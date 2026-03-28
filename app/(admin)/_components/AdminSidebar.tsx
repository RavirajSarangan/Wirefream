"use client"

import { useAuthContext } from '@/app/provider'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, FileText, BarChart3, LogsIcon, Home, BookOpen, GraduationCap } from 'lucide-react'

export default function AdminSidebar() {
    const pathname = usePathname()
    const { user } = useAuthContext()

    const menuItems = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: Home
        },
        {
            label: 'Users',
            href: '/admin/users',
            icon: Users
        },
        {
            label: 'Students',
            href: '/admin/students',
            icon: GraduationCap
        },
        {
            label: 'Resources',
            href: '/admin/resources',
            icon: BookOpen
        },
        {
            label: 'Content',
            href: '/admin/content',
            icon: FileText
        },
        {
            label: 'Analytics',
            href: '/admin/analytics',
            icon: BarChart3
        },
        {
            label: 'Logs',
            href: '/admin/logs',
            icon: LogsIcon
        }
    ]

    return (
        <div className='w-64 bg-white border-r border-gray-200 min-h-screen p-4'>
            {/* Logo */}
            <div className='mb-8 px-2'>
                <h1 className='text-2xl font-bold text-blue-600'>Admin</h1>
                <p className='text-sm text-gray-500 mt-1'>Dashboard</p>
            </div>

            {/* User Info */}
            {user && (
                <div className='mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100'>
                    <p className='text-xs text-gray-600'>Logged in as</p>
                    <p className='text-sm font-semibold text-blue-700 truncate'>
                        {user.email}
                    </p>
                </div>
            )}

            {/* Menu Items */}
            <nav className='space-y-2'>
                {menuItems.map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href ||
                                   pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Icon className='w-5 h-5' />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50'>
                <p className='text-xs text-gray-500 text-center'>
                    Admin Portal v1.0
                </p>
            </div>
        </div>
    )
}
