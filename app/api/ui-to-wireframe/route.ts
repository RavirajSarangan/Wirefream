import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/configs/db";
import { UIToWireframeTable, usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
//@ts-ignore
import uuid4 from "uuid4";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { originalImageUrl, style, model, description, email } = await req.json();

    try {
        const creditResult = await db.select().from(usersTable)
            .where(eq(usersTable.email, email));

        if (!creditResult[0]?.credits || creditResult[0]?.credits < 1) {
            return NextResponse.json({ error: 'Not enough credits. UI to Wireframe conversion costs 1 credit.' }, { status: 402 });
        }

        const analysisPrompt = `Analyze this UI design and return ONLY a valid JSON object describing the exact layout structure.

Return this JSON format:
{
  "sections": [
    {
      "type": "navigation",
      "height": 70,
      "background": "dark" | "light",
      "hasLogo": true,
      "menuItems": 5,
      "hasPhone": false,
      "hasSearch": false
    },
    {
      "type": "hero",
      "layout": "split" | "full",
      "height": 500,
      "textSide": "left" | "right" | "center",
      "imageSide": "right" | "left" | "none",
      "hasGreeting": true,
      "hasHeading": true,
      "hasSubtitle": true,
      "hasDescription": false,
      "hasButton": true,
      "buttonColor": "yellow" | "blue" | "green" | "default",
      "buttonText": "Button Text",
      "hasSocialIcons": true,
      "socialCount": 4
    },
    {
      "type": "gallery",
      "imageCount": 6,
      "columns": 3,
      "rows": 2
    },
    {
      "type": "cards",
      "count": 3,
      "columns": 3,
      "hasImages": true,
      "hasText": true
    },
    {
      "type": "form",
      "fields": ["Name", "Email", "Phone"],
      "buttonText": "Submit"
    },
    {
      "type": "testimonials",
      "count": 3,
      "columns": 3
    },
    {
      "type": "footer",
      "columns": 4,
      "height": 200
    }
  ]
}

CRITICAL RULES:
1. Count EXACT numbers - menu items, images, cards, columns
2. For hero: detect if it's split layout (text on one side, image on other) or full-width
3. Specify which side has text vs image in split layouts
4. Note exact button colors (yellow/gold, blue, green, etc.)
5. Count social media icons precisely
6. ONLY include sections that actually exist in the image
7. Return ONLY the JSON object, no markdown formatting, no extra text`;

        const visionResponse = await openai.chat.completions.create({
            model: model || 'google/gemini-2.0-flash-001',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: analysisPrompt + (description ? `\n\nAdditional context: ${description}` : '')
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: originalImageUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000,
            response_format: { type: "json_object" }
        });

        const uiAnalysis = visionResponse.choices[0]?.message?.content;

        if (!uiAnalysis) {
            return NextResponse.json({ error: 'Failed to analyze UI image' }, { status: 500 });
        }

        // Parse the JSON response
        let layoutData;
        try {
            layoutData = JSON.parse(uiAnalysis);
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', e);
            layoutData = { 
                sections: [],
                error: 'Failed to parse layout structure',
                rawText: uiAnalysis
            };
        }

        const uid = uuid4();
        const result = await db.insert(UIToWireframeTable).values({
            uid: uid.toString(),
            originalImageUrl: originalImageUrl,
            wireframeImageUrl: JSON.stringify(layoutData),
            model: model,
            style: style,
            description: description || '',
            createdBy: email
        }).returning({ id: UIToWireframeTable.id, uid: UIToWireframeTable.uid });

        await db.update(usersTable).set({
            credits: creditResult[0].credits - 1
        }).where(eq(usersTable.email, email));

        return NextResponse.json({
            success: true,
            uid: result[0].uid,
            wireframeData: layoutData,
            style: style
        });

    } catch (error: any) {
        console.error('UI to Wireframe conversion error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to convert UI to wireframe'
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
            .from(UIToWireframeTable)
            .where(eq(UIToWireframeTable.uid, uid));
        return NextResponse.json(result[0]);
    }
    else if (email) {
        const result = await db.select()
            .from(UIToWireframeTable)
            .where(eq(UIToWireframeTable.createdBy, email))
            .orderBy(UIToWireframeTable.id);
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

        await db.delete(UIToWireframeTable)
            .where(eq(UIToWireframeTable.uid, uid));

        return NextResponse.json({ 
            success: true, 
            message: 'UI to wireframe conversion deleted successfully' 
        });
    } catch (error: any) {
        console.error('Error deleting UI to wireframe:', error);
        return NextResponse.json({ 
            error: 'Failed to delete UI to wireframe conversion', 
            details: error.message 
        }, { status: 500 });
    }
}
