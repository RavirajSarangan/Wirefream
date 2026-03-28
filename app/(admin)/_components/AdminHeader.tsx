"use client"

import { useAuthContext } from '@/app/provider'
import { signOut } from 'firebase/auth'
import { auth } from '@/configs/firebaseConfig'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function AdminHeader() {
    const { user } = useAuthContext()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className='bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between'>
            <div>
                <h2 className='text-xl font-semibold text-gray-800'>
                    Admin Dashboard
                </h2>
            </div>

            <div className='flex items-center gap-4'>
                {user && (
                    <>
                        <div className='text-right'>
                            <p className='text-sm font-medium text-gray-800'>
                                {user.displayName || user.email}
                            </p>
                            <p className='text-xs text-gray-500'>Administrator</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                            <LogOut className='w-4 h-4' />
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
