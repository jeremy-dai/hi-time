import type { TopActivity } from '../../types/insights'
import { cn } from '../../utils/classNames'
import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../../constants/colors'
import { Trophy } from 'lucide-react'

interface TopActivitiesBreakdownProps {
  activities: TopActivity[]
}

export default function TopActivitiesBreakdown({ activities }: TopActivitiesBreakdownProps) {
  if (activities.length === 0) {
    return (
      <div className={cn(
        'rounded-3xl p-6',
        'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(
            'text-lg font-semibold',
            'text-gray-900 dark:text-gray-100'
          )}>
            Top Activities
          </h2>
          <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className={cn(
          'p-6 rounded-xl text-center',
          'bg-gray-50 dark:bg-gray-800/50',
          'border border-gray-200 dark:border-gray-700'
        )}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No detailed activity data available
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Add subcategories or notes to your time blocks for more detailed insights
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-3xl p-6',
      'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]'
    )}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn(
          'text-lg font-semibold',
          'text-gray-900 dark:text-gray-100'
        )}>
          Top {activities.length} Activities
        </h2>
        <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              'border-b border-gray-200 dark:border-gray-700'
            )}>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                Hours
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => {
              const categoryColors = CATEGORY_COLORS_HEX[activity.type]
              const categoryLabel = CATEGORY_LABELS[activity.type] || activity.type

              return (
                <tr
                  key={`${activity.activity}-${index}`}
                  className={cn(
                    'border-b border-gray-100 dark:border-gray-800',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    'transition-colors'
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full',
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}>
                      <span className="text-xs font-bold">
                        {index + 1}
                      </span>
                    </div>
                  </td>

                  {/* Activity */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-sm font-medium',
                      'text-gray-900 dark:text-gray-100'
                    )}>
                      {activity.activity}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: categoryColors?.bg || '#f3f4f6',
                        color: categoryColors?.text || '#4b5563'
                      }}
                    >
                      {categoryLabel}
                    </span>
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-sm font-semibold',
                      'text-gray-900 dark:text-gray-100'
                    )}>
                      {activity.hours.toFixed(1)}
                    </span>
                  </td>

                  {/* Percentage */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, activity.percentage)}%`,
                            backgroundColor: categoryColors?.bg || '#9ca3af'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
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
      <div className={cn(
        'mt-4 p-3 rounded-xl',
        'bg-gray-50 dark:bg-gray-800/50',
        'border border-gray-200 dark:border-gray-700'
      )}>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">
            Showing top {activities.length} activities
          </span>{' '}
          accounting for{' '}
          <span className="font-semibold">
            {activities.reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
          </span>{' '}
          of tracked time
        </p>
      </div>
    </div>
  )
}
