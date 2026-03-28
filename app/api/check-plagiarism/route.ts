import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/configs/db";
import { PlagiarismChecksTable, usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
import Constants from "@/data/Constants";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY || process.env.OPENROUTER_API_KEY,
});

// Generate unique ID
const generateUID = () => {
    return crypto.randomUUID();
};

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { text, fileName, email, model } = await req.json();

    try {
        // Check user credits
        const creditResult = await db.select().from(usersTable)
            .where(eq(usersTable.email, email));

        if (!creditResult[0]) {
            return NextResponse.json({ error: 'User not found. Please sign in.' }, { status: 404 });
        }

        if (!creditResult[0]?.credits || creditResult[0]?.credits < 2) {
            return NextResponse.json({ 
                error: 'Not enough credits. Plagiarism check costs 2 credits.' 
            }, { status: 402 });
        }

        // Get selected AI model
        const ModelObj = Constants.AiModelList.find(item => item.name === model);
        const modelName = ModelObj?.modelName || 'google/gemini-2.0-flash-001';

        // Enhanced AI Plagiarism Analysis Prompt with AI Detection
        const plagiarismPrompt = `You are an advanced plagiarism detection AI similar to Turnitin. Analyze the following text for potential plagiarism AND AI-generated content.

TEXT TO ANALYZE:
"""
${text.substring(0, 15000)} 
"""

Your comprehensive analysis should include:

1. PLAGIARISM DETECTION:
   - Break the text into key phrases and sentences
   - Identify sections that appear to be copied or paraphrased from common sources
   - Provide SPECIFIC source URLs or academic references where possible
   - Categorize sources (web, academic journals, books, student papers, etc.)
   - Assess match strength for each source (0-100%)

2. AI WRITING DETECTION:
   - Analyze writing patterns typical of AI models (GPT, Claude, Bard, etc.)
   - Look for: uniform sentence structure, lack of personal voice, overly formal language, perfect grammar
   - Identify AI-generated sections
   - Give AI likelihood score (0-100%)

3. PARAPHRASING ANALYSIS:
   - Detect close paraphrasing that maintains original structure
   - Identify synonym replacement without proper citation
   - Flag text that's reworded but not original

Return ONLY a valid JSON object with this exact structure:
{
  "similarityScore": <number 0-100>,
  "aiDetectionScore": <number 0-100>,
  "overallAssessment": "<brief summary>",
  "suspiciousSections": [
    {
      "text": "<exact text snippet>",
      "reason": "<why this might be plagiarized>",
      "startIndex": <character position>,
      "endIndex": <character position>,
      "severity": "low" | "medium" | "high",
      "type": "plagiarism" | "ai-generated" | "paraphrasing"
    }
  ],
  "matchedSources": [
    {
      "source": "<specific URL or source name>",
      "confidence": <number 0-100>,
      "description": "<brief description>",
      "type": "web" | "academic" | "book" | "student_paper" | "news",
      "matchPercentage": <number 0-100>
    }
  ],
  "sourceBreakdown": [
    {
      "sourceUrl": "<actual or likely URL>",
      "sourceTitle": "<title of source>",
      "sourceType": "web" | "academic" | "book" | "student_paper" | "news" | "unknown",
      "matchPercentage": <number 0-100>,
      "excerpts": ["<matched text 1>", "<matched text 2>"]
    }
  ],
  "aiDetectionAnalysis": {
    "likelihood": "low" | "medium" | "high",
    "patterns": ["<pattern 1>", "<pattern 2>"],
    "sections": [
      {
        "text": "<AI-generated section>",
        "startIndex": <number>,
        "endIndex": <number>,
        "confidence": <number 0-100>
      }
    ]
  },
  "paraphrasingDetected": "yes" | "no" | "partial",
  "recommendations": [
    "<improvement suggestion 1>",
    "<improvement suggestion 2>"
  ],
  "uniqueContent": <percentage 0-100>
}

Be thorough, specific, and professional. Return ONLY the JSON object, no other text.`;

        // Call AI for analysis
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: 'user',
                    content: plagiarismPrompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const aiResponseText = response.choices[0].message.content || '{}';
        let aiAnalysis;

        try {
            aiAnalysis = JSON.parse(aiResponseText);
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            aiAnalysis = {
                similarityScore: 0,
                aiDetectionScore: 0,
                overallAssessment: 'Unable to complete analysis',
                suspiciousSections: [],
                matchedSources: [],
                sourceBreakdown: [],
                aiDetectionAnalysis: { likelihood: 'low', patterns: [], sections: [] },
                paraphrasingDetected: 'no',
                recommendations: ['Please try again with different text'],
                uniqueContent: 100
            };
        }

        // Ensure scores are valid
        const similarityScore = Math.min(100, Math.max(0, aiAnalysis.similarityScore || 0));
        const aiDetectionScore = Math.min(100, Math.max(0, aiAnalysis.aiDetectionScore || 0));

        // Save to database
        const uid = generateUID();
        await db.insert(PlagiarismChecksTable).values({
            uid: uid.toString(),
            originalText: text.substring(0, 50000), // Store up to 50k chars
            fileName: fileName || 'Direct Input',
            fileUrl: null,
            similarityScore: similarityScore,
            aiDetectionScore: aiDetectionScore,
            matchedSources: aiAnalysis.matchedSources || [],
            sourceBreakdown: aiAnalysis.sourceBreakdown || [],
            aiAnalysis: aiAnalysis,
            paraphrasingDetected: aiAnalysis.paraphrasingDetected || 'no',
            aiModelUsed: model || 'Gemini Google',
            status: 'completed',
            createdBy: email
        });

        // Deduct 2 credits
        await db.update(usersTable).set({
            credits: creditResult[0].credits - 2
        }).where(eq(usersTable.email, email));

        return NextResponse.json({
            success: true,
            uid: uid,
            similarityScore: similarityScore,
            aiDetectionScore: aiDetectionScore,
            overallAssessment: aiAnalysis.overallAssessment || 'Analysis completed',
            suspiciousSections: aiAnalysis.suspiciousSections || [],
            matchedSources: aiAnalysis.matchedSources || [],
            sourceBreakdown: aiAnalysis.sourceBreakdown || [],
            aiDetectionAnalysis: aiAnalysis.aiDetectionAnalysis || { likelihood: 'low', patterns: [], sections: [] },
            paraphrasingDetected: aiAnalysis.paraphrasingDetected || 'no',
            recommendations: aiAnalysis.recommendations || [],
            uniqueContent: aiAnalysis.uniqueContent || (100 - similarityScore),
            creditsRemaining: creditResult[0].credits - 2
        });

    } catch (error: any) {
        console.error('Plagiarism check error:', error);
        return NextResponse.json(
            { error: 'Failed to check plagiarism', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    const reqUrl = req.url;
    const { searchParams } = new URL(reqUrl);
    const email = searchParams?.get('email');

    if (email) {
        const result = await db.select()
            .from(PlagiarismChecksTable)
            .where(eq(PlagiarismChecksTable.createdBy, email));
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
}

export async function DELETE(req: Request) {
    const reqUrl = req.url;
    const { searchParams } = new URL(reqUrl);
    const uid = searchParams?.get('uid');
    const email = searchParams?.get('email');

    if (!uid || !email) {
        return NextResponse.json({ 
            error: 'UID and email parameters required' 
        }, { status: 400 });
    }

    try {
        // First, verify the user owns this plagiarism check
        const existingCheck = await db.select()
            .from(PlagiarismChecksTable)
            .where(eq(PlagiarismChecksTable.uid, uid));

        if (!existingCheck || existingCheck.length === 0) {
            return NextResponse.json({ 
                error: 'Plagiarism check not found' 
            }, { status: 404 });
        }

        if (existingCheck[0].createdBy !== email) {
            return NextResponse.json({ 
                error: 'Unauthorized: You can only delete your own plagiarism checks' 
            }, { status: 403 });
        }

        // Delete from database
        await db.delete(PlagiarismChecksTable)
            .where(eq(PlagiarismChecksTable.uid, uid));

        // Note: If fileUrl exists in the future and points to Firebase Storage,
        // you would delete the file here using Firebase Storage API

        return NextResponse.json({ 
            success: true, 
            message: 'Plagiarism check deleted successfully' 
        });

    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete plagiarism check', details: error.message },
            { status: 500 }
        );
    }
}
