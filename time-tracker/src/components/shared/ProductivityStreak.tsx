import { cn } from '../../utils/classNames'
import { Flame } from 'lucide-react'
import CardHeader from './CardHeader'
import ProgressBar from './ProgressBar'

interface StreakMetricsData {
  currentStreak: number
  longestStreak: number
  productiveDays: number
  totalDays: number
}

interface ProductivityStreakProps {
  streakMetrics: StreakMetricsData
  /**
   * 'compact' - smaller cards with decorative icons (for Annual view)
   * 'detailed' - larger cards with info box (for Trends view)
   */
  variant?: 'compact' | 'detailed'
  className?: string
}

export default function ProductivityStreak({
  streakMetrics,
  variant = 'compact',
  className
}: ProductivityStreakProps) {
  const { currentStreak, longestStreak, productiveDays, totalDays } = streakMetrics
  const productivePercentage = totalDays > 0 ? (productiveDays / totalDays) * 100 : 0

  const streakColor = currentStreak >= 30
    ? 'text-orange-500'
    : currentStreak >= 14
      ? 'text-yellow-500'
      : 'text-gray-400'

  return (
    <div className={cn('rounded-xl p-5', 'glass-card', className)}>
      <CardHeader 
        title="Productivity Streak" 
        icon={Flame}
        titleClassName={cn(variant === 'compact' ? 'text-sm' : 'text-base')}
        iconClassName={streakColor}
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className="relative group">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <div className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">Current</div>
          </div>
          <div className="flex items-baseline gap-1">
            <div className={cn(
              'font-bold tracking-tight text-zinc-900',
              variant === 'compact' ? 'text-3xl' : 'text-2xl'
            )}>
              {currentStreak}
            </div>
            <div className="text-xs font-medium text-zinc-400">
              {currentStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="relative group">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <div className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">Best</div>
          </div>
          <div className="flex items-baseline gap-1">
            <div className={cn(
              'font-bold tracking-tight text-zinc-900',
              variant === 'compact' ? 'text-3xl' : 'text-2xl'
            )}>
              {longestStreak}
            </div>
            <div className="text-xs font-medium text-zinc-400">
              days
            </div>
          </div>
        </div>

        {/* Productive Days */}
        <div className="relative group">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <div className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">Rate</div>
          </div>
          <div className="flex items-baseline gap-1">
            <div className={cn(
              'font-bold tracking-tight text-zinc-900',
              variant === 'compact' ? 'text-3xl' : 'text-2xl'
            )}>
              {productivePercentage.toFixed(0)}%
            </div>
            <div className="text-xs font-medium text-zinc-400">
              {productiveDays}/{totalDays}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar spanning full width */}
      <ProgressBar 
        value={productivePercentage} 
        className="mt-4 h-1"
        barClassName="bg-gradient-to-r from-emerald-400 to-emerald-500 duration-1000"
      />

      {/* Info Box (detailed variant only) */}
      {variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <p className="text-xs leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-600">Productive Day:</span> 8+ hours of work on weekdays or 4+ hours on weekends.
            Streak allows up to 2 skipped days without breaking.
          </p>
        </div>
      )}
    </div>
  )
}
