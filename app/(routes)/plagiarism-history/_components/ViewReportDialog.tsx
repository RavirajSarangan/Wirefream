"use client"
import React from 'react'
import {
    AlertDialog,
    AlertDialogContent,
} from "@/components/ui/alert-dialog"
import PlagiarismReport from '../../plagiarism-checker/_components/PlagiarismReport'

interface ViewReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reportData: any
}

function ViewReportDialog({ open, onOpenChange, reportData }: ViewReportDialogProps) {
    if (!reportData) return null

    const handleCheckAnother = () => {
        onOpenChange(false)
        // Navigate to plagiarism checker page
        globalThis.location.href = '/plagiarism-checker'
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
                <div className='mt-4'>
                    <PlagiarismReport
                        result={reportData}
                        originalText={reportData.originalText || ''}
                        onCheckAnother={handleCheckAnother}
                    />
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ViewReportDialog
