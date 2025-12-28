import type { YTDStats } from './analytics'
import type { TimeBlock, DailyMemory } from '../types/time'
import { CATEGORY_KEYS } from '../types/time'
import { CATEGORY_LABELS } from '../constants/colors'

/**
 * Data structure for annual export
 */
export interface AnnualExportData {
  ytdStats: YTDStats
  weekThemes: Record<string, string>
  memories: Record<string, DailyMemory>
  weeksStore: Record<string, TimeBlock[][]>
  year: number
}

/**
 * Generate complete markdown report for annual data
 */
export function generateAnnualReport(data: AnnualExportData): string {
  const sections: string[] = []
  const { ytdStats, weekThemes, memories, weeksStore, year } = data

  // Title
  const firstWeek = ytdStats.weeklyData[ytdStats.weeklyData.length - 1]?.weekKey || ''
  const lastWeek = ytdStats.weeklyData[0]?.weekKey || ''
  sections.push(`# ${year} Annual Time Analysis Report`)
  sections.push('')
  sections.push(`*Analysis Period: ${firstWeek} to ${lastWeek}*`)
  sections.push(`*Generated: ${new Date().toLocaleString()}*`)
  sections.push('')

  // ========== SECTION 1: YEAR OVERVIEW ==========
  sections.push('---')
  sections.push('')
  sections.push('# 📊 Section 1: Year Overview & Summary')
  sections.push('')
  sections.push(formatYearOverview(ytdStats))
  sections.push('')

  // ========== SECTION 2: CATEGORY BREAKDOWN ==========
  sections.push('---')
  sections.push('')
  sections.push('# 📈 Section 2: Annual Category Breakdown')
  sections.push('')
  sections.push(formatCategoryBreakdown(ytdStats))
  sections.push('')

  // ========== SECTION 3: PRODUCTIVITY STREAKS ==========
  sections.push('---')
  sections.push('')
  sections.push('# 🔥 Section 3: Productivity Streak Analysis')
  sections.push('')
  sections.push(formatProductivityStreaks(ytdStats, weeksStore))
  sections.push('')

  // ========== SECTION 4: WEEKLY BREAKDOWN & RAW DATA ==========
  sections.push('---')
  sections.push('')
  sections.push('# 📅 Section 4: Weekly Breakdown & Raw Time Data')
  sections.push('')
  sections.push(formatWeeklyBreakdown(ytdStats, weekThemes, weeksStore))
  sections.push('')

  // ========== SECTION 5: DAILY HEATMAP SUMMARY ==========
  sections.push('---')
  sections.push('')
  sections.push('# 🗓️ Section 5: Daily Work Heatmap Summary')
  sections.push('')
  sections.push(formatDailyHeatmap(ytdStats, weeksStore))
  sections.push('')

  // ========== SECTION 6: MEMORIES & REFLECTIONS ==========
  sections.push('---')
  sections.push('')
  sections.push('# 💭 Section 6: Year Memories & Reflections')
  sections.push('')
  sections.push(formatMemoriesAndReflections(memories))
  sections.push('')

  // ========== SECTION 7: INSIGHTS CONTEXT FOR AI ==========
  sections.push('---')
  sections.push('')
  sections.push(formatInsightsContext(ytdStats, weekThemes, memories))
  sections.push('')

  return sections.join('\n')
}

// ========== SECTION 1: YEAR OVERVIEW ==========

function formatYearOverview(ytdStats: YTDStats): string {
  const lines: string[] = []

  lines.push('## Executive Summary')
  lines.push('')
  lines.push(`**Year:** ${ytdStats.year}`)
  lines.push(`**Total Hours Tracked:** ${ytdStats.totalHours.toFixed(1)} hours`)
  lines.push(`**Total Weeks Analyzed:** ${ytdStats.totalWeeks}`)
  lines.push(`**Average Hours/Week:** ${ytdStats.averagePerWeek.toFixed(1)} hours`)
  lines.push('')

  if (ytdStats.highestWeek) {
    lines.push(`**Highest Week:** ${ytdStats.highestWeek.weekKey} (${ytdStats.highestWeek.hours.toFixed(1)} hours)`)
  }

  if (ytdStats.lowestWeek) {
    lines.push(`**Lowest Week:** ${ytdStats.lowestWeek.weekKey} (${ytdStats.lowestWeek.hours.toFixed(1)} hours)`)
  }

  lines.push('')

  // Category distribution percentages
  lines.push('## Overall Category Distribution')
  lines.push('')

  const categoryPercentages = CATEGORY_KEYS
    .filter(k => k !== '')
    .map(k => {
      const hours = ytdStats.categoryTotals[k] || 0
      const percentage = ytdStats.totalHours > 0 ? (hours / ytdStats.totalHours) * 100 : 0
      const label = CATEGORY_LABELS[k]
      return { label, percentage: percentage.toFixed(1) }
    })
    .filter(c => parseFloat(c.percentage) > 0)
    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))

  for (const { label, percentage } of categoryPercentages) {
    lines.push(`- **${label}:** ${percentage}%`)
  }

  lines.push('')

  return lines.join('\n')
}

// ========== SECTION 2: CATEGORY BREAKDOWN ==========

function formatCategoryBreakdown(ytdStats: YTDStats): string {
  const lines: string[] = []

  lines.push('## Category Summary Table')
  lines.push('')
  lines.push('| Category | Total Hours | Average/Week | Percentage |')
  lines.push('|----------|-------------|--------------|------------|')

  const categories = CATEGORY_KEYS
    .filter(k => k !== '')
    .map(k => ({
      key: k,
      label: CATEGORY_LABELS[k],
      total: ytdStats.categoryTotals[k] || 0,
      average: ytdStats.categoryAverages[k] || 0
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  for (const cat of categories) {
    const percentage = ytdStats.totalHours > 0 ? ((cat.total / ytdStats.totalHours) * 100).toFixed(1) : '0.0'
    lines.push(`| ${cat.label} | ${cat.total.toFixed(1)} | ${cat.average.toFixed(1)} | ${percentage}% |`)
  }

  lines.push('')

  return lines.join('\n')
}

// ========== SECTION 3: PRODUCTIVITY STREAKS ==========

function formatProductivityStreaks(ytdStats: YTDStats, weeksStore: Record<string, TimeBlock[][]>): string {
  const lines: string[] = []

  lines.push('## Streak Metrics')
  lines.push('')
  lines.push(`🔥 **Current Streak:** ${ytdStats.streakMetrics.currentStreak} days`)
  lines.push(`📈 **Longest Streak:** ${ytdStats.streakMetrics.longestStreak} days`)
  lines.push(`📊 **Productive Days:** ${ytdStats.streakMetrics.productiveDays}/${ytdStats.streakMetrics.totalDays} (${((ytdStats.streakMetrics.productiveDays / ytdStats.streakMetrics.totalDays) * 100).toFixed(1)}%)`)
  lines.push('')
  lines.push('*Productive day = 8+ hours of Work (W) category. Allows up to 2 skipped days without breaking streak.*')
  lines.push('')

  // Monthly productivity summary
  lines.push('## Monthly Productivity Summary')
  lines.push('')

  const monthlyData = calculateMonthlyProductivity(ytdStats, weeksStore)

  if (monthlyData.length > 0) {
    lines.push('| Month | Productive Days | Total Days | Percentage |')
    lines.push('|-------|-----------------|------------|------------|')

    for (const month of monthlyData) {
      const percentage = month.totalDays > 0 ? ((month.productiveDays / month.totalDays) * 100).toFixed(1) : '0.0'
      lines.push(`| ${month.month} | ${month.productiveDays} | ${month.totalDays} | ${percentage}% |`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

function calculateMonthlyProductivity(ytdStats: YTDStats, weeksStore: Record<string, TimeBlock[][]>): Array<{
  month: string
  productiveDays: number
  totalDays: number
}> {
  const monthlyMap = new Map<string, { productiveDays: number; totalDays: number }>()

  for (const weekData of ytdStats.weeklyData) {
    const weekKey = weekData.weekKey
    const [yearStr, weekStr] = weekKey.split('-W')
    const year = parseInt(yearStr)
    const week = parseInt(weekStr)

    // Get the week's time blocks
    const blocks = weeksStore[weekKey]
    if (!blocks) continue

    // Process each day of the week
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayBlocks = blocks[dayIndex] || []

      // Calculate work hours for this day
      const workHours = dayBlocks
        .filter(b => b.category === 'W')
        .length * 0.5

      // Estimate the date for this day
      const date = getDateFromWeekAndDay(year, week, dayIndex)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { productiveDays: 0, totalDays: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.totalDays++

      if (workHours >= 8) {
        monthData.productiveDays++
      }
    }
  }

  // Convert to array and sort by month
  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      productiveDays: data.productiveDays,
      totalDays: data.totalDays
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function getDateFromWeekAndDay(year: number, week: number, dayIndex: number): Date {
  // dayIndex: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Get first day of year
  const jan1 = new Date(year, 0, 1)

  // Find first Sunday of the year
  const firstSunday = new Date(jan1)
  firstSunday.setDate(jan1.getDate() + (7 - jan1.getDay()) % 7)

  // Calculate the date
  const targetDate = new Date(firstSunday)
  targetDate.setDate(firstSunday.getDate() + (week - 1) * 7 + dayIndex)

  return targetDate
}

// ========== SECTION 4: WEEKLY BREAKDOWN ==========

function formatWeeklyBreakdown(
  ytdStats: YTDStats,
  weekThemes: Record<string, string>,
  weeksStore: Record<string, TimeBlock[][]>
): string {
  const lines: string[] = []

  // Week-by-week comparison table
  lines.push('## Week-by-Week Comparison')
  lines.push('')

  const categoryHeaders = CATEGORY_KEYS.filter(k => k !== '').map(k => CATEGORY_LABELS[k])
  lines.push(`| Week | ${categoryHeaders.join(' | ')} | Theme | Total |`)
  lines.push(`|------|${categoryHeaders.map(() => '------').join('|')}|-------|-------|`)

  // Reverse to show oldest to newest
  const sortedWeeks = [...ytdStats.weeklyData].reverse()

  for (const week of sortedWeeks) {
    const categoryValues = CATEGORY_KEYS
      .filter(k => k !== '')
      .map(k => (week.categoryHours[k] || 0).toFixed(1))

    const theme = weekThemes[week.weekKey] || ''
    const themeStr = theme.length > 20 ? theme.substring(0, 17) + '...' : theme

    lines.push(`| ${week.weekKey} | ${categoryValues.join(' | ')} | ${themeStr} | ${week.hours.toFixed(1)} |`)
  }

  lines.push('')

  // Full year raw time tables
  lines.push('## Full Year Raw Time Data')
  lines.push('')
  lines.push('*Detailed time slot tables for each week, grouped by month*')
  lines.push('')

  lines.push(formatFullYearRawData(ytdStats, weeksStore))

  return lines.join('\n')
}

function formatFullYearRawData(ytdStats: YTDStats, weeksStore: Record<string, TimeBlock[][]>): string {
  const lines: string[] = []
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayIndices = [6, 0, 1, 2, 3, 4, 5] // Map display order to day indices

  // Group weeks by month
  const weeksByMonth = new Map<string, typeof ytdStats.weeklyData>()

  for (const week of ytdStats.weeklyData) {
    const [year, weekNum] = week.weekKey.split('-W')
    const monthKey = getMonthFromWeek(parseInt(year), parseInt(weekNum))

    if (!weeksByMonth.has(monthKey)) {
      weeksByMonth.set(monthKey, [])
    }
    weeksByMonth.get(monthKey)!.push(week)
  }

  // Sort months and process each
  const sortedMonths = Array.from(weeksByMonth.keys()).sort()

  for (const monthKey of sortedMonths) {
    const weeks = weeksByMonth.get(monthKey)!.reverse() // Oldest to newest

    lines.push(`### ${monthKey}`)
    lines.push('')

    for (const week of weeks) {
      const weekData = weeksStore[week.weekKey]
      if (!weekData || weekData.length === 0) continue

      lines.push(`#### Week ${week.weekKey}`)
      lines.push('')

      // Get time slots from first day
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
            let cell = block.category + ':'

            const activityName = extractActivityNameFromBlock(block)
            if (activityName) {
              cell += activityName
            }

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
      lines.push(`**Week Total:** ${week.hours.toFixed(1)} hours`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

function getMonthFromWeek(year: number, week: number): string {
  const date = getDateFromWeekAndDay(year, week, 3) // Use Wednesday as reference
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

function extractActivityNameFromBlock(block: TimeBlock): string {
  if (block.subcategory) {
    if (typeof block.subcategory === 'object' && 'name' in block.subcategory) {
      return block.subcategory.name
    }
    if (typeof block.subcategory === 'string' && block.subcategory.trim()) {
      return block.subcategory
    }
  }

  if (block.notes && block.notes.trim()) {
    return block.notes
  }

  return ''
}

// ========== SECTION 5: DAILY HEATMAP ==========

function formatDailyHeatmap(ytdStats: YTDStats, weeksStore: Record<string, TimeBlock[][]>): string {
  const lines: string[] = []

  // Day-of-week analysis
  lines.push('## Day-of-Week Analysis')
  lines.push('')
  lines.push('Average work hours by day of week across the entire year:')
  lines.push('')

  const dayTotals = [0, 0, 0, 0, 0, 0, 0]
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]
  const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const week of ytdStats.weeklyData) {
    const weekData = weeksStore[week.weekKey]
    if (!weekData) continue

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayBlocks = weekData[dayIndex] || []
      const workHours = dayBlocks.filter(b => b.category === 'W').length * 0.5

      dayTotals[dayIndex] += workHours
      dayCounts[dayIndex]++
    }
  }

  for (let i = 0; i < 7; i++) {
    const avg = dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0
    lines.push(`- **${DAY_NAMES_FULL[i]}:** ${avg.toFixed(2)} hours`)
  }

  lines.push('')

  // Top productive days
  lines.push('## Top 10 Most Productive Days')
  lines.push('')

  const allDays = collectAllDays(ytdStats, weeksStore)
  const topDays = allDays
    .sort((a, b) => b.workHours - a.workHours)
    .slice(0, 10)

  if (topDays.length > 0) {
    lines.push('| Rank | Date | Work Hours | Total Hours |')
    lines.push('|------|------|------------|-------------|')

    topDays.forEach((day, index) => {
      lines.push(`| ${index + 1} | ${day.date} | ${day.workHours.toFixed(1)} | ${day.totalHours.toFixed(1)} |`)
    })

    lines.push('')
  }

  // Bottom productive days
  lines.push('## Bottom 10 Least Productive Days')
  lines.push('')

  const bottomDays = allDays
    .filter(d => d.totalHours > 0) // Exclude completely empty days
    .sort((a, b) => a.workHours - b.workHours)
    .slice(0, 10)

  if (bottomDays.length > 0) {
    lines.push('| Rank | Date | Work Hours | Total Hours |')
    lines.push('|------|------|------------|-------------|')

    bottomDays.forEach((day, index) => {
      lines.push(`| ${index + 1} | ${day.date} | ${day.workHours.toFixed(1)} | ${day.totalHours.toFixed(1)} |`)
    })

    lines.push('')
  }

  return lines.join('\n')
}

function collectAllDays(ytdStats: YTDStats, weeksStore: Record<string, TimeBlock[][]>): Array<{
  date: string
  workHours: number
  totalHours: number
}> {
  const days: Array<{ date: string; workHours: number; totalHours: number }> = []

  for (const week of ytdStats.weeklyData) {
    const weekData = weeksStore[week.weekKey]
    if (!weekData) continue

    const [yearStr, weekStr] = week.weekKey.split('-W')
    const year = parseInt(yearStr)
    const weekNum = parseInt(weekStr)

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayBlocks = weekData[dayIndex] || []
      const workHours = dayBlocks.filter(b => b.category === 'W').length * 0.5
      const totalHours = dayBlocks.filter(b => b.category).length * 0.5

      const date = getDateFromWeekAndDay(year, weekNum, dayIndex)
      const dateStr = date.toISOString().split('T')[0]

      days.push({
        date: dateStr,
        workHours,
        totalHours
      })
    }
  }

  return days
}

// ========== SECTION 6: MEMORIES ==========

function formatMemoriesAndReflections(memories: Record<string, DailyMemory>): string {
  const lines: string[] = []

  const memoryList = Object.values(memories)

  if (memoryList.length === 0) {
    lines.push('*No memories recorded for this year.*')
    lines.push('')
    return lines.join('\n')
  }

  // Group by month
  lines.push('## Monthly Memory Summaries')
  lines.push('')

  const memorysByMonth = new Map<string, DailyMemory[]>()

  for (const memory of memoryList) {
    const monthKey = memory.date.substring(0, 7) // YYYY-MM
    if (!memorysByMonth.has(monthKey)) {
      memorysByMonth.set(monthKey, [])
    }
    memorysByMonth.get(monthKey)!.push(memory)
  }

  const sortedMonths = Array.from(memorysByMonth.keys()).sort()

  for (const monthKey of sortedMonths) {
    const monthMemories = memorysByMonth.get(monthKey)!
    const [year, month] = monthKey.split('-')
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
    const monthName = monthNames[parseInt(month) - 1]

    lines.push(`### ${monthName} ${year} (${monthMemories.length} memories)`)
    lines.push('')

    // Sort by date
    monthMemories.sort((a, b) => a.date.localeCompare(b.date))

    for (const memory of monthMemories) {
      const moodEmoji = getMoodEmoji(memory.mood)
      const tagsStr = memory.tags && memory.tags.length > 0 ? ` *[${memory.tags.join(', ')}]*` : ''

      lines.push(`**${memory.date}** ${moodEmoji}${tagsStr}`)
      lines.push(`> ${memory.memory}`)
      lines.push('')
    }
  }

  // Mood analysis
  lines.push('## Mood Analysis')
  lines.push('')

  const moodCounts: Record<string, number> = {
    great: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    terrible: 0
  }

  for (const memory of memoryList) {
    if (memory.mood) {
      moodCounts[memory.mood]++
    }
  }

  const totalWithMood = Object.values(moodCounts).reduce((a, b) => a + b, 0)

  if (totalWithMood > 0) {
    lines.push('| Mood | Count | Percentage |')
    lines.push('|------|-------|------------|')

    const moodOrder: Array<keyof typeof moodCounts> = ['great', 'good', 'neutral', 'bad', 'terrible']
    for (const mood of moodOrder) {
      const count = moodCounts[mood]
      if (count > 0) {
        const percentage = ((count / totalWithMood) * 100).toFixed(1)
        const emoji = getMoodEmoji(mood)
        lines.push(`| ${emoji} ${mood.charAt(0).toUpperCase() + mood.slice(1)} | ${count} | ${percentage}% |`)
      }
    }

    lines.push('')
  }

  // Tag cloud
  lines.push('## Tag Cloud')
  lines.push('')

  const tagCounts = new Map<string, number>()

  for (const memory of memoryList) {
    if (memory.tags) {
      for (const tag of memory.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }
  }

  if (tagCounts.size > 0) {
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])

    lines.push('| Tag | Frequency |')
    lines.push('|-----|-----------|')

    for (const [tag, count] of sortedTags) {
      lines.push(`| ${tag} | ${count} |`)
    }

    lines.push('')
  } else {
    lines.push('*No tags used this year.*')
    lines.push('')
  }

  return lines.join('\n')
}

function getMoodEmoji(mood: string | undefined): string {
  switch (mood) {
    case 'great': return '😄'
    case 'good': return '🙂'
    case 'neutral': return '😐'
    case 'bad': return '😕'
    case 'terrible': return '😢'
    default: return ''
  }
}

// ========== SECTION 7: INSIGHTS CONTEXT ==========

function formatInsightsContext(
  ytdStats: YTDStats,
  weekThemes: Record<string, string>,
  memories: Record<string, DailyMemory>
): string {
  const lines: string[] = []

  lines.push('# 💡 Insights Context for AI Analysis')
  lines.push('')
  lines.push('## Suggested Analysis Questions')
  lines.push('')
  lines.push('1. **Productivity Patterns:** What are my most productive periods this year and what patterns emerge?')
  lines.push('2. **Week Themes:** How do my week themes correlate with productivity levels and category allocation?')
  lines.push('3. **Category Trends:** What trends do you see in my time allocation across categories over the year?')
  lines.push('4. **Streak Correlation:** How does my productivity streak pattern relate to my daily memories and mood?')
  lines.push('5. **Burnout Indicators:** Are there any concerning patterns, burnout indicators, or periods of low productivity?')
  lines.push('6. **Life Priorities:** What do my daily memories reveal about my priorities and life balance?')
  lines.push('7. **Mood vs. Productivity:** How does my mood tracking correlate with work hours and category distribution?')
  lines.push('8. **Future Planning:** What specific, actionable recommendations would you make for next year?')
  lines.push('9. **Focus Areas:** Which activities or categories should I focus more/less on based on this data?')
  lines.push('10. **Balance Assessment:** How balanced is my time allocation? Are there any categories being neglected?')
  lines.push('')

  lines.push('## Structured Data for AI')
  lines.push('')
  lines.push('```json')

  // Build mood distribution
  const moodDistribution: Record<string, number> = {
    great: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    terrible: 0
  }

  const memoryList = Object.values(memories)
  for (const memory of memoryList) {
    if (memory.mood) {
      moodDistribution[memory.mood]++
    }
  }

  // Build unique tags
  const uniqueTags = new Set<string>()
  for (const memory of memoryList) {
    if (memory.tags) {
      memory.tags.forEach(tag => uniqueTags.add(tag))
    }
  }

  const structuredData = {
    year_overview: {
      year: ytdStats.year,
      total_hours: ytdStats.totalHours,
      total_weeks: ytdStats.totalWeeks,
      average_per_week: ytdStats.averagePerWeek,
      highest_week: ytdStats.highestWeek,
      lowest_week: ytdStats.lowestWeek,
      category_totals: ytdStats.categoryTotals,
      category_averages: ytdStats.categoryAverages
    },
    productivity: {
      current_streak: ytdStats.streakMetrics.currentStreak,
      longest_streak: ytdStats.streakMetrics.longestStreak,
      productive_days: ytdStats.streakMetrics.productiveDays,
      total_days: ytdStats.streakMetrics.totalDays,
      productive_percentage: (ytdStats.streakMetrics.productiveDays / ytdStats.streakMetrics.totalDays) * 100
    },
    memories_summary: {
      total_memories: memoryList.length,
      mood_distribution: moodDistribution,
      unique_tags: Array.from(uniqueTags)
    },
    week_themes: weekThemes
  }

  lines.push(JSON.stringify(structuredData, null, 2))
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

/**
 * Download annual markdown file
 */
export function downloadAnnualMarkdownReport(content: string, year: number): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `annual-analysis-${year}-${timestamp}.md`

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
