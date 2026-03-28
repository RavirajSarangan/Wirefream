import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: number
    icon?: React.ReactNode
    trend?: 'up' | 'down'
    trendValue?: number
    description?: string
}

export default function StatsCard({
    title,
    value,
    icon,
    trend,
    trendValue,
    description
}: StatsCardProps) {
    return (
        <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-start justify-between'>
                <div>
                    <p className='text-sm text-gray-600 font-medium'>{title}</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>
                        {value.toLocaleString()}
                    </p>
                    {description && (
                        <p className='text-xs text-gray-500 mt-1'>{description}</p>
                    )}
                </div>

                {icon ? (
                    <div className='text-blue-600'>{icon}</div>
                ) : trend ? (
                    trend === 'up' ? (
                        <TrendingUp className='w-8 h-8 text-green-600' />
                    ) : (
                        <TrendingDown className='w-8 h-8 text-red-600' />
                    )
                ) : null}
            </div>

            {trendValue !== undefined && (
                <div className={`mt-4 flex items-center gap-1 text-sm ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {trend === 'up' ? (
                        <TrendingUp className='w-4 h-4' />
                    ) : (
                        <TrendingDown className='w-4 h-4' />
                    )}
                    <span>{trendValue}% from last month</span>
                </div>
            )}
        </div>
    )
}
