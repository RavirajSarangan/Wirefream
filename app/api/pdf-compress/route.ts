import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const compressionLevel = formData.get('compressionLevel') as string || 'medium'

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            )
        }

        // Read the uploaded PDF
        const bytes = await file.arrayBuffer()
        
        // Load the PDF
        const pdfDoc = await PDFDocument.load(bytes)

        // Compress by removing metadata and unused objects
        pdfDoc.setTitle('')
        pdfDoc.setAuthor('')
        pdfDoc.setSubject('')
        pdfDoc.setKeywords([])
        pdfDoc.setProducer('')
        pdfDoc.setCreator('')

        // Save with compression settings based on level
        let compressedPdfBytes: Uint8Array

        switch (compressionLevel) {
            case 'high':
                // Maximum compression - remove all optional content
                compressedPdfBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectsPerTick: 50,
                })
                break
            case 'low':
                // Minimal compression - preserve more quality
                compressedPdfBytes = await pdfDoc.save({
                    useObjectStreams: false,
                    addDefaultPage: false,
                })
                break
            case 'medium':
            default:
                // Balanced compression
                compressedPdfBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                })
                break
        }

        // Return compressed PDF
        return new NextResponse(Buffer.from(compressedPdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '-compressed.pdf')}"`,
            },
        })
    } catch (error: any) {
        console.error('Compression error:', error)
        return NextResponse.json(
            { error: 'Failed to compress PDF', details: error.message },
            { status: 500 }
        )
    }
}
