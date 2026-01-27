import { cn } from '../../utils/classNames'
import { Flame, TrendingUp, Calendar } from 'lucide-react'

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
    <div className={cn('rounded-xl p-4', 'glass-card', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn(
          'font-semibold',
          variant === 'compact' ? 'text-sm text-gray-900' : 'text-lg text-gray-900'
        )}>
          Productivity Streak
        </h3>
        <Flame className={cn('w-4 h-4', streakColor)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Current Streak */}
        <div className={cn(
          'rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          variant === 'compact' ? 'p-4' : 'p-5',
          'bg-white border border-orange-100 shadow-sm'
        )}>
          <Flame className="absolute -right-2 -bottom-2 w-16 h-16 text-orange-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-orange-600/70 mb-1">Current Streak</div>
            <div className="flex items-baseline gap-1">
              <div className={cn(
                'font-bold tracking-tight text-zinc-900',
                variant === 'compact' ? 'text-4xl' : 'text-3xl'
              )}>
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
          'rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          variant === 'compact' ? 'p-4' : 'p-5',
          'bg-white border border-purple-100 shadow-sm'
        )}>
          <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-purple-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-purple-600/70 mb-1">Longest Streak</div>
            <div className="flex items-baseline gap-1">
              <div className={cn(
                'font-bold tracking-tight text-zinc-900',
                variant === 'compact' ? 'text-4xl' : 'text-3xl'
              )}>
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
          'rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300',
          variant === 'compact' ? 'p-4' : 'p-5',
          'bg-white border border-emerald-100 shadow-sm'
        )}>
          <div
            className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000"
            style={{ width: `${productivePercentage}%` }}
          />
          <Calendar className="absolute -right-2 -bottom-2 w-16 h-16 text-emerald-500/10 rotate-12" />
          <div className="relative z-10">
            <div className="text-2xs font-bold uppercase tracking-wider text-emerald-600/70 mb-1">Productive Days</div>
            <div className="flex items-baseline gap-1">
              <div className={cn(
                'font-bold tracking-tight text-zinc-900',
                variant === 'compact' ? 'text-4xl' : 'text-3xl'
              )}>
                {productivePercentage.toFixed(0)}%
              </div>
              <div className="text-xs font-medium text-zinc-400">
                {productiveDays}/{totalDays}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box (detailed variant only) */}
      {variant === 'detailed' && (
        <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="text-xs leading-relaxed text-gray-600">
            <span className="font-semibold">Productive Day:</span> 8+ hours of work on weekdays (Mon-Fri) or 4+ hours on weekends (Sat-Sun).
            Streak allows up to 2 skipped days without breaking.
          </div>
        </div>
      )}
    </div>
  )
}
