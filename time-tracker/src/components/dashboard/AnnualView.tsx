import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { AnnualStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface AnnualViewProps {
  annual: AnnualStats
}

export default function AnnualView({ annual }: AnnualViewProps) {
  const data = annual.monthlyTotals.map(m => ({ month: m.monthKey, hours: m.hours }))
  return (
    <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
      <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>Annual Overview</div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="hours" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

