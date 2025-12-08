import React from 'react'
import { Check, Layers } from 'lucide-react'

interface Screen {
    name: string
    purpose: string
    elements: string[]
    interactions?: string[]
}

interface ScreenListProps {
    screens: Screen[]
}

function ScreenList({ screens }: ScreenListProps) {
    return (
        <div className='space-y-4'>
            <div className='flex items-center gap-2'>
                <Layers className='h-6 w-6 text-primary' />
                <h3 className='font-bold text-xl'>App Screens ({screens.length})</h3>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {screens.map((screen, index) => (
                    <div 
                        key={`screen-${screen.name}-${index}`}
                        className='p-5 border-2 rounded-lg hover:shadow-lg transition-all bg-white'
                    >
                        <div className='flex items-start gap-3 mb-3'>
                            <div className='w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0'>
                                {index + 1}
                            </div>
                            <div className='flex-1'>
                                <h4 className='font-bold text-lg'>{screen.name}</h4>
                                <p className='text-sm text-gray-600 mt-1'>{screen.purpose}</p>
                            </div>
                        </div>

                        {/* Elements */}
                        <div className='mt-4'>
                            <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                                Elements
                            </p>
                            <ul className='space-y-1'>
                                {screen.elements.map((element, idx) => (
                                    <li 
                                        key={`element-${screen.name}-${idx}`}
                                        className='text-sm flex items-start gap-2'
                                    >
                                        <Check className='h-4 w-4 text-green-500 flex-shrink-0 mt-0.5' />
                                        <span>{element}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Interactions */}
                        {screen.interactions && screen.interactions.length > 0 && (
                            <div className='mt-4 pt-4 border-t'>
                                <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
                                    Interactions
                                </p>
                                <ul className='space-y-1'>
                                    {screen.interactions.map((interaction, idx) => (
                                        <li 
                                            key={`interaction-${screen.name}-${idx}`}
                                            className='text-sm text-blue-600'
                                        >
                                            → {interaction}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ScreenList
