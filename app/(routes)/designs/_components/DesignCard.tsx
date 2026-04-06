import { Button } from '@/components/ui/button'
import { Code, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { memo, useState } from 'react'
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

    // Get AI model info
    const getModelInfo = () => {
        const model = item?.model
        
        if (!model) {
            return { 
                name: 'AI Model', 
                provider: 'Unknown', 
                showIcon: false,
                initial: 'AI',
                bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600' 
            }
        }

        if (model.toLowerCase().includes('gemini')) {
            return { 
                name: 'Gemini', 
                provider: 'Google',
                showIcon: true,
            }
        }
        
        if (model.toLowerCase().includes('gpt') || model.toLowerCase().includes('openai')) {
            return { 
                name: 'ChatGPT', 
                provider: 'OpenAI',
                showIcon: false,
                initial: 'C',
                bgColor: 'bg-gradient-to-br from-green-400 to-green-600'
            }
        }
        
        if (model.toLowerCase().includes('claude')) {
            return { 
                name: 'Claude', 
                provider: 'Anthropic',
                showIcon: false,
                initial: 'C',
                bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600'
            }
        }

        return { 
            name: model.split('-')[0] || 'AI', 
            provider: 'AI Model',
            showIcon: false,
            initial: model[0]?.toUpperCase() || 'AI',
            bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600'
        }
    }

    const modelInfo = getModelInfo()

    return (
        <>
            <div className='bg-blue-50 border-blue-200 border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all relative group'>
                {/* Delete button - shows on hover */}
                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                >
                    <Trash2 className='h-3.5 w-3.5' />
                </button>

                {/* Image Section */}
                {item?.imageUrl && typeof item.imageUrl === 'string' && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://') || item.imageUrl.startsWith('/')) ? (
                    <div className="relative w-full h-48">
                        <Image 
                            src={item.imageUrl} 
                            alt={item?.description || 'Wireframe'}
                            fill
                            className='object-cover'
                        />
                    </div>
                ) : (
                    <div className='w-full h-48 bg-blue-100 flex items-center justify-center'>
                        <Code className='h-16 w-16 text-blue-600 opacity-50' />
                    </div>
                )}

                {/* Content Section */}
                <div className='p-5 bg-white'>
                    <h3 className='font-semibold text-lg mb-2 line-clamp-2'>{item?.description || 'Wireframe Conversion'}</h3>
                    
                    {/* Date */}
                    {item?.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <span className="text-xs">{formatDate(item.createdAt)}</span>
                        </div>
                    )}

                    {/* Badge with AI Model */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            {modelInfo.showIcon ? (
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                </div>
                            ) : (
                                <div className={`w-8 h-8 rounded-full ${modelInfo.bgColor} text-white flex items-center justify-center shadow-md`}>
                                    <span className="text-sm font-bold">{modelInfo.initial}</span>
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-semibold">{modelInfo.name}</div>
                                <div className="text-xs text-gray-500">{modelInfo.provider}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Button */}
                    <Link href={'/view-code/' + item?.uid}>
                        <Button 
                            size='sm' 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Code className="h-4 w-4 mr-2" />
                            View Code
                        </Button>
                    </Link>
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

export default memo(DesignCard)