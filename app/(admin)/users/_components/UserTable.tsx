import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Lock, Unlock } from 'lucide-react'

interface User {
    id: number
    name: string
    email: string
    credits: number
    role: string
    isActive: string
    suspiciousActivity: number
}

interface UserTableProps {
    users: User[]
    onEdit: (user: User) => void
    onDelete: (user: User) => void
    onToggleActive: (user: User) => void
}

export default function UserTable({
    users,
    onEdit,
    onDelete,
    onToggleActive
}: UserTableProps) {
    if (users.length === 0) {
        return (
            <div className='text-center py-8'>
                <p className='text-gray-500'>No users found</p>
            </div>
        )
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Email
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Credits
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Role
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                    {users.map(user => (
                        <tr key={user.id} className='hover:bg-gray-50 transition-colors'>
                            <td className='px-6 py-4 text-sm text-gray-900'>
                                {user.name}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-600'>
                                {user.email}
                            </td>
                            <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                                {user.credits}
                            </td>
                            <td className='px-6 py-4 text-sm'>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}
                                >
                                    {user.role}
                                </span>
                            </td>
                            <td className='px-6 py-4 text-sm'>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        user.isActive === 'true'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {user.isActive === 'true' ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className='px-6 py-4 text-sm flex items-center gap-2'>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => onEdit(user)}
                                    className='flex items-center gap-1'
                                >
                                    <Edit2 className='w-4 h-4' />
                                    Edit
                                </Button>
                                <Button
                                    size='sm'
                                    onClick={() => onToggleActive(user)}
                                    className={`flex items-center gap-1 ${
                                        user.isActive === 'true'
                                            ? 'bg-yellow-600 hover:bg-yellow-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {user.isActive === 'true' ? (
                                        <>
                                            <Lock className='w-4 h-4' />
                                            Block
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className='w-4 h-4' />
                                            Unblock
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size='sm'
                                    variant='destructive'
                                    onClick={() => onDelete(user)}
                                    className='flex items-center gap-1'
                                >
                                    <Trash2 className='w-4 h-4' />
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
