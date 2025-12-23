import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeekStats } from '../../utils/analytics'
import { CATEGORY_LABELS } from '../../constants/colors'

interface WeeklyBreakdownChartProps {
  stats: WeekStats
}

export default function WeeklyBreakdownChart({ stats }: WeeklyBreakdownChartProps) {
  const data = useMemo(() =>
    stats.dailyByCategory
      ? Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
          R: stats.dailyByCategory[i]?.R || 0,
          W: stats.dailyByCategory[i]?.W || 0,
          M: stats.dailyByCategory[i]?.M || 0,
          G: stats.dailyByCategory[i]?.G || 0,
          P: stats.dailyByCategory[i]?.P || 0,
        }))
      : []
  , [stats])

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="R" stackId="a" fill="#22c55e" name={CATEGORY_LABELS.R} />
          <Bar dataKey="W" stackId="a" fill="#f59e0b" name={CATEGORY_LABELS.W} />
          <Bar dataKey="M" stackId="a" fill="#ea580c" name={CATEGORY_LABELS.M} />
          <Bar dataKey="G" stackId="a" fill="#3b82f6" name={CATEGORY_LABELS.G} />
          <Bar dataKey="P" stackId="a" fill="#ef4444" name={CATEGORY_LABELS.P} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

