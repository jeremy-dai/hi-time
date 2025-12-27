import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MultiWeekStats } from '../../utils/analytics'
import { CATEGORY_COLORS_HEX } from '../../constants/colors'
import { cn } from '../../utils/classNames'

interface MultiWeekTrendChartProps {
  multiWeekStats: MultiWeekStats
}

export default function MultiWeekTrendChart({ multiWeekStats }: MultiWeekTrendChartProps) {
  const chartData = useMemo(() => {
    return multiWeekStats.weeks.map(({ weekKey, stats }) => {
      // Format week key for display (e.g., "2025-W50" -> "W50")
      const weekLabel = weekKey.split('-W')[1] ? `W${weekKey.split('-W')[1]}` : weekKey

      return {
        week: weekLabel,
        Rest: Number((stats.categoryHours['R'] || 0).toFixed(1)),
        Work: Number((stats.categoryHours['W'] || 0).toFixed(1)),
        Play: Number((stats.categoryHours['G'] || 0).toFixed(1)),
        Procrastination: Number((stats.categoryHours['P'] || 0).toFixed(1)),
        Mandatory: Number((stats.categoryHours['M'] || 0).toFixed(1))
      }
    })
  }, [multiWeekStats])

  return (
    <div className={cn('rounded-3xl p-6 min-w-0', 'bg-white shadow-sm')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900')}>
        4-Week Trend
      </div>

      {chartData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No trend data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="week"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }}
              labelStyle={{ color: '#111827', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="Rest"
              stroke={CATEGORY_COLORS_HEX['R'].bg}
              strokeWidth={4}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Work"
              stroke={CATEGORY_COLORS_HEX['W'].bg}
              strokeWidth={4}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Play"
              stroke={CATEGORY_COLORS_HEX['G'].bg}
              strokeWidth={4}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Procrastination"
              stroke={CATEGORY_COLORS_HEX['P'].bg}
              strokeWidth={4}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Mandatory"
              stroke={CATEGORY_COLORS_HEX['M'].bg}
              strokeWidth={4}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
