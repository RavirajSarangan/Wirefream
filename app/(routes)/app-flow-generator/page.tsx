"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Workflow, Sparkles, Loader2Icon, Download, History, FileDown } from 'lucide-react'
import React, { useState, useRef } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { useAuthContext } from '@/app/provider'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Constants from '@/data/Constants'
import ScreenList from './_components/ScreenList'
import FlowDiagram from './_components/FlowDiagram'
import UserJourneyMap from './_components/UserJourneyMap'
import { Skeleton } from '@/components/ui/skeleton'

interface Screen {
    name: string
    purpose: string
    elements: string[]
    interactions?: string[]
}

interface UserJourney {
    persona?: string
    steps: Array<{
        step: number
        action: string
        screen: string
        emotion: string
        painPoint?: string
    }>
    goals?: string[]
}

interface AppFlowData {
    uid: string
    appName: string
    screens: Screen[]
    flowDiagram: string
    userJourney: UserJourney
    creditsRemaining: number
}

function AppFlowGenerator() {
    const { user } = useAuthContext()
    const router = useRouter()
    const [appDescription, setAppDescription] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState('Gemini Google')
    const [loading, setLoading] = useState(false)
    const [flowData, setFlowData] = useState<AppFlowData | null>(null)
    const [exportingPDF, setExportingPDF] = useState(false)

    const contentRef = useRef<HTMLDivElement>(null)

    const wordCount = appDescription.trim() ? appDescription.trim().split(/\s+/).length : 0
    const charCount = appDescription.length

    const onGenerateFlow = async () => {
        if (!appDescription.trim()) {
            toast.error('Please enter an app description')
            return
        }

        if (wordCount < 3) {
            toast.error('Please provide a more detailed description (at least 3 words)')
            return
        }

        if (wordCount > 500) {
            toast.error('Description is too long. Please keep it under 500 words.')
            return
        }

        setLoading(true)
        setFlowData(null)

        try {
            const response = await axios.post('/api/generate-app-flow', {
                appDescription: appDescription,
                model: Constants.AiModelList.find(m => m.name === selectedModel)?.modelName || 'google/gemini-2.0-flash-001',
                email: user?.email
            })

            if (response.data.success) {
                setFlowData(response.data)
                toast.success('App flow generated successfully!')
            } else if (response.data.error) {
                toast.error(response.data.error)
            }
        } catch (error: any) {
            console.error('App flow generation error:', error)
            toast.error(error.response?.data?.error || 'Failed to generate app flow')
        } finally {
            setLoading(false)
        }
    }

    const onReset = () => {
        setAppDescription('')
        setFlowData(null)
    }

    const handleExportJSON = () => {
        if (!flowData) return

        const dataStr = JSON.stringify(flowData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${flowData.appName.replaceAll(' ', '-')}-flow.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Flow data exported as JSON')
    }

    const handleExportPDF = async () => {
        if (!flowData || !contentRef.current) return
        
        setExportingPDF(true)
        toast.info('Generating PDF... This may take a moment')

        try {
            const html2canvas = (await import('html2canvas')).default
            const jsPDF = (await import('jspdf')).default

            const element = contentRef.current
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            const imgWidth = canvas.width
            const imgHeight = canvas.height
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
            const imgX = (pdfWidth - imgWidth * ratio) / 2
            const imgY = 10

            // If content is too long, split into multiple pages
            const pageHeight = imgHeight * ratio
            let heightLeft = pageHeight
            let position = 0

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, pageHeight)
            heightLeft -= pdfHeight

            while (heightLeft >= 0) {
                position = heightLeft - pageHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, pageHeight)
                heightLeft -= pdfHeight
            }

            pdf.save(`${flowData.appName.replaceAll(' ', '-')}-flow.pdf`)
            toast.success('PDF exported successfully!')
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error('Failed to export PDF')
        } finally {
            setExportingPDF(false)
        }
    }

    return (
        <div className='xl:px-20'>
            <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-3'>
                    <Workflow className='h-8 w-8 text-primary' />
                    <h2 className='font-bold text-3xl'>AI App Flow Generator</h2>
                </div>
                <Button 
                    variant='outline' 
                    onClick={() => router.push('/flow-history')}
                    className='gap-2'
                >
                    <History className='h-4 w-4' />
                    View History
                </Button>
            </div>
            <p className='text-gray-500 mb-10'>
                Generate complete app flows with screen lists, flow diagrams, and user journey maps (Costs 2 credits)
            </p>

            <div className='mt-10'>
                {flowData ? (
                    <div className='space-y-8'>
                        {/* Header with Export */}
                        <div className='flex items-center justify-between'>
                            <div>
                                <h2 className='text-2xl font-bold text-primary'>{flowData.appName}</h2>
                                <p className='text-sm text-gray-500 mt-1'>
                                    Credits remaining: {flowData.creditsRemaining}
                                </p>
                            </div>
                            <div className='flex gap-3'>
                                <Button 
                                    variant='outline' 
                                    onClick={handleExportJSON}
                                    className='gap-2'
                                    disabled={exportingPDF}
                                >
                                    <Download className='h-4 w-4' />
                                    Export JSON
                                </Button>
                                <Button 
                                    variant='outline' 
                                    onClick={handleExportPDF}
                                    className='gap-2'
                                    disabled={exportingPDF}
                                >
                                    {exportingPDF ? (
                                        <>
                                            <Loader2Icon className='h-4 w-4 animate-spin' />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FileDown className='h-4 w-4' />
                                            Export PDF
                                        </>
                                    )}
                                </Button>
                                <Button onClick={onReset}>
                                    Generate Another
                                </Button>
                            </div>
                        </div>

                        {/* Exportable Content */}
                        <div ref={contentRef} className='bg-white p-8 rounded-lg'>
                            {/* Screen List */}
                            <ScreenList screens={flowData.screens} />

                            {/* Flow Diagram */}
                            <FlowDiagram 
                                mermaidSyntax={flowData.flowDiagram}
                                appName={flowData.appName}
                            />

                            {/* User Journey Map */}
                            {flowData.userJourney && (
                                <UserJourneyMap journey={flowData.userJourney} />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-10'>
                        {/* App Description Input */}
                        <div className='space-y-4'>
                            <div className='flex justify-between items-center'>
                                <h3 className='font-semibold text-lg'>Describe Your App</h3>
                                <div className='text-sm text-gray-500'>
                                    {wordCount} words | {charCount} characters
                                    {wordCount > 500 && <span className='text-red-500 ml-2'>(Max: 500 words)</span>}
                                </div>
                            </div>
                            <Textarea
                                value={appDescription}
                                onChange={(e) => setAppDescription(e.target.value)}
                                placeholder='Example: "Create an attendance tracking app for schools where teachers can mark student attendance, view attendance reports, send notifications to parents, and generate monthly summaries"'
                                className='min-h-[200px] text-sm'
                            />
                            <div className='text-xs text-gray-400 space-y-1'>
                                <p>💡 <strong>Tips for best results:</strong></p>
                                <ul className='list-disc ml-6 space-y-1'>
                                    <li>Describe the main purpose of your app</li>
                                    <li>Mention key features or functionality</li>
                                    <li>Include target users (students, teachers, businesses, etc.)</li>
                                    <li>Specify any specific workflows or processes</li>
                                </ul>
                            </div>
                        </div>

                        {/* AI Model Selection */}
                        {appDescription && (
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-2'>
                                    <label htmlFor='ai-model-select' className='font-semibold text-sm'>
                                        Select AI Model
                                    </label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
                                        <SelectTrigger className='w-full md:w-[300px]'>
                                            <SelectValue placeholder="Select AI Model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Constants?.AiModelList.map((model) => (
                                                <SelectItem value={model.name} key={model.name}>
                                                    <div className='flex items-center gap-2'>
                                                        <Image 
                                                            src={model.icon} 
                                                            alt={model.name} 
                                                            width={20} 
                                                            height={20} 
                                                        />
                                                        <h2>{model.name}</h2>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className='text-xs text-gray-500'>
                                        Different models may provide varying creativity and detail levels
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className='flex items-center justify-center gap-4'>
                            <Button 
                                onClick={onGenerateFlow} 
                                disabled={!appDescription.trim() || loading || wordCount > 500}
                                size='lg'
                                className='gap-2'
                            >
                                {loading ? (
                                    <>
                                        <Loader2Icon className='h-5 w-5 animate-spin' />
                                        Generating App Flow...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className='h-5 w-5' />
                                        Generate App Flow (2 Credits)
                                    </>
                                )}
                            </Button>
                            {appDescription && !loading && (
                                <Button variant='outline' onClick={onReset}>
                                    Reset
                                </Button>
                            )}
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className='space-y-6 mt-10'>
                                <div className='space-y-3'>
                                    <Skeleton className='h-8 w-48' />
                                    <Skeleton className='h-32 w-full' />
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Skeleton key={i} className='h-40' />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AppFlowGenerator
