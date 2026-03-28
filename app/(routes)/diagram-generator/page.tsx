"use client"
import React from 'react'
import { GitGraph, Sparkles, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function DiagramGenerator() {
    const handleNotify = () => {
        toast.success('We\'ll notify you when Diagram Generator launches!')
    }

    return (
        <div className='xl:px-20'>
            <div className='flex flex-col items-center justify-center min-h-[70vh] text-center'>
                {/* Animated Icon */}
                <div className='relative mb-8'>
                    <div className='w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center animate-pulse'>
                        <GitGraph className='h-12 w-12 text-indigo-600' />
                    </div>
                    <div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center'>
                        <Sparkles className='h-4 w-4 text-white' />
                    </div>
                </div>

                {/* Title */}
                <h1 className='font-bold text-4xl md:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600'>
                    Coming Soon
                </h1>

                {/* Subtitle */}
                <h2 className='font-semibold text-xl text-gray-800 mb-3'>
                    Diagram Generator
                </h2>

                {/* Description */}
                <p className='text-gray-500 max-w-md mb-8 leading-relaxed'>
                    Generate professional flowcharts, sequence diagrams, ER diagrams, and more using AI. 
                    Simply describe what you need and get beautiful diagrams instantly.
                </p>

                {/* Features Preview */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mb-10'>
                    <div className='p-4 bg-white border-2 border-gray-100 rounded-xl'>
                        <div className='text-2xl mb-2'>📊</div>
                        <h3 className='font-semibold text-sm text-gray-800'>Flowcharts</h3>
                        <p className='text-xs text-gray-400 mt-1'>Process & workflow diagrams</p>
                    </div>
                    <div className='p-4 bg-white border-2 border-gray-100 rounded-xl'>
                        <div className='text-2xl mb-2'>🔄</div>
                        <h3 className='font-semibold text-sm text-gray-800'>Sequence Diagrams</h3>
                        <p className='text-xs text-gray-400 mt-1'>System interaction flows</p>
                    </div>
                    <div className='p-4 bg-white border-2 border-gray-100 rounded-xl'>
                        <div className='text-2xl mb-2'>🗃️</div>
                        <h3 className='font-semibold text-sm text-gray-800'>ER Diagrams</h3>
                        <p className='text-xs text-gray-400 mt-1'>Database schema design</p>
                    </div>
                </div>

                {/* CTA */}
                <Button 
                    onClick={handleNotify}
                    className='bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-base'
                    size='lg'
                >
                    <Bell className='h-4 w-4 mr-2' />
                    Notify Me When Ready
                </Button>
            </div>
        </div>
    )
}

export default DiagramGenerator
