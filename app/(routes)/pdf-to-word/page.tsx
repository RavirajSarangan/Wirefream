"use client"
import { Button } from '@/components/ui/button'
import { CloudUpload, Download, FileType, Loader2Icon, X } from 'lucide-react'
import React, { ChangeEvent, useState } from 'react'
import { toast } from 'sonner'
import axios from 'axios'

function PDFToWord() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>('')

    const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files[0]) {
            const selectedFile = files[0]
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                setFile(selectedFile)
                setFileName(selectedFile.name.replace('.pdf', '.docx'))
                setConvertedFileUrl(null)
            } else {
                toast.error('Please select a valid PDF file')
            }
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf'))) {
            setFile(droppedFile)
            setFileName(droppedFile.name.replace('.pdf', '.docx'))
            setConvertedFileUrl(null)
        } else {
            toast.error('Please drop a valid PDF file')
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const onConvertClick = async () => {
        if (!file) {
            toast.error('Please select a file first')
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await axios.post('/api/pdf-to-word', formData, {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            })
            const url = URL.createObjectURL(blob)
            setConvertedFileUrl(url)
            toast.success('File converted successfully!')
        } catch (error: any) {
            console.error('Conversion error:', error)
            toast.error(error.response?.data?.error || 'Failed to convert file')
        } finally {
            setLoading(false)
        }
    }

    const onDownloadClick = () => {
        if (convertedFileUrl) {
            const link = document.createElement('a')
            link.href = convertedFileUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('File downloaded successfully!')
        }
    }

    const onReset = () => {
        setFile(null)
        setConvertedFileUrl(null)
        setFileName('')
    }

    return (
        <div className='xl:px-20'>
            <h2 className='font-bold text-3xl mb-2'>PDF to Word Converter</h2>
            <p className='text-gray-500 mb-10'>Convert your PDF files to editable Word documents (.docx)</p>

            <div className='mt-10'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    <div 
                        className='p-7 border-2 border-dashed rounded-md shadow-md flex flex-col items-center justify-center min-h-[300px] hover:border-primary transition-colors'
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {file ? (
                            <div className='w-full'>
                                <div className='flex items-center justify-between mb-4'>
                                    <div className='flex items-center gap-3'>
                                        <FileType className='h-10 w-10 text-red-500' />
                                        <div>
                                            <h3 className='font-semibold'>{file.name}</h3>
                                            <p className='text-sm text-gray-500'>
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <X 
                                        className='h-6 w-6 cursor-pointer text-gray-500 hover:text-red-500'
                                        onClick={onReset}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <CloudUpload className='h-16 w-16 text-primary mb-4' />
                                <h2 className='font-bold text-lg'>Upload PDF Document</h2>
                                <p className='text-gray-400 mt-2 text-center'>
                                    Drag and drop or click to select PDF file
                                </p>
                                <div className='p-5 border border-dashed w-full flex mt-4 justify-center'>
                                    <label htmlFor='pdfFileSelect'>
                                        <h2 className='p-2 bg-blue-100 font-bold text-primary rounded-md px-5 cursor-pointer hover:bg-blue-200'>
                                            Select PDF File
                                        </h2>
                                    </label>
                                </div>
                                <input 
                                    type="file" 
                                    id='pdfFileSelect'
                                    className='hidden'
                                    accept='.pdf,application/pdf'
                                    onChange={onFileSelect}
                                />
                            </>
                        )}
                    </div>

                    <div className='p-7 border shadow-md rounded-lg min-h-[300px] flex flex-col justify-between'>
                        <div>
                            <h2 className='font-bold text-lg mb-4'>Conversion Result</h2>
                            {convertedFileUrl ? (
                                <div className='space-y-4'>
                                    <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
                                        <div className='flex items-center gap-3'>
                                            <FileType className='h-10 w-10 text-green-600' />
                                            <div>
                                                <h3 className='font-semibold text-green-800'>{fileName}</h3>
                                                <p className='text-sm text-green-600'>Converted successfully</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={onDownloadClick} 
                                        className='w-full'
                                    >
                                        <Download className='mr-2' />
                                        Download Word Document
                                    </Button>
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center h-40 text-gray-400'>
                                    <FileType className='h-12 w-12 mb-2' />
                                    <p className='text-center'>Upload a PDF to convert to Word document</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className='mt-10 flex items-center justify-center'>
                    <Button 
                        onClick={onConvertClick} 
                        disabled={!file || loading}
                        size='lg'
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className='mr-2 animate-spin' />
                                Converting...
                            </>
                        ) : (
                            <>
                                <FileType className='mr-2' />
                                Convert to Word
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PDFToWord
