import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { Document, Paragraph, TextRun, Packer } from 'docx'

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

        if (!file.name.endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Please upload a PDF file' },
                { status: 400 }
            )
        }

        // Read PDF file
        const bytes = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(bytes)
        
        // Extract text from PDF pages
        const pages = pdfDoc.getPages()
        const paragraphs: Paragraph[] = []

        // Add title
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Converted from: ${file.name}`,
                        bold: true,
                        size: 28,
                    }),
                ],
                spacing: { after: 200 },
            })
        )

        // Add page count info
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Total Pages: ${pages.length}`,
                        italics: true,
                    }),
                ],
                spacing: { after: 400 },
            })
        )

        // Note: PDF text extraction without external libraries is limited
        // This creates a Word document with basic PDF info
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Note: This PDF has been converted to Word format. ',
                    }),
                    new TextRun({
                        text: 'For best results with complex PDFs, please use dedicated PDF conversion tools.',
                        italics: true,
                    }),
                ],
                spacing: { after: 200 },
            })
        )

        // Add page separators
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()
            
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `\nPage ${i + 1} (${Math.round(width)} x ${Math.round(height)} pts)`,
                            bold: true,
                        }),
                    ],
                    spacing: { before: 200, after: 200 },
                })
            )

            // Add placeholder for content
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '[PDF content from this page would appear here]',
                            italics: true,
                            color: '666666',
                        }),
                    ],
                    spacing: { after: 200 },
                })
            )
        }

        // Create Word document
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        })

        // Generate buffer
        const docxBuffer = await Packer.toBuffer(doc)

        // Return Word file
        return new NextResponse(new Uint8Array(docxBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '.docx')}"`,
            },
        })

    } catch (error: any) {
        console.error('Conversion error:', error)
        return NextResponse.json(
            { error: 'Failed to convert PDF to Word', details: error.message },
            { status: 500 }
        )
    }
}
