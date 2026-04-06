import Constants from "@/data/Constants";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { model, description, imageUrl } = await req.json();

        if (!process.env.OPENROUTER_AI_API_KEY && !process.env.OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_AI_API_KEY || process.env.OPENROUTER_API_KEY,
        });

        const ModelObj = Constants.AiModelList.find(item => item.name === model);
        const modelName = ModelObj?.modelName;
        const response = await openai.chat.completions.create({
            model: modelName ?? 'google/gemma-3n-e2b-it:free',
            stream: true,
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": description
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": imageUrl
                            }
                        }
                    ]
                }
            ]
        });

        // Create a readable stream to send data in real-time
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const text = chunk.choices?.[0]?.delta?.content || "";
                        controller.enqueue(new TextEncoder().encode(text)); // Send data chunk
                    }
                    controller.close(); // End stream
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate code', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}