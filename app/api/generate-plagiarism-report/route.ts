import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(req: NextRequest) {
    try {
        const data = await req.json()
        const {
            uid,
            fileName,
            similarityScore,
            aiDetectionScore,
            uniqueContent,
            overallAssessment,
            suspiciousSections,
            sourceBreakdown,
            matchedSources,
            recommendations,
            paraphrasingDetected,
            aiModelUsed,
            createdAt
        } = data

        // Sanitize function to remove WinAnsi-incompatible characters
        const sanitizeText = (text: string): string => {
            if (!text) return ''
            // Remove common problematic characters
            let cleaned = text
                .replaceAll(/[\u2018\u2019\u02bc]/g, "'")  // Smart quotes
                .replaceAll(/[\u201c\u201d]/g, '"')        // Smart double quotes
                .replaceAll(/[\u2013\u2014]/g, '-')        // Dashes
                .replaceAll('…', '...')                   // Ellipsis
                .replaceAll(' ', ' ')                     // Non-breaking space
                .replaceAll('\t', '    ')                 // Tabs
            // Remove control characters (ASCII 0-31 except newline)
            cleaned = cleaned.split('').filter(char => {
                const code = char.codePointAt(0) ?? 0
                return code >= 32 || code === 10
            }).join('')
            // Keep only printable ASCII and newlines
            return cleaned.split('').filter(char => {
                const code = char.codePointAt(0) ?? 0
                return (code >= 32 && code <= 126) || code === 10
            }).join('')
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create()
        const timesRoman = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        const pageWidth = 595 // A4 width
        const pageHeight = 842 // A4 height
        const margin = 50
        const contentWidth = pageWidth - (2 * margin)
        let yPosition = pageHeight - margin

        // Helper function to add new page
        const addNewPage = () => {
            const page = pdfDoc.addPage([pageWidth, pageHeight])
            yPosition = pageHeight - margin
            return page
        }

        // Helper function to check if new page needed
        const checkNewPage = (requiredSpace: number, currentPage: any) => {
            if (yPosition - requiredSpace < margin) {
                return addNewPage()
            }
            return currentPage
        }

        // Helper function to draw text with word wrap
        const drawWrappedText = (page: any, text: string, x: number, fontSize: number, font: any, maxWidth: number) => {
            const sanitized = sanitizeText(text)
            const words = sanitized.split(' ')
            let line = ''
            const lines: string[] = []

            for (const word of words) {
                const testLine = line ? `${line} ${word}` : word
                const width = font.widthOfTextAtSize(testLine, fontSize)
                
                if (width > maxWidth && line) {
                    lines.push(line)
                    line = word
                } else {
                    line = testLine
                }
            }
            if (line) lines.push(line)

            for (const textLine of lines) {
                page = checkNewPage(fontSize * 1.5, page)
                page.drawText(textLine, {
                    x,
                    y: yPosition,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                })
                yPosition -= fontSize * 1.5
            }
            return page
        }

        // Page 1: Title and Summary
        let page = addNewPage()

        // Header/Title
        page.drawText('PLAGIARISM ANALYSIS REPORT', {
            x: margin,
            y: yPosition,
            size: 24,
            font: timesBold,
            color: rgb(0.2, 0.2, 0.8),
        })
        yPosition -= 40

        // Report metadata
        page.drawText(`Report ID: ${uid}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: timesRoman,
            color: rgb(0.4, 0.4, 0.4),
        })
        yPosition -= 15

        page.drawText(`Generated: ${new Date(createdAt || Date.now()).toLocaleString()}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: timesRoman,
            color: rgb(0.4, 0.4, 0.4),
        })
        yPosition -= 15

        page.drawText(`Document: ${sanitizeText(fileName || 'Unknown')}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: timesRoman,
            color: rgb(0.4, 0.4, 0.4),
        })
        yPosition -= 30

        // Divider line
        page.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: pageWidth - margin, y: yPosition },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
        })
        yPosition -= 30

        // Score Summary Section
        page.drawText('SUMMARY SCORES', {
            x: margin,
            y: yPosition,
            size: 16,
            font: timesBold,
            color: rgb(0, 0, 0),
        })
        yPosition -= 30

        // Similarity Score
        let simColor
        if (similarityScore <= 15) {
            simColor = rgb(0, 0.6, 0)
        } else if (similarityScore <= 40) {
            simColor = rgb(0.8, 0.8, 0)
        } else {
            simColor = rgb(0.8, 0, 0)
        }
        
        page.drawText(`Similarity Score: ${similarityScore}%`, {
            x: margin,
            y: yPosition,
            size: 14,
            font: timesBold,
            color: simColor,
        })
        yPosition -= 20

        // AI Detection Score
        let aiColor
        if (aiDetectionScore <= 30) {
            aiColor = rgb(0, 0.6, 0)
        } else if (aiDetectionScore <= 70) {
            aiColor = rgb(0.8, 0.8, 0)
        } else {
            aiColor = rgb(0.6, 0, 0.8)
        }
        
        page.drawText(`AI Detection Score: ${aiDetectionScore}%`, {
            x: margin,
            y: yPosition,
            size: 14,
            font: timesBold,
            color: aiColor,
        })
        yPosition -= 20

        page.drawText(`Unique Content: ${uniqueContent}%`, {
            x: margin,
            y: yPosition,
            size: 14,
            font: timesRoman,
            color: rgb(0, 0.5, 0),
        })
        yPosition -= 30

        if (paraphrasingDetected && paraphrasingDetected !== 'no') {
            page.drawText(`! Paraphrasing Detected: ${sanitizeText(paraphrasingDetected)}`, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesBold,
                color: rgb(0.8, 0.5, 0),
            })
            yPosition -= 25
        }

        if (aiModelUsed) {
            page.drawText(`Analysis Model: ${sanitizeText(aiModelUsed)}`, {
                x: margin,
                y: yPosition,
                size: 10,
                font: timesRoman,
                color: rgb(0.4, 0.4, 0.4),
            })
            yPosition -= 30
        }

        // Overall Assessment
        if (overallAssessment) {
            page.drawText('OVERALL ASSESSMENT', {
                x: margin,
                y: yPosition,
                size: 14,
                font: timesBold,
                color: rgb(0, 0, 0),
            })
            yPosition -= 20

            page = drawWrappedText(page, overallAssessment, margin, 11, timesRoman, contentWidth)
            yPosition -= 20
        }

        // Suspicious Sections
        if (suspiciousSections && suspiciousSections.length > 0) {
            page = checkNewPage(100, page)
            
            page.drawText(`FLAGGED SECTIONS (${suspiciousSections.length})`, {
                x: margin,
                y: yPosition,
                size: 14,
                font: timesBold,
                color: rgb(0, 0, 0),
            })
            yPosition -= 25

            for (const section of suspiciousSections.slice(0, 10)) { // Limit to 10 for space
                page = checkNewPage(60, page)

                let severityColor
                if (section.severity === 'high') {
                    severityColor = rgb(0.8, 0, 0)
                } else if (section.severity === 'medium') {
                    severityColor = rgb(0.8, 0.6, 0)
                } else {
                    severityColor = rgb(0.8, 0.4, 0)
                }
                const typeText = section.type ? ` (${sanitizeText(section.type)})` : ''
                page.drawText(`- ${section.severity.toUpperCase()} RISK${typeText}`, {
                    x: margin,
                    y: yPosition,
                    size: 10,
                    font: timesBold,
                    color: severityColor,
                })
                yPosition -= 15

                const excerptText = section.text.length > 100 
                    ? section.text.substring(0, 100) + '...' 
                    : section.text

                page = drawWrappedText(page, `"${excerptText}"`, margin + 10, 9, timesRoman, contentWidth - 10)
                yPosition -= 5

                page = drawWrappedText(page, `Reason: ${section.reason}`, margin + 10, 9, timesRoman, contentWidth - 10)
                yPosition -= 15
            }
        }

        // Source Breakdown
        if (sourceBreakdown && sourceBreakdown.length > 0) {
            page = checkNewPage(100, page)

            page.drawText(`MATCHED SOURCES (${sourceBreakdown.length})`, {
                x: margin,
                y: yPosition,
                size: 14,
                font: timesBold,
                color: rgb(0, 0, 0),
            })
            yPosition -= 25

            for (const source of sourceBreakdown.slice(0, 15)) { // Limit to 15
                page = checkNewPage(50, page)

                page.drawText(`- ${sanitizeText(source.sourceTitle || 'Unknown Source')}`, {
                    x: margin,
                    y: yPosition,
                    size: 10,
                    font: timesBold,
                    color: rgb(0, 0, 0.6),
                })
                yPosition -= 15

                if (source.sourceUrl && source.sourceUrl !== 'unknown') {
                    const urlText = source.sourceUrl.length > 70 
                        ? source.sourceUrl.substring(0, 70) + '...' 
                        : source.sourceUrl
                    
                    page.drawText(`URL: ${sanitizeText(urlText)}`, {
                        x: margin + 10,
                        y: yPosition,
                        size: 8,
                        font: timesRoman,
                        color: rgb(0, 0, 0.8),
                    })
                    yPosition -= 12
                }

                page.drawText(`Type: ${sanitizeText(source.sourceType || 'unknown')} | Match: ${source.matchPercentage || 0}%`, {
                    x: margin + 10,
                    y: yPosition,
                    size: 9,
                    font: timesRoman,
                    color: rgb(0.3, 0.3, 0.3),
                })
                yPosition -= 20
            }
        } else if (matchedSources && matchedSources.length > 0) {
            // Fallback to basic matched sources
            page = checkNewPage(100, page)

            page.drawText(`POTENTIAL SOURCES (${matchedSources.length})`, {
                x: margin,
                y: yPosition,
                size: 14,
                font: timesBold,
                color: rgb(0, 0, 0),
            })
            yPosition -= 25

            for (const source of matchedSources.slice(0, 10)) {
                page = checkNewPage(40, page)

                page.drawText(`- ${sanitizeText(source.source)}`, {
                    x: margin,
                    y: yPosition,
                    size: 10,
                    font: timesBold,
                    color: rgb(0, 0, 0.6),
                })
                yPosition -= 15

                page = drawWrappedText(page, source.description, margin + 10, 9, timesRoman, contentWidth - 10)
                yPosition -= 15
            }
        }

        // Recommendations
        if (recommendations && recommendations.length > 0) {
            page = checkNewPage(100, page)

            page.drawText('RECOMMENDATIONS', {
                x: margin,
                y: yPosition,
                size: 14,
                font: timesBold,
                color: rgb(0, 0.5, 0),
            })
            yPosition -= 25

            for (const rec of recommendations) {
                page = checkNewPage(30, page)

                page.drawText('+', {
                    x: margin,
                    y: yPosition,
                    size: 12,
                    font: timesBold,
                    color: rgb(0, 0.6, 0),
                })

                page = drawWrappedText(page, rec, margin + 15, 10, timesRoman, contentWidth - 15)
                yPosition -= 10
            }
        }

        // Footer on last page
        yPosition = margin - 20
        page.drawText('Generated by Plagiarism Checker | Report is confidential', {
            x: margin,
            y: yPosition,
            size: 8,
            font: timesRoman,
            color: rgb(0.5, 0.5, 0.5),
        })

        // Save PDF
        const pdfBytes = await pdfDoc.save()

        // Return PDF
        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="plagiarism-report-${uid}.pdf"`,
            },
        })

    } catch (error: any) {
        console.error('PDF generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF report', details: error.message },
            { status: 500 }
        )
    }
}
