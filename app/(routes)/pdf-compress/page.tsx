"use client"
import { Button } from '@/components/ui/button'
import { CloudUpload, Download, Loader2Icon, Minimize2, X } from 'lucide-react'
import React, { ChangeEvent, useState } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function PDFCompress() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>('')
    const [compressionLevel, setCompressionLevel] = useState<string>('medium')
    const [originalSize, setOriginalSize] = useState<number>(0)
    const [compressedSize, setCompressedSize] = useState<number>(0)

    const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files[0]) {
            const selectedFile = files[0]
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                setFile(selectedFile)
                setFileName(selectedFile.name.replace('.pdf', '-compressed.pdf'))
                setOriginalSize(selectedFile.size)
                setConvertedFileUrl(null)
                setCompressedSize(0)
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
            setFileName(droppedFile.name.replace('.pdf', '-compressed.pdf'))
            setOriginalSize(droppedFile.size)
            setConvertedFileUrl(null)
            setCompressedSize(0)
        } else {
            toast.error('Please drop a valid PDF file')
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const onCompressClick = async () => {
        if (!file) {
            toast.error('Please select a file first')
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('compressionLevel', compressionLevel)

        try {
            const response = await axios.post('/api/pdf-compress', formData, {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const blob = new Blob([response.data], { type: 'application/pdf' })
            setCompressedSize(blob.size)
            const url = URL.createObjectURL(blob)
            setConvertedFileUrl(url)
            toast.success('PDF compressed successfully!')
        } catch (error: any) {
            console.error('Compression error:', error)
            toast.error(error.response?.data?.error || 'Failed to compress PDF')
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
            link.remove()
            toast.success('File downloaded successfully!')
        }
    }

    const onReset = () => {
        setFile(null)
        setConvertedFileUrl(null)
        setFileName('')
        setOriginalSize(0)
        setCompressedSize(0)
    }

    const calculateReduction = () => {
        if (originalSize && compressedSize) {
            const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
            return reduction
        }
        return '0'
    }

    return (
        <div className='xl:px-20'>
            <h2 className='font-bold text-3xl mb-2'>PDF Compress</h2>
            <p className='text-gray-500 mb-10'>Reduce PDF file size while maintaining quality</p>

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
                                        <Minimize2 className='h-10 w-10 text-purple-500' />
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
                                    <label htmlFor='pdfCompressSelect'>
                                        <h2 className='p-2 bg-blue-100 font-bold text-primary rounded-md px-5 cursor-pointer hover:bg-blue-200'>
                                            Select PDF File
                                        </h2>
                                    </label>
                                </div>
                                <input 
                                    type="file" 
                                    id='pdfCompressSelect'
                                    className='hidden'
                                    accept='.pdf,application/pdf'
                                    onChange={onFileSelect}
                                />
                            </>
                        )}
                    </div>

                    <div className='p-7 border shadow-md rounded-lg min-h-[300px] flex flex-col justify-between'>
                        <div>
                            <h2 className='font-bold text-lg mb-4'>Compression Settings</h2>
                            
                            <Select onValueChange={(value) => setCompressionLevel(value)} defaultValue="medium">
                                <SelectTrigger className="w-full mb-6">
                                    <SelectValue placeholder="Select compression level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (Better Quality)</SelectItem>
                                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                                    <SelectItem value="high">High (Smaller Size)</SelectItem>
                                </SelectContent>
                            </Select>

                            {convertedFileUrl ? (
                                <div className='space-y-4'>
                                    <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
                                        <div className='flex items-center gap-3 mb-3'>
                                            <Minimize2 className='h-10 w-10 text-green-600' />
                                            <div>
                                                <h3 className='font-semibold text-green-800'>{fileName}</h3>
                                                <p className='text-sm text-green-600'>Compressed successfully</p>
                                            </div>
                                        </div>
                                        <div className='grid grid-cols-2 gap-4 mt-4 text-sm'>
                                            <div>
                                                <p className='text-gray-600'>Original Size</p>
                                                <p className='font-semibold'>{(originalSize / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div>
                                                <p className='text-gray-600'>Compressed Size</p>
                                                <p className='font-semibold text-green-600'>{(compressedSize / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div className='col-span-2'>
                                                <p className='text-gray-600'>Size Reduction</p>
                                                <p className='font-semibold text-green-600'>{calculateReduction()}%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={onDownloadClick} 
                                        className='w-full'
                                    >
                                        <Download className='mr-2' />
                                        Download Compressed PDF
                                    </Button>
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center h-32 text-gray-400'>
                                    <Minimize2 className='h-12 w-12 mb-2' />
                                    <p className='text-center'>Upload a PDF to compress</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className='mt-10 flex items-center justify-center'>
                    <Button 
                        onClick={onCompressClick} 
                        disabled={!file || loading}
                        size='lg'
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className='mr-2 animate-spin' />
                                Compressing...
                            </>
                        ) : (
                            <>
                                <Minimize2 className='mr-2' />
                                Compress PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PDFCompress
