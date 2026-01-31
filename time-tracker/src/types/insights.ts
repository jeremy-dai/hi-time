import type { CategoryKey } from './time'
import type { WeekStats } from '../utils/analytics'

/**
 * Time slot pattern showing activity distribution by hour
 */
export interface TimeSlotPattern {
  timeSlot: string // HH:MM format (e.g., "09:00")
  activityCounts: Record<CategoryKey, number> // Count of blocks per category
  dominantActivity: CategoryKey | null // Most common activity in this slot
  totalBlocks: number // Total blocks in this time slot
}

/**
 * Specific activity with ranking and time spent
 */
export interface TopActivity {
  activity: string // Activity name (from subcategory or notes)
  type: CategoryKey // Category code (R/W/G/P/M)
  hours: number // Total hours spent
  blocks: number // Total blocks (each block = 0.5 hours)
  percentage: number // Percentage of total tracked time
}

/**
 * Executive summary of time tracking period
 */
export interface ExecutiveSummary {
  periodLabel: string // e.g., "2025-W50 to 2025-W47"
  totalHours: number // Total hours tracked in period
  totalBlocks: number // Total blocks tracked
  mostCommonActivity: string // Most frequent activity name
  mostCommonCategory: CategoryKey | null // Most frequent category
  averageHoursPerDay: number // Average hours per day
  averageHoursPerWeek: number // Average hours per week (for multi-week)
  weeksTracked: number // Number of weeks in analysis
}

/**
 * Work-life balance metrics
 */
export interface WorkLifeMetrics {
  workHours: number // W + M combined
  restHours: number // R
  playHours: number // G
  procrastinationHours: number // P
  workPercentage: number // (W + M) / total
  restPercentage: number // R / total
  playPercentage: number // G / total
  procrastinationPercentage: number // P / total
  workRestRatio: number // (W + M) / R (healthy is around 1-2)
  balanceScore: number // 0-100 score (100 = perfect balance)
}

/**
 * Procrastination analysis metrics
 */
export interface ProcrastinationMetrics {
  totalProcrastinationHours: number
  procrastinationPercentage: number
  dailyAverage: number // Average procrastination hours per day
  peakProcrastinationDay: string | null // Day with most procrastination
  peakProcrastinationTime: string | null // Time slot with most procrastination
  procrastinationTrend: 'increasing' | 'decreasing' | 'stable' // Trend over period
}

/**
 * Daily breakdown with activity distribution
 */
export interface DailyBreakdown {
  dayName: string // e.g., "Sunday", "Monday"
  dayIndex: number // 0-6 (0 = Sunday)
  totalHours: number
  categoryHours: Record<CategoryKey, number>
  dominantCategory: CategoryKey | null
}

/**
 * Comprehensive analysis result with dual perspective:
 * - Latest week for current detailed insights
 * - 4-week trends for patterns and context
 */
export interface EnhancedAnalysis {
  // Latest week analysis (detailed current insights)
  latestWeek: {
    weekKey: string
    weekStats: WeekStats
    executiveSummary: ExecutiveSummary
    categoryBreakdown: Record<CategoryKey, number>
    dailyBreakdown: DailyBreakdown[]
    topActivities: TopActivity[]
    timeSlotPatterns: TimeSlotPattern[]
    workGoalMetrics: WorkGoalMetrics
    procrastinationMetrics: ProcrastinationMetrics
  }

  // 4-week trends (aggregated patterns and comparison)
  trends: {
    weekKeys: string[]
    multiWeekComparison: WeekComparison[]
    categoryTrends: Record<CategoryKey, CategoryTrendData>
    streakMetrics: StreakMetrics
    weeklyRhythm: WeeklyRhythmData[]
    averageDailyPattern: DailyBreakdown[]
    workLifeBalance: WorkLifeMetrics
    averageWorkGoal: WorkGoalMetrics
    topActivities: TopActivity[] // Top activities across all 4 weeks
    rawWeekData: Record<string, import('./time').TimeBlock[][]> // Raw time blocks for each week
  }

  // Metadata
  generatedAt: Date
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  totalBlocks: number
  blocksWithSubcategory: number
  blocksWithNotes: number
  blocksWithDetailedInfo: number // Has either subcategory or notes
  qualityPercentage: number // Percentage with detailed info
}

/**
 * Streak tracking metrics
 */
export interface StreakMetrics {
  currentStreak: number // Current productive streak in days
  longestStreak: number // Longest streak in the period
  productiveDays: number // Number of days meeting productivity threshold
  totalDays: number // Total days in period
  productivePercentage: number // Percentage of productive days
  skippedDays: number // Days that were skipped but didn't break streak
}

/**
 * Weekly work goal metrics
 */
export interface WorkGoalMetrics {
  targetHours: number // Goal hours (default 80)
  actualHours: number // Actual work hours (W + M)
  weeklyAverage: number // Average across 4 weeks
  goalPercentage: number // Actual / target * 100
  status: 'excellent' | 'good' | 'acceptable' | 'review' | 'concern'
  delta: number // Difference from target
}

/**
 * Weekly rhythm heatmap data point
 */
export interface WeeklyRhythmData {
  day: string // Day name (Monday, Tuesday, etc.)
  dayIndex: number // 0-6 (0 = Monday for display purposes)
  timeSlot: string // e.g., "6-8am", "8-10am"
  timeSlotStart: number // Hour (6, 8, 10, etc.)
  averageHours: number // Average hours in this slot across 4 weeks
  categoryBreakdown: Record<CategoryKey, number> // Hours per category
  dominantCategory: CategoryKey | null
}

/**
 * Single week comparison data
 */
export interface WeekComparison {
  weekKey: string
  weekLabel: string // e.g., "W50"
  categoryHours: Record<CategoryKey, number>
  totalHours: number
  dailyBreakdown: DailyBreakdown[] // Daily breakdown for this week
}

/**
 * Category trend analysis
 */
export interface CategoryTrendData {
  category: CategoryKey
  weeks: number[] // Hours for each week [week1, week2, week3, week4]
  average: number
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercentage: number // % change from first to last week
}
