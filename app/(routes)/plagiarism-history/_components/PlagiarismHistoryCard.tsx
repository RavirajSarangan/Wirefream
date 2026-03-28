"use client"
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, FileSearch, Download, Eye, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import React, { useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import axios from 'axios'
import Image from 'next/image'
import Constants from '@/data/Constants'

interface PlagiarismHistoryCardProps {
    item: any
    onDelete: (uid: string) => void
    onView: (item: any) => void
}

function PlagiarismHistoryCard({ item, onDelete, onView }: PlagiarismHistoryCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const similarityScore = item?.similarityScore || 0
    const aiDetectionScore = item?.aiDetectionScore || 0
    const uniqueContent = item?.uniqueContent || (100 - similarityScore)
    const modelObj = Constants.AiModelList.find((x) => x.name === item?.aiModelUsed)

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date unknown'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getScoreColor = (score: number) => {
        if (score <= 24) return 'text-green-600'
        if (score <= 49) return 'text-yellow-600'
        if (score <= 74) return 'text-orange-600'
        return 'text-red-600'
    }

    const getScoreBg = (score: number) => {
        if (score <= 15) return 'bg-green-50 border-green-200'
        if (score <= 40) return 'bg-yellow-50 border-yellow-200'
        return 'bg-red-50 border-red-200'
    }

    const getScoreIcon = (score: number) => {
        if (score <= 15) return <CheckCircle2 className='h-5 w-5 text-green-600' />
        if (score <= 40) return <AlertCircle className='h-5 w-5 text-yellow-600' />
        return <XCircle className='h-5 w-5 text-red-600' />
    }

    const getRiskLabel = (score: number) => {
        if (score <= 15) return 'Low Risk'
        if (score <= 40) return 'Moderate'
        return 'High Risk'
    }

    const getRiskBadgeClass = (score: number) => {
        if (score <= 15) return 'bg-green-200 text-green-800'
        if (score <= 40) return 'bg-yellow-200 text-yellow-800'
        return 'bg-red-200 text-red-800'
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const response = await axios.delete(`/api/check-plagiarism?uid=${item?.uid}&email=${item?.createdBy}`)
            
            if (response.data.success) {
                toast.success('Plagiarism check deleted successfully')
                setShowDeleteDialog(false)
                onDelete(item?.uid)
            } else {
                toast.error(response.data.error || 'Failed to delete')
            }
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.error || 'Failed to delete')
        } finally {
            setDeleting(false)
        }
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const response = await axios.post('/api/generate-plagiarism-report', item, {
                responseType: 'blob'
            })
            
            const url = globalThis.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `plagiarism-report-${item.uid || Date.now()}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            globalThis.URL.revokeObjectURL(url)
            
            toast.success('PDF report downloaded successfully!')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download PDF report')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <>
            <div className={`p-5 border-2 rounded-lg hover:shadow-lg transition-all relative group ${getScoreBg(similarityScore)}`}>
                {/* Delete button - shows on hover */}
                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className='absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10'
                    aria-label='Delete check'
                >
                    <Trash2 className='w-4 h-4' />
                </button>

                {/* Header with icon and risk level */}
                <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        {getScoreIcon(similarityScore)}
                        <div>
                            <h3 className='font-semibold text-lg line-clamp-1'>
                                {item?.fileName || 'Plagiarism Check'}
                            </h3>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${getRiskBadgeClass(similarityScore)}`}>
                                {getRiskLabel(similarityScore)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scores Grid */}
                <div className='grid grid-cols-3 gap-3 mb-4'>
                    <div className='text-center p-3 bg-white rounded-lg border'>
                        <div className={`text-2xl font-bold ${getScoreColor(similarityScore)}`}>
                            {similarityScore}%
                        </div>
                        <div className='text-xs text-gray-600 mt-1'>Similarity</div>
                    </div>
                    <div className='text-center p-3 bg-white rounded-lg border'>
                        <div className='text-2xl font-bold text-purple-600'>
                            {aiDetectionScore}%
                        </div>
                        <div className='text-xs text-gray-600 mt-1'>AI Content</div>
                    </div>
                    <div className='text-center p-3 bg-white rounded-lg border'>
                        <div className='text-2xl font-bold text-green-600'>
                            {uniqueContent}%
                        </div>
                        <div className='text-xs text-gray-600 mt-1'>Unique</div>
                    </div>
                </div>

                {/* Text Preview */}
                {item?.originalText && (
                    <div className='mb-4 p-3 bg-white rounded border'>
                        <p className='text-xs text-gray-600 line-clamp-3 font-mono'>
                            {item.originalText}
                        </p>
                    </div>
                )}

                {/* Stats Row */}
                <div className='flex items-center justify-between mb-4 text-xs text-gray-600'>
                    <div className='flex items-center gap-4'>
                        <span className='flex items-center gap-1'>
                            <FileSearch className='w-3 h-3' />
                            {item?.suspiciousSections?.length || 0} flagged
                        </span>
                        {item?.sourceBreakdown?.length > 0 && (
                            <span className='flex items-center gap-1'>
                                {item.sourceBreakdown.length} sources
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className='flex items-center justify-between pt-3 border-t border-gray-200'>
                    <div className='flex flex-col gap-1'>
                        {/* AI Model */}
                        {modelObj && (
                            <div className='flex items-center gap-2'>
                                <Image src={modelObj.icon} alt={modelObj.name} width={16} height={16} />
                                <span className='text-xs text-gray-600'>{modelObj.name}</span>
                            </div>
                        )}
                        {/* Date */}
                        {item?.createdAt && (
                            <p className='text-xs text-gray-500 flex items-center gap-1'>
                                <Calendar className='w-3 h-3' />
                                {formatDate(item.createdAt)}
                            </p>
                        )}
                    </div>
                    
                    <div className='flex gap-2'>
                        <Button 
                            size='sm' 
                            variant='outline'
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            <Download className='w-4 h-4' />
                        </Button>
                        <Button 
                            size='sm'
                            onClick={() => onView(item)}
                        >
                            <Eye className='w-4 h-4 mr-1' />
                            View
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plagiarism Check?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this plagiarism check and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={deleting}
                            className='bg-red-500 hover:bg-red-600'
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default PlagiarismHistoryCard
