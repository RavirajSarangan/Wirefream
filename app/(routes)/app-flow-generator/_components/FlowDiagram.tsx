"use client"
import React, { useEffect, useRef, useState } from 'react'

// Cache mermaid module — only imported and initialized once across all renders
let mermaidInstance: typeof import('mermaid').default | null = null
import { GitBranch, Download, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FlowDiagramProps {
    mermaidSyntax: string
    appName: string
}

function FlowDiagram({ mermaidSyntax, appName }: FlowDiagramProps) {
    const diagramRef = useRef<HTMLDivElement>(null)
    const [isRendering, setIsRendering] = useState(true)
    const [renderError, setRenderError] = useState(false)

    useEffect(() => {
        const renderDiagram = async () => {
            if (!diagramRef.current || !mermaidSyntax) return

            setIsRendering(true)
            setRenderError(false)

            try {
                // Load and initialize mermaid only once
                if (!mermaidInstance) {
                    mermaidInstance = (await import('mermaid')).default
                    mermaidInstance.initialize({
                        startOnLoad: false,
                        theme: 'default',
                        securityLevel: 'loose',
                        flowchart: {
                            useMaxWidth: true,
                            htmlLabels: true,
                            curve: 'basis'
                        }
                    })
                }

                // Clear previous diagram
                diagramRef.current.innerHTML = ''

                // Render the diagram
                const { svg } = await mermaidInstance.render(
                    `mermaid-diagram-${Date.now()}`,
                    mermaidSyntax
                )

                if (diagramRef.current) {
                    diagramRef.current.innerHTML = svg
                }

                setIsRendering(false)
            } catch (error) {
                console.error('Mermaid rendering error:', error)
                setRenderError(true)
                setIsRendering(false)
            }
        }

        renderDiagram()
    }, [mermaidSyntax])

    const handleExportSVG = async () => {
        if (!diagramRef.current) return

        try {
            const svgElement = diagramRef.current.querySelector('svg')
            if (!svgElement) {
                toast.error('No diagram to export')
                return
            }

            const svgData = new XMLSerializer().serializeToString(svgElement)
            const blob = new Blob([svgData], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${appName.replaceAll(' ', '-')}-flow-diagram.svg`
            link.click()
            URL.revokeObjectURL(url)
            toast.success('Diagram exported as SVG')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export diagram')
        }
    }

    const handleExportPNG = async () => {
        if (!diagramRef.current) return

        try {
            // Dynamically import html2canvas
            const html2canvas = (await import('html2canvas')).default

            const svgElement = diagramRef.current.querySelector('svg')
            if (!svgElement) {
                toast.error('No diagram to export')
                return
            }

            const canvas = await html2canvas(diagramRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            })

            canvas.toBlob((blob) => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${appName.replaceAll(' ', '-')}-flow-diagram.png`
                link.click()
                URL.revokeObjectURL(url)
                toast.success('Diagram exported as PNG')
            })
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export diagram')
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <GitBranch className='h-6 w-6 text-primary' />
                    <h3 className='font-bold text-xl'>Flow Diagram</h3>
                </div>
                <div className='flex gap-2'>
                    <Button 
                        variant='outline' 
                        size='sm'
                        onClick={handleExportSVG}
                        disabled={isRendering || renderError}
                        className='gap-2'
                    >
                        <Download className='h-4 w-4' />
                        Export SVG
                    </Button>
                    <Button 
                        variant='outline' 
                        size='sm'
                        onClick={handleExportPNG}
                        disabled={isRendering || renderError}
                        className='gap-2'
                    >
                        <Download className='h-4 w-4' />
                        Export PNG
                    </Button>
                </div>
            </div>

            <div className='p-6 border-2 rounded-lg bg-white'>
                {isRendering && (
                    <div className='flex items-center justify-center py-20'>
                        <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
                        <span className='ml-3 text-gray-500'>Rendering diagram...</span>
                    </div>
                )}

                {renderError && (
                    <div className='py-20 text-center'>
                        <p className='text-red-500 font-semibold mb-2'>Failed to render diagram</p>
                        <p className='text-sm text-gray-500'>
                            The AI-generated diagram syntax may have errors. Try regenerating.
                        </p>
                        <pre className='mt-4 p-4 bg-gray-100 rounded text-xs text-left overflow-auto max-h-40'>
                            {mermaidSyntax}
                        </pre>
                    </div>
                )}

                <div 
                    ref={diagramRef}
                    className={`flex justify-center items-center ${isRendering || renderError ? 'hidden' : ''}`}
                />
            </div>

            {/* Mermaid Syntax Display */}
            {!isRendering && !renderError && (
                <details className='text-sm'>
                    <summary className='cursor-pointer text-gray-600 hover:text-gray-800 font-semibold'>
                        View Mermaid Syntax
                    </summary>
                    <pre className='mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60'>
                        {mermaidSyntax}
                    </pre>
                </details>
            )}
        </div>
    )
}

export default FlowDiagram
