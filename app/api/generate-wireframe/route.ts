import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/configs/db";
import { GeneratedWireframesTable, usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
//@ts-ignore
import uuid4 from "uuid4";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { prompt, style, deviceType, components, model, email } = await req.json();

    try {
        // Check user credits
        const creditResult = await db.select().from(usersTable)
            .where(eq(usersTable.email, email));

        if (!creditResult[0]?.credits || creditResult[0]?.credits < 1) {
            return NextResponse.json({ error: 'Not enough credits. Wireframe generation costs 1 credit.' }, { status: 402 });
        }

        // Build detailed prompt for wireframe generation
        const wireframePrompt = `Create a wireframe layout structure for: ${prompt}

Device: ${deviceType}
Style: ${style}
Components needed: ${components.join(', ')}

Return ONLY valid JSON describing the layout:
{
  "sections": [
    {
      "type": "navigation" | "hero" | "gallery" | "cards" | "form" | "footer",
      "height": 70,
      "layout": "split" | "full",
      "elements": {...}
    }
  ]
}

Be specific about component counts, positions, and layouts. Return ONLY JSON, no other text.`;

        // Use chat completion to generate structured layout
        const selectedModel = model || 'google/gemini-2.0-flash-001';
        const response = await openai.chat.completions.create({
            model: selectedModel,
            messages: [
                {
                    role: 'user',
                    content: wireframePrompt
                }
            ],
            max_tokens: 2000,
            response_format: { type: "json_object" }
        });

        const layoutContent = response.choices[0]?.message?.content;

        if (!layoutContent) {
            return NextResponse.json({ error: 'Failed to generate wireframe layout' }, { status: 500 });
        }

        // Parse JSON
        let layoutData;
        try {
            layoutData = JSON.parse(layoutContent);
        } catch (e) {
            console.error('Failed to parse wireframe JSON:', e);
            layoutData = {
                sections: [],
                error: 'Parse failed',
                rawText: layoutContent
            };
        }

        // Save to database
        const uid = uuid4();
        const result = await db.insert(GeneratedWireframesTable).values({
            uid: uid.toString(),
            prompt: prompt,
            imageUrl: JSON.stringify(layoutData),
            style: style,
            deviceType: deviceType,
            components: components,
            createdBy: email
        }).returning({ id: GeneratedWireframesTable.id, uid: GeneratedWireframesTable.uid });

        // Deduct 1 credit
        await db.update(usersTable).set({
            credits: creditResult[0].credits - 1
        }).where(eq(usersTable.email, email));

        return NextResponse.json({
            success: true,
            uid: result[0].uid,
            wireframeData: layoutData,
            style: style,
            deviceType: deviceType
        });

    } catch (error: any) {
        console.error('Wireframe generation error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate wireframe'
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
            .from(GeneratedWireframesTable)
            .where(eq(GeneratedWireframesTable.uid, uid));
        return NextResponse.json(result[0]);
    }
    else if (email) {
        const result = await db.select()
            .from(GeneratedWireframesTable)
            .where(eq(GeneratedWireframesTable.createdBy, email))
            .orderBy(GeneratedWireframesTable.id);
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'No Record Found' }, { status: 404 });
}

export async function DELETE(req: Request) {
    try {
        const reqUrl = req.url;
        const { searchParams } = new URL(reqUrl);
        const uid = searchParams?.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        await db.delete(GeneratedWireframesTable)
            .where(eq(GeneratedWireframesTable.uid, uid));

        return NextResponse.json({ 
            success: true, 
            message: 'Wireframe deleted successfully' 
        });
    } catch (error: any) {
        console.error('Error deleting wireframe:', error);
        return NextResponse.json({ 
            error: 'Failed to delete wireframe', 
            details: error.message 
        }, { status: 500 });
    }
}
