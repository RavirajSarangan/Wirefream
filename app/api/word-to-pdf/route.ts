import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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

        if (!file.name.match(/\.(docx?|doc)$/i)) {
            return NextResponse.json(
                { error: 'Please upload a Word document (.doc or .docx)' },
                { status: 400 }
            )
        }

        // Read Word file and extract text
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Extract text from Word document
        const result = await mammoth.extractRawText({ buffer })
        let text = result.value

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'No text found in Word document' },
                { status: 400 }
            )
        }

        // Sanitize text to remove unsupported WinAnsi characters
        // Replace special Unicode characters with ASCII equivalents
        text = text
            .replaceAll(/[\u2018\u2019\u02bc]/g, "'")  // Smart quotes and modifier letter apostrophe
            .replaceAll(/[\u201c\u201d]/g, '"')        // Smart double quotes
            .replaceAll(/[\u2013\u2014]/g, '-')        // En dash, em dash
            .replaceAll('\u2026', '...')              // Ellipsis
            .replaceAll('\u00a0', ' ')                // Non-breaking space
            .replaceAll('\t', '    ')                 // Tabs to spaces
            .replaceAll(/[\x00-\x08\x0b-\x1f]/g, '')  // Remove control characters except newline
            // Remove any remaining non-printable or unsupported characters
            .replaceAll(/[^\x20-\x7E\n]/g, '')

        // Create PDF document
        const pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        const fontSize = 12
        const lineHeight = fontSize * 1.5
        const margin = 50
        const pageWidth = 595 // A4 width in points
        const pageHeight = 842 // A4 height in points
        const maxWidth = pageWidth - (2 * margin)

        // Add header page
        let page = pdfDoc.addPage([pageWidth, pageHeight])
        let yPosition = pageHeight - margin

        // Add title
        page.drawText(`Converted from: ${file.name}`, {
            x: margin,
            y: yPosition,
            size: 16,
            font: boldFont,
            color: rgb(0, 0, 0),
        })
        yPosition -= 40

        // Add conversion note
        page.drawText('This document was converted from Word to PDF format.', {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        })
        yPosition -= 60

        // Split text into lines and pages
        const lines = text.split('\n')
        
        for (const line of lines) {
            // Word wrap for long lines
            const words = line.split(' ')
            let currentLine = ''
            
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                const textWidth = font.widthOfTextAtSize(testLine, fontSize)
                
                if (textWidth > maxWidth && currentLine) {
                    // Draw current line
                    if (yPosition < margin + lineHeight) {
                        // Add new page
                        page = pdfDoc.addPage([pageWidth, pageHeight])
                        yPosition = pageHeight - margin
                    }
                    
                    page.drawText(currentLine, {
                        x: margin,
                        y: yPosition,
                        size: fontSize,
                        font: font,
                        color: rgb(0, 0, 0),
                    })
                    yPosition -= lineHeight
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            }
            
            // Draw remaining text
            if (currentLine) {
                if (yPosition < margin + lineHeight) {
                    page = pdfDoc.addPage([pageWidth, pageHeight])
                    yPosition = pageHeight - margin
                }
                
                page.drawText(currentLine, {
                    x: margin,
                    y: yPosition,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                })
                yPosition -= lineHeight
            }
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save()

        // Return PDF file
        return new NextResponse(new Uint8Array(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace(/\.(docx?|doc)$/i, '.pdf')}"`,
            },
        })

    } catch (error: any) {
        console.error('Conversion error:', error)
        return NextResponse.json(
            { error: 'Failed to convert Word to PDF', details: error.message },
            { status: 500 }
        )
    }
}
