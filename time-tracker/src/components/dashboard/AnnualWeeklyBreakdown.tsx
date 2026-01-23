import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { YTDStats } from '../../utils/analytics'
import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../../constants/colors'
import { CATEGORY_KEYS } from '../../types/time'
import { cn } from '../../utils/classNames'

interface AnnualWeeklyBreakdownProps {
  ytdStats: YTDStats
  weekThemes: Record<string, string>
  onUpdateTheme: (weekKey: string, theme: string) => Promise<void>
}

export default function AnnualWeeklyBreakdown({ ytdStats, weekThemes, onUpdateTheme }: AnnualWeeklyBreakdownProps) {
  const [editingWeek, setEditingWeek] = useState<string | null>(null)
  const [editingTheme, setEditingTheme] = useState('')

  const chartData = useMemo(() => {
    return ytdStats.weeklyData.map(({ weekKey, categoryHours }) => {
      // Format week key for display (e.g., "2025-W01" -> "01")
      const weekLabel = weekKey.split('-W')[1] || weekKey

      // Convert category hours to pomodoro counts (1 pomodoro = 0.5 hours)
      const categoryPomodoros: Record<string, number> = {}
      Object.entries(categoryHours).forEach(([cat, hours]) => {
        categoryPomodoros[cat] = Math.round(hours * 2)
      })

      return {
        week: weekLabel,
        weekKey,
        Rest: categoryPomodoros['R'] || 0,
        Work: categoryPomodoros['W'] || 0,
        Play: categoryPomodoros['G'] || 0,
        Procrastination: categoryPomodoros['P'] || 0,
        Mandatory: categoryPomodoros['M'] || 0
      }
    })
  }, [ytdStats])

  const handleThemeClick = (weekKey: string, currentTheme: string) => {
    setEditingWeek(weekKey)
    setEditingTheme(currentTheme)
  }

  const handleThemeSave = (weekKey: string) => {
    onUpdateTheme(weekKey, editingTheme.trim())
    setEditingWeek(null)
    setEditingTheme('')
  }

  const handleThemeKeyDown = (e: React.KeyboardEvent, weekKey: string) => {
    if (e.key === 'Enter') {
      handleThemeSave(weekKey)
    } else if (e.key === 'Escape') {
      setEditingWeek(null)
      setEditingTheme('')
    }
  }

  // Custom X-axis tick with theme display
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props
    const weekData = chartData.find(d => d.week === payload.value)
    if (!weekData) return null

    const theme = weekThemes[weekData.weekKey] || ''
    const displayTheme = theme.substring(0, 2) // First 2 characters
    const isEditing = editingWeek === weekData.weekKey

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="11"
        >
          {payload.value}
        </text>
        {isEditing ? (
          <foreignObject x={-20} y={22} width={40} height={24}>
            <input
              type="text"
              value={editingTheme}
              onChange={(e) => setEditingTheme(e.target.value)}
              onBlur={() => handleThemeSave(weekData.weekKey)}
              onKeyDown={(e) => handleThemeKeyDown(e, weekData.weekKey)}
              autoFocus
              maxLength={20}
              className="w-full h-full text-xs text-center border border-emerald-500 rounded px-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              style={{ fontSize: '10px' }}
            />
          </foreignObject>
        ) : (
          <text
            x={0}
            y={32}
            textAnchor="middle"
            fill={theme ? '#3b82f6' : '#d1d5db'}
            fontSize="10"
            fontWeight={theme ? '600' : '400'}
            className="cursor-pointer"
            onClick={() => handleThemeClick(weekData.weekKey, theme)}
            style={{ cursor: 'pointer' }}
          >
            {displayTheme || '+'}
          </text>
        )}
      </g>
    )
  }

  // Calculate optimal width: 50px per bar + spacing, max 60px per bar
  // This ensures bars don't get too wide on wide screens
  const optimalBarWidth = 50
  const barSpacing = 10
  const totalBarWidth = (optimalBarWidth + barSpacing) * chartData.length
  const chartPadding = 80 // Y-axis + padding
  const chartWidth = Math.min(totalBarWidth + chartPadding, 2000)
  const needsScroll = chartWidth > 1200

  return (
    <div className={cn('rounded-xl p-6 min-w-0', 'bg-white shadow-sm')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900')}>
        Weekly Breakdown
      </div>

      {chartData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No weekly data available
        </div>
      ) : (
        <div className={cn('overflow-y-visible', needsScroll ? 'overflow-x-auto' : 'overflow-x-hidden')}>
          <div style={{ width: needsScroll ? '100%' : chartWidth, minWidth: needsScroll ? chartWidth : 200 }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} barCategoryGap="15%" maxBarSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                stroke="#6b7280"
                tick={<CustomXAxisTick />}
                height={60}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              {CATEGORY_KEYS.filter(k => k !== '').map((cat) => (
                <Bar
                  key={cat}
                  dataKey={CATEGORY_LABELS[cat]}
                  stackId="a"
                  fill={CATEGORY_COLORS_HEX[cat].bg}
                  label={(props: any) => {
                    const { x, y, width, height, index } = props

                    // Get the actual individual value from the data
                    const dataPoint = chartData[index]
                    const actualValue = dataPoint?.[CATEGORY_LABELS[cat]] || 0

                    // Only show label if segment is tall enough (at least 20px) and value >= 10 pomodoros
                    if (!actualValue || actualValue < 10 || height < 20) return null

                    return (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                      >
                        {actualValue}
                      </text>
                    )
                  }}
                />
              ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
