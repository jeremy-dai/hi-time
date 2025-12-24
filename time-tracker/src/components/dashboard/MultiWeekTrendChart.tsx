import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MultiWeekStats } from '../../utils/analytics'
import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../../constants/colors'
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
        Total: Number(stats.totalHours.toFixed(1)),
        Rest: Number((stats.categoryHours['R'] || 0).toFixed(1)),
        Work: Number((stats.categoryHours['W'] || 0).toFixed(1)),
        Play: Number((stats.categoryHours['G'] || 0).toFixed(1)),
        Procrastination: Number((stats.categoryHours['P'] || 0).toFixed(1)),
        Mandatory: Number((stats.categoryHours['M'] || 0).toFixed(1))
      }
    })
  }, [multiWeekStats])

  return (
    <div className={cn('rounded-xl border p-6 min-w-0', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900 dark:text-gray-100')}>
        4-Week Trend
      </div>

      {chartData.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          No trend data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="week"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-gray-400"
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Rest"
              stroke={CATEGORY_COLORS_HEX['R'].bg}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Work"
              stroke={CATEGORY_COLORS_HEX['W'].bg}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Play"
              stroke={CATEGORY_COLORS_HEX['G'].bg}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Procrastination"
              stroke={CATEGORY_COLORS_HEX['P'].bg}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Mandatory"
              stroke={CATEGORY_COLORS_HEX['M'].bg}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Summary stats */}
      <div className={cn('mt-6 p-4 rounded-lg', 'bg-gray-50 dark:bg-gray-800/50')}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total Hours</div>
            <div className={cn('text-lg font-semibold', 'text-gray-900 dark:text-gray-100')}>
              {multiWeekStats.totalHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Avg per Week</div>
            <div className={cn('text-lg font-semibold', 'text-gray-900 dark:text-gray-100')}>
              {multiWeekStats.averagePerWeek.toFixed(1)}h
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-gray-600 dark:text-gray-400">Weeks Tracked</div>
            <div className={cn('text-lg font-semibold', 'text-gray-900 dark:text-gray-100')}>
              {multiWeekStats.weeks.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
