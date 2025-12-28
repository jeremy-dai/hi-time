import { cn } from '../../utils/classNames'
import type { YTDStats } from '../../utils/analytics'
import { Flame, TrendingUp, Calendar } from 'lucide-react'

interface AnnualProductivityStreakProps {
  streakMetrics: YTDStats['streakMetrics']
}

export default function AnnualProductivityStreak({ streakMetrics }: AnnualProductivityStreakProps) {
  const { currentStreak, longestStreak, productiveDays, totalDays } = streakMetrics

  const productivePercentage = totalDays > 0 ? (productiveDays / totalDays) * 100 : 0

  // Determine streak color based on current streak
  const streakColor = currentStreak >= 30
    ? 'text-orange-500'
    : currentStreak >= 14
      ? 'text-yellow-500'
      : 'text-gray-400'

  return (
    <div className={cn(
      'rounded-2xl p-4',
      'bg-white shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-base font-semibold', 'text-gray-900')}>
          Productivity Streak
        </h3>
        <Flame className={cn('w-4 h-4', streakColor)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Current Streak */}
        <div className={cn(
          'rounded-xl p-3 text-center',
          'bg-gradient-to-br from-orange-50 to-orange-100',
          'border border-orange-200'
        )}>
          <div className="flex justify-center mb-1">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {currentStreak}
          </div>
          <div className="text-xs font-medium text-orange-900">
            Current Streak
          </div>
          <div className="text-[10px] text-orange-700">
            {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className={cn(
          'rounded-xl p-3 text-center',
          'bg-gradient-to-br from-purple-50 to-purple-100',
          'border border-purple-200'
        )}>
          <div className="flex justify-center mb-1">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {longestStreak}
          </div>
          <div className="text-xs font-medium text-purple-900">
            Longest Streak
          </div>
          <div className="text-[10px] text-purple-700">
            this year
          </div>
        </div>

        {/* Productive Days */}
        <div className={cn(
          'rounded-xl p-3 text-center',
          'bg-gradient-to-br from-blue-50 to-blue-100',
          'border border-blue-200'
        )}>
          <div className="flex justify-center mb-1">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {productiveDays}/{totalDays}
          </div>
          <div className="text-xs font-medium text-blue-900">
            Productive Days
          </div>
          <div className="text-[10px] text-blue-700">
            {productivePercentage.toFixed(0)}% of year
          </div>
        </div>
      </div>
    </div>
  )
}
