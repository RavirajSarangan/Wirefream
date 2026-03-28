"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CloudUpload, FileSearch, Loader2Icon, X, FileText } from 'lucide-react'
import React, { ChangeEvent, useState } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { useAuthContext } from '@/app/provider'
import { useRouter } from 'next/navigation'
import PlagiarismReport from './_components/PlagiarismReport'
import Image from 'next/image'
import Constants from '@/data/Constants'

function PlagiarismChecker() {
    const { user } = useAuthContext()
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [textInput, setTextInput] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [extracting, setExtracting] = useState(false)
    const [plagiarismResult, setPlagiarismResult] = useState<any>(null)
    const [inputMethod, setInputMethod] = useState<'file' | 'text'>('text')
    const [selectedModel, setSelectedModel] = useState('Gemini Google')

    const wordCount = textInput.trim() ? textInput.trim().split(/\s+/).length : 0
    const charCount = textInput.length

    const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files[0]) {
            const selectedFile = files[0]
            const validTypes = [
                'text/plain',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            const validExtensions = ['.txt', '.pdf', '.docx']
            
            const isValidType = validTypes.includes(selectedFile.type) || 
                              validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))
            
            if (isValidType && selectedFile.size <= 5 * 1024 * 1024) { // 5MB limit
                setFile(selectedFile)
                setInputMethod('file')
                setTextInput('')
                setPlagiarismResult(null)
                extractTextFromFile(selectedFile)
            } else if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB')
            } else {
                toast.error('Please select a valid file (.txt, .pdf, or .docx)')
            }
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            const event = { target: { files: [droppedFile] } } as any
            onFileSelect(event)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault()
    }

    const extractTextFromFile = async (file: File) => {
        setExtracting(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await axios.post('/api/extract-text', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 second timeout
            })

            if (response.data.text) {
                setTextInput(response.data.text)
                toast.success(`Text extracted successfully (${response.data.wordCount} words)`)
            }
        } catch (error: any) {
            console.error('Extraction error:', error)
            
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    toast.error('Request timed out. Please try a smaller file.')
                } else if (error.code === 'ERR_NETWORK') {
                    toast.error('Network error. Please check your connection and try again.')
                } else if (error.response) {
                    toast.error(error.response.data?.error || 'Failed to extract text from file')
                } else {
                    toast.error('Failed to connect to server. Please try again.')
                }
            } else {
                toast.error('An unexpected error occurred')
            }
            setFile(null)
        } finally {
            setExtracting(false)
        }
    }

    const onCheckPlagiarism = async () => {
        if (!textInput.trim()) {
            toast.error('Please enter or upload text to check')
            return
        }

        if (wordCount > 10000) {
            toast.error('Text must be less than 10,000 words')
            return
        }

        if (wordCount < 50) {
            toast.error('Text must be at least 50 words for accurate analysis')
            return
        }

        setLoading(true)
        setPlagiarismResult(null)

        try {
            const response = await axios.post('/api/check-plagiarism', {
                text: textInput,
                fileName: file?.name || 'Direct Text Input',
                email: user?.email,
                model: selectedModel
            }, {
                timeout: 120000, // 2 minute timeout for AI processing
            })

            if (response.data.success) {
                setPlagiarismResult(response.data)
                toast.success('Plagiarism check completed!')
            } else if (response.data.error) {
                toast.error(response.data.error)
            }
        } catch (error: any) {
            console.error('Plagiarism check error:', error)
            
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    toast.error('Request timed out. The text might be too long. Please try with a shorter text.')
                } else if (error.code === 'ERR_NETWORK') {
                    toast.error('Network error. Please check your connection and try again.')
                } else if (error.response) {
                    toast.error(error.response.data?.error || 'Failed to check plagiarism')
                } else {
                    toast.error('Failed to connect to server. Please try again.')
                }
            } else {
                toast.error('An unexpected error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    const onReset = () => {
        setFile(null)
        setTextInput('')
        setPlagiarismResult(null)
        setInputMethod('text')
    }

    return (
        <div className='xl:px-20'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='font-bold text-3xl'>Plagiarism Checker</h2>
                <Button 
                    variant='outline' 
                    onClick={() => router.push('/history')}
                    className='gap-2'
                >
                    <FileText className='h-4 w-4' />
                    View History
                </Button>
            </div>
            <p className='text-gray-500 mb-10'>
                Check your text for plagiarism using AI-powered analysis (Costs 2 credits)
            </p>

            <div className='mt-10'>
                <div className='grid grid-cols-1 gap-10'>
                    {/* Input Method Selection */}
                    <div className='flex gap-4 mb-4'>
                        <Button
                            variant={inputMethod === 'text' ? 'default' : 'outline'}
                            onClick={() => {
                                setInputMethod('text')
                                setFile(null)
                            }}
                        >
                            <FileText className='mr-2 h-4 w-4' />
                            Type/Paste Text
                        </Button>
                        <Button
                            variant={inputMethod === 'file' ? 'default' : 'outline'}
                            onClick={() => setInputMethod('file')}
                        >
                            <CloudUpload className='mr-2 h-4 w-4' />
                            Upload File
                        </Button>
                    </div>

                    {/* File Upload Section */}
                    {inputMethod === 'file' && (
                        <label 
                            htmlFor='fileInput'
                            className='p-10 border-2 border-dashed rounded-md shadow-md flex flex-col items-center justify-center min-h-[300px] hover:border-primary transition-colors cursor-pointer'
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                                {file ? (
                                    <div className='w-full'>
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='flex items-center gap-3'>
                                                <FileText className='h-10 w-10 text-blue-500' />
                                                <div>
                                                    <h3 className='font-semibold'>{file.name}</h3>
                                                    <p className='text-sm text-gray-500'>
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <X 
                                                className='h-6 w-6 cursor-pointer text-gray-500 hover:text-red-500'
                                                onClick={onReset}
                                            />
                                        </div>
                                        {extracting && (
                                            <div className='flex items-center gap-2 text-blue-600'>
                                                <Loader2Icon className='h-5 w-5 animate-spin' />
                                                <span>Extracting text...</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <CloudUpload className='h-16 w-16 text-primary mb-4' />
                                        <h2 className='font-bold text-lg'>Upload Document</h2>
                                        <p className='text-gray-400 mt-2 text-center'>
                                            Drag and drop or click to select file<br/>
                                            Supported: .txt, .pdf, .docx (max 5MB)
                                        </p>
                                        <div className='p-5 border border-dashed w-full flex mt-4 justify-center'>
                                            <label htmlFor='fileSelect'>
                                                <h2 className='p-2 bg-blue-100 font-bold text-primary rounded-md px-5 cursor-pointer hover:bg-blue-200'>
                                                    Select File
                                                </h2>
                                            </label>
                                        </div>
                                        <input 
                                            type="file" 
                                            id='fileSelect'
                                            className='hidden'
                                            accept='.txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                            onChange={onFileSelect}
                                        />
                                    </>
                            )}
                        </label>
                    )}

                    {/* Text Input Section */}
                    {inputMethod === 'text' && (
                        <div className='space-y-4'>
                            <div className='flex justify-between items-center'>
                                <h3 className='font-semibold text-lg'>Enter Text</h3>
                                <div className='text-sm text-gray-500'>
                                    {wordCount} words | {charCount} characters
                                    {wordCount > 10000 && <span className='text-red-500 ml-2'>(Max: 10,000 words)</span>}
                                </div>
                            </div>
                            <Textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Paste or type your text here to check for plagiarism..."
                                className='min-h-[400px] font-mono text-sm'
                            />
                        </div>
                    )}

                    {/* Extracted Text Display (for file uploads) */}
                    {inputMethod === 'file' && textInput && !extracting && (
                        <div className='space-y-4'>
                            <div className='flex justify-between items-center'>
                                <h3 className='font-semibold text-lg'>Extracted Text</h3>
                                <div className='text-sm text-gray-500'>
                                    {wordCount} words | {charCount} characters
                                </div>
                            </div>
                            <Textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className='min-h-[300px] font-mono text-sm'
                            />
                        </div>
                    )}

                    {/* AI Model Selection */}
                    {textInput && !extracting && (
                        <div className='space-y-4'>
                            <div className='flex flex-col gap-2'>
                                <label htmlFor='ai-model-select' className='font-semibold text-sm'>Select AI Model</label>
                                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
                                    <SelectTrigger className='w-full md:w-[300px]'>
                                        <SelectValue placeholder="Select AI Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Constants?.AiModelList.map((model) => (
                                            <SelectItem value={model.name} key={model.name}>
                                                <div className='flex items-center gap-2'>
                                                    <Image src={model.icon} alt={model.name} width={20} height={20} />
                                                    <h2>{model.name}</h2>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className='text-xs text-gray-500'>Different models may provide varying accuracy levels</p>
                            </div>
                        </div>
                    )}

                    {/* Check Button */}
                    <div className='flex items-center justify-center gap-4'>
                        <Button 
                            onClick={onCheckPlagiarism} 
                            disabled={!textInput.trim() || loading || extracting || wordCount > 10000}
                            size='lg'
                        >
                            {loading ? (
                                <>
                                    <Loader2Icon className='mr-2 animate-spin' />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <FileSearch className='mr-2' />
                                    Check Plagiarism (2 Credits)
                                </>
                            )}
                        </Button>
                        {(textInput || file) && !loading && (
                            <Button variant='outline' onClick={onReset}>
                                Reset
                            </Button>
                        )}
                    </div>
                        
                    {plagiarismResult && (
                        <PlagiarismReport 
                            result={plagiarismResult} 
                            originalText={textInput}
                            onCheckAnother={onReset}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PlagiarismChecker
