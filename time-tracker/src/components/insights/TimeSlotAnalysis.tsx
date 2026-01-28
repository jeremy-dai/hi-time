import type { TimeSlotPattern } from '../../types/insights'
import { CATEGORY_KEYS } from '../../types/time'
import { cn } from '../../utils/classNames'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategoryColor, getCategoryLabel } from '../../utils/colorHelpers'
import { Clock } from 'lucide-react'
import CardHeader from '../shared/CardHeader'
import { CHART_CONFIG } from '../../utils/chartConfig'

interface TimeSlotAnalysisProps {
  timeSlotData: TimeSlotPattern[]
}

export default function TimeSlotAnalysis({ timeSlotData }: TimeSlotAnalysisProps) {

  if (timeSlotData.length === 0) {
    return (
      <div className={cn(
        'rounded-xl p-5',
        'glass-card'
      )}>
        <CardHeader 
          title="Time Slot Patterns" 
          icon={Clock}
        />
        <p className="text-sm text-gray-500">
          No time slot data available for this period.
        </p>
      </div>
    )
  }

  // Prepare data for chart
  const chartData = timeSlotData.map(slot => {
    const total = slot.totalBlocks * 0.5 // Convert to hours
    const breakdown: Record<string, number> = {}

    for (const [category, count] of Object.entries(slot.activityCounts)) {
      const label = getCategoryLabel(category as any) || category
      breakdown[label] = count * 0.5 // Convert to hours
    }

    return {
      time: slot.timeSlot,
      total,
      ...breakdown
    }
  })

  // Get categories in fixed order that are present in the data
  const presentCategories = new Set(
    timeSlotData.flatMap(slot => Object.keys(slot.activityCounts))
  )
  const categories = CATEGORY_KEYS
    .filter(k => k !== '' && presentCategories.has(k))

  // Determine peak productivity time
  const productiveCategories = ['Work', 'Productive Work']
  let peakProductiveSlot: TimeSlotPattern | null = null
  let maxProductiveBlocks = 0

  for (const slot of timeSlotData) {
    const productiveBlocks = Object.entries(slot.activityCounts)
      .filter(([cat]) => productiveCategories.includes(getCategoryLabel(cat as any)))
      .reduce((sum, [, count]) => sum + count, 0)

    if (productiveBlocks > maxProductiveBlocks) {
      maxProductiveBlocks = productiveBlocks
      peakProductiveSlot = slot
    }
  }

  return (
    <div className={cn(
      'rounded-xl p-5',
      'glass-card'
    )}>
      <CardHeader 
        title="Time Slot Patterns (Latest Week)" 
        icon={Clock}
      />

      {peakProductiveSlot && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-600">
            <span className="font-medium text-zinc-800">Peak:</span>{' '}
            {peakProductiveSlot.timeSlot} ({maxProductiveBlocks * 0.5}h productive)
          </span>
        </div>
      )}

      <div className="flex justify-center w-full">
        <div className="w-full max-w-2xl" style={{ minWidth: 200 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -10, bottom: 5 }}
          >
          <XAxis
            dataKey="time"
            hide={true}
          />
          <YAxis
            width={25}
            tick={CHART_CONFIG.axis.tick}
            stroke={CHART_CONFIG.axis.stroke}
          />
          <Tooltip
            contentStyle={CHART_CONFIG.tooltip.contentStyle}
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)} hrs` : ''}
          />
          {categories.map((categoryKey) => {
            const label = getCategoryLabel(categoryKey)
            const color = getCategoryColor(categoryKey).bg

            return (
              <Bar
                key={categoryKey}
                dataKey={label}
                stackId="a"
                fill={color}
                radius={[4, 4, 0, 0]}
              />
            )
          })}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
