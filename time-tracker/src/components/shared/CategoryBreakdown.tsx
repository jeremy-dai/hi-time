import { cn } from '../../utils/classNames'
import { getCategoryLabel, getCategoryColor } from '../../utils/colorHelpers'
import { CATEGORY_KEYS } from '../../types/time'
import { BarChart3 } from 'lucide-react'
import CardHeader from './CardHeader'
import ProgressBar from './ProgressBar'

interface CategoryBreakdownProps {
  /**
   * Hours per category (e.g., { W: 40, R: 20, ... })
   */
  categoryHours: Record<string, number>
  className?: string
}

export default function CategoryBreakdown({
  categoryHours,
  className
}: CategoryBreakdownProps) {
  const totalHours = Object.values(categoryHours).reduce((sum, h) => sum + h, 0)

  return (
    <div className={cn(
      'rounded-xl p-5',
      'glass-card',
      className
    )}>
      {/* Header */}
      <CardHeader 
        title="Category Breakdown" 
        icon={BarChart3} 
        titleClassName="text-sm"
      />

      {/* Bar chart */}
      <div className="space-y-2">
        {CATEGORY_KEYS.filter(k => k !== '').map((cat) => {
          const hours = categoryHours[cat] || 0
          const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0

          if (hours === 0) return null

          return (
            <div key={cat} className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Label */}
              <div className="w-16 sm:w-20 text-xs font-medium text-gray-600 shrink-0 truncate">
                {getCategoryLabel(cat)}
              </div>
              {/* Bar */}
              <ProgressBar 
                value={percentage} 
                className="flex-1 min-w-0 h-2.5 bg-zinc-100/80 border border-zinc-200/50"
                style={{ backgroundColor: getCategoryColor(cat).bg }}
              />
              {/* Stats */}
              <div className="flex items-center gap-2 text-2xs shrink-0">
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
