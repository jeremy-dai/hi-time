import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeekStats } from '../../utils/analytics'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX } from '../../constants/colors'

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
    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="R" stackId="a" fill={CATEGORY_COLORS_HEX.R.bg} name={CATEGORY_LABELS.R} />
          <Bar dataKey="W" stackId="a" fill={CATEGORY_COLORS_HEX.W.bg} name={CATEGORY_LABELS.W} />
          <Bar dataKey="M" stackId="a" fill={CATEGORY_COLORS_HEX.M.bg} name={CATEGORY_LABELS.M} />
          <Bar dataKey="G" stackId="a" fill={CATEGORY_COLORS_HEX.G.bg} name={CATEGORY_LABELS.G} />
          <Bar dataKey="P" stackId="a" fill={CATEGORY_COLORS_HEX.P.bg} name={CATEGORY_LABELS.P} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

