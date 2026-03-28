"use client"
import React, { useState } from 'react'
import { FileText, Download, RefreshCw, Sparkles, X } from 'lucide-react'
import { useAuthContext } from '@/app/provider'
import { storage } from '@/configs/firebaseConfig'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type CreationMode = 'manual' | 'prompt'

const generateUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function CoverPageCreator() {
    const { user } = useAuthContext()
    const [mode, setMode] = useState<CreationMode>('manual')
    const [formData, setFormData] = useState({
        institutionName: '',
        title: '',
        subject: '',
        studentName: '',
        indexNumber: '',
        className: '',
        teacherName: '',
        date: new Date().toISOString().split('T')[0]
    })

    const [promptText, setPromptText] = useState('')
    const [generatingFromPrompt, setGeneratingFromPrompt] = useState(false)
    const [template, setTemplate] = useState('classic')
    const [pageSize, setPageSize] = useState('a4')
    const [aiModel, setAiModel] = useState('gemini')
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)

    const templates = [
        { value: 'classic', label: 'Classic', category: 'Academic' },
        { value: 'modern', label: 'Modern', category: 'Business' },
        { value: 'minimal', label: 'Minimal', category: 'Academic' },
        { value: 'formal', label: 'Formal', category: 'Research' },
        { value: 'creative', label: 'Creative', category: 'Portfolio' },
        { value: 'professional', label: 'Professional', category: 'Business' }
    ]

    const pageSizes = [
        { value: 'a4', label: 'A4 (210 × 297 mm)' },
        { value: 'letter', label: 'Letter (8.5 × 11")' },
        { value: 'legal', label: 'Legal (8.5 × 14")' },
        { value: 'a3', label: 'A3 (297 × 420 mm)' }
    ]

    const aiModels = [
        { value: 'gemini', label: 'Gemini 2.0', provider: 'Google' },
        { value: 'chatgpt', label: 'GPT-4o', provider: 'OpenAI' },
        { value: 'claude', label: 'Claude 3.5', provider: 'Anthropic' }
    ]

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setUploadedImage(reader.result as string)
                toast.success('Image uploaded successfully')
            }
            reader.readAsDataURL(file)
        }
    }

    const generateFromPrompt = async () => {
        if (!promptText.trim()) {
            toast.error('Please enter a description for your cover page')
            return
        }

        setGeneratingFromPrompt(true)
        toast.info('AI is analyzing your description...')

        try {
            const response = await fetch('/api/generate-cover-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText, model: aiModel })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to generate cover page' }))
                throw new Error(errorData.error || `Server error: ${response.status}`)
            }

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setFormData({
                institutionName: data.institutionName || '',
                title: data.title || '',
                subject: data.subject || '',
                studentName: data.studentName || '',
                indexNumber: data.indexNumber || '',
                className: data.className || '',
                teacherName: data.teacherName || '',
                date: new Date().toISOString().split('T')[0]
            })

            if (data.template) setTemplate(data.template)

            setMode('manual')
            toast.success('Cover page generated! You can now customize it.')
        } catch (error: any) {
            console.error('Error generating cover page:', error)
            toast.error(error.message || 'Failed to generate cover page')
        } finally {
            setGeneratingFromPrompt(false)
        }
    }

    const generatePDF = async () => {
        if (!formData.institutionName || !formData.title || !formData.studentName) {
            toast.error('Please fill in required fields (Institution, Title, Name)')
            return
        }

        setGenerating(true)
        toast.info('Generating PDF...')

        try {
            const jsPDF = (await import('jspdf')).default
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: pageSize === 'a4' ? 'a4' : pageSize === 'letter' ? 'letter' : 'a4'
            })

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()
            const margin = 20

            if (template === 'classic' || template === 'formal') {
                doc.setLineWidth(1)
                doc.rect(15, 15, pageWidth - 30, pageHeight - 30)
                if (template === 'formal') {
                    doc.setLineWidth(0.5)
                    doc.rect(17, 17, pageWidth - 34, pageHeight - 34)
                }
            }

            if (uploadedImage) {
                try {
                    doc.addImage(uploadedImage, 'PNG', pageWidth / 2 - 15, 30, 30, 30)
                } catch (e) {
                    console.log('Could not add image to PDF')
                }
            }

            const institutionY = uploadedImage ? 70 : 40
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            const institutionLines = doc.splitTextToSize(formData.institutionName, pageWidth - 2 * margin)
            doc.text(institutionLines, pageWidth / 2, institutionY, { align: 'center' })

            const titleY = institutionY + 40
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            const titleLines = doc.splitTextToSize(formData.title, pageWidth - 2 * margin)
            doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' })

            if (formData.subject) {
                doc.setFontSize(12)
                doc.setFont('helvetica', 'normal')
                doc.text(formData.subject, pageWidth / 2, titleY + 15, { align: 'center' })
            }

            const studentSectionY = pageHeight / 2 + 10
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text('Submitted By:', pageWidth / 2, studentSectionY, { align: 'center' })

            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(formData.studentName, pageWidth / 2, studentSectionY + 10, { align: 'center' })

            let currentY = studentSectionY + 20
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')

            if (formData.indexNumber) {
                doc.text('Index Number: ' + formData.indexNumber, pageWidth / 2, currentY, { align: 'center' })
                currentY += 7
            }

            if (formData.className) {
                doc.text('Class: ' + formData.className, pageWidth / 2, currentY, { align: 'center' })
                currentY += 7
            }

            if (formData.teacherName) {
                currentY += 10
                doc.setFont('helvetica', 'normal')
                doc.text('Submitted To:', pageWidth / 2, currentY, { align: 'center' })
                doc.setFont('helvetica', 'bold')
                doc.text(formData.teacherName, pageWidth / 2, currentY + 7, { align: 'center' })
            }

            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            const formattedDate = new Date(formData.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            doc.text('Date: ' + formattedDate, pageWidth / 2, pageHeight - 30, { align: 'center' })

            try {
                let logoUrl = ''
                if (uploadedImage && user?.email) {
                    const logoFileName = Date.now() + '_logo.png'
                    const logoRef = ref(storage, 'CoverPageLogos/' + logoFileName)
                    const response = await fetch(uploadedImage)
                    const blob = await response.blob()
                    await uploadBytes(logoRef, blob)
                    logoUrl = await getDownloadURL(logoRef)
                }

                const uid = generateUID()
                await fetch('/api/cover-page', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: uid,
                        institutionName: formData.institutionName,
                        title: formData.title,
                        subject: formData.subject,
                        studentName: formData.studentName,
                        indexNumber: formData.indexNumber,
                        className: formData.className,
                        teacherName: formData.teacherName,
                        date: formData.date,
                        template: template,
                        pageSize: pageSize,
                        logoUrl: logoUrl,
                        aiModel: aiModel,
                        generationMethod: mode,
                        originalPrompt: mode === 'prompt' ? promptText : '',
                        email: user?.email
                    })
                })
            } catch (dbError) {
                console.error('Failed to save to database:', dbError)
            }

            const fileName = formData.title.replace(/[^a-z0-9]/gi, '_') + '_CoverPage.pdf'
            doc.save(fileName)
            toast.success('PDF downloaded successfully!')
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            toast.error('Failed to generate PDF. Please try again.')
        } finally {
            setGenerating(false)
        }
    }

    const mainContent = (
        <div className="xl:px-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-indigo-600" />
                        <h2 className="font-bold text-3xl">Cover Page Creator</h2>
                    </div>
                    <p className="text-gray-500 mt-1">Create professional cover pages - Choose your creation method</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'manual' ? 'default' : 'outline'}
                        onClick={() => setMode('manual')}
                        className="flex-1"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Manual Entry
                    </Button>
                    <Button
                        variant={mode === 'prompt' ? 'default' : 'outline'}
                        onClick={() => setMode('prompt')}
                        className="flex-1"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Prompt
                    </Button>
                </div>
            </div>

            {mode === 'prompt' && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6 mb-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        Describe Your Cover Page
                    </h3>
                    <Textarea
                        placeholder="Example: Create a cover page for my Computer Science thesis titled 'Machine Learning in Healthcare' at MIT. My name is John Smith, student ID: 2025CS001, supervised by Dr. Jane Doe."
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        className="min-h-[120px] mb-4"
                    />
                    <div className="flex items-center gap-4 mb-4">
                        <Select value={aiModel} onValueChange={setAiModel}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {aiModels.map((am) => (
                                    <SelectItem key={am.value} value={am.value}>
                                        {am.label} ({am.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={generateFromPrompt}
                        disabled={generatingFromPrompt || !promptText.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {generatingFromPrompt ? (
                            <span className="flex items-center">
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                            </span>
                        )}
                    </Button>
                </div>
            )}

            {mode === 'manual' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                            <h3 className="font-semibold text-lg mb-4">Cover Page Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Institution Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g., University of Technology"
                                        value={formData.institutionName}
                                        onChange={(e) => handleInputChange('institutionName', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Document Title <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g., Research Project Report"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Subject</label>
                                    <Input
                                        placeholder="e.g., Computer Science"
                                        value={formData.subject}
                                        onChange={(e) => handleInputChange('subject', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Student Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g., John Doe"
                                        value={formData.studentName}
                                        onChange={(e) => handleInputChange('studentName', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Index Number</label>
                                        <Input
                                            placeholder="e.g., 2025/CS/001"
                                            value={formData.indexNumber}
                                            onChange={(e) => handleInputChange('indexNumber', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Class/Year</label>
                                        <Input
                                            placeholder="e.g., 3rd Year"
                                            value={formData.className}
                                            onChange={(e) => handleInputChange('className', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Teacher/Professor Name</label>
                                    <Input
                                        placeholder="e.g., Dr. Jane Smith"
                                        value={formData.teacherName}
                                        onChange={(e) => handleInputChange('teacherName', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Date</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Template Style</label>
                                    <Select value={template} onValueChange={setTemplate}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label} ({t.category})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Page Size</label>
                                    <Select value={pageSize} onValueChange={setPageSize}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pageSizes.map((ps) => (
                                                <SelectItem key={ps.value} value={ps.value}>
                                                    {ps.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Upload Logo (Optional)</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="cursor-pointer"
                                        />
                                        {uploadedImage && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUploadedImage(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {uploadedImage && (
                                        <div className="mt-2 w-20 h-20 border rounded overflow-hidden">
                                            <img src={uploadedImage} alt="Logo" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={generatePDF}
                            disabled={generating}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            size="lg"
                        >
                            {generating ? (
                                <span className="flex items-center">
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Generating PDF...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate and Download PDF
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                        <h3 className="font-semibold text-lg mb-4">Live Preview</h3>
                        <div className="border-2 border-gray-300 rounded-lg p-6 bg-white min-h-[500px] flex flex-col items-center justify-center text-center">
                            {uploadedImage && (
                                <div className="w-16 h-16 mb-4">
                                    <img src={uploadedImage} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                                {formData.institutionName || 'Institution Name'}
                            </h4>
                            <div className="w-32 h-0.5 bg-gray-300 my-4"></div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {formData.title || 'Document Title'}
                            </h3>
                            {formData.subject && (
                                <p className="text-gray-600 italic mb-4">{formData.subject}</p>
                            )}
                            <div className="mt-8">
                                <p className="text-sm text-gray-500">Submitted By:</p>
                                <p className="font-semibold text-gray-800">
                                    {formData.studentName || 'Student Name'}
                                </p>
                                {formData.indexNumber && (
                                    <p className="text-sm text-gray-600">ID: {formData.indexNumber}</p>
                                )}
                                {formData.className && (
                                    <p className="text-sm text-gray-600">{formData.className}</p>
                                )}
                            </div>
                            {formData.teacherName && (
                                <div className="mt-6">
                                    <p className="text-sm text-gray-500">Submitted To:</p>
                                    <p className="font-semibold text-gray-800">{formData.teacherName}</p>
                                </div>
                            )}
                            <p className="mt-8 text-sm text-gray-500">
                                {formData.date ? new Date(formData.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Date'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return mainContent
}

export default CoverPageCreator
