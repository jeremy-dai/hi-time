import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateWeekData, aggregateMultiWeekData } from '../../utils/analytics'
import { generateEnhancedAnalysis } from '../../utils/enhancedAnalytics'
import { useYearMemories } from '../../hooks/useYearMemories'
import { useWeekReviews } from '../../hooks/useWeekReviews'
import { useDailyShipping } from '../../hooks/useDailyShipping'
import CategoryBreakdown from '../shared/CategoryBreakdown'
import WeeklyBreakdownChart from './WeeklyBreakdownChart'
import MultiWeekTrendChart from './MultiWeekTrendChart'
import {
  TopActivitiesBreakdown,
  ExportButton,
  ExportInfo,
  WeeklyWorkGoal,
  WeeklyRhythmHeatmap
} from '../insights'
import WeekNavigator from '../shared/WeekNavigator'
import { PageHeader } from '../layout/PageHeader'
import { cn } from '../../utils/classNames'
import { TrendingUp, BarChart3 } from 'lucide-react'
import CardHeader from '../shared/CardHeader'

interface CurrentWeekDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  weekKeys: string[] // The 4 weeks to display [newest, ..., oldest]
  dateRangeLabel: string
  selectedWeekKey: string
  onWeekChange: (weekKey: string) => void
  maxWeekKey: string
}

export default function CurrentWeekDashboard({
  weeksStore,
  weekKeys,
  dateRangeLabel,
  selectedWeekKey,
  onWeekChange,
  maxWeekKey
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
      {/* Page Header */}
      <PageHeader
        title="Trends"
        subtitle={<>
          {dateRangeLabel} • 4-week trends
        </>}
        icon={TrendingUp}
        useGradientTitle={true}
        animateIcon={true}
        actions={
          <>
            <WeekNavigator
              selectedWeekKey={selectedWeekKey}
              onWeekChange={onWeekChange}
              maxWeekKey={maxWeekKey}
              variant="emerald"
            />
            <ExportInfo reportType="trends" />
            <ExportButton
              analysis={enhancedAnalysis}
              weekRange={weekRange}
              weekReviews={weekReviews}
              dailyShipping={dailyShipping}
              memories={memories}
            />
          </>
        }
      />

      {/* LATEST WEEK SECTION */}
      <div className="space-y-6 stagger-reveal">
        {/* Category Summary and Weekly Work Goal - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <CategoryBreakdown
            categoryHours={currentStats.categoryHours}
          />
          <WeeklyWorkGoal metrics={enhancedAnalysis.latestWeek.workGoalMetrics} />
        </div>
      </div>

      {/* TRENDS & DETAILED ANALYSIS SECTION */}
      <div className="space-y-6 stagger-reveal">
        {/* 4-Week Trend and Average Daily Breakdown - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 4-Week Trend Chart - Shows progression over time */}
          <MultiWeekTrendChart multiWeekStats={multiWeekStats} />

          {/* Average Daily Breakdown - Pattern across week */}
          <div className={cn('rounded-xl p-5', 'glass-card')}>
            <CardHeader 
              title="Average Daily Breakdown (4 Weeks)" 
              icon={BarChart3}
            />
            <WeeklyBreakdownChart dailyPattern={enhancedAnalysis.trends.averageDailyPattern} />
          </div>
        </div>

        {/* Weekly Rhythm Heatmap and Top Activities - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <WeeklyRhythmHeatmap rhythmData={enhancedAnalysis.trends.weeklyRhythm} />
          <TopActivitiesBreakdown
            activities={enhancedAnalysis.trends.topActivities}
            title="Top 10 Activities (4 Weeks)"
          />
        </div>
      </div>
    </div>
  )
}
