"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Clock, AlertCircle, User } from 'lucide-react'

interface LogEntry {
    id: number
    adminEmail?: string
    action?: string
    userEmail?: string
    ipAddress?: string
    country?: string
    method?: string
    createdAt: string
}

export default function LogsPage() {
    const { user } = useAuthContext()
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [logType, setLogType] = useState('audit')

    useEffect(() => {
        fetchLogs()
    }, [user?.email, logType])

    const fetchLogs = async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            const response = await axios.get('/api/admin/logs', {
                params: {
                    adminEmail: user.email,
                    type: logType,
                    limit: 100,
                    offset: 0
                }
            })

            setLogs(response.data.logs || [])
        } catch (error) {
            toast.error('Failed to fetch logs')
            console.error('Error fetching logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString()
    }

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>System Logs</h1>
                    <p className='text-gray-600 mt-1'>
                        View audit trail and access logs
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Log Type
                </label>
                <Select value={logType} onValueChange={setLogType}>
                    <SelectTrigger className='w-48'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='audit'>Audit Logs</SelectItem>
                        <SelectItem value='access'>Access Logs</SelectItem>
                        <SelectItem value='suspicious'>
                            Suspicious Activity
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Logs Table */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto'></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className='p-8 text-center'>
                        <p className='text-gray-500'>No logs found</p>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-50 border-b border-gray-200'>
                                <tr>
                                    {logType === 'audit' ? (
                                        <>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Admin
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Action
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Target
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Time
                                            </th>
                                        </>
                                    ) : logType === 'access' ? (
                                        <>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                IP Address
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Country
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Method
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Time
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                User ID
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Flag Type
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Status
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                                Time
                                            </th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {logs.map(log => (
                                    <tr key={log.id} className='hover:bg-gray-50'>
                                        {logType === 'audit' ? (
                                            <>
                                                <td className='px-6 py-4 text-sm text-gray-900 flex items-center gap-2'>
                                                    <User className='w-4 h-4 text-gray-400' />
                                                    {log.adminEmail}
                                                </td>
                                                <td className='px-6 py-4 text-sm'>
                                                    <span className='inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium'>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-600'>
                                                    {log.userEmail || 'N/A'}
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-500 flex items-center gap-2'>
                                                    <Clock className='w-4 h-4' />
                                                    {formatDate(log.createdAt)}
                                                </td>
                                            </>
                                        ) : logType === 'access' ? (
                                            <>
                                                <td className='px-6 py-4 text-sm text-gray-900'>
                                                    {log.ipAddress}
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-600'>
                                                    {log.country || 'N/A'}
                                                </td>
                                                <td className='px-6 py-4 text-sm'>
                                                    <span className='inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium'>
                                                        {log.method}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-500'>
                                                    {formatDate(log.createdAt)}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className='px-6 py-4 text-sm text-gray-900'>
                                                    {log.userEmail || 'N/A'}
                                                </td>
                                                <td className='px-6 py-4 text-sm'>
                                                    <span className='inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium'>
                                                        <AlertCircle className='w-3 h-3' />
                                                        Flag
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-600'>
                                                    Pending
                                                </td>
                                                <td className='px-6 py-4 text-sm text-gray-500'>
                                                    {formatDate(log.createdAt)}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
