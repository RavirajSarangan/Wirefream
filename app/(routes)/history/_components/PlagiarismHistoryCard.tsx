"use client"
import React from 'react'
import { FileSearch, Trash2, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlagiarismHistoryCardProps {
    item: any
    onDelete: (uid: string) => void
    onView: () => void
}

function PlagiarismHistoryCard({ item, onDelete, onView }: PlagiarismHistoryCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getResultColor = () => {
        if (item.overallPlagiarismPercentage < 20) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
        if (item.overallPlagiarismPercentage < 50) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' }
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' }
    }

    const colors = getResultColor()
    
    // Get AI model info
    const modelInfo = {
        name: item.aiModelUsed?.includes('gemini') ? 'Gemini' : 'AI Model',
        provider: item.aiModelUsed?.includes('gemini') ? 'Google' : 'Unknown',
        showIcon: item.aiModelUsed?.includes('gemini'),
    }

    return (
        <div className={`${colors.bg} ${colors.border} border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all relative group`}>
            {/* Delete button - shows on hover */}
            <button
                onClick={() => onDelete(item.uid || item.id)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Plagiarism Score Section */}
            <div className={`w-full h-48 flex items-center justify-center ${colors.bg}`}>
                <div className="text-center">
                    <FileSearch className={`h-16 w-16 ${colors.text} mx-auto mb-4`} />
                    {item.overallPlagiarismPercentage !== undefined && (
                        <div className={`text-5xl font-bold ${colors.text}`}>
                            {item.overallPlagiarismPercentage}%
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Section */}
            <div className="p-5 bg-white">
                <h3 className='font-semibold text-lg mb-2 line-clamp-2'>{item.fileName || 'Plagiarism Check'}</h3>
                
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="text-xs">{formatDate(item.createdAt)}</span>
                </div>

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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center shadow-md">
                                <span className="text-sm font-bold">AI</span>
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-semibold">{modelInfo.name}</div>
                            <div className="text-xs text-gray-500">{modelInfo.provider}</div>
                        </div>
                    </div>
                </div>
                
                {/* Action Button */}
                <Button 
                    size='sm' 
                    onClick={onView} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Code className="h-4 w-4 mr-2" />
                    View Report
                </Button>
            </div>
        </div>
    )
}

export default PlagiarismHistoryCard
