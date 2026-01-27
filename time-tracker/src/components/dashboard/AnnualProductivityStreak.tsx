import { cn } from '../../utils/classNames'
import type { YTDStats } from '../../utils/analytics'
import { Flame, TrendingUp, Calendar, Info } from 'lucide-react'
import Tooltip from '../shared/Tooltip'

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
      'rounded-xl p-4',
      'glass-card'
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-sm font-semibold', 'text-gray-900')}>
          Productivity Streak
        </h3>
        <Flame className={cn('w-4 h-4', streakColor)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Current Streak */}
        <div className={cn(
          'rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          'bg-white border border-orange-100 shadow-sm'
        )}>
          <Flame className="absolute -right-2 -bottom-2 w-16 h-16 text-orange-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-orange-600/70 mb-1">Current Streak</div>
            <div className="flex items-baseline gap-1">
              <div className="text-4xl font-bold tracking-tight text-zinc-900">
                {currentStreak}
              </div>
              <div className="text-xs font-medium text-zinc-400">
                {currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className={cn(
          'rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          'bg-white border border-purple-100 shadow-sm'
        )}>
          <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-purple-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-purple-600/70 mb-1">Longest Streak</div>
            <div className="flex items-baseline gap-1">
              <div className="text-4xl font-bold tracking-tight text-zinc-900">
                {longestStreak}
              </div>
              <div className="text-xs font-medium text-zinc-400">
                days
              </div>
            </div>
          </div>
        </div>

        {/* Productive Days */}
        <div className={cn(
          'rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          'bg-white border border-lime-100 shadow-sm'
        )}>
          {/* Background progress indicator - very subtle */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-lime-500 transition-all duration-1000"
            style={{ width: `${productivePercentage}%` }}
          />
          
          <Calendar className="absolute -right-2 -bottom-2 w-16 h-16 text-lime-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-lime-600/70 mb-1">Productive Days</div>
            <div className="flex items-baseline gap-1">
              <div className="text-4xl font-bold tracking-tight text-zinc-900">
                {productivePercentage.toFixed(0)}%
              </div>
              <div className="text-xs font-medium text-zinc-400">
                {productiveDays}/{totalDays}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
