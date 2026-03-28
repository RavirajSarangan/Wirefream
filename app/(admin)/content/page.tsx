"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import ContentTable from './_components/ContentTable'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'

interface Content {
    uid: string
    id: number
    createdBy: string
    createdAt: string
    description?: string
    fileName?: string
    type: string
}

export default function ContentPage() {
    const { user } = useAuthContext()
    const [content, setContent] = useState<Content[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedContent, setSelectedContent] = useState<Content | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showFlagDialog, setShowFlagDialog] = useState(false)
    const [flagReason, setFlagReason] = useState('')

    useEffect(() => {
        fetchContent()
    }, [user?.email])

    const fetchContent = async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            const response = await axios.get('/api/admin/content', {
                params: {
                    adminEmail: user.email,
                    limit: 100,
                    offset: 0
                }
            })

            setContent(response.data.content || [])
        } catch (error) {
            toast.error('Failed to fetch content')
            console.error('Error fetching content:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteContent = async () => {
        if (!selectedContent || !user?.email) return

        try {
            await axios.delete('/api/admin/content', {
                params: {
                    adminEmail: user.email,
                    uid: selectedContent.uid
                }
            })

            setContent(content.filter(c => c.uid !== selectedContent.uid))
            toast.success('Content deleted successfully')
            setShowDeleteDialog(false)
            setSelectedContent(null)
        } catch (error) {
            toast.error('Failed to delete content')
            console.error('Error deleting content:', error)
        }
    }

    const handleFlagContent = async () => {
        if (!selectedContent || !user?.email) return

        try {
            await axios.post('/api/admin/content', {
                adminEmail: user.email,
                contentUid: selectedContent.uid,
                action: 'flag',
                reason: flagReason,
                userId: selectedContent.id
            })

            toast.success('Content flagged successfully')
            setShowFlagDialog(false)
            setSelectedContent(null)
            setFlagReason('')
        } catch (error) {
            toast.error('Failed to flag content')
            console.error('Error flagging content:', error)
        }
    }

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>
                        Content Moderation
                    </h1>
                    <p className='text-gray-600 mt-1'>
                        {content.length} total items
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto'></div>
                    </div>
                ) : (
                    <ContentTable
                        content={content}
                        onView={(item) => {
                            toast.info(`Content UID: ${item.uid}`)
                        }}
                        onDelete={(item) => {
                            setSelectedContent(item)
                            setShowDeleteDialog(true)
                        }}
                        onFlag={(item) => {
                            setSelectedContent(item)
                            setShowFlagDialog(true)
                        }}
                    />
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Content</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this content? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteContent}
                            className='bg-red-600 hover:bg-red-700'
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Flag Dialog */}
            <AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Flag Content</AlertDialogTitle>
                        <AlertDialogDescription className='pt-4'>
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Reason for flagging
                                    </label>
                                    <Input
                                        placeholder='Enter reason...'
                                        value={flagReason}
                                        onChange={(e) =>
                                            setFlagReason(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleFlagContent}
                            disabled={!flagReason.trim()}
                        >
                            Flag Content
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
