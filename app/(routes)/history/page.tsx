"use client"
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import React, { useEffect, useState, useMemo } from 'react'
import PlagiarismHistoryCard from './_components/PlagiarismHistoryCard'
import ViewReportDialog from './_components/ViewReportDialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, History, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import DesignCard from '../designs/_components/DesignCard'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
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

interface UnifiedActivity {
    id: string
    type: 'wireframe-to-code' | 'plagiarism-check'
    title: string
    description?: string
    createdAt: string
    data: any
}

function UnifiedHistory() {
    const { user } = useAuthContext()
    const router = useRouter()
    const [activities, setActivities] = useState<UnifiedActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('newest')
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [deleteItem, setDeleteItem] = useState<{ uid: string; type: string } | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
    const [deletingAll, setDeletingAll] = useState(false)

    useEffect(() => {
        if (user) {
            fetchAllActivities()
        }
    }, [user])

    const fetchAllActivities = async () => {
        setLoading(true)
        try {
            const [wireframes, plagiarismChecks] = await Promise.all([
                axios.get(`/api/wireframe-to-code?email=${user?.email}`).catch(() => ({ data: [] })),
                axios.get(`/api/check-plagiarism?email=${user?.email}`).catch(() => ({ data: [] }))
            ])

            const allActivities: UnifiedActivity[] = [
                ...(wireframes.data || []).map((item: any) => ({
                    id: item.uid || item.id,
                    type: 'wireframe-to-code' as const,
                    title: item.description || 'Wireframe Conversion',
                    description: item.description,
                    createdAt: item.createdAt,
                    data: item
                })),
                ...(plagiarismChecks.data || []).map((item: any) => ({
                    id: item.uid || item.id,
                    type: 'plagiarism-check' as const,
                    title: item.fileName || 'Plagiarism Check',
                    description: item.originalText?.substring(0, 100),
                    createdAt: item.createdAt,
                    data: item
                }))
            ]

            setActivities(allActivities)
        } catch (error) {
            console.error('Error fetching activities:', error)
            setActivities([])
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (uid: string, type: string) => {
        setDeleteItem({ uid, type })
    }

    const confirmDelete = async () => {
        if (!deleteItem) return

        setDeleting(true)
        try {
            const endpointMap: Record<string, string> = {
                'wireframe-to-code': '/api/wireframe-to-code',
                'plagiarism-check': '/api/check-plagiarism'
            }

            const endpoint = endpointMap[deleteItem.type]
            if (!endpoint) {
                toast.error('Unknown activity type')
                return
            }

            await axios.delete(`${endpoint}?uid=${deleteItem.uid}&email=${user?.email}`)
            
            setActivities(prev => prev.filter((item) => item.id !== deleteItem.uid))
            toast.success('Activity deleted successfully')
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.error || 'Failed to delete activity')
        } finally {
            setDeleting(false)
            setDeleteItem(null)
        }
    }

    const confirmDeleteAll = async () => {
        setDeletingAll(true)
        try {
            const deletePromises = activities.map(async (activity) => {
                const endpointMap: Record<string, string> = {
                    'wireframe-to-code': '/api/wireframe-to-code',
                    'plagiarism-check': '/api/check-plagiarism'
                }
                const endpoint = endpointMap[activity.type]
                if (endpoint) {
                    await axios.delete(`${endpoint}?uid=${activity.id}&email=${user?.email}`)
                }
            })

            await Promise.all(deletePromises)
            setActivities([])
            toast.success('All activities deleted successfully')
        } catch (error: any) {
            console.error('Delete all error:', error)
            toast.error('Failed to delete some activities')
        } finally {
            setDeletingAll(false)
            setShowDeleteAllDialog(false)
        }
    }

    const handleView = (item: UnifiedActivity) => {
        if (item.type === 'plagiarism-check') {
            setSelectedReport(item.data)
            setShowReportDialog(true)
        } else if (item.type === 'wireframe-to-code') {
            router.push(`/view-code/${item.id}`)
        }
    }

    // Helper function to get AI model display info


    // Filter and sort activities
    const filteredActivities = useMemo(() => {
        let filtered = [...activities]

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter((item) => 
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Activity type filter
        if (activityTypeFilter && activityTypeFilter !== 'all') {
            filtered = filtered.filter((item) => item.type === activityTypeFilter)
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            }
            return 0
        })

        return filtered
    }, [activities, searchTerm, activityTypeFilter, sortBy])

    // Calculate statistics


    return (
        <div>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <div className='flex items-center gap-3'>
                        <History className='h-8 w-8 text-blue-600' />
                        <h2 className='font-bold text-3xl'>Activity History</h2>
                    </div>
                    <p className='text-gray-500 mt-1'>View all your activities across all features</p>
                </div>
                {!loading && activities.length > 0 && (
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteAllDialog(true)}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete All History
                    </Button>
                )}
            </div>


            {/* Filters Section */}
            <div className='mb-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Search */}
                <div className='relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                        type='text'
                        placeholder='Search activities...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                    />
                </div>

                {/* Activity Type Filter */}
                <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder='All Activities' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All Activities</SelectItem>
                        <SelectItem value='wireframe-to-code'>Wireframe to Code</SelectItem>
                        <SelectItem value='plagiarism-check'>Plagiarism Check</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                        <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='newest'>Newest First</SelectItem>
                        <SelectItem value='oldest'>Oldest First</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Count */}
            {!loading && activities.length > 0 && (
                <p className='text-sm text-gray-500 mb-4'>
                    Showing {filteredActivities.length} of {activities.length} activities
                </p>
            )}

            {/* Loading State */}
            {loading && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className='p-5 border rounded-lg'>
                            <Skeleton className='h-6 w-3/4 mb-4' />
                            <Skeleton className='h-32 mb-4' />
                            <Skeleton className='h-10' />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && activities.length === 0 && (
                <div className='mt-20 text-center'>
                    <History className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                    <h3 className='text-xl font-semibold text-gray-600 mb-2'>No Activity Yet</h3>
                    <p className='text-gray-400 mb-6'>
                        Start using our features to see your activity history here
                    </p>
                </div>
            )}

            {/* No Results from Filters */}
            {!loading && activities.length > 0 && filteredActivities.length === 0 && (
                <div className='mt-20 text-center'>
                    <Search className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                    <h3 className='text-xl font-semibold text-gray-600 mb-2'>No Matches Found</h3>
                    <p className='text-gray-400'>Try adjusting your search or filter criteria</p>
                </div>
            )}

            {/* Activities Grid */}
            {!loading && filteredActivities.length > 0 && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredActivities.map((activity) => {
                        if (activity.type === 'plagiarism-check') {
                            return (
                                <PlagiarismHistoryCard 
                                    key={activity.id} 
                                    item={activity.data} 
                                    onDelete={(uid: string) => handleDeleteClick(uid, activity.type)}
                                    onView={() => handleView(activity)}
                                />
                            )
                        } else if (activity.type === 'wireframe-to-code') {
                            return (
                                <DesignCard 
                                    key={activity.id} 
                                    item={activity.data} 
                                    onDelete={(uid: string) => handleDeleteClick(uid, activity.type)}
                                />
                            )
                        }
                        return null;
                    })}
                </div>
            )}

            {/* View Report Dialog */}
            <ViewReportDialog
                open={showReportDialog}
                onOpenChange={setShowReportDialog}
                reportData={selectedReport}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this activity? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Confirmation Dialog */}
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete All History</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete ALL {activities.length} activities? This action cannot be undone and will permanently remove all your activity history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteAll}
                            disabled={deletingAll}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deletingAll ? 'Deleting All...' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default UnifiedHistory
