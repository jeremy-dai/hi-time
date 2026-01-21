import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateWeekData, aggregateMultiWeekData } from '../../utils/analytics'
import { generateEnhancedAnalysis } from '../../utils/enhancedAnalytics'
import { useYearMemories } from '../../hooks/useYearMemories'
import { useWeekReviews } from '../../hooks/useWeekReviews'
import { useDailyShipping } from '../../hooks/useDailyShipping'
import KPICards from './KPICards'
import WeeklyBreakdownChart from './WeeklyBreakdownChart'
import MultiWeekTrendChart from './MultiWeekTrendChart'
import {
  TimeSlotAnalysis,
  TopActivitiesBreakdown,
  ExportButton,
  ExportInfo,
  WeeklyWorkGoal,
  WeeklyRhythmHeatmap
} from '../insights'
import { cn } from '../../utils/classNames'
import { CalendarRange } from 'lucide-react'

interface CurrentWeekDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  weekKeys: string[] // The 4 weeks to display [newest, ..., oldest]
  dateRangeLabel: string
}

export default function CurrentWeekDashboard({
  weeksStore,
  weekKeys,
  dateRangeLabel
}: CurrentWeekDashboardProps) {
  // Most recent completed week (the first one in the list)
  const displayWeekKey = weekKeys[0]
  const displayWeekData = useMemo(() => weeksStore[displayWeekKey] || [], [weeksStore, displayWeekKey])

  // Extract year from the display week key for data fetching
  const year = useMemo(() => {
    if (!displayWeekKey) return new Date().getFullYear()
    const match = displayWeekKey.match(/^(\d{4})-/)
    return match ? parseInt(match[1]) : new Date().getFullYear()
  }, [displayWeekKey])

  // Fetch supplementary data for export
  const { memories } = useYearMemories(year)
  const { reviews: weekReviews } = useWeekReviews(year)
  const { entries: dailyShippingEntries } = useDailyShipping(year)

  // Current/display week stats
  const currentStats = useMemo(() => aggregateWeekData(displayWeekData), [displayWeekData])

  // Multi-week stats for trend chart
  const multiWeekStats = useMemo(() => {
    return aggregateMultiWeekData(weeksStore, weekKeys)
  }, [weeksStore, weekKeys])

  // Enhanced analysis for insights (dual perspective)
  const enhancedAnalysis = useMemo(() => {
    return generateEnhancedAnalysis(displayWeekData, currentStats, weeksStore, weekKeys)
  }, [displayWeekData, currentStats, weeksStore, weekKeys])

  // Calculate 4-week average for KPI cards
  const fourWeekAverage = useMemo(() => {
    const avg: Record<string, number> = {}
    for (const comparison of enhancedAnalysis.trends.multiWeekComparison) {
      for (const [cat, hours] of Object.entries(comparison.categoryHours)) {
        avg[cat] = (avg[cat] || 0) + hours
      }
    }
    // Divide by number of weeks to get average
    for (const cat in avg) {
      avg[cat] = avg[cat] / weekKeys.length
    }
    return avg
  }, [enhancedAnalysis.trends.multiWeekComparison, weekKeys.length])

  // Week range for export filename
  const weekRange = weekKeys.length > 1
    ? `${weekKeys[0]}-to-${weekKeys[weekKeys.length - 1]}`
    : weekKeys[0] || 'unknown'

  // Convert daily shipping entries to DailyShipping format
  const dailyShipping = useMemo(() => {
    const shipping: Record<string, any> = {}
    Object.entries(dailyShippingEntries).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const [y, m, d] = key.split('-').map(Number)
        shipping[key] = {
          year: y,
          month: m,
          day: d,
          shipped: value,
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      } else {
        const [y, m, d] = key.split('-').map(Number)
        shipping[key] = {
          year: y,
          month: m,
          day: d,
          shipped: value.shipped,
          completed: value.completed,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
    })
    return shipping
  }, [dailyShippingEntries])

  return (
    <div className="space-y-6">
      {/* Analysis Period Banner with Export Button */}
      <div className={cn(
        'rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0',
        'bg-emerald-50 text-emerald-900'
      )}>
        <div className="flex items-center space-x-3">
          <CalendarRange className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">
              Analysis Period: {dateRangeLabel}
            </h3>
            <p className="text-xs mt-0.5 opacity-90">
              Latest week: <span className="font-semibold">{displayWeekKey}</span> • 4-week trends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <ExportInfo reportType="trends" />
          <ExportButton
            analysis={enhancedAnalysis}
            weekRange={weekRange}
            weekReviews={weekReviews}
            dailyShipping={dailyShipping}
            memories={memories}
          />
        </div>
      </div>

      {/* LATEST WEEK SECTION */}
      <div>
        <h2 className={cn('text-lg font-bold mb-4', 'text-gray-700')}>
          📊 Latest Week Overview
        </h2>

        <div className="space-y-6">
          {/* Category Summary and Weekly Work Goal - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <KPICards
              latestWeekStats={currentStats}
              fourWeekAverage={fourWeekAverage as any}
            />
            <WeeklyWorkGoal metrics={enhancedAnalysis.latestWeek.workGoalMetrics} />
          </div>

          {/* Top Activities (latest week) - Most actionable insight */}
          <TopActivitiesBreakdown activities={enhancedAnalysis.latestWeek.topActivities} />
        </div>
      </div>

      {/* TRENDS & DETAILED ANALYSIS SECTION */}
      <div>
        <h2 className={cn('text-lg font-bold mb-4', 'text-gray-700')}>
          📈 Trends & Detailed Analysis
        </h2>

        <div className="space-y-6">
          {/* 4-Week Trend and Average Daily Breakdown - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* 4-Week Trend Chart - Shows progression over time */}
            <MultiWeekTrendChart multiWeekStats={multiWeekStats} />

            {/* Average Daily Breakdown - Pattern across week */}
            <div className={cn('rounded-xl p-6', 'bg-white shadow-sm')}>
              <div className={cn('text-lg font-semibold mb-3', 'text-gray-900')}>
                Average Daily Breakdown (4 Weeks)
              </div>
              <WeeklyBreakdownChart dailyPattern={enhancedAnalysis.trends.averageDailyPattern} />
            </div>
          </div>

          {/* Weekly Rhythm Heatmap and Time Slot Patterns - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <WeeklyRhythmHeatmap rhythmData={enhancedAnalysis.trends.weeklyRhythm} />
            <TimeSlotAnalysis timeSlotData={enhancedAnalysis.latestWeek.timeSlotPatterns} />
          </div>
        </div>
      </div>
    </div>
  )
}
