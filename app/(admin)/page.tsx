"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import StatsCard from './_components/StatsCard'
import { Users, FileText, BarChart3, Activity } from 'lucide-react'

export default function AdminDashboard() {
    const { user } = useAuthContext()
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.email) return

            try {
                const response = await axios.get('/api/admin/analytics', {
                    params: {
                        adminEmail: user.email,
                        type: 'overview'
                    }
                })

                setAnalytics(response.data.data)
            } catch (error) {
                console.error('Error fetching analytics:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user?.email) {
            fetchAnalytics()
        }
    }, [user?.email])

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
                <p className='text-gray-600 mt-2'>
                    Welcome back, {user?.displayName || user?.email}
                </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className='grid-skeleton' />
            ) : analytics ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                    <StatsCard
                        title='Total Users'
                        value={analytics.totalUsers || 0}
                        icon={<Users className='w-8 h-8' />}
                        description='Active & inactive users'
                    />
                    <StatsCard
                        title='Active Users'
                        value={analytics.activeUsers || 0}
                        icon={<Activity className='w-8 h-8' />}
                        description='Currently active'
                    />
                    <StatsCard
                        title='Content Generated'
                        value={
                            (analytics.wireframesGenerated || 0) +
                            (analytics.plagiarismChecksRun || 0) +
                            (analytics.coverPagesCreated || 0)
                        }
                        icon={<FileText className='w-8 h-8' />}
                        description='Total resources'
                    />
                    <StatsCard
                        title='Credits Distributed'
                        value={analytics.totalCreditsIssued || 0}
                        icon={<BarChart3 className='w-8 h-8' />}
                        description='Total credits issued'
                    />
                </div>
            ) : null}

            {/* Feature Usage */}
            <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                    Feature Usage Breakdown
                </h2>
                {analytics ? (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <span className='text-gray-700'>
                                Wireframe to Code
                            </span>
                            <span className='font-semibold text-gray-900'>
                                {analytics.wireframesGenerated || 0}
                            </span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <span className='text-gray-700'>
                                Plagiarism Checker
                            </span>
                            <span className='font-semibold text-gray-900'>
                                {analytics.plagiarismChecksRun || 0}
                            </span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <span className='text-gray-700'>
                                Cover Pages Created
                            </span>
                            <span className='font-semibold text-gray-900'>
                                {analytics.coverPagesCreated || 0}
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
