import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/configs/db'
import { CodeRefinementsTable, WireframeToCodeTable } from '@/configs/schema'
import { eq } from 'drizzle-orm'

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_AI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { wireframeUid, userMessage, currentCode, email } = await req.json()

        if (!userMessage || !currentCode) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get wireframe record to find ID
        let wireframeId: number | null = null
        if (wireframeUid) {
            const wireframeRecord = await db.select()
                .from(WireframeToCodeTable)
                .where(eq(WireframeToCodeTable.uid, wireframeUid))
                .limit(1)
            
            if (wireframeRecord.length > 0) {
                wireframeId = wireframeRecord[0].id
            }
        }

        // Create context-aware refinement prompt
        const refinementPrompt = `You are an expert React developer. The user has generated React code from a wireframe and wants to refine it.

Current Code:
\`\`\`jsx
${currentCode}
\`\`\`

User's Refinement Request: ${userMessage}

Please provide the complete updated React code that addresses the user's request. Follow these guidelines:
1. Maintain the existing structure and functionality unless explicitly asked to change it
2. Keep using Tailwind CSS for styling
3. Ensure the code is clean, well-organized, and follows React best practices
4. Include all necessary imports
5. Make the changes requested while preserving existing features
6. Return ONLY the complete updated code without explanations

Return the complete updated React component code:`

        // Stream the AI response
        const response = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-001', // Using fastest model for refinements
            stream: true,
            messages: [
                {
                    role: 'user',
                    content: refinementPrompt
                }
            ]
        })

        // Set up streaming response
        const encoder = new TextEncoder()
        let fullResponse = ''

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || ''
                        fullResponse += content
                        
                        // Clean up markdown code fences
                        const cleanContent = content
                            .replaceAll('```jsx', '')
                            .replaceAll('```javascript', '')
                            .replaceAll('javascript', '')
                            .replaceAll('jsx', '')
                            .replaceAll('```', '')
                        
                        controller.enqueue(encoder.encode(cleanContent))
                    }

                    controller.close()

                    // Save refinement to database
                    if (wireframeId) {
                        // Get the latest version number
                        const existingRefinements = await db.select()
                            .from(CodeRefinementsTable)
                            .where(eq(CodeRefinementsTable.wireframeId, wireframeId))
                        
                        const latestVersion = existingRefinements.length > 0 
                            ? Math.max(...existingRefinements.map(r => r.codeVersion || 0))
                            : 0

                        await db.insert(CodeRefinementsTable).values({
                            wireframeId,
                            userMessage,
                            aiResponse: fullResponse,
                            codeVersion: latestVersion + 1,
                            createdBy: email || 'unknown'
                        })
                    }

                } catch (error) {
                    console.error('Streaming error:', error)
                    controller.error(error)
                }
            }
        })

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        })

    } catch (error: any) {
        console.error('Refine code error:', error)
        return NextResponse.json(
            { error: 'Failed to refine code', details: error.message },
            { status: 500 }
        )
    }
}

// GET endpoint to retrieve refinement history
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const wireframeUid = searchParams.get('uid')

        if (!wireframeUid) {
            return NextResponse.json(
                { error: 'Missing wireframe UID' },
                { status: 400 }
            )
        }

        // Get wireframe record
        const wireframeRecord = await db.select()
            .from(WireframeToCodeTable)
            .where(eq(WireframeToCodeTable.uid, wireframeUid))
            .limit(1)

        if (wireframeRecord.length === 0) {
            return NextResponse.json(
                { error: 'Wireframe not found' },
                { status: 404 }
            )
        }

        const wireframeId = wireframeRecord[0].id

        // Get all refinements for this wireframe
        const refinements = await db.select()
            .from(CodeRefinementsTable)
            .where(eq(CodeRefinementsTable.wireframeId, wireframeId))

        return NextResponse.json({
            success: true,
            refinements
        })

    } catch (error: any) {
        console.error('Get refinements error:', error)
        return NextResponse.json(
            { error: 'Failed to get refinements', details: error.message },
            { status: 500 }
        )
    }
}
