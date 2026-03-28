"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import StatsCard from '../_components/StatsCard'
import { Users, TrendingUp, Activity, BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
    const { user } = useAuthContext()
    const [overview, setOverview] = useState<any>(null)
    const [featureUsage, setFeatureUsage] = useState<any>(null)
    const [creditUsage, setCreditUsage] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [user?.email])

    const fetchAnalytics = async () => {
        if (!user?.email) return

        try {
            setLoading(true)

            const [overviewRes, featureRes, creditRes] = await Promise.all([
                axios.get('/api/admin/analytics', {
                    params: { adminEmail: user.email, type: 'overview' }
                }),
                axios.get('/api/admin/analytics', {
                    params: { adminEmail: user.email, type: 'feature-usage' }
                }),
                axios.get('/api/admin/analytics', {
                    params: { adminEmail: user.email, type: 'credit-usage' }
                })
            ])

            setOverview(overviewRes.data.data)
            setFeatureUsage(featureRes.data.data)
            setCreditUsage(creditRes.data.data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>Analytics</h1>
                <p className='text-gray-600 mt-1'>
                    Comprehensive platform analytics and insights
                </p>
            </div>

            {/* Overview Stats */}
            {loading ? (
                <div className='grid-skeleton' />
            ) : overview ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                    <StatsCard
                        title='Total Users'
                        value={overview.totalUsers || 0}
                        icon={<Users className='w-8 h-8 text-blue-600' />}
                    />
                    <StatsCard
                        title='Active Users'
                        value={overview.activeUsers || 0}
                        icon={<Activity className='w-8 h-8 text-green-600' />}
                    />
                    <StatsCard
                        title='Admin Users'
                        value={overview.adminCount || 0}
                        icon={<BarChart3 className='w-8 h-8 text-purple-600' />}
                    />
                    <StatsCard
                        title='Credits Issued'
                        value={overview.totalCreditsIssued || 0}
                        icon={<TrendingUp className='w-8 h-8 text-orange-600' />}
                    />
                </div>
            ) : null}

            {/* Feature Usage */}
            {featureUsage && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                    <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                            Feature Usage
                        </h2>
                        <div className='space-y-4'>
                            {featureUsage.features?.map((feature: any) => (
                                <div key={feature.name}>
                                    <div className='flex items-center justify-between mb-2'>
                                        <span className='text-sm font-medium text-gray-700'>
                                            {feature.name}
                                        </span>
                                        <span className='text-sm font-semibold text-gray-900'>
                                            {feature.count}
                                        </span>
                                    </div>
                                    <div className='w-full bg-gray-200 rounded-full h-2'>
                                        <div
                                            className='bg-blue-600 h-2 rounded-full'
                                            style={{
                                                width: `${feature.percentage}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        {feature.percentage}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Credit Usage */}
                    {creditUsage && (
                        <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                                Credit Usage
                            </h2>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between pb-4 border-b'>
                                    <span className='text-sm text-gray-600'>
                                        Total Issued
                                    </span>
                                    <span className='text-lg font-semibold text-blue-600'>
                                        {creditUsage.totalIssued?.toLocaleString()}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between pb-4 border-b'>
                                    <span className='text-sm text-gray-600'>
                                        Total Consumed
                                    </span>
                                    <span className='text-lg font-semibold text-red-600'>
                                        {creditUsage.totalConsumed?.toLocaleString()}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>
                                        Remaining
                                    </span>
                                    <span className='text-lg font-semibold text-green-600'>
                                        {creditUsage.remaining?.toLocaleString()}
                                    </span>
                                </div>
                                <div className='mt-4 p-3 bg-blue-50 rounded border border-blue-200'>
                                    <p className='text-xs text-blue-700'>
                                        Average per user:{' '}
                                        <strong>{creditUsage.averagePerUser}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Stats */}
            {overview && (
                <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                    <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                        Content Generated
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='text-center p-4 bg-blue-50 rounded-lg'>
                            <p className='text-sm text-gray-600 mb-2'>
                                Wireframe to Code
                            </p>
                            <p className='text-3xl font-bold text-blue-600'>
                                {overview.wireframesGenerated || 0}
                            </p>
                        </div>
                        <div className='text-center p-4 bg-purple-50 rounded-lg'>
                            <p className='text-sm text-gray-600 mb-2'>
                                Plagiarism Checks
                            </p>
                            <p className='text-3xl font-bold text-purple-600'>
                                {overview.plagiarismChecksRun || 0}
                            </p>
                        </div>
                        <div className='text-center p-4 bg-green-50 rounded-lg'>
                            <p className='text-sm text-gray-600 mb-2'>
                                Cover Pages
                            </p>
                            <p className='text-3xl font-bold text-green-600'>
                                {overview.coverPagesCreated || 0}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
