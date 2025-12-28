import { Briefcase, Bed, Gamepad2, AlertCircle, CheckCircle } from 'lucide-react'
import type { YTDStats } from '../../utils/analytics'
import { CATEGORY_KEYS } from '../../types/time'
import { cn } from '../../utils/classNames'

interface YTDKPICardsProps {
  ytdStats: YTDStats
}

const categoryConfig = {
  G: {
    title: 'Avg Play / Week',
    icon: Gamepad2,
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    subtitle: 'Weekly Average'
  },
  R: {
    title: 'Avg Rest / Week',
    icon: Bed,
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    subtitle: 'Target: ~56h (8h/day)'
  },
  P: {
    title: 'Avg Procrastination',
    icon: AlertCircle,
    gradient: 'bg-gradient-to-br from-rose-500 to-red-600',
    subtitle: 'Weekly Average'
  },
  M: {
    title: 'Avg Mandatory / Week',
    icon: CheckCircle,
    gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
    subtitle: 'Weekly Average'
  },
  W: {
    title: 'Avg Work / Week',
    icon: Briefcase,
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    subtitle: 'Weekly Average'
  }
}

export default function YTDKPICards({ ytdStats }: YTDKPICardsProps) {
  const cards = CATEGORY_KEYS.filter(k => k !== '').map(cat => ({
    ...categoryConfig[cat],
    value: `${(ytdStats.categoryAverages?.[cat] || 0).toFixed(1)}h`
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={cn(
              'rounded-2xl p-3 text-white',
              card.gradient,
              'shadow hover:shadow-lg transition-shadow duration-200'
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="p-1 bg-white/20 rounded-lg">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0">
              <div className="text-xs font-medium opacity-90">{card.title}</div>
              <div className="text-xl font-bold">{card.value}</div>
              <div className="text-[10px] opacity-75">{card.subtitle}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
