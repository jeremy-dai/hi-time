import { cn } from '../../utils/classNames'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX } from '../../constants/colors'
import type { YTDStats } from '../../utils/analytics'
import { CATEGORY_KEYS } from '../../types/time'
import { BarChart3 } from 'lucide-react'

interface AnnualCategoryBreakdownProps {
  ytdStats: YTDStats
}

export default function AnnualCategoryBreakdown({ ytdStats }: AnnualCategoryBreakdownProps) {
  const totalHours = ytdStats.categoryTotals
    ? Object.values(ytdStats.categoryTotals).reduce((sum, hours) => sum + hours, 0)
    : 0

  return (
    <div className={cn('rounded-xl p-4', 'bg-white shadow-sm')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <h3 className={cn('text-sm font-semibold', 'text-gray-900')}>
          Category Breakdown
        </h3>
      </div>

      {/* Bar chart with all info */}
      <div className="space-y-1.5">
        {CATEGORY_KEYS.filter(k => k !== '').map((cat) => {
          const totalCategoryHours = ytdStats.categoryTotals?.[cat] || 0
          const avgHours = ytdStats.categoryAverages?.[cat] || 0
          const percentage = totalHours > 0 ? (totalCategoryHours / totalHours) * 100 : 0

          if (totalCategoryHours === 0) return null

          return (
            <div key={cat} className="flex items-center gap-2 min-w-0">
              {/* Label */}
              <div className="w-24 shrink-0 text-xs font-medium text-gray-600 truncate">
                {CATEGORY_LABELS[cat]}
              </div>
              {/* Bar */}
              <div className="flex-1 min-w-0 h-5 rounded-xl overflow-hidden bg-gray-100">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CATEGORY_COLORS_HEX[cat].bg
                  }}
                />
              </div>
              {/* Stats */}
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="font-semibold text-gray-900 w-12 text-right whitespace-nowrap">
                  {totalCategoryHours.toFixed(0)}h
                </span>
                <span className="font-medium text-gray-500 w-12 text-right whitespace-nowrap">
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 w-20 text-right whitespace-nowrap">
                  {avgHours.toFixed(1)}h/wk
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
