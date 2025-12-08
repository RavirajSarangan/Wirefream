"use client"
import React from 'react'
import { FileText, Trash2, Eye, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlagiarismHistoryCardProps {
    item: any
    onDelete: (uid: string) => void
    onView: () => void
}

function PlagiarismHistoryCard({ item, onDelete, onView }: PlagiarismHistoryCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getResultColor = () => {
        if (item.overallPlagiarismPercentage < 20) return 'text-green-600 bg-green-100 border-green-200'
        if (item.overallPlagiarismPercentage < 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
        return 'text-red-600 bg-red-100 border-red-200'
    }

    return (
        <div className='p-5 border-2 rounded-lg hover:shadow-lg transition-all bg-white relative'>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(item.uid || item.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            
            <div className='flex items-start gap-3 mb-3'>
                <div className='p-2 rounded-lg bg-red-100 text-red-800 border border-red-200'>
                    <FileText className='h-5 w-5' />
                </div>
                <div className='flex-1 pr-8'>
                    <h3 className='font-semibold text-lg line-clamp-1'>{item.fileName || 'Plagiarism Check'}</h3>
                    <span className='text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 inline-block mt-1'>
                        Plagiarism Check
                    </span>
                </div>
            </div>

            <div className='space-y-2 mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar className='h-4 w-4' />
                    <span>{formatDate(item.createdAt)}</span>
                </div>
                {item.originalText && (
                    <p className='text-sm text-gray-600 line-clamp-2 mt-2'>
                        {item.originalText}
                    </p>
                )}
            </div>

            {item.overallPlagiarismPercentage !== undefined && (
                <div className={`mb-4 p-3 rounded-lg border ${getResultColor()}`}>
                    <div className='text-2xl font-bold'>{item.overallPlagiarismPercentage}%</div>
                    <div className='text-xs'>Plagiarism Detected</div>
                </div>
            )}

            <Button size='sm' onClick={onView} className='w-full gap-2'>
                <Eye className='h-4 w-4' />
                View Report
            </Button>
        </div>
    )
}

export default PlagiarismHistoryCard
