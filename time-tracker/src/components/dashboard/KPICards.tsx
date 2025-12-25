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
        <div key={cat} className={cn('p-4 rounded-3xl bg-white shadow-sm')}>
          <div className="text-xs font-medium mb-3 text-gray-500 uppercase tracking-wide">{CATEGORY_LABELS[cat]}</div>
          <div className="h-10 w-full rounded-xl overflow-hidden shadow-sm">
            <div className={cn('h-full w-full', CATEGORY_GRADIENTS[cat])} />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              {(stats.categoryHours[cat] || 0).toFixed(1)}<span className="text-lg font-medium text-gray-500 ml-0.5">h</span>
            </span>
            <span className="text-sm font-bold text-gray-500">
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

