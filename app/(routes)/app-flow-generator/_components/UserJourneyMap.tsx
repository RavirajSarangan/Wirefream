import React from 'react'
import { MapPin, Target, User, Smile, Meh, Frown } from 'lucide-react'

interface JourneyStep {
    step: number
    action: string
    screen: string
    emotion: string
    painPoint?: string
}

interface UserJourney {
    persona?: string
    steps: JourneyStep[]
    goals?: string[]
}

interface UserJourneyMapProps {
    journey: UserJourney
}

function UserJourneyMap({ journey }: UserJourneyMapProps) {
    const getEmotionIcon = (emotion: string) => {
        const emotionLower = emotion.toLowerCase()
        if (emotionLower.includes('happy') || emotionLower.includes('satisfied') || emotionLower.includes('excited')) {
            return <Smile className='h-5 w-5 text-green-500' />
        }
        if (emotionLower.includes('frustrated') || emotionLower.includes('angry') || emotionLower.includes('confused')) {
            return <Frown className='h-5 w-5 text-red-500' />
        }
        return <Meh className='h-5 w-5 text-yellow-500' />
    }

    const getEmotionColor = (emotion: string) => {
        const emotionLower = emotion.toLowerCase()
        if (emotionLower.includes('happy') || emotionLower.includes('satisfied') || emotionLower.includes('excited')) {
            return 'bg-green-100 border-green-300'
        }
        if (emotionLower.includes('frustrated') || emotionLower.includes('angry') || emotionLower.includes('confused')) {
            return 'bg-red-100 border-red-300'
        }
        return 'bg-yellow-100 border-yellow-300'
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center gap-2'>
                <MapPin className='h-6 w-6 text-primary' />
                <h3 className='font-bold text-xl'>User Journey Map</h3>
            </div>

            <div className='p-6 border-2 rounded-lg bg-white space-y-6'>
                {/* Persona */}
                {journey.persona && (
                    <div className='flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                        <User className='h-6 w-6 text-blue-600 flex-shrink-0' />
                        <div>
                            <p className='font-semibold text-blue-900'>User Persona</p>
                            <p className='text-sm text-blue-700 mt-1'>{journey.persona}</p>
                        </div>
                    </div>
                )}

                {/* Goals */}
                {journey.goals && journey.goals.length > 0 && (
                    <div className='flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
                        <Target className='h-6 w-6 text-purple-600 flex-shrink-0' />
                        <div>
                            <p className='font-semibold text-purple-900 mb-2'>User Goals</p>
                            <ul className='space-y-1'>
                                {journey.goals.map((goal, idx) => (
                                    <li 
                                        key={`goal-${goal.substring(0, 30)}-${idx}`}
                                        className='text-sm text-purple-700'
                                    >
                                        • {goal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Journey Steps */}
                <div className='space-y-4'>
                    <p className='font-semibold text-gray-700'>Journey Steps</p>
                    <div className='relative'>
                        {/* Timeline Line */}
                        <div className='absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300' />

                        {/* Steps */}
                        <div className='space-y-6'>
                            {journey.steps.map((step, index) => (
                                <div 
                                    key={`step-${step.step}-${index}`}
                                    className='relative pl-16'
                                >
                                    {/* Step Number */}
                                    <div className='absolute left-0 top-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold z-10'>
                                        {step.step}
                                    </div>

                                    {/* Step Content */}
                                    <div className={`p-4 rounded-lg border-2 ${getEmotionColor(step.emotion)}`}>
                                        <div className='flex items-start justify-between gap-3'>
                                            <div className='flex-1'>
                                                <div className='flex items-center gap-2 mb-2'>
                                                    <p className='font-semibold text-gray-800'>
                                                        {step.action}
                                                    </p>
                                                    {getEmotionIcon(step.emotion)}
                                                </div>
                                                <p className='text-sm text-gray-600'>
                                                    <span className='font-medium'>Screen:</span> {step.screen}
                                                </p>
                                                {step.painPoint && (
                                                    <p className='text-sm text-red-600 mt-2'>
                                                        <span className='font-medium'>⚠️ Pain Point:</span> {step.painPoint}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Emotion Legend */}
                <div className='pt-4 border-t'>
                    <p className='text-xs font-semibold text-gray-500 uppercase mb-3'>Emotion Legend</p>
                    <div className='flex flex-wrap gap-4'>
                        <div className='flex items-center gap-2'>
                            <Smile className='h-4 w-4 text-green-500' />
                            <span className='text-sm text-gray-600'>Positive</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Meh className='h-4 w-4 text-yellow-500' />
                            <span className='text-sm text-gray-600'>Neutral</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Frown className='h-4 w-4 text-red-500' />
                            <span className='text-sm text-gray-600'>Negative</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserJourneyMap
