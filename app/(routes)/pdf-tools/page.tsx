"use client"
import { FileText, Minimize2, FileDown, FileUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

function PDFTools() {
    const router = useRouter()

    const tools = [
        {
            title: "Word to PDF",
            description: "Convert Word documents to PDF format",
            icon: FileDown,
            color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
            iconColor: "text-blue-600",
            route: "/word-to-pdf"
        },
        {
            title: "PDF to Word",
            description: "Convert PDF files to Word documents",
            icon: FileUp,
            color: "bg-green-50 hover:bg-green-100 border-green-200",
            iconColor: "text-green-600",
            route: "/pdf-to-word"
        },
        {
            title: "PDF Compress",
            description: "Reduce PDF file size efficiently",
            icon: Minimize2,
            color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
            iconColor: "text-purple-600",
            route: "/pdf-compress"
        }
    ]

    return (
        <div className='xl:px-20'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <div className='flex items-center gap-3'>
                        <FileText className='h-8 w-8 text-blue-600' />
                        <h2 className='font-bold text-3xl'>PDF Tools</h2>
                    </div>
                    <p className='text-gray-500 mt-1'>Choose a PDF conversion or compression tool</p>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-10'>
                {tools.map((tool) => {
                    const Icon = tool.icon
                    return (
                        <button
                            key={tool.route}
                            onClick={() => router.push(tool.route)}
                            className={`p-8 border-2 rounded-xl cursor-pointer transition-all ${tool.color} w-full`}
                        >
                            <div className='flex flex-col items-center text-center gap-4'>
                                <div className={`p-4 rounded-full bg-white border-2 ${tool.iconColor}`}>
                                    <Icon className='h-8 w-8' />
                                </div>
                                <div>
                                    <h3 className='font-bold text-xl mb-2'>{tool.title}</h3>
                                    <p className='text-gray-600'>{tool.description}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default PDFTools
