import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyBreakdown } from '../../types/insights'
import { CATEGORY_COLORS_HEX } from '../../constants/colors'

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
          <Bar dataKey="R" stackId="a" fill={CATEGORY_COLORS_HEX.R.bg} name="R" radius={[0, 0, 0, 0]} />
          <Bar dataKey="W" stackId="a" fill={CATEGORY_COLORS_HEX.W.bg} name="W" radius={[0, 0, 0, 0]} />
          <Bar dataKey="M" stackId="a" fill={CATEGORY_COLORS_HEX.M.bg} name="M" radius={[0, 0, 0, 0]} />
          <Bar dataKey="G" stackId="a" fill={CATEGORY_COLORS_HEX.G.bg} name="G" radius={[0, 0, 0, 0]} />
          <Bar dataKey="P" stackId="a" fill={CATEGORY_COLORS_HEX.P.bg} name="P" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
