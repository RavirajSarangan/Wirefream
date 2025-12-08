import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        let extractedText = ''

        // Extract text based on file type
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            // Plain text file
            extractedText = buffer.toString('utf-8')
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.name.endsWith('.docx')) {
            // Word document
            const result = await mammoth.extractRawText({ buffer })
            extractedText = result.value
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // PDF document - use pdf-parse-fork for text extraction
            try {
                // @ts-ignore - pdf-parse-fork doesn't have TypeScript definitions
                const pdfParse = (await import('pdf-parse-fork')).default
                const pdfData = await pdfParse(buffer)
                extractedText = pdfData.text
                
                if (!extractedText || extractedText.trim().length === 0) {
                    return NextResponse.json(
                        { error: 'No text content found in PDF. The PDF may contain only images or be scanned. Please use OCR software or paste text directly.' },
                        { status: 400 }
                    )
                }
            } catch (pdfError: any) {
                console.error('PDF extraction error:', pdfError)
                return NextResponse.json(
                    { error: 'Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images.' },
                    { status: 400 }
                )
            }
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload .txt, .pdf, or .docx files.' },
                { status: 400 }
            )
        }

        // Clean up the text
        extractedText = extractedText.trim()

        if (!extractedText) {
            return NextResponse.json(
                { error: 'No text could be extracted from the file' },
                { status: 400 }
            )
        }

        // Calculate word count
        const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length
        const charCount = extractedText.length

        return NextResponse.json({
            success: true,
            text: extractedText,
            wordCount,
            charCount,
            fileName: file.name
        })

    } catch (error: any) {
        console.error('Text extraction error:', error)
        return NextResponse.json(
            { error: 'Failed to extract text from file', details: error.message },
            { status: 500 }
        )
    }
}
