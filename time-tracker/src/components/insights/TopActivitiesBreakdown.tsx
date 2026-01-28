import type { TopActivity } from '../../types/insights'
import { cn } from '../../utils/classNames'
import { getCategoryColor, getCategoryLabel } from '../../utils/colorHelpers'
import { Trophy } from 'lucide-react'
import CardHeader from '../shared/CardHeader'

interface TopActivitiesBreakdownProps {
  activities: TopActivity[]
}

export default function TopActivitiesBreakdown({ activities }: TopActivitiesBreakdownProps) {
  if (activities.length === 0) {
    return (
      <div className={cn(
        'rounded-xl p-5',
        'glass-card'
      )}>
        <CardHeader 
          title="Top Activities" 
          icon={Trophy}
          titleClassName="text-lg"
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
      'rounded-xl p-5',
      'glass-card'
    )}>
      <CardHeader 
        title={`Top ${activities.length} Activities`} 
        icon={Trophy}
        className="mb-3"
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              'border-b border-gray-200'
            )}>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600">
                Rank
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600">
                Activity
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600">
                Type
              </th>
              <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-600">
                Hours
              </th>
              <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-600">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => {
              const categoryColors = getCategoryColor(activity.type)
              const categoryLabel = getCategoryLabel(activity.type) || activity.type

              return (
                <tr
                  key={`${activity.activity}-${index}`}
                  className={cn(
                    'border-b border-gray-100',
                    'hover:bg-gray-50',
                    'transition-colors'
                  )}
                >
                  {/* Rank */}
                  <td className="px-2 py-1.5">
                    <div className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full',
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      <span className="text-xs font-bold">
                        {index + 1}
                      </span>
                    </div>
                  </td>

                  {/* Activity */}
                  <td className="px-2 py-1.5">
                    <span className={cn(
                      'text-sm font-medium',
                      'text-gray-900'
                    )}>
                      {activity.activity}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-2 py-1.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: categoryColors.bg,
                        color: categoryColors.text
                      }}
                    >
                      {categoryLabel}
                    </span>
                  </td>

                  {/* Hours */}
                  <td className="px-2 py-1.5 text-right">
                    <span className={cn(
                      'text-sm font-semibold',
                      'text-gray-900'
                    )}>
                      {activity.hours.toFixed(1)}
                    </span>
                  </td>

                  {/* Percentage */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, activity.percentage)}%`,
                            backgroundColor: categoryColors.bg
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10 text-right">
                        {activity.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-3 pt-3 border-t border-zinc-100">
        <p className="text-xs text-gray-500">
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
