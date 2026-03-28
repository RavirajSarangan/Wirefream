import { Button } from '@/components/ui/button'
import { Eye, Trash2, Flag } from 'lucide-react'

interface Content {
    uid: string
    id: number
    createdBy: string
    createdAt: string
    description?: string
    fileName?: string
    type: string
}

interface ContentTableProps {
    content: Content[]
    onView: (item: Content) => void
    onDelete: (item: Content) => void
    onFlag: (item: Content) => void
}

export default function ContentTable({
    content,
    onView,
    onDelete,
    onFlag
}: ContentTableProps) {
    if (content.length === 0) {
        return (
            <div className='text-center py-8'>
                <p className='text-gray-500'>No content found</p>
            </div>
        )
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'wireframe-to-code':
                return 'bg-blue-100 text-blue-800'
            case 'plagiarism-check':
                return 'bg-purple-100 text-purple-800'
            case 'cover-page':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Type
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Creator
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Created At
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                    {content.map(item => (
                        <tr key={item.uid} className='hover:bg-gray-50 transition-colors'>
                            <td className='px-6 py-4 text-sm'>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}
                                >
                                    {item.type.replace('-', ' ')}
                                </span>
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-600'>
                                {item.createdBy}
                            </td>
                            <td className='px-6 py-4 text-sm text-gray-600'>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className='px-6 py-4 text-sm flex items-center gap-2'>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => onView(item)}
                                    className='flex items-center gap-1'
                                >
                                    <Eye className='w-4 h-4' />
                                    View
                                </Button>
                                <Button
                                    size='sm'
                                    onClick={() => onFlag(item)}
                                    className='bg-yellow-600 hover:bg-yellow-700 flex items-center gap-1'
                                >
                                    <Flag className='w-4 h-4' />
                                    Flag
                                </Button>
                                <Button
                                    size='sm'
                                    variant='destructive'
                                    onClick={() => onDelete(item)}
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
