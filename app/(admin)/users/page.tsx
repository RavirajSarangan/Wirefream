"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import UserTable from './_components/UserTable'
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
import { Search } from 'lucide-react'

interface User {
    id: number
    name: string
    email: string
    credits: number
    role: string
    isActive: string
    suspiciousActivity: number
}

export default function UsersPage() {
    const { user } = useAuthContext()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editCredits, setEditCredits] = useState(0)

    useEffect(() => {
        fetchUsers()
    }, [user?.email])

    const fetchUsers = async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            const response = await axios.get('/api/admin/users', {
                params: {
                    adminEmail: user.email,
                    limit: 100,
                    offset: 0,
                    search: searchTerm
                }
            })

            setUsers(response.data.users)
        } catch (error) {
            toast.error('Failed to fetch users')
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser || !user?.email) return

        try {
            await axios.delete('/api/admin/users', {
                params: {
                    adminEmail: user.email,
                    userId: selectedUser.id
                }
            })

            setUsers(users.filter(u => u.id !== selectedUser.id))
            toast.success('User deleted successfully')
            setShowDeleteDialog(false)
            setSelectedUser(null)
        } catch (error) {
            toast.error('Failed to delete user')
            console.error('Error deleting user:', error)
        }
    }

    const handleEditUser = async () => {
        if (!selectedUser || !user?.email) return

        try {
            const response = await axios.post('/api/admin/users', {
                adminEmail: user.email,
                userId: selectedUser.id,
                data: {
                    credits: editCredits
                }
            })

            setUsers(users.map(u => (u.id === selectedUser.id ? response.data.user : u)))
            toast.success('User updated successfully')
            setShowEditDialog(false)
            setSelectedUser(null)
        } catch (error) {
            toast.error('Failed to update user')
            console.error('Error updating user:', error)
        }
    }

    const handleToggleActive = async (userToToggle: User) => {
        if (!user?.email) return

        try {
            const response = await axios.post('/api/admin/users', {
                adminEmail: user.email,
                userId: userToToggle.id,
                data: {
                    isActive: userToToggle.isActive === 'true' ? 'false' : 'true'
                }
            })

            setUsers(users.map(u => (u.id === userToToggle.id ? response.data.user : u)))
            toast.success(`User ${userToToggle.isActive === 'true' ? 'blocked' : 'unblocked'} successfully`)
        } catch (error) {
            toast.error('Failed to update user status')
            console.error('Error updating user:', error)
        }
    }

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Users</h1>
                    <p className='text-gray-600 mt-1'>
                        {users.length} total users
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className='mb-6 flex items-center gap-2'>
                <Search className='w-5 h-5 text-gray-400' />
                <Input
                    type='text'
                    placeholder='Search by name or email...'
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                    }}
                    onKeyUp={() => fetchUsers()}
                    className='flex-1'
                />
            </div>

            {/* Table */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto'></div>
                    </div>
                ) : (
                    <UserTable
                        users={users}
                        onEdit={(user) => {
                            setSelectedUser(user)
                            setEditCredits(user.credits)
                            setShowEditDialog(true)
                        }}
                        onDelete={(user) => {
                            setSelectedUser(user)
                            setShowDeleteDialog(true)
                        }}
                        onToggleActive={handleToggleActive}
                    />
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{selectedUser?.email}</strong>? This action cannot
                            be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className='bg-red-600 hover:bg-red-700'
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Credits Dialog */}
            <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit User Credits</AlertDialogTitle>
                        <AlertDialogDescription className='pt-4'>
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        User: {selectedUser?.email}
                                    </label>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Credits
                                    </label>
                                    <Input
                                        type='number'
                                        value={editCredits}
                                        onChange={(e) =>
                                            setEditCredits(parseInt(e.target.value) || 0)
                                        }
                                        min='0'
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEditUser}>
                            Save Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
