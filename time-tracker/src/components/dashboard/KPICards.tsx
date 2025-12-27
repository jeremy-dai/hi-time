import { cn } from '../../utils/classNames'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX } from '../../constants/colors'
import type { WeekStats } from '../../utils/analytics'
import type { CategoryKey } from '../../types/time'
import { BarChart3 } from 'lucide-react'

interface KPICardsProps {
  latestWeekStats: WeekStats
  fourWeekAverage: Record<CategoryKey, number>
}

const order: Array<keyof typeof CATEGORY_LABELS> = ['R', 'W', 'M', 'G', 'P']

export default function KPICards({ latestWeekStats, fourWeekAverage }: KPICardsProps) {
  const totalHours = latestWeekStats.totalHours

  return (
    <div className={cn('rounded-3xl p-4', 'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className={cn('text-sm font-semibold', 'text-gray-900 dark:text-gray-100')}>
          Category Breakdown
        </h3>
      </div>

      {/* Bar chart with all info */}
      <div className="space-y-1.5">
        {order.map((cat) => {
          const hours = latestWeekStats.categoryHours[cat] || 0
          const avgHours = fourWeekAverage[cat] || 0
          const delta = hours - avgHours
          const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0

          if (hours === 0) return null

          return (
            <div key={cat} className="flex items-center gap-2 min-w-0">
              {/* Label */}
              <div className="w-24 flex-shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                {CATEGORY_LABELS[cat]}
              </div>
              {/* Bar */}
              <div className="flex-1 min-w-0 h-5 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CATEGORY_COLORS_HEX[cat].bg
                  }}
                />
              </div>
              {/* Stats */}
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                <span className="font-semibold text-gray-900 dark:text-gray-100 w-12 text-right whitespace-nowrap">
                  {hours.toFixed(1)}h
                </span>
                <span className="font-medium text-gray-500 dark:text-gray-400 w-12 text-right whitespace-nowrap">
                  {percentage.toFixed(1)}%
                </span>
                <span className={cn('text-xs w-20 text-right whitespace-nowrap', delta > 0.5 ? 'text-green-600 dark:text-green-400' : delta < -0.5 ? 'text-red-600 dark:text-red-400' : 'text-gray-500')}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}h vs avg
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
