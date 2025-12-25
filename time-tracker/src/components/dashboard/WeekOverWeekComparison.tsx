import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { calculateWeekDelta, aggregateWeekData } from '../../utils/analytics'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX } from '../../constants/colors'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface WeekOverWeekComparisonProps {
  currentWeekData: TimeBlock[][]
  previousWeekData: TimeBlock[][] | null
  currentWeekLabel: string
  previousWeekLabel: string
}

export default function WeekOverWeekComparison({
  currentWeekData,
  previousWeekData,
}: WeekOverWeekComparisonProps) {
  const delta = useMemo(() => {
    if (!previousWeekData) return null
    return calculateWeekDelta(currentWeekData, previousWeekData)
  }, [currentWeekData, previousWeekData])

  const currentStats = useMemo(() => aggregateWeekData(currentWeekData), [currentWeekData])
  const previousStats = useMemo(() => previousWeekData ? aggregateWeekData(previousWeekData) : null, [previousWeekData])

  if (!previousStats || !delta) {
    return (
      <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]')}>
        <div className={cn('text-lg font-semibold mb-4', 'text-gray-900 dark:text-gray-100')}>Week Over Week</div>
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          No previous week data available for comparison
        </div>
      </div>
    )
  }

  const formatDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}h`
  }

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <ArrowUp className="w-4 h-4" />
    if (delta < 0) return <ArrowDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600 dark:text-green-400'
    if (delta < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const categories = ['R', 'W', 'G', 'P', 'M'] as const

  return (
    <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900 dark:text-gray-100')}>Week Over Week</div>

      {/* Category Deltas */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">By Category</div>
        {categories.map((cat) => {
          const currentHours = currentStats.categoryHours[cat] || 0
          const previousHours = previousStats.categoryHours[cat] || 0
          const catDelta = delta.categoryDeltas[cat]

          if (currentHours === 0 && previousHours === 0) return null

          return (
            <div
              key={cat}
              className={cn('flex items-center justify-between p-3 rounded-lg', 'bg-gray-50 dark:bg-gray-800/50')}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS_HEX[cat].bg }}
                />
                <span className={cn('font-medium', 'text-gray-900 dark:text-gray-100')}>
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={cn('text-sm font-medium', 'text-gray-900 dark:text-gray-100')}>
                    {currentHours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    was {previousHours.toFixed(1)}h
                  </div>
                </div>
                {catDelta && (
                  <div className={cn('flex items-center space-x-1 text-sm font-semibold min-w-[80px] justify-end', getDeltaColor(catDelta.delta))}>
                    {getDeltaIcon(catDelta.delta)}
                    <span>{formatDelta(catDelta.delta)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
