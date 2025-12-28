import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyBreakdown } from '../../types/insights'
import { CATEGORY_COLORS_HEX } from '../../constants/colors'
import { CATEGORY_KEYS } from '../../types/time'

interface WeeklyBreakdownChartProps {
  dailyPattern: DailyBreakdown[]
}

export default function WeeklyBreakdownChart({ dailyPattern }: WeeklyBreakdownChartProps) {
  const data = useMemo(() => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    // Re-order from Sunday-first to Monday-first
    const orderedData = dayOrder.map((dayName, index) => {
      const dayData = dailyPattern.find(d => d.dayName === dayName)
      if (!dayData) {
        return {
          day: dayLabels[index],
          R: 0,
          W: 0,
          M: 0,
          G: 0,
          P: 0
        }
      }

      return {
        day: dayLabels[index],
        R: dayData.categoryHours['R'] || 0,
        W: dayData.categoryHours['W'] || 0,
        M: dayData.categoryHours['M'] || 0,
        G: dayData.categoryHours['G'] || 0,
        P: dayData.categoryHours['P'] || 0
      }
    })

    return orderedData
  }, [dailyPattern])

  return (
    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis
            dataKey="day"
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
          {CATEGORY_KEYS.filter(k => k !== '').map((cat, idx, arr) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={CATEGORY_COLORS_HEX[cat].bg}
              name={cat}
              radius={idx === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
