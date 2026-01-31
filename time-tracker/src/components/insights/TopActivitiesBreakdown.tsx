import type { TopActivity } from '../../types/insights'
import { cn } from '../../utils/classNames'
import { getCategoryColor, getCategoryLabel } from '../../utils/colorHelpers'
import { Trophy } from 'lucide-react'
import CardHeader from '../shared/CardHeader'

interface TopActivitiesBreakdownProps {
  activities: TopActivity[]
  title?: string // Optional custom title
}

export default function TopActivitiesBreakdown({ activities, title }: TopActivitiesBreakdownProps) {
  const displayTitle = title || `Top ${activities.length} Activities`

  if (activities.length === 0) {
    return (
      <div className={cn(
        'rounded-xl p-5',
        'glass-card'
      )}>
        <CardHeader
          title={title || "Top Activities"}
          icon={Trophy}
          iconClassName="w-5 h-5 text-emerald-600"
        />
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 mb-1">
            No detailed activity data available
          </p>
          <p className="text-xs text-gray-400">
            Add subcategories or notes to your time blocks for more detailed insights
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl p-4',
      'glass-card'
    )}>
      <CardHeader
        title={displayTitle}
        icon={Trophy}
        className="mb-2"
      />

      {/* Compact List Design */}
      <div className="space-y-0.5">
        {activities.map((activity, index) => {
          const categoryColors = getCategoryColor(activity.type)
          const categoryLabel = getCategoryLabel(activity.type) || activity.type

          return (
            <div
              key={`${activity.activity}-${index}`}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md',
                'hover:bg-gray-50/80',
                'transition-colors'
              )}
            >
              {/* Rank Badge */}
              <div className={cn(
                'flex items-center justify-center w-4 h-4 rounded-full shrink-0',
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-200 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              )}>
                <span className="text-2xs font-bold leading-none">
                  {index + 1}
                </span>
              </div>

              {/* Activity Name - Primary anchor */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-900 truncate">
                  {activity.activity}
                </div>
              </div>

              {/* Type Badge */}
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium shrink-0"
                style={{
                  backgroundColor: categoryColors.bg,
                  color: categoryColors.text
                }}
              >
                {categoryLabel}
              </span>

              {/* Hours and Percentage */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-900 w-8 text-right">
                  {activity.hours.toFixed(1)}h
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-10 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, activity.percentage)}%`,
                        backgroundColor: categoryColors.bg
                      }}
                    />
                  </div>
                  <span className="text-2xs font-medium text-gray-600 w-8 text-right">
                    {activity.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-2 pt-2 border-t border-zinc-100">
        <p className="text-2xs text-gray-500">
          <span className="font-medium text-gray-700">
            Top {activities.length}
          </span>{' '}
          ={' '}
          <span className="font-medium text-gray-700">
            {activities.reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
          </span>{' '}
          of tracked time
        </p>
      </div>
    </div>
  )
}
