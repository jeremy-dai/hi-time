import { cn } from '../../utils/classNames'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX } from '../../constants/colors'
import type { WeekStats } from '../../utils/analytics'
import { CATEGORY_KEYS } from '../../types/time'
import { BarChart3 } from 'lucide-react'

interface KPICardsProps {
  latestWeekStats: WeekStats
  fourWeekAverage: Record<string, number>
}

export default function KPICards({ latestWeekStats, fourWeekAverage }: KPICardsProps) {
  const totalHours = latestWeekStats.totalHours

  return (
    <div className={cn('rounded-xl p-4', 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-md hover:shadow-lg transition-all duration-300')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <h3 className={cn('text-2xs font-bold uppercase tracking-wider', 'text-gray-500')}>
          Category Breakdown
        </h3>
      </div>

      {/* Bar chart with all info */}
      <div className="space-y-2">
        {CATEGORY_KEYS.filter(k => k !== '').map((cat) => {
          const hours = latestWeekStats.categoryHours[cat] || 0
          const avgHours = fourWeekAverage[cat] || 0
          const delta = hours - avgHours
          const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0

          if (hours === 0) return null

          return (
            <div key={cat} className="flex items-center gap-3 min-w-0">
              {/* Label */}
              <div className="w-16 sm:w-20 flex-shrink-0 text-2xs font-bold text-gray-500 uppercase tracking-wider truncate">
                {CATEGORY_LABELS[cat]}
              </div>
              {/* Bar */}
              <div className="flex-1 min-w-0 h-2.5 rounded-full overflow-hidden bg-zinc-100/80 border border-zinc-200/50">
                <div
                  className="h-full transition-all rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CATEGORY_COLORS_HEX[cat].bg
                  }}
                />
              </div>
              {/* Stats */}
              <div className="flex items-center gap-2 text-2xs flex-shrink-0">
                <span className="font-bold text-gray-900 w-8 text-right whitespace-nowrap">
                  {hours.toFixed(1)}h
                </span>
                <span className="font-medium text-gray-400 w-8 text-right whitespace-nowrap">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
