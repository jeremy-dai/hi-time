import type { TimeBlock, CategoryKey } from '../types/time'
import type { WeekStats } from './analytics'
import type {
  EnhancedAnalysis,
  TimeSlotPattern,
  TopActivity,
  ExecutiveSummary,
  WorkLifeMetrics,
  ProcrastinationMetrics,
  DailyBreakdown,
  DataQualityMetrics,
  StreakMetrics,
  WorkGoalMetrics,
  WeeklyRhythmData,
  WeekComparison,
  CategoryTrendData
} from '../types/insights'
import { CATEGORY_LABELS } from '../constants/colors'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Extract activity name from a TimeBlock
 * Uses subcategory if available, otherwise creates a default subcategory based on category
 */
export function extractActivityName(block: TimeBlock): string | null {
  // First try to use subcategory
  if (block.subcategory) {
    if (typeof block.subcategory === 'object' && 'name' in block.subcategory) {
      return block.subcategory.name
    }
    if (typeof block.subcategory === 'string' && block.subcategory.trim()) {
      return block.subcategory
    }
  }

  // If no subcategory, create a default one based on category
  if (block.category) {
    const categoryName = CATEGORY_LABELS[block.category]?.toLowerCase() || block.category.toLowerCase()
    return `${categoryName}-default`
  }

  return null
}

/**
 * Analyze time slot patterns (hourly activity distribution)
 */
export function analyzeTimeSlotPatterns(weekData: TimeBlock[][]): TimeSlotPattern[] {
  const slotMap = new Map<string, Record<CategoryKey, number>>()

  // Iterate through all blocks and group by time slot
  for (let d = 0; d < 7; d++) {
    const dayBlocks = weekData[d] || []
    for (const block of dayBlocks) {
      if (!block || !block.category) continue

      const timeSlot = block.time // Already in HH:MM format
      if (!slotMap.has(timeSlot)) {
        slotMap.set(timeSlot, {} as Record<CategoryKey, number>)
      }

      const slotData = slotMap.get(timeSlot)!
      slotData[block.category] = (slotData[block.category] || 0) + 1
    }
  }

  // Convert map to array and calculate dominant activity
  const patterns: TimeSlotPattern[] = []
  for (const [timeSlot, activityCounts] of slotMap.entries()) {
    let dominantActivity: CategoryKey | null = null
    let maxCount = 0

    for (const [category, count] of Object.entries(activityCounts)) {
      if (count > maxCount) {
        maxCount = count
        dominantActivity = category as CategoryKey
      }
    }

    const totalBlocks = Object.values(activityCounts).reduce((sum, count) => sum + count, 0)

    patterns.push({
      timeSlot,
      activityCounts: activityCounts as Record<CategoryKey, number>,
      dominantActivity,
      totalBlocks
    })
  }

  // Sort by time slot
  patterns.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))

  return patterns
}

/**
 * Extract and rank top activities
 * Uses subcategories when available, creates defaults for blocks without subcategories
 */
export function extractTopActivities(weekData: TimeBlock[][], limit: number = 10): TopActivity[] {
  const activityMap = new Map<string, { type: CategoryKey, blocks: number }>()

  // Count blocks per activity (including defaults for blocks without subcategories)
  for (let d = 0; d < 7; d++) {
    const dayBlocks = weekData[d] || []
    for (const block of dayBlocks) {
      if (!block || !block.category) continue

      const activityName = extractActivityName(block)
      if (!activityName) continue // Should not happen with new implementation

      const key = `${activityName}|${block.category}` // Unique key: name + category

      if (!activityMap.has(key)) {
        activityMap.set(key, { type: block.category, blocks: 0 })
      }

      activityMap.get(key)!.blocks += 1
    }
  }

  // Calculate total blocks for percentages (all tracked blocks)
  const totalBlocks = Array.from(activityMap.values()).reduce((sum, data) => sum + data.blocks, 0)

  // Convert to TopActivity array
  const activities: TopActivity[] = []
  for (const [key, data] of activityMap.entries()) {
    const [activity] = key.split('|')
    const hours = data.blocks * 0.5
    const percentage = totalBlocks > 0 ? (data.blocks / totalBlocks) * 100 : 0

    activities.push({
      activity,
      type: data.type,
      hours,
      blocks: data.blocks,
      percentage
    })
  }

  // Sort by hours descending and take top N
  activities.sort((a, b) => b.hours - a.hours)
  return activities.slice(0, limit)
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(
  stats: WeekStats,
  weekKeys: string[]
): ExecutiveSummary {
  // Find most common category
  let mostCommonCategory: CategoryKey | null = null
  let maxHours = 0
  for (const [category, hours] of Object.entries(stats.categoryHours)) {
    if (hours > maxHours) {
      maxHours = hours
      mostCommonCategory = category as CategoryKey
    }
  }

  const totalBlocks = Math.round(stats.totalHours * 2)
  const mostCommonActivity = mostCommonCategory ? CATEGORY_LABELS[mostCommonCategory] : 'None'

  // Calculate period label
  const periodLabel = weekKeys.length > 1
    ? `${weekKeys[0]} to ${weekKeys[weekKeys.length - 1]}`
    : weekKeys[0] || 'Unknown'

  // Calculate averages
  const weeksTracked = weekKeys.length
  const averageHoursPerWeek = weeksTracked > 0 ? stats.totalHours / weeksTracked : stats.totalHours
  const averageHoursPerDay = stats.totalHours / (weeksTracked * 7)

  return {
    periodLabel,
    totalHours: stats.totalHours,
    totalBlocks,
    mostCommonActivity,
    mostCommonCategory,
    averageHoursPerDay,
    averageHoursPerWeek,
    weeksTracked
  }
}

/**
 * Calculate work-life balance metrics
 */
export function calculateWorkLifeBalance(categoryHours: Record<string, number>): WorkLifeMetrics {
  const workHours = (categoryHours['W'] || 0) + (categoryHours['M'] || 0)
  const restHours = categoryHours['R'] || 0
  const playHours = categoryHours['G'] || 0
  const procrastinationHours = categoryHours['P'] || 0

  const totalHours = Object.values(categoryHours).reduce((sum, hours) => sum + hours, 0)

  // Calculate percentages
  const workPercentage = totalHours > 0 ? (workHours / totalHours) * 100 : 0
  const restPercentage = totalHours > 0 ? (restHours / totalHours) * 100 : 0
  const playPercentage = totalHours > 0 ? (playHours / totalHours) * 100 : 0
  const procrastinationPercentage = totalHours > 0 ? (procrastinationHours / totalHours) * 100 : 0

  // Calculate work-rest ratio
  const workRestRatio = restHours > 0 ? workHours / restHours : workHours

  // Calculate balance score (0-100)
  // Ideal: 30-40% work, 35-45% rest, 15-25% play, <10% procrastination
  let balanceScore = 100

  // Penalty for too much work (> 40%)
  if (workPercentage > 40) {
    balanceScore -= (workPercentage - 40) * 1.5
  }

  // Penalty for too little rest (< 35%)
  if (restPercentage < 35) {
    balanceScore -= (35 - restPercentage) * 2
  }

  // Penalty for too much procrastination (> 10%)
  if (procrastinationPercentage > 10) {
    balanceScore -= (procrastinationPercentage - 10) * 3
  }

  // Bonus for adequate play (15-25%)
  if (playPercentage >= 15 && playPercentage <= 25) {
    balanceScore += 10
  }

  // Clamp to 0-100
  balanceScore = Math.max(0, Math.min(100, balanceScore))

  return {
    workHours,
    restHours,
    playHours,
    procrastinationHours,
    workPercentage,
    restPercentage,
    playPercentage,
    procrastinationPercentage,
    workRestRatio,
    balanceScore
  }
}

/**
 * Analyze procrastination patterns
 */
export function analyzeProcrastination(weekData: TimeBlock[][]): ProcrastinationMetrics {
  let totalBlocks = 0
  let procrastinationBlocks = 0
  const dailyProcrastination = Array(7).fill(0)
  const timeSlotProcrastination = new Map<string, number>()

  // Count procrastination blocks
  for (let d = 0; d < 7; d++) {
    const dayBlocks = weekData[d] || []
    for (const block of dayBlocks) {
      if (!block) continue
      totalBlocks++

      if (block.category === 'P') {
        procrastinationBlocks++
        dailyProcrastination[d]++

        // Track by time slot
        const timeSlot = block.time
        timeSlotProcrastination.set(timeSlot, (timeSlotProcrastination.get(timeSlot) || 0) + 1)
      }
    }
  }

  const totalProcrastinationHours = procrastinationBlocks * 0.5
  const procrastinationPercentage = totalBlocks > 0 ? (procrastinationBlocks / totalBlocks) * 100 : 0
  const dailyAverage = totalProcrastinationHours / 7

  // Find peak day
  let peakDay = 0
  let maxDayBlocks = 0
  for (let d = 0; d < 7; d++) {
    if (dailyProcrastination[d] > maxDayBlocks) {
      maxDayBlocks = dailyProcrastination[d]
      peakDay = d
    }
  }
  const peakProcrastinationDay = maxDayBlocks > 0 ? DAY_NAMES[peakDay] : null

  // Find peak time slot
  let peakTimeSlot: string | null = null
  let maxTimeSlotBlocks = 0
  for (const [timeSlot, count] of timeSlotProcrastination.entries()) {
    if (count > maxTimeSlotBlocks) {
      maxTimeSlotBlocks = count
      peakTimeSlot = timeSlot
    }
  }

  // Determine trend (simplified - would need historical data for real trend)
  const procrastinationTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'

  return {
    totalProcrastinationHours,
    procrastinationPercentage,
    dailyAverage,
    peakProcrastinationDay,
    peakProcrastinationTime: peakTimeSlot,
    procrastinationTrend
  }
}

/**
 * Generate daily breakdown
 */
export function generateDailyBreakdown(weekData: TimeBlock[][]): DailyBreakdown[] {
  const breakdown: DailyBreakdown[] = []

  for (let d = 0; d < 7; d++) {
    const dayBlocks = weekData[d] || []
    const categoryHours: Record<CategoryKey, number> = {} as Record<CategoryKey, number>
    let totalHours = 0

    for (const block of dayBlocks) {
      if (!block || !block.category) continue
      categoryHours[block.category] = (categoryHours[block.category] || 0) + 0.5
      totalHours += 0.5
    }

    // Find dominant category
    let dominantCategory: CategoryKey | null = null
    let maxHours = 0
    for (const [category, hours] of Object.entries(categoryHours)) {
      if (hours > maxHours) {
        maxHours = hours
        dominantCategory = category as CategoryKey
      }
    }

    breakdown.push({
      dayName: DAY_NAMES[d],
      dayIndex: d,
      totalHours,
      categoryHours: categoryHours as Record<CategoryKey, number>,
      dominantCategory
    })
  }

  return breakdown
}

/**
 * Calculate data quality metrics
 */
export function calculateDataQuality(weekData: TimeBlock[][]): DataQualityMetrics {
  let totalBlocks = 0
  let blocksWithSubcategory = 0
  let blocksWithNotes = 0

  for (let d = 0; d < 7; d++) {
    const dayBlocks = weekData[d] || []
    for (const block of dayBlocks) {
      if (!block || !block.category) continue
      totalBlocks++

      if (block.subcategory) {
        if (typeof block.subcategory === 'object' && 'name' in block.subcategory && block.subcategory.name) {
          blocksWithSubcategory++
        } else if (typeof block.subcategory === 'string' && block.subcategory.trim()) {
          blocksWithSubcategory++
        }
      }

      if (block.notes && block.notes.trim()) {
        blocksWithNotes++
      }
    }
  }

  const blocksWithDetailedInfo = Math.max(blocksWithSubcategory, blocksWithNotes)
  const qualityPercentage = totalBlocks > 0 ? (blocksWithDetailedInfo / totalBlocks) * 100 : 0

  return {
    totalBlocks,
    blocksWithSubcategory,
    blocksWithNotes,
    blocksWithDetailedInfo,
    qualityPercentage
  }
}

/**
 * Analyze productive streak across multiple weeks
 */
export function analyzeProductiveStreak(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): StreakMetrics {
  // Build array of all days across all weeks with their work hours
  const daysData: Array<{ date: string; workHours: number; dayOfWeek: number }> = []

  for (const weekKey of weekKeys) {
    const weekData = weeksStore[weekKey] || []
    for (let d = 0; d < 7; d++) {
      const dayBlocks = weekData[d] || []
      let workHours = 0

      for (const block of dayBlocks) {
        if (block && (block.category === 'W' || block.category === 'M')) {
          workHours += 0.5
        }
      }

      daysData.push({
        date: `${weekKey}-${d}`,
        workHours,
        dayOfWeek: d // 0 = Sunday, 1 = Monday, etc.
      })
    }
  }

  // Determine productive threshold based on day of week
  const isProductiveDay = (day: typeof daysData[0]) => {
    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6 // Sunday or Saturday
    const threshold = isWeekend ? 4 : 8
    return day.workHours >= threshold
  }

  // Calculate streaks with skip allowance
  let currentStreak = 0
  let longestStreak = 0
  let skipsRemaining = 2 // Allow up to 2 skipped days
  let productiveDays = 0
  let skippedDays = 0

  for (const day of daysData) {
    const isProductive = isProductiveDay(day)

    if (isProductive) {
      productiveDays++
      currentStreak++
      skipsRemaining = 2 // Reset skip allowance
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }
    } else {
      // Day is not productive
      if (skipsRemaining > 0) {
        // Skip this day without breaking streak
        skipsRemaining--
        skippedDays++
      } else {
        // Break the streak
        currentStreak = 0
        skipsRemaining = 2
      }
    }
  }

  const totalDays = daysData.length
  const productivePercentage = totalDays > 0 ? (productiveDays / totalDays) * 100 : 0

  return {
    currentStreak,
    longestStreak,
    productiveDays,
    totalDays,
    productivePercentage,
    skippedDays
  }
}

/**
 * Calculate weekly work goal metrics
 */
export function calculateWeeklyWorkGoal(
  latestWeekStats: WeekStats,
  multiWeekStats: { categoryHours: Record<CategoryKey, number>; weeks: number },
  targetHours: number = 40
): WorkGoalMetrics {
  // Latest week work hours (Work + Mandatory)
  const actualHours = (latestWeekStats.categoryHours['W'] || 0) + (latestWeekStats.categoryHours['M'] || 0)

  // 4-week average
  const avgWorkHours = (multiWeekStats.categoryHours['W'] || 0) + (multiWeekStats.categoryHours['M'] || 0)
  const weeklyAverage = multiWeekStats.weeks > 0 ? avgWorkHours / multiWeekStats.weeks : 0

  const goalPercentage = (actualHours / targetHours) * 100
  const delta = actualHours - targetHours

  // Determine status (thresholds are relative to target)
  // More lenient for exceeding goal since that's generally positive
  let status: WorkGoalMetrics['status']
  const excellentMin = targetHours * 0.95   // 95% of target
  const excellentMax = targetHours * 1.15   // 115% of target
  const goodMin = targetHours * 0.80        // 80% of target
  const goodMax = targetHours * 1.30        // 130% of target
  const reviewMin = targetHours * 0.60      // 60% of target
  const reviewMax = targetHours * 1.50      // 150% of target

  if (actualHours >= excellentMin && actualHours <= excellentMax) {
    status = 'excellent'
  } else if ((actualHours >= goodMin && actualHours < excellentMin) || (actualHours > excellentMax && actualHours <= goodMax)) {
    status = 'good'
  } else if ((actualHours >= reviewMin && actualHours < goodMin) || (actualHours > goodMax && actualHours <= reviewMax)) {
    status = 'review'
  } else {
    status = 'concern'
  }

  return {
    targetHours,
    actualHours,
    weeklyAverage,
    goalPercentage,
    status,
    delta
  }
}

/**
 * Generate weekly rhythm heatmap data (aggregated across multiple weeks)
 */
export function generateWeeklyRhythmData(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): WeeklyRhythmData[] {
  // Time slot definitions (1-hour blocks from 6am to 11pm = 17 blocks)
  const timeSlots: Array<{ label: string; start: number; end: number }> = []
  for (let hour = 6; hour < 23; hour++) {
    const nextHour = hour + 1
    const formatHour = (h: number) => {
      if (h === 12) return '12pm'
      if (h > 12) return `${h - 12}pm`
      return `${h}am`
    }
    timeSlots.push({
      label: `${formatHour(hour)}-${formatHour(nextHour)}`,
      start: hour,
      end: nextHour
    })
  }

  // Day names for display (Mon-Sun)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const rhythmData: WeeklyRhythmData[] = []

  // For each day (Mon=1, Tue=2, ..., Sun=0 in JS Date, but we remap for display)
  for (let displayDayIndex = 0; displayDayIndex < 7; displayDayIndex++) {
    // Map display index to actual day index (Mon=1, Sun=0)
    const actualDayIndex = displayDayIndex === 6 ? 0 : displayDayIndex + 1

    for (const slot of timeSlots) {
      const slotData: Record<CategoryKey, number> = {} as Record<CategoryKey, number>
      let totalBlocks = 0

      // Aggregate across all weeks
      for (const weekKey of weekKeys) {
        const weekData = weeksStore[weekKey] || []
        const dayBlocks = weekData[actualDayIndex] || []

        for (const block of dayBlocks) {
          if (!block || !block.category) continue

          // Parse time (format: "HH:MM")
          const [hourStr] = block.time.split(':')
          const hour = parseInt(hourStr, 10)

          // Check if block falls in this time slot
          if (hour >= slot.start && hour < slot.end) {
            slotData[block.category] = (slotData[block.category] || 0) + 0.5
            totalBlocks++
          }
        }
      }

      // Calculate average across weeks
      const averageHours = weekKeys.length > 0 ? totalBlocks * 0.5 / weekKeys.length : 0

      // Find dominant category
      let dominantCategory: CategoryKey | null = null
      let maxHours = 0
      for (const [category, hours] of Object.entries(slotData)) {
        if (hours > maxHours) {
          maxHours = hours
          dominantCategory = category as CategoryKey
        }
      }

      rhythmData.push({
        day: dayNames[displayDayIndex],
        dayIndex: displayDayIndex,
        timeSlot: slot.label,
        timeSlotStart: slot.start,
        averageHours,
        categoryBreakdown: slotData,
        dominantCategory
      })
    }
  }

  return rhythmData
}

/**
 * Generate multi-week comparison data
 */
export function generateMultiWeekComparison(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): WeekComparison[] {
  const comparisons: WeekComparison[] = []

  for (const weekKey of weekKeys) {
    const weekData = weeksStore[weekKey] || []
    const categoryHours: Record<CategoryKey, number> = {} as Record<CategoryKey, number>
    let totalHours = 0

    for (let d = 0; d < 7; d++) {
      const dayBlocks = weekData[d] || []
      for (const block of dayBlocks) {
        if (!block || !block.category) continue
        categoryHours[block.category] = (categoryHours[block.category] || 0) + 0.5
        totalHours += 0.5
      }
    }

    // Format week label (e.g., "2025-W50" -> "W50")
    const weekLabel = weekKey.includes('-W') ? `W${weekKey.split('-W')[1]}` : weekKey

    // Generate daily breakdown for this week
    const dailyBreakdown = generateDailyBreakdown(weekData)

    comparisons.push({
      weekKey,
      weekLabel,
      categoryHours,
      totalHours,
      dailyBreakdown
    })
  }

  return comparisons
}

/**
 * Analyze category trends across weeks
 */
export function analyzeCategoryTrends(
  comparisons: WeekComparison[]
): Record<CategoryKey, CategoryTrendData> {
  const categories: CategoryKey[] = ['R', 'W', 'M', 'G', 'P']
  const trends: Record<CategoryKey, CategoryTrendData> = {} as Record<CategoryKey, CategoryTrendData>

  for (const category of categories) {
    const weeks = comparisons.map(c => c.categoryHours[category] || 0)
    const average = weeks.reduce((sum, h) => sum + h, 0) / weeks.length

    // Determine trend
    const firstWeek = weeks[weeks.length - 1] // Oldest week
    const lastWeek = weeks[0] // Newest week
    const changePercentage = firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(changePercentage) < 10) {
      trend = 'stable'
    } else if (changePercentage > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    trends[category] = {
      category,
      weeks,
      average,
      trend,
      changePercentage
    }
  }

  return trends
}

/**
 * Calculate average daily pattern across multiple weeks
 */
export function calculateAverageDailyPattern(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): DailyBreakdown[] {
  const breakdown: DailyBreakdown[] = []

  for (let d = 0; d < 7; d++) {
    const categoryHours: Record<CategoryKey, number> = {} as Record<CategoryKey, number>
    let totalHours = 0

    // Aggregate across all weeks for this day
    for (const weekKey of weekKeys) {
      const weekData = weeksStore[weekKey] || []
      const dayBlocks = weekData[d] || []

      for (const block of dayBlocks) {
        if (!block || !block.category) continue
        categoryHours[block.category] = (categoryHours[block.category] || 0) + 0.5
        totalHours += 0.5
      }
    }

    // Calculate averages
    const numWeeks = weekKeys.length
    for (const cat in categoryHours) {
      categoryHours[cat as CategoryKey] = categoryHours[cat as CategoryKey] / numWeeks
    }
    totalHours = totalHours / numWeeks

    // Find dominant category
    let dominantCategory: CategoryKey | null = null
    let maxHours = 0
    for (const [category, hours] of Object.entries(categoryHours)) {
      if (hours > maxHours) {
        maxHours = hours
        dominantCategory = category as CategoryKey
      }
    }

    breakdown.push({
      dayName: DAY_NAMES[d],
      dayIndex: d,
      totalHours,
      categoryHours,
      dominantCategory
    })
  }

  return breakdown
}

/**
 * Generate comprehensive enhanced analysis with dual perspective
 */
export function generateEnhancedAnalysis(
  latestWeekData: TimeBlock[][],
  latestWeekStats: WeekStats,
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): EnhancedAnalysis {
  const latestWeekKey = weekKeys[0]

  // Calculate multi-week aggregates
  let multiWeekCategoryHours: Record<CategoryKey, number> = {} as Record<CategoryKey, number>
  for (const weekKey of weekKeys) {
    const weekData = weeksStore[weekKey] || []
    for (let d = 0; d < 7; d++) {
      const dayBlocks = weekData[d] || []
      for (const block of dayBlocks) {
        if (!block || !block.category) continue
        multiWeekCategoryHours[block.category] = (multiWeekCategoryHours[block.category] || 0) + 0.5
      }
    }
  }

  // Generate comparisons and trends
  const multiWeekComparison = generateMultiWeekComparison(weeksStore, weekKeys)
  const categoryTrends = analyzeCategoryTrends(multiWeekComparison)

  return {
    latestWeek: {
      weekKey: latestWeekKey,
      weekStats: latestWeekStats,
      executiveSummary: generateExecutiveSummary(latestWeekStats, [latestWeekKey]),
      categoryBreakdown: latestWeekStats.categoryHours,
      dailyBreakdown: generateDailyBreakdown(latestWeekData),
      topActivities: extractTopActivities(latestWeekData),
      timeSlotPatterns: analyzeTimeSlotPatterns(latestWeekData),
      workGoalMetrics: calculateWeeklyWorkGoal(
        latestWeekStats,
        { categoryHours: multiWeekCategoryHours, weeks: weekKeys.length }
      ),
      procrastinationMetrics: analyzeProcrastination(latestWeekData)
    },
    trends: {
      weekKeys,
      multiWeekComparison,
      categoryTrends,
      streakMetrics: analyzeProductiveStreak(weeksStore, weekKeys),
      weeklyRhythm: generateWeeklyRhythmData(weeksStore, weekKeys),
      averageDailyPattern: calculateAverageDailyPattern(weeksStore, weekKeys),
      workLifeBalance: calculateWorkLifeBalance(multiWeekCategoryHours),
      averageWorkGoal: calculateWeeklyWorkGoal(
        latestWeekStats,
        { categoryHours: multiWeekCategoryHours, weeks: weekKeys.length }
      ),
      rawWeekData: weeksStore
    },
    generatedAt: new Date()
  }
}
