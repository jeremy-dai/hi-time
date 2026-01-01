import type { EnhancedAnalysis } from '../types/insights'
import type { TimeBlock, WeekReview, DailyShipping } from '../types/time'
import { CATEGORY_KEYS } from '../types/time'
import { CATEGORY_LABELS } from '../constants/colors'

/**
 * Generate complete markdown report with dual perspective:
 * - Latest week for detailed current insights
 * - 4-week trends for context and patterns
 * - Optional weekly reviews for reflections
 * - Optional daily shipping for accountability
 */
export function generateTrendsReport(
  analysis: EnhancedAnalysis,
  weekReviews?: Record<number, WeekReview>,
  dailyShipping?: Record<string, DailyShipping>
): string {
  const sections: string[] = []

  // Title
  const latestWeek = analysis.latestWeek.weekKey
  const oldestWeek = analysis.trends.weekKeys[analysis.trends.weekKeys.length - 1]
  sections.push(`# Time Analysis Report: ${latestWeek} (Latest Week) + ${oldestWeek} to ${latestWeek} (4-Week Trends)`)
  sections.push('')
  sections.push(`*Generated: ${analysis.generatedAt.toLocaleString()}*`)
  sections.push('')

  // ========== PART 1: LATEST WEEK ANALYSIS ==========
  sections.push('---')
  sections.push('')
  sections.push('# 📊 Part 1: Latest Week Analysis')
  sections.push('')
  sections.push(`## Week: ${latestWeek}`)
  sections.push('')

  // Latest Week Executive Summary
  sections.push(formatLatestWeekSummary(analysis))
  sections.push('')

  // Latest Week Category Breakdown
  sections.push(formatLatestWeekCategories(analysis))
  sections.push('')

  // Latest Week Daily Breakdown
  sections.push(formatLatestWeekDaily(analysis))
  sections.push('')

  // Latest Week Top Activities
  sections.push(formatLatestWeekActivities(analysis))
  sections.push('')

  // Latest Week Time Slots
  sections.push(formatLatestWeekTimeSlots(analysis))
  sections.push('')

  // Latest Week Work Goal
  sections.push(formatLatestWeekWorkGoal(analysis))
  sections.push('')

  // Latest Week Procrastination
  sections.push(formatLatestWeekProcrastination(analysis))
  sections.push('')

  // ========== PART 2: 4-WEEK TRENDS ==========
  sections.push('---')
  sections.push('')
  sections.push('# 📈 Part 2: 4-Week Trends & Patterns')
  sections.push('')
  sections.push(`## Period: ${oldestWeek} to ${latestWeek}`)
  sections.push('')

  // Multi-Week Comparison Table
  sections.push(formatMultiWeekComparison(analysis))
  sections.push('')

  // Four Weeks Raw Data
  sections.push(formatFourWeeksRawData(analysis))
  sections.push('')

  // Category Trends
  sections.push(formatCategoryTrends(analysis))
  sections.push('')

  // Streak Metrics
  sections.push(formatStreakMetrics(analysis))
  sections.push('')

  // Weekly Rhythm Summary
  sections.push(formatWeeklyRhythmSummary(analysis))
  sections.push('')

  // Average Daily Pattern
  sections.push(formatAverageDailyPattern(analysis))
  sections.push('')

  // ========== WEEKLY REVIEWS ==========
  if (weekReviews && Object.keys(weekReviews).length > 0) {
    sections.push('---')
    sections.push('')
    sections.push(formatWeeklyReviews(analysis, weekReviews))
    sections.push('')
  }

  // ========== DAILY SHIPPING ==========
  if (dailyShipping && Object.keys(dailyShipping).length > 0) {
    sections.push('---')
    sections.push('')
    sections.push(formatDailyShippingForWeek(analysis, dailyShipping))
    sections.push('')
  }

  // ========== INSIGHTS CONTEXT FOR AI ==========
  sections.push('---')
  sections.push('')
  sections.push(formatInsightsContext(analysis))
  sections.push('')

  return sections.join('\n')
}

// ========== LATEST WEEK FORMATTERS ==========

function formatLatestWeekSummary(analysis: EnhancedAnalysis): string {
  const { executiveSummary, weekStats } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Executive Summary')
  lines.push('')
  lines.push(`**Week:** ${analysis.latestWeek.weekKey}`)
  lines.push(`**Total Hours:** ${weekStats.totalHours.toFixed(1)} hours`)
  lines.push(`**Total Blocks:** ${Math.round(weekStats.totalHours * 2)} blocks`)
  lines.push(`**Average per Day:** ${(weekStats.totalHours / 7).toFixed(1)} hours`)
  lines.push(`**Most Common Activity:** ${executiveSummary.mostCommonActivity}`)
  lines.push('')

  return lines.join('\n')
}

function formatLatestWeekCategories(analysis: EnhancedAnalysis): string {
  const { categoryBreakdown } = analysis.latestWeek
  const { weekStats } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Category Breakdown')
  lines.push('')
  lines.push('| Category | Hours | Blocks | Percentage |')
  lines.push('|----------|-------|--------|------------|')

  const categories = Object.entries(categoryBreakdown)
    .filter(([_, hours]) => hours > 0)
    .sort(([, a], [, b]) => b - a)

  for (const [category, hours] of categories) {
    const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
    const blocks = Math.round(hours * 2)
    const percentage = weekStats.totalHours > 0 ? ((hours / weekStats.totalHours) * 100).toFixed(1) : '0.0'
    lines.push(`| ${label} | ${hours.toFixed(1)} | ${blocks} | ${percentage}% |`)
  }

  lines.push('')

  return lines.join('\n')
}

function formatLatestWeekDaily(analysis: EnhancedAnalysis): string {
  const { dailyBreakdown } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Daily Breakdown')
  lines.push('')

  for (const day of dailyBreakdown) {
    if (day.totalHours === 0) continue

    lines.push(`### ${day.dayName} (${day.totalHours.toFixed(1)} hours)`)
    lines.push('')

    const categories = Object.entries(day.categoryHours)
      .filter(([_, hours]) => hours > 0)
      .sort(([, a], [, b]) => b - a)

    for (const [category, hours] of categories) {
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
      const percentage = day.totalHours > 0 ? ((hours / day.totalHours) * 100).toFixed(0) : '0'
      lines.push(`- **${label}:** ${hours.toFixed(1)} hours (${percentage}%)`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

function formatLatestWeekActivities(analysis: EnhancedAnalysis): string {
  const { topActivities } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Top 10 Activities')
  lines.push('')

  if (topActivities.length === 0) {
    lines.push('*No detailed activity data available.*')
    lines.push('')
    return lines.join('\n')
  }

  lines.push('| Rank | Activity | Type | Hours | % |')
  lines.push('|------|----------|------|-------|---|')

  topActivities.forEach((activity, index) => {
    const rank = index + 1
    const label = CATEGORY_LABELS[activity.type] || activity.type
    lines.push(
      `| ${rank} | ${activity.activity} | ${label} | ${activity.hours.toFixed(1)} | ${activity.percentage.toFixed(1)}% |`
    )
  })

  lines.push('')

  return lines.join('\n')
}

function formatLatestWeekTimeSlots(analysis: EnhancedAnalysis): string {
  const { timeSlotPatterns } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Time Slot Patterns')
  lines.push('')

  if (timeSlotPatterns.length === 0) {
    lines.push('*No time slot data available.*')
    lines.push('')
    return lines.join('\n')
  }

  // Group by time periods
  const morning = timeSlotPatterns.filter(p => {
    const hour = parseInt(p.timeSlot.split(':')[0])
    return hour >= 6 && hour < 12
  })

  const afternoon = timeSlotPatterns.filter(p => {
    const hour = parseInt(p.timeSlot.split(':')[0])
    return hour >= 12 && hour < 18
  })

  const evening = timeSlotPatterns.filter(p => {
    const hour = parseInt(p.timeSlot.split(':')[0])
    return hour >= 18 && hour < 24
  })

  if (morning.length > 0) {
    lines.push('### Morning (6:00 AM - 12:00 PM)')
    lines.push('')
    lines.push(...formatTimeSlotPeriod(morning))
    lines.push('')
  }

  if (afternoon.length > 0) {
    lines.push('### Afternoon (12:00 PM - 6:00 PM)')
    lines.push('')
    lines.push(...formatTimeSlotPeriod(afternoon))
    lines.push('')
  }

  if (evening.length > 0) {
    lines.push('### Evening (6:00 PM - 12:00 AM)')
    lines.push('')
    lines.push(...formatTimeSlotPeriod(evening))
    lines.push('')
  }

  return lines.join('\n')
}

function formatTimeSlotPeriod(patterns: Array<{
  timeSlot: string
  activityCounts: Record<string, number>
  dominantActivity: string | null
  totalBlocks: number
}>): string[] {
  const lines: string[] = []
  const activityCounts: Record<string, number> = {}

  for (const pattern of patterns) {
    for (const [category, count] of Object.entries(pattern.activityCounts)) {
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
      activityCounts[label] = (activityCounts[label] || 0) + (count as number)
    }
  }

  const sorted = Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  if (sorted.length > 0) {
    lines.push('**Dominant Activities:**')
    for (const [activity, count] of sorted) {
      const hours = (count * 0.5).toFixed(1)
      lines.push(`- ${activity}: ${hours} hours`)
    }
  }

  return lines
}

function formatLatestWeekWorkGoal(analysis: EnhancedAnalysis): string {
  const { workGoalMetrics } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Work Goal Progress')
  lines.push('')
  lines.push(`**Target:** ${workGoalMetrics.targetHours} hours/week`)
  lines.push(`**Actual:** ${workGoalMetrics.actualHours.toFixed(1)} hours (Work only)`)
  lines.push(`**Progress:** ${workGoalMetrics.goalPercentage.toFixed(1)}%`)
  lines.push(`**Status:** ${workGoalMetrics.status.charAt(0).toUpperCase() + workGoalMetrics.status.slice(1)}`)
  lines.push(`**Delta:** ${workGoalMetrics.delta >= 0 ? '+' : ''}${workGoalMetrics.delta.toFixed(1)} hours`)
  lines.push('')
  lines.push(`*4-Week Average: ${workGoalMetrics.weeklyAverage.toFixed(1)} hours/week*`)
  lines.push('')

  return lines.join('\n')
}

function formatLatestWeekProcrastination(analysis: EnhancedAnalysis): string {
  const { procrastinationMetrics } = analysis.latestWeek
  const lines: string[] = []

  lines.push('## Procrastination Analysis')
  lines.push('')
  lines.push(`**Total:** ${procrastinationMetrics.totalProcrastinationHours.toFixed(1)} hours (${procrastinationMetrics.procrastinationPercentage.toFixed(1)}%)`)
  lines.push(`**Daily Average:** ${procrastinationMetrics.dailyAverage.toFixed(1)} hours/day`)

  if (procrastinationMetrics.peakProcrastinationDay) {
    lines.push(`**Peak Day:** ${procrastinationMetrics.peakProcrastinationDay}`)
  }

  if (procrastinationMetrics.peakProcrastinationTime) {
    lines.push(`**Peak Time:** ${procrastinationMetrics.peakProcrastinationTime}`)
  }

  lines.push('')

  return lines.join('\n')
}

// ========== 4-WEEK TRENDS FORMATTERS ==========

function formatMultiWeekComparison(analysis: EnhancedAnalysis): string {
  const { multiWeekComparison } = analysis.trends
  const lines: string[] = []

  lines.push('## Week-by-Week Comparison')
  lines.push('')

  const categoryHeaders = CATEGORY_KEYS.filter(k => k !== '').map(k => CATEGORY_LABELS[k])
  lines.push(`| Week | ${categoryHeaders.join(' | ')} | Total |`)
  lines.push(`|------|${categoryHeaders.map(() => '------').join('|')}|-------|`)

  for (const week of multiWeekComparison) {
    const categoryValues = CATEGORY_KEYS.filter(k => k !== '').map(k => (week.categoryHours[k] || 0).toFixed(1))
    lines.push(`| ${week.weekLabel} | ${categoryValues.join(' | ')} | ${week.totalHours.toFixed(1)} |`)
  }

  lines.push('')

  return lines.join('\n')
}

function formatFourWeeksRawData(analysis: EnhancedAnalysis): string {
  const { multiWeekComparison, rawWeekData } = analysis.trends
  const lines: string[] = []

  lines.push('## Four Weeks Raw Data')
  lines.push('')
  lines.push('### Detailed Time Table by Week')
  lines.push('')

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  // Map display order (Sun..Sat) to day indices (6, 0, 1, 2, 3, 4, 5)
  const dayIndices = [6, 0, 1, 2, 3, 4, 5]

  // Process each week
  for (const week of multiWeekComparison) {
    const weekData = rawWeekData[week.weekKey]
    if (!weekData || weekData.length === 0) continue

    lines.push(`#### Week ${week.weekLabel} (${week.weekKey})`)
    lines.push('')

    // Get time slots from the first day
    const timeSlots = weekData[0]?.map(block => block.time) || []
    if (timeSlots.length === 0) continue

    // Create header row
    lines.push('| Time | ' + DAY_NAMES.join(' | ') + ' |')
    lines.push('|------|' + DAY_NAMES.map(() => '------').join('|') + '|')

    // For each time slot, show activities for each day
    for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
      const timeSlot = timeSlots[timeIndex]
      const row: string[] = [timeSlot]

      for (let i = 0; i < 7; i++) {
        const day = dayIndices[i]
        const block = weekData[day]?.[timeIndex]
        
        if (block && block.category) {
          // Format: Category:Activity or Category:Activity:Notes
          let cell = block.category + ':'
          
          // Add activity name (subcategory or notes)
          const activityName = extractActivityNameFromBlock(block)
          if (activityName) {
            cell += activityName
          }
          
          // Add notes if different from activity name
          if (block.notes && block.notes.trim() && block.notes !== activityName) {
            if (activityName) {
              cell += ':'
            }
            cell += block.notes
          }
          
          row.push(cell)
        } else {
          row.push('')
        }
      }

      lines.push('| ' + row.join(' | ') + ' |')
    }

    lines.push('')
    lines.push(`**Week Total:** ${week.totalHours.toFixed(1)} hours`)
    lines.push('')
  }

  return lines.join('\n')
}

function extractActivityNameFromBlock(block: TimeBlock): string {
  // Try subcategory first
  if (block.subcategory) {
    if (typeof block.subcategory === 'object' && 'name' in block.subcategory) {
      return block.subcategory.name
    }
    if (typeof block.subcategory === 'string' && block.subcategory.trim()) {
      return block.subcategory
    }
  }
  
  // Fall back to notes if no subcategory
  if (block.notes && block.notes.trim()) {
    return block.notes
  }
  
  return ''
}

function formatCategoryTrends(analysis: EnhancedAnalysis): string {
  const { categoryTrends } = analysis.trends
  const lines: string[] = []

  lines.push('## Category Trends')
  lines.push('')

  for (const cat of CATEGORY_KEYS.filter(k => k !== '')) {
    const trend = categoryTrends[cat]
    if (!trend) continue

    const label = CATEGORY_LABELS[cat]
    const trendIcon = trend.trend === 'increasing' ? '📈' : trend.trend === 'decreasing' ? '📉' : '➡️'

    lines.push(`### ${trendIcon} ${label}`)
    lines.push('')
    lines.push(`- **Average:** ${trend.average.toFixed(1)} hours/week`)
    lines.push(`- **Trend:** ${trend.trend}`)
    lines.push(`- **Change:** ${trend.changePercentage >= 0 ? '+' : ''}${trend.changePercentage.toFixed(1)}% (from oldest to latest week)`)
    lines.push(`- **Weekly values:** ${trend.weeks.reverse().map(h => h.toFixed(1)).join('h, ')}h`)
    lines.push('')
  }

  return lines.join('\n')
}

function formatStreakMetrics(analysis: EnhancedAnalysis): string {
  const { streakMetrics } = analysis.trends
  const lines: string[] = []

  lines.push('## Productivity Streak')
  lines.push('')
  lines.push(`🔥 **Current Streak:** ${streakMetrics.currentStreak} days`)
  lines.push(`📈 **Longest Streak:** ${streakMetrics.longestStreak} days`)
  lines.push(`📊 **Productive Days:** ${streakMetrics.productiveDays}/${streakMetrics.totalDays} (${streakMetrics.productivePercentage.toFixed(1)}%)`)
  lines.push(`⏭️  **Skipped Days:** ${streakMetrics.skippedDays} (allowed without breaking streak)`)
  lines.push('')
  lines.push('*Productive day = 8+ hours work on weekdays, 4+ hours on weekends*')
  lines.push('')

  return lines.join('\n')
}

function formatWeeklyRhythmSummary(analysis: EnhancedAnalysis): string {
  const { weeklyRhythm } = analysis.trends
  const lines: string[] = []

  lines.push('## Weekly Rhythm Pattern')
  lines.push('')
  lines.push('Average activity intensity by day and time slot (2-hour blocks):')
  lines.push('')

  // Find top 5 most active time slots
  const sorted = weeklyRhythm
    .filter(r => r.averageHours > 0)
    .sort((a, b) => b.averageHours - a.averageHours)
    .slice(0, 10)

  if (sorted.length > 0) {
    lines.push('**Most Active Time Slots:**')
    lines.push('')
    for (const slot of sorted) {
      const dominant = slot.dominantCategory
        ? CATEGORY_LABELS[slot.dominantCategory as keyof typeof CATEGORY_LABELS]
        : 'Mixed'
      lines.push(`- **${slot.day}, ${slot.timeSlot}:** ${slot.averageHours.toFixed(2)}h average (${dominant})`)
    }
  } else {
    lines.push('*No significant activity patterns detected.*')
  }

  lines.push('')

  return lines.join('\n')
}

function formatAverageDailyPattern(analysis: EnhancedAnalysis): string {
  const { averageDailyPattern } = analysis.trends
  const lines: string[] = []

  lines.push('## Average Daily Pattern (4-Week Average)')
  lines.push('')

  for (const day of averageDailyPattern) {
    if (day.totalHours < 0.1) continue

    lines.push(`### ${day.dayName} (${day.totalHours.toFixed(1)} hours avg)`)
    lines.push('')

    const categories = Object.entries(day.categoryHours)
      .filter(([_, hours]) => hours > 0.1)
      .sort(([, a], [, b]) => b - a)

    for (const [category, hours] of categories) {
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
      const percentage = day.totalHours > 0 ? ((hours / day.totalHours) * 100).toFixed(0) : '0'
      lines.push(`- **${label}:** ${hours.toFixed(1)} hours (${percentage}%)`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

// ========== WEEKLY REVIEWS FORMATTER ==========

function formatWeeklyReviews(analysis: EnhancedAnalysis, weekReviews: Record<number, WeekReview>): string {
  const lines: string[] = []

  lines.push('# 📝 Weekly Reviews')
  lines.push('')
  lines.push('## Reflections & Notes')
  lines.push('')

  // Get week numbers from the analysis
  const weekKeys = analysis.trends.weekKeys
  const weekReviewEntries: Array<{ weekKey: string; weekNumber: number; review: WeekReview }> = []

  // Parse week keys and match with reviews
  for (const weekKey of weekKeys) {
    // Extract week number from format like "2025-W01"
    const match = weekKey.match(/W(\d+)$/)
    if (match) {
      const weekNumber = parseInt(match[1], 10)
      if (weekReviews[weekNumber]) {
        weekReviewEntries.push({
          weekKey,
          weekNumber,
          review: weekReviews[weekNumber]
        })
      }
    }
  }

  // Display reviews in reverse chronological order (latest first)
  if (weekReviewEntries.length > 0) {
    for (const { weekKey, weekNumber, review } of weekReviewEntries) {
      lines.push(`### Week ${weekNumber} (${weekKey})`)
      lines.push('')
      lines.push(review.review)
      lines.push('')
      lines.push(`*Last updated: ${new Date(review.updatedAt).toLocaleString()}*`)
      lines.push('')
    }
  } else {
    lines.push('*No weekly reviews found for this period.*')
    lines.push('')
  }

  return lines.join('\n')
}

// ========== DAILY SHIPPING FORMATTER ==========

function formatDailyShippingForWeek(analysis: EnhancedAnalysis, dailyShipping: Record<string, DailyShipping>): string {
  const lines: string[] = []

  lines.push('# 📦 Daily Shipping Log')
  lines.push('')

  // Get the date range for the 4-week period
  const weekKeys = analysis.trends.weekKeys

  // Extract start and end dates from week keys
  const parseWeekKey = (weekKey: string): { year: number; week: number } => {
    const match = weekKey.match(/(\d{4})-W(\d+)/)
    if (!match) return { year: 0, week: 0 }
    return { year: parseInt(match[1]), week: parseInt(match[2]) }
  }

  // Get ISO date from year and week number
  const getDateFromWeek = (year: number, week: number, dayOfWeek: number): Date => {
    const jan4 = new Date(year, 0, 4)
    const dayOfWeekJan4 = jan4.getDay() || 7
    const firstMonday = new Date(jan4.getTime() - (dayOfWeekJan4 - 1) * 86400000)
    const targetDate = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000 + (dayOfWeek - 1) * 86400000)
    return targetDate
  }

  // Collect all dates in the 4-week period
  const allDatesInPeriod: string[] = []
  for (const weekKey of weekKeys) {
    const { year, week } = parseWeekKey(weekKey)
    if (year > 0 && week > 0) {
      for (let day = 1; day <= 7; day++) {
        const date = getDateFromWeek(year, week, day)
        const dateStr = date.toISOString().split('T')[0]
        allDatesInPeriod.push(dateStr)
      }
    }
  }

  // Filter shipping entries for this period
  const periodShipping = Object.entries(dailyShipping).filter(([dateKey]) =>
    allDatesInPeriod.includes(dateKey)
  )

  if (periodShipping.length === 0) {
    lines.push('*No shipping entries for this 4-week period.*')
    lines.push('')
    return lines.join('\n')
  }

  // Calculate stats
  const totalEntries = periodShipping.length
  const completedEntries = periodShipping.filter(([_, entry]) => entry.completed).length
  const completionRate = totalEntries > 0 ? ((completedEntries / totalEntries) * 100).toFixed(1) : '0.0'

  lines.push('## Period Summary')
  lines.push('')
  lines.push(`**Days Logged:** ${totalEntries} out of ${allDatesInPeriod.length} days`)
  lines.push(`**Days Completed:** ${completedEntries}`)
  lines.push(`**Completion Rate:** ${completionRate}%`)
  lines.push('')

  // Display entries chronologically (latest first for this report)
  lines.push('## Shipping Entries')
  lines.push('')
  lines.push('| Date | What Did You Ship? | Status |')
  lines.push('|------|-------------------|--------|')

  const sortedShipping = periodShipping.sort(([a], [b]) => b.localeCompare(a))

  for (const [dateKey, entry] of sortedShipping) {
    const escapedShipped = entry.shipped.replace(/\|/g, '\\|')
    const status = entry.completed ? '✅' : '⬜'
    lines.push(`| ${dateKey} | ${escapedShipped} | ${status} |`)
  }

  lines.push('')

  return lines.join('\n')
}

// ========== INSIGHTS CONTEXT FOR AI ==========

function formatInsightsContext(analysis: EnhancedAnalysis): string {
  const lines: string[] = []

  lines.push('# 💡 Insights Context for AI Analysis')
  lines.push('')
  lines.push('## Suggested Analysis Questions')
  lines.push('')
  lines.push('1. **Latest Week Performance:** How did this week compare to my 4-week average? What went well?')
  lines.push('2. **Work-Life Balance:** Is my work-life-play balance healthy based on the 4-week trends?')
  lines.push('3. **Productivity Patterns:** What are my most productive days/times? How can I optimize my schedule?')
  lines.push('4. **Goal Progress:** Am I on track with my 80-hour work goal? What adjustments should I make?')
  lines.push('5. **Streak & Consistency:** How consistent am I? What breaks my productive streaks?')
  lines.push('6. **Procrastination:** When and why do I procrastinate most? How can I reduce it?')
  lines.push('7. **Trends:** Which categories are trending up/down? Is this intentional?')
  lines.push('8. **Recommendations:** Based on all this data, what specific, actionable changes would improve my time management?')
  lines.push('')

  lines.push('## Structured Data for AI')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify({
    latest_week: {
      week: analysis.latestWeek.weekKey,
      total_hours: analysis.latestWeek.weekStats.totalHours,
      categories: analysis.latestWeek.categoryBreakdown,
      work_goal: {
        target: analysis.latestWeek.workGoalMetrics.targetHours,
        actual: analysis.latestWeek.workGoalMetrics.actualHours,
        percentage: analysis.latestWeek.workGoalMetrics.goalPercentage,
        status: analysis.latestWeek.workGoalMetrics.status
      },
      procrastination: {
        hours: analysis.latestWeek.procrastinationMetrics.totalProcrastinationHours,
        percentage: analysis.latestWeek.procrastinationMetrics.procrastinationPercentage
      },
      top_activity: analysis.latestWeek.executiveSummary.mostCommonActivity
    },
    four_week_trends: {
      period: `${analysis.trends.weekKeys[analysis.trends.weekKeys.length - 1]} to ${analysis.trends.weekKeys[0]}`,
      streak: {
        current: analysis.trends.streakMetrics.currentStreak,
        longest: analysis.trends.streakMetrics.longestStreak,
        productive_days: analysis.trends.streakMetrics.productiveDays,
        total_days: analysis.trends.streakMetrics.totalDays
      },
      category_trends: Object.fromEntries(
        Object.entries(analysis.trends.categoryTrends).map(([cat, trend]) => [
          CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS],
          {
            average: trend.average,
            trend: trend.trend,
            change_percentage: trend.changePercentage
          }
        ])
      )
    }
  }, null, 2))
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

/**
 * Download markdown file
 */
export function downloadMarkdownReport(content: string, weekRange: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `time-analysis-${weekRange}-${timestamp}.md`

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
