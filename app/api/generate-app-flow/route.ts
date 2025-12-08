import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/configs/db";
import { AppFlowGeneratorTable, usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
//@ts-ignore
import uuid4 from "uuid4";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { appDescription, model, email } = await req.json();

    try {
        // Check user credits
        const creditResult = await db.select().from(usersTable)
            .where(eq(usersTable.email, email));

        if (!creditResult[0]?.credits || creditResult[0]?.credits < 2) {
            return NextResponse.json({ 
                error: 'Not enough credits. App flow generation costs 2 credits.' 
            }, { status: 402 });
        }

        // Build AI prompt for comprehensive app flow generation
        const flowPrompt = `You are an expert mobile app designer and UX architect. Generate a complete app flow for: "${appDescription}"

Return ONLY valid JSON with this exact structure:
{
  "appName": "Professional App Name",
  "screens": [
    {
      "name": "Screen Name",
      "purpose": "Clear description of what this screen does",
      "elements": ["Element 1", "Element 2", "Element 3"],
      "interactions": ["Action 1", "Action 2"]
    }
  ],
  "flowDiagram": "graph TD\\n    A[Screen1]-->B[Screen2]\\n    B-->C[Screen3]\\n    B-->D[Screen4]",
  "userJourney": {
    "persona": "Target user description",
    "steps": [
      {
        "step": 1,
        "action": "User action description",
        "screen": "Screen name",
        "emotion": "happy/neutral/frustrated",
        "painPoint": "Any issues or concerns"
      }
    ],
    "goals": ["Primary goal", "Secondary goal"]
  }
}

Guidelines:
- Create 5-8 logical screens that cover the full user flow
- flowDiagram should be valid Mermaid.js syntax (use \\n for newlines)
- Include common screens like: Login/Signup, Dashboard/Home, Main Features, Settings, Profile
- Make elements specific and actionable
- User journey should tell a complete story
- Consider edge cases and error states

Return ONLY the JSON object, no markdown, no explanations.`;

        console.log('Generating app flow with model:', model);
        console.log('App description:', appDescription);
        
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: flowPrompt
                }
            ],
            max_tokens: 3000,
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const flowContent = response.choices[0]?.message?.content;

        if (!flowContent) {
            return NextResponse.json({ 
                error: 'Failed to generate app flow' 
            }, { status: 500 });
        }

        // Parse JSON response
        let flowData;
        try {
            flowData = JSON.parse(flowContent);
        } catch (e) {
            console.error('Failed to parse app flow JSON:', e);
            return NextResponse.json({ 
                error: 'Failed to parse AI response. Please try again.' 
            }, { status: 500 });
        }

        // Validate required fields
        if (!flowData.appName || !flowData.screens || !flowData.flowDiagram) {
            return NextResponse.json({ 
                error: 'Incomplete app flow data generated. Please try again.' 
            }, { status: 500 });
        }

        // Save to database
        const uid = uuid4();
        const result = await db.insert(AppFlowGeneratorTable).values({
            uid: uid.toString(),
            appName: flowData.appName,
            appDescription: appDescription,
            screenList: flowData.screens,
            flowDiagramData: {
                mermaidSyntax: flowData.flowDiagram,
                type: 'flowchart'
            },
            userJourneyData: flowData.userJourney || {},
            model: model,
            createdBy: email
        }).returning({ 
            id: AppFlowGeneratorTable.id, 
            uid: AppFlowGeneratorTable.uid 
        });

        // Deduct 2 credits
        await db.update(usersTable).set({
            credits: creditResult[0].credits - 2
        }).where(eq(usersTable.email, email));

        return NextResponse.json({
            success: true,
            uid: result[0].uid,
            appName: flowData.appName,
            screens: flowData.screens,
            flowDiagram: flowData.flowDiagram,
            userJourney: flowData.userJourney,
            creditsRemaining: creditResult[0].credits - 2
        });

    } catch (error: any) {
        console.error('App flow generation error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json({
            error: error.message || 'Failed to generate app flow',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const reqUrl = req.url;
    const { searchParams } = new URL(reqUrl);
    const uid = searchParams?.get('uid');
    const email = searchParams?.get('email');

    if (uid) {
        const result = await db.select()
            .from(AppFlowGeneratorTable)
            .where(eq(AppFlowGeneratorTable.uid, uid));
        return NextResponse.json(result[0]);
    }
    else if (email) {
        const result = await db.select()
            .from(AppFlowGeneratorTable)
            .where(eq(AppFlowGeneratorTable.createdBy, email))
            .orderBy(AppFlowGeneratorTable.createdAt);
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'No Record Found' }, { status: 404 });
}
