import { Clock, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import type { YTDStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface YTDKPICardsProps {
  ytdStats: YTDStats
}

export default function YTDKPICards({ ytdStats }: YTDKPICardsProps) {
  const cards = [
    {
      title: 'Total YTD Hours',
      value: `${ytdStats.totalHours.toFixed(1)}h`,
      icon: Clock,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      subtitle: `Across ${ytdStats.totalWeeks} weeks`
    },
    {
      title: 'Average per Week',
      value: `${ytdStats.averagePerWeek.toFixed(1)}h`,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-green-500 to-green-600',
      subtitle: 'Weekly average'
    },
    {
      title: 'Highest Week',
      value: ytdStats.highestWeek ? `${ytdStats.highestWeek.hours.toFixed(1)}h` : 'N/A',
      icon: ArrowUp,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      subtitle: ytdStats.highestWeek ? ytdStats.highestWeek.weekKey.split('-W')[1] ? `Week ${ytdStats.highestWeek.weekKey.split('-W')[1]}` : ytdStats.highestWeek.weekKey : 'No data'
    },
    {
      title: 'Lowest Week',
      value: ytdStats.lowestWeek ? `${ytdStats.lowestWeek.hours.toFixed(1)}h` : 'N/A',
      icon: ArrowDown,
      gradient: 'bg-gradient-to-br from-amber-500 to-amber-600',
      subtitle: ytdStats.lowestWeek ? ytdStats.lowestWeek.weekKey.split('-W')[1] ? `Week ${ytdStats.lowestWeek.weekKey.split('-W')[1]}` : ytdStats.lowestWeek.weekKey : 'No data'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
