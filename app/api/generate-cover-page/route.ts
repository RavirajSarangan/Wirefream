import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { prompt, model } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!process.env.OPENROUTER_AI_API_KEY) {
            return NextResponse.json(
                { error: "OpenRouter API key is not configured. Please add OPENROUTER_AI_API_KEY to your .env file." },
                { status: 500 }
            );
        }

        // Determine model name based on selection
        const modelMap: { [key: string]: string } = {
            'gemini': 'google/gemini-2.0-flash-exp:free',
            'chatgpt': 'openai/gpt-4o-mini',
            'claude': 'anthropic/claude-3.5-sonnet',
            'custom': 'google/gemma-3n-e2b-it:free'
        };

        const modelName = modelMap[model] || modelMap['gemini'];

        const systemPrompt = `You are a cover page information extractor. Extract the following information from the user's description and return ONLY a valid JSON object with these exact fields:
{
  "institutionName": "extracted institution/university name",
  "title": "extracted document/project title",
  "subject": "extracted subject/course name",
  "studentName": "extracted student name",
  "indexNumber": "extracted student ID/index number",
  "className": "extracted class/year/grade",
  "teacherName": "extracted teacher/professor name",
  "template": "choose one: classic, modern, minimal, formal, creative, or professional based on the description"
}

Rules:
- Return ONLY the JSON object, no other text
- If a field is not mentioned, use an empty string ""
- For template, analyze the description and choose the most appropriate style
- Extract exact names and numbers as mentioned
- Do not add any explanations or markdown formatting`;

        let response;
        try {
            response = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            });
        } catch (apiError: any) {
            console.error("OpenRouter API error:", apiError);
            
            if (apiError.status === 429) {
                return NextResponse.json(
                    { error: "AI service rate limit reached. Please try again in a few moments or switch to a different AI model." },
                    { status: 429 }
                );
            }
            
            if (apiError.status === 401) {
                return NextResponse.json(
                    { error: "Invalid API key. Please check your OPENROUTER_AI_API_KEY configuration." },
                    { status: 500 }
                );
            }
            
            throw new Error(apiError.message || "Failed to connect to AI service");
        }

        const content = response.choices[0]?.message?.content || "{}";
        
        // Try to parse the JSON response
        let coverPageData;
        try {
            // Remove markdown code blocks if present
            const cleanedContent = content.replaceAll(/```json\n?|\n?```/g, '').trim();
            coverPageData = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error("Failed to parse AI response:", content, parseError);
            // Fallback: try to extract JSON from the response
            const jsonRegex = /\{[\s\S]*\}/;
            const jsonMatch = jsonRegex.exec(content);
            if (jsonMatch) {
                coverPageData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Invalid JSON response from AI");
            }
        }

        // Validate and ensure all required fields exist
        const validatedData = {
            institutionName: coverPageData.institutionName || '',
            title: coverPageData.title || '',
            subject: coverPageData.subject || '',
            studentName: coverPageData.studentName || '',
            indexNumber: coverPageData.indexNumber || '',
            className: coverPageData.className || '',
            teacherName: coverPageData.teacherName || '',
            template: ['classic', 'modern', 'minimal', 'formal', 'creative', 'professional'].includes(coverPageData.template) 
                ? coverPageData.template 
                : 'modern'
        };

        return NextResponse.json(validatedData);

    } catch (error: any) {
        console.error("Error generating cover page:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate cover page" },
            { status: 500 }
        );
    }
}
