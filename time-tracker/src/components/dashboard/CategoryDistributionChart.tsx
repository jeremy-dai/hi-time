import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeekStats } from '../../utils/analytics'
import { CATEGORY_LABELS } from '../../constants/colors'

interface CategoryDistributionChartProps {
  stats: WeekStats
}

const order: Array<keyof typeof CATEGORY_LABELS> = ['R', 'W', 'M', 'G', 'P']
const colors: Record<string, string> = {
  R: '#22c55e',
  W: '#f59e0b',
  M: '#ea580c',
  G: '#3b82f6',
  P: '#ef4444',
}

export default function CategoryDistributionChart({ stats }: CategoryDistributionChartProps) {
  const data = useMemo(() =>
    order.map(k => ({
      name: CATEGORY_LABELS[k],
      key: k,
      value: stats.categoryHours[k] || 0
    }))
  , [stats])

  return (
    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={colors[entry.key]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

