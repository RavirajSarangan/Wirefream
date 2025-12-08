"use client"
import React from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import PlagiarismReport from '../../plagiarism-checker/_components/PlagiarismReport'

interface ViewReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reportData: any
}

function ViewReportDialog({ open, onOpenChange, reportData }: ViewReportDialogProps) {
    if (!reportData) return null

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
                <AlertDialogHeader>
                    <AlertDialogTitle className='text-2xl'>Plagiarism Report</AlertDialogTitle>
                </AlertDialogHeader>
                <PlagiarismReport 
                    result={reportData}
                    originalText={reportData.originalText}
                    onCheckAnother={() => onOpenChange(false)}
                />
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ViewReportDialog
