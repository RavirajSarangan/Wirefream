import { Button } from '@/components/ui/button'
import Constants from '@/data/Constants'
import { Code, Trash2, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
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
import { toast } from 'sonner'
import axios from 'axios'

function DesignCard({ item, onDelete }: { item: any; onDelete: (uid: string) => void }) {
    const modelObj = item && Constants.AiModelList.find((x => x.name == item?.model))
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date unknown'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const response = await axios.delete(`/api/wireframe-to-code?uid=${item?.uid}&email=${item?.createdBy}`)
            
            if (response.data.success) {
                toast.success('Design deleted successfully')
                setShowDeleteDialog(false)
                onDelete(item?.uid)
            } else {
                toast.error(response.data.error || 'Failed to delete design')
            }
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.error || 'Failed to delete design')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            <div className='p-5 border rounded-lg hover:shadow-lg transition-shadow relative group'>
                {/* Delete button - shows on hover */}
                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className='absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10'
                    aria-label='Delete design'
                >
                    <Trash2 className='w-4 h-4' />
                </button>

                {item?.imageUrl && typeof item.imageUrl === 'string' && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://') || item.imageUrl.startsWith('/')) ? (
                    <Image src={item.imageUrl} alt='image'
                        width={300} height={200}
                        className='w-full h-[200px] object-cover bg-white rounded-lg'
                    />
                ) : (
                    <div className='w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center'>
                        <Code className='w-12 h-12 text-gray-400' />
                    </div>
                )}

                <div className='mt-2'>
                    <h2 className='line-clamp-3 text-gray-400 text-sm'>{item?.description}</h2>
                    
                    {/* Creation Date */}
                    {item?.createdAt && (
                        <p className='text-xs text-gray-500 mt-2 flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            {formatDate(item.createdAt)}
                        </p>
                    )}
                    
                    <div className='flex justify-between items-center mt-4'>
                        <div className='flex  items-center gap-2 p-2 bg-gray-50 rounded-full '>
                            {modelObj && <Image src={modelObj?.icon} alt={modelObj?.modelName ?? ''}
                                width={30}
                                height={30}
                            />}
                            <h2>{modelObj?.name}</h2>
                        </div>
                        <Link href={'/view-code/' + item?.uid}>
                            <Button className=''> <Code /> View Code</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this design and its generated code. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className='bg-red-500 hover:bg-red-600'
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default DesignCard