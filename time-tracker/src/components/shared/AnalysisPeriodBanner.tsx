import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CalendarRange } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface AnalysisPeriodBannerProps {
  dateRangeLabel: string
  subtitle: ReactNode
  actions: ReactNode
  icon?: LucideIcon
}

export default function AnalysisPeriodBanner({
  dateRangeLabel,
  subtitle,
  actions,
  icon: Icon = CalendarRange
}: AnalysisPeriodBannerProps) {
  return (
    <div className={cn(
      'flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0',
      'pb-4 border-b border-gray-100'
    )}>
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-600 shrink-0" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-900">
            Analysis Period: {dateRangeLabel}
          </h3>
          <p className="text-xs mt-0.5 text-gray-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
        {actions}
      </div>
    </div>
  )
}
