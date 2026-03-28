"use client"

import { useEffect } from 'react'
import { useAuthContext } from '@/app/provider'
import { useRouter } from 'next/navigation'
import AdminSidebar from './_components/AdminSidebar'
import AdminHeader from './_components/AdminHeader'
import axios from 'axios'

export default function AdminLayout({
    children
}: {
    children: React.ReactNode
}) {
    const { user } = useAuthContext()
    const router = useRouter()

    useEffect(() => {
        if (!user) {
            router.push('/')
        }
    }, [user, router])

    useEffect(() => {
        // Verify admin access
        const checkAdminAccess = async () => {
            if (!user?.email) return

            try {
                const response = await axios.get('/api/auth/check-admin', {
                    params: { email: user.email }
                })

                if (!response.data.isAdmin) {
                    router.push('/')
                }
            } catch (error) {
                console.error('Admin access check failed:', error)
                router.push('/')
            }
        }

        if (user?.email) {
            checkAdminAccess()
        }
    }, [user?.email, router])

    if (!user) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='text-center'>
                    <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className='flex h-screen bg-gray-50'>
            <AdminSidebar />
            <div className='flex-1 flex flex-col overflow-hidden'>
                <AdminHeader />
                <main className='flex-1 overflow-auto'>
                    {children}
                </main>
            </div>
        </div>
    )
}
