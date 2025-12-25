import { Briefcase, Bed, Gamepad2, AlertCircle, CheckCircle } from 'lucide-react'
import type { YTDStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface YTDKPICardsProps {
  ytdStats: YTDStats
}

export default function YTDKPICards({ ytdStats }: YTDKPICardsProps) {
  const cards = [
    {
      title: 'Avg Rest / Week',
      value: `${(ytdStats.categoryAverages?.['R'] || 0).toFixed(1)}h`,
      icon: Bed,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      subtitle: 'Target: ~56h (8h/day)'
    },
    {
      title: 'Avg Work / Week',
      value: `${(ytdStats.categoryAverages?.['W'] || 0).toFixed(1)}h`,
      icon: Briefcase,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      subtitle: 'Weekly Average'
    },
    {
      title: 'Avg Play / Week',
      value: `${(ytdStats.categoryAverages?.['G'] || 0).toFixed(1)}h`,
      icon: Gamepad2,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      subtitle: 'Weekly Average'
    },
    {
      title: 'Avg Mandatory / Week',
      value: `${(ytdStats.categoryAverages?.['M'] || 0).toFixed(1)}h`,
      icon: CheckCircle,
      gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
      subtitle: 'Weekly Average'
    },
    {
      title: 'Avg Procrastination',
      value: `${(ytdStats.categoryAverages?.['P'] || 0).toFixed(1)}h`,
      icon: AlertCircle,
      gradient: 'bg-gradient-to-br from-rose-500 to-red-600',
      subtitle: 'Weekly Average'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={cn(
              'rounded-xl p-6 text-white',
              card.gradient,
              'shadow-lg hover:shadow-xl transition-shadow duration-200'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium opacity-90">{card.title}</div>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-xs opacity-75">{card.subtitle}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
