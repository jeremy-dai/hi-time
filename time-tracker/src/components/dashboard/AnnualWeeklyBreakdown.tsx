import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { YTDStats } from '../../utils/analytics'
import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../../constants/colors'
import { CATEGORY_KEYS } from '../../types/time'
import { cn } from '../../utils/classNames'

interface AnnualWeeklyBreakdownProps {
  ytdStats: YTDStats
}

export default function AnnualWeeklyBreakdown({ ytdStats }: AnnualWeeklyBreakdownProps) {
  const chartData = useMemo(() => {
    return ytdStats.weeklyData.map(({ weekKey, hours, categoryHours }) => {
      // Format week key for display (e.g., "2025-W01" -> "W01")
      const weekLabel = weekKey.split('-W')[1] ? `W${weekKey.split('-W')[1]}` : weekKey

      return {
        week: weekLabel,
        Total: Number(hours.toFixed(1)),
        Rest: Number((categoryHours['R'] || 0).toFixed(1)),
        Work: Number((categoryHours['W'] || 0).toFixed(1)),
        Play: Number((categoryHours['G'] || 0).toFixed(1)),
        Procrastination: Number((categoryHours['P'] || 0).toFixed(1)),
        Mandatory: Number((categoryHours['M'] || 0).toFixed(1))
      }
    })
  }, [ytdStats])

  return (
    <div className={cn('rounded-3xl p-6 min-w-0', 'bg-white shadow-sm')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900')}>
        Weekly Breakdown
      </div>

      {chartData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No weekly data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
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
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            {CATEGORY_KEYS.filter(k => k !== '').map((cat) => (
              <Bar
                key={cat}
                dataKey={CATEGORY_LABELS[cat]}
                stackId="a"
                fill={CATEGORY_COLORS_HEX[cat].bg}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Summary */}
      <div className={cn('mt-6 p-4 rounded-lg', 'bg-gray-50')}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {CATEGORY_KEYS.filter(k => k !== '').map((cat) => {
            const totalCategoryHours = ytdStats.weeklyData.reduce(
              (sum, week) => sum + (week.categoryHours[cat] || 0),
              0
            )
            return (
              <div key={cat}>
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS_HEX[cat].bg }}
                  />
                  <div className="text-gray-600">{CATEGORY_LABELS[cat]}</div>
                </div>
                <div className={cn('text-lg font-semibold', 'text-gray-900')}>
                  {totalCategoryHours.toFixed(1)}h
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
