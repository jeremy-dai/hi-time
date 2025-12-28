import { cn } from '../../utils/classNames'
import type { StreakMetrics } from '../../types/insights'
import { Flame, TrendingUp, Calendar } from 'lucide-react'

interface StreakTrackerProps {
  metrics: StreakMetrics
}

export default function StreakTracker({ metrics }: StreakTrackerProps) {
  const { currentStreak, longestStreak, productiveDays, totalDays, productivePercentage } = metrics

  // Determine streak color based on current streak
  const streakColor = currentStreak >= 7
    ? 'text-orange-500'
    : currentStreak >= 3
      ? 'text-yellow-500'
      : 'text-gray-400'

  return (
    <div className={cn(
      'rounded-xl p-6',
      'bg-white shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn('text-lg font-semibold', 'text-gray-900')}>
          Productivity Streak
        </h3>
        <Flame className={cn('w-5 h-5', streakColor)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className={cn(
          'rounded-xl p-5 text-center',
          'bg-gradient-to-br from-orange-50 to-orange-100',
          'border border-orange-200'
        )}>
          <div className="flex justify-center mb-2">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {currentStreak}
          </div>
          <div className="text-sm font-medium text-orange-900">
            Current Streak
          </div>
          <div className="text-xs text-orange-700 mt-1">
            {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className={cn(
          'rounded-xl p-5 text-center',
          'bg-gradient-to-br from-purple-50 to-purple-100',
          'border border-purple-200'
        )}>
          <div className="flex justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {longestStreak}
          </div>
          <div className="text-sm font-medium text-purple-900">
            Longest Streak
          </div>
          <div className="text-xs text-purple-700 mt-1">
            in this period
          </div>
        </div>

        {/* Productive Days */}
        <div className={cn(
          'rounded-xl p-5 text-center',
          'bg-gradient-to-br from-blue-50 to-blue-100',
          'border border-emerald-200'
        )}>
          <div className="flex justify-center mb-2">
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 mb-1">
            {productiveDays}/{totalDays}
          </div>
          <div className="text-sm font-medium text-emerald-900">
            Productive Days
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {productivePercentage.toFixed(0)}% of period
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className={cn(
        'mt-6 p-4 rounded-xl',
        'bg-gray-50',
        'border border-gray-200'
      )}>
        <div className={cn('text-sm leading-relaxed', 'text-gray-700')}>
          <span className="font-semibold">Productive Day:</span> 8+ hours of work on weekdays (Mon-Fri) or 4+ hours on weekends (Sat-Sun).
          Streak allows up to 2 skipped days without breaking.
        </div>
      </div>
    </div>
  )
}
