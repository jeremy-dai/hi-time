import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeekStats } from '../../utils/analytics'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

interface WeeklyTrendChartProps {
  current: WeekStats
  previous?: WeekStats | null
}

export default function WeeklyTrendChart({ current, previous }: WeeklyTrendChartProps) {
  const data = useMemo(() =>
    DAYS.map((d, i) => ({
      day: d,
      current: current.dailyHours[i] || 0,
      previous: previous ? previous.dailyHours[i] || 0 : 0
    }))
  , [current, previous])

  return (
    <div style={{ width: '100%', height: 280, minWidth: 0 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="current" stroke="#60a5fa" strokeWidth={2} dot={false} />
          {previous && <Line type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

