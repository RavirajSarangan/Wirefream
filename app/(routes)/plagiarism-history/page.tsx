"use client"
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import React, { useEffect, useState, useMemo } from 'react'
import PlagiarismHistoryCard from './_components/PlagiarismHistoryCard'
import ViewReportDialog from './_components/ViewReportDialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, History, Paintbrush, Sparkles, ArrowLeftRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import DesignCard from '../designs/_components/DesignCard'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface UnifiedActivity {
    id: string
    type: 'wireframe-to-code' | 'generated-wireframe' | 'ui-to-wireframe' | 'plagiarism-check'
    title: string
    description?: string
    createdAt: string
    data: any
}

function UnifiedHistory() {
    const { user } = useAuthContext()
    const [activities, setActivities] = useState<UnifiedActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('newest')
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [showReportDialog, setShowReportDialog] = useState(false)

    useEffect(() => {
        if (user) {
            fetchAllActivities()
        }
    }, [user])

    const fetchAllActivities = async () => {
        setLoading(true)
        try {
            const [wireframes, generatedWireframes, uiToWireframes, plagiarismChecks] = await Promise.all([
                axios.get(`/api/wireframe-to-code?email=${user?.email}`).catch(() => ({ data: [] })),
                axios.get(`/api/generate-wireframe?email=${user?.email}`).catch(() => ({ data: [] })),
                axios.get(`/api/ui-to-wireframe?email=${user?.email}`).catch(() => ({ data: [] })),
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
                ...(generatedWireframes.data || []).map((item: any) => ({
                    id: item.uid || item.id,
                    type: 'generated-wireframe' as const,
                    title: item.prompt || 'Generated Wireframe',
                    description: item.prompt,
                    createdAt: item.createdAt,
                    data: item
                })),
                ...(uiToWireframes.data || []).map((item: any) => ({
                    id: item.uid || item.id,
                    type: 'ui-to-wireframe' as const,
                    title: item.description || 'UI to Wireframe Conversion',
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

    const handleDelete = (uid: string, type: string) => {
        setActivities(prev => prev.filter((item) => item.id !== uid))
    }

    const handleView = (item: any) => {
        if (item.type === 'plagiarism-check') {
            setSelectedReport(item.data)
            setShowReportDialog(true)
        } else if (item.type === 'wireframe-to-code') {
            globalThis.location.href = `/view-code/${item.id}`
        } else {
            globalThis.location.href = `/designs`
        }
    }

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
    const stats = useMemo(() => {
        return {
            total: activities.length,
            wireframes: activities.filter(a => a.type === 'wireframe-to-code').length,
            generated: activities.filter(a => a.type === 'generated-wireframe').length,
            uiConversions: activities.filter(a => a.type === 'ui-to-wireframe').length,
            plagiarism: activities.filter(a => a.type === 'plagiarism-check').length
        }
    }, [activities])

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
            </div>

            {/* Statistics Cards */}
            {!loading && activities.length > 0 && (
                <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
                    <div className='p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>{stats.total}</div>
                        <div className='text-sm text-gray-600'>Total Activities</div>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg'>
                        <div className='text-2xl font-bold text-purple-600'>{stats.wireframes}</div>
                        <div className='text-sm text-gray-600'>Wireframes</div>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600'>{stats.generated}</div>
                        <div className='text-sm text-gray-600'>Generated</div>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg'>
                        <div className='text-2xl font-bold text-orange-600'>{stats.uiConversions}</div>
                        <div className='text-sm text-gray-600'>UI Conversions</div>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg'>
                        <div className='text-2xl font-bold text-red-600'>{stats.plagiarism}</div>
                        <div className='text-sm text-gray-600'>Plagiarism Checks</div>
                    </div>
                </div>
            )}

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
                        <SelectItem value='generated-wireframe'>Generated Wireframe</SelectItem>
                        <SelectItem value='ui-to-wireframe'>UI to Wireframe</SelectItem>
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
                                    onDelete={(uid) => handleDelete(uid, activity.type)}
                                    onView={() => handleView(activity)}
                                />
                            )
                        } else if (activity.type === 'wireframe-to-code') {
                            return (
                                <DesignCard 
                                    key={activity.id} 
                                    item={activity.data} 
                                    onDelete={(uid) => handleDelete(uid, activity.type)}
                                />
                            )
                        } else {
                            // For generated-wireframe and ui-to-wireframe, use a simple card
                            const config = {
                                'generated-wireframe': { icon: Sparkles, label: 'Generated Wireframe', color: 'bg-purple-100 text-purple-800' },
                                'ui-to-wireframe': { icon: ArrowLeftRight, label: 'UI to Wireframe', color: 'bg-green-100 text-green-800' }
                            }[activity.type] || { icon: Paintbrush, label: 'Activity', color: 'bg-blue-100 text-blue-800' }
                            
                            const Icon = config.icon
                            
                            return (
                                <div key={activity.id} className='p-5 border-2 rounded-lg hover:shadow-lg transition-all bg-white'>
                                    <div className='flex items-start gap-3 mb-3'>
                                        <div className={`p-2 rounded-lg ${config.color} border`}>
                                            <Icon className='h-5 w-5' />
                                        </div>
                                        <div className='flex-1'>
                                            <h3 className='font-semibold text-lg line-clamp-2'>{activity.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${config.color} border inline-block mt-1`}>
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>
                                    {activity.data.imageUrl && typeof activity.data.imageUrl === 'string' && (activity.data.imageUrl.startsWith('http://') || activity.data.imageUrl.startsWith('https://') || activity.data.imageUrl.startsWith('/')) && (
                                        <Image 
                                            src={activity.data.imageUrl} 
                                            alt='Preview' 
                                            width={300} 
                                            height={150}
                                            className='w-full h-32 object-cover rounded border mb-3'
                                        />
                                    )}
                                    <Button size='sm' onClick={() => handleView(activity)} className='w-full'>
                                        View Details
                                    </Button>
                                </div>
                            )
                        }
                    })}
                </div>
            )}

            {/* View Report Dialog */}
            <ViewReportDialog
                open={showReportDialog}
                onOpenChange={setShowReportDialog}
                reportData={selectedReport}
            />
        </div>
    )
}

export default UnifiedHistory
