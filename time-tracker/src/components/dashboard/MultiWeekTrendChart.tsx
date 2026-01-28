import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MultiWeekStats } from '../../utils/analytics'
import { getCategoryColor } from '../../utils/colorHelpers'
import { cn } from '../../utils/classNames'
import { TrendingUp } from 'lucide-react'
import CardHeader from '../shared/CardHeader'
import { CHART_CONFIG } from '../../utils/chartConfig'

interface MultiWeekTrendChartProps {
  multiWeekStats: MultiWeekStats
}

export default function MultiWeekTrendChart({ multiWeekStats }: MultiWeekTrendChartProps) {

  const chartData = useMemo(() => {
    // Reverse the weeks array to show oldest to newest (left to right)
    return multiWeekStats.weeks.slice().reverse().map(({ weekKey, stats }) => {
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
    <div className={cn('rounded-xl p-6 min-w-0', 'bg-white shadow-sm')}>
      <CardHeader 
        title="4-Week Trend" 
        icon={TrendingUp}
      />

      {chartData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No trend data available
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <div style={{ width: '100%', maxWidth: '700px', minWidth: 200 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
          <CartesianGrid strokeDasharray={CHART_CONFIG.grid.strokeDasharray} stroke={CHART_CONFIG.grid.stroke} />
          <XAxis
            dataKey="week"
            stroke={CHART_CONFIG.axis.stroke}
            tick={CHART_CONFIG.axis.tick}
          />
          <YAxis
            stroke={CHART_CONFIG.axis.stroke}
            tick={CHART_CONFIG.axis.tick}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: CHART_CONFIG.axis.label.fill }}
          />
          <Tooltip
            contentStyle={CHART_CONFIG.tooltip.contentStyle}
            labelStyle={CHART_CONFIG.tooltip.labelStyle}
          />
          <Line
            type="monotone"
            dataKey="Rest"
            stroke={getCategoryColor('R').bg}
            strokeWidth={4}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Work"
            stroke={getCategoryColor('W').bg}
            strokeWidth={4}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Play"
            stroke={getCategoryColor('G').bg}
            strokeWidth={4}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Procrastination"
            stroke={getCategoryColor('P').bg}
            strokeWidth={4}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Mandatory"
            stroke={getCategoryColor('M').bg}
            strokeWidth={4}
            dot={{ r: 4 }}
          />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
