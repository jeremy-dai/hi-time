import { cn } from '../../utils/classNames'
import { CATEGORY_LABELS, CATEGORY_GRADIENTS } from '../../constants/colors'
import type { WeekStats } from '../../utils/analytics'

interface KPICardsProps {
  stats: WeekStats
}

const order: Array<keyof typeof CATEGORY_LABELS> = ['R', 'W', 'M', 'G', 'P']

export default function KPICards({ stats }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {order.map((cat) => (
        <div key={cat} className={cn('p-4 rounded-xl border', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
          <div className={cn('text-xs mb-2', 'text-gray-500 dark:text-gray-400')}>{CATEGORY_LABELS[cat]}</div>
          <div className="h-10 w-full rounded-md overflow-hidden">
            <div className={cn('h-full w-full', CATEGORY_GRADIENTS[cat])} />
          </div>
          <div className={cn('mt-2 flex items-baseline justify-between', 'text-gray-900 dark:text-gray-100')}>
            <span className="text-2xl font-semibold">
              {(stats.categoryHours[cat] || 0).toFixed(1)}h
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stats.totalHours > 0 
                ? `${(((stats.categoryHours[cat] || 0) / stats.totalHours) * 100).toFixed(1)}%` 
                : '0%'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

