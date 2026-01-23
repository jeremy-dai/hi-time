import type { TimeSlotPattern } from '../../types/insights'
import { CATEGORY_KEYS } from '../../types/time'
import { cn } from '../../utils/classNames'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../../constants/colors'
import { Clock } from 'lucide-react'

interface TimeSlotAnalysisProps {
  timeSlotData: TimeSlotPattern[]
}

export default function TimeSlotAnalysis({ timeSlotData }: TimeSlotAnalysisProps) {

  if (timeSlotData.length === 0) {
    return (
      <div className={cn(
        'rounded-xl px-4 pt-3 pb-4',
        'bg-white shadow-sm'
      )}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={cn(
            'text-lg font-semibold',
            'text-gray-900'
          )}>
            Time Slot Patterns
          </h2>
          <Clock className="w-5 h-5 text-emerald-600" />
        </div>
        <p className={cn('text-sm text-gray-500')}>
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
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
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
    .map(k => CATEGORY_LABELS[k])

  // Determine peak productivity time
  const productiveCategories = ['Work', 'Productive Work']
  let peakProductiveSlot: TimeSlotPattern | null = null
  let maxProductiveBlocks = 0

  for (const slot of timeSlotData) {
    const productiveBlocks = Object.entries(slot.activityCounts)
      .filter(([cat]) => productiveCategories.includes(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]))
      .reduce((sum, [, count]) => sum + count, 0)

    if (productiveBlocks > maxProductiveBlocks) {
      maxProductiveBlocks = productiveBlocks
      peakProductiveSlot = slot
    }
  }

  return (
    <div className={cn(
      'rounded-xl px-4 pt-3 pb-4',
      'bg-white shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={cn(
          'text-lg font-semibold',
          'text-gray-900'
        )}>
          Time Slot Patterns
        </h2>
        <Clock className="w-5 h-5 text-emerald-600" />
      </div>

      {peakProductiveSlot && (
        <div className={cn(
          'mb-2 p-2 rounded-xl',
          'bg-emerald-50',
          'border border-emerald-200'
        )}>
          <p className="text-sm text-emerald-900">
            <span className="font-semibold">Peak Productivity:</span>{' '}
            {peakProductiveSlot.timeSlot} ({maxProductiveBlocks * 0.5} hours of productive work)
          </p>
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
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)} hrs` : ''}
          />
          {categories.map((category) => {
            // Find the category key for this label
            const categoryKey = Object.entries(CATEGORY_LABELS).find(
              ([, label]) => label === category
            )?.[0] as keyof typeof CATEGORY_COLORS_HEX | undefined

            const color = categoryKey ? CATEGORY_COLORS_HEX[categoryKey]?.bg : '#9ca3af'

            return (
              <Bar
                key={category}
                dataKey={category}
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
