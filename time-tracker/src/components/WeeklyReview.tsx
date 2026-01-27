import { useState, useMemo, useEffect } from 'react'
import { useWeekReviews } from '../hooks/useWeekReviews'
import { useAnnualReview } from '../hooks/useAnnualReview'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { Calendar, Circle, Leaf, Sun, CloudRain, Snowflake, Sparkles } from 'lucide-react'
import { cn } from '../utils/classNames'
import { PageContainer } from './layout/PageContainer'
import { PageHeader } from './layout/PageHeader'

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Helper function to get the date range for a given week number in a year
function getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000)

  const start = new Date(firstMonday.getTime() + (weekNumber - 1) * 7 * 86400000)
  const end = new Date(start.getTime() + 6 * 86400000)

  return { start, end }
}

// Get season for ISO week number (Spring: 1-13, Summer: 14-26, Fall: 27-39, Winter: 40-52/53)
function getSeason(weekNumber: number): 'Spring' | 'Summer' | 'Fall' | 'Winter' {
  if (weekNumber >= 1 && weekNumber <= 13) return 'Spring'
  if (weekNumber >= 14 && weekNumber <= 26) return 'Summer'
  if (weekNumber >= 27 && weekNumber <= 39) return 'Fall'
  return 'Winter'
}

// Get week within season
function getWeekInSeason(weekNumber: number): number {
  const season = getSeason(weekNumber)
  switch (season) {
    case 'Spring': return weekNumber
    case 'Summer': return weekNumber - 13
    case 'Fall': return weekNumber - 26
    case 'Winter': return weekNumber - 39
  }
}

// Get season style
function getSeasonStyle(season: 'Spring' | 'Summer' | 'Fall' | 'Winter') {
  switch (season) {
    case 'Spring':
      return {
        icon: Leaf,
        bgGradient: 'from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-900',
        accentColor: 'text-emerald-600',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-700',
        tabBg: 'bg-emerald-500',
        tabHover: 'hover:bg-emerald-600',
      }
    case 'Summer':
      return {
        icon: Sun,
        bgGradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-900',
        accentColor: 'text-amber-600',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
        tabBg: 'bg-amber-500',
        tabHover: 'hover:bg-amber-600',
      }
    case 'Fall':
      return {
        icon: CloudRain,
        bgGradient: 'from-orange-50 to-amber-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-900',
        accentColor: 'text-orange-600',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-700',
        tabBg: 'bg-orange-500',
        tabHover: 'hover:bg-orange-600',
      }
    case 'Winter':
      return {
        icon: Snowflake,
        bgGradient: 'from-sky-50 to-blue-50',
        borderColor: 'border-sky-200',
        textColor: 'text-sky-900',
        accentColor: 'text-sky-600',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-700',
        tabBg: 'bg-sky-500',
        tabHover: 'hover:bg-sky-600',
      }
  }
}

// Get week label (e.g., "Spring week 1")
function getWeekLabel(weekNumber: number): string {
  const season = getSeason(weekNumber)
  const weekInSeason = getWeekInSeason(weekNumber)
  return `${season} week ${weekInSeason}`
}

interface WeekRowProps {
  year: number
  weekNumber: number
  review: string | undefined
  onUpdate: (weekNumber: number, review: string) => void
  onDelete: (weekNumber: number) => void
  isCurrentWeek: boolean
}

function WeekRow({ year, weekNumber, review, onUpdate, onDelete, isCurrentWeek }: WeekRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(review || '')

  const { start, end } = getWeekDateRange(year, weekNumber)
  const dateRange = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const season = getSeason(weekNumber)
  const style = getSeasonStyle(season)

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(weekNumber, editValue.trim())
    } else if (review) {
      onDelete(weekNumber)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(review || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      id={`week-${weekNumber}`}
      className={cn(
        "group relative scroll-mt-6",
        isCurrentWeek && cn("bg-linear-to-br", style.bgGradient, "border-2", style.borderColor, "rounded-xl")
      )}
    >
      <div className="px-5 py-4 flex items-start gap-5">
        {/* Week indicator */}
        <div className="flex-shrink-0 flex items-start gap-3 w-44">
          <div className={cn(
            "mt-1",
            review ? style.accentColor : "text-gray-300"
          )}>
            <Circle className={cn("w-2 h-2", review && "fill-current")} />
          </div>
          <div>
            <div className={cn(
              "font-semibold text-sm",
              isCurrentWeek ? style.textColor : "text-gray-900"
            )}>
              {getWeekLabel(weekNumber)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{dateRange}</div>
            <div className="text-xs text-gray-400 mt-0.5">Week #{weekNumber}</div>
          </div>
        </div>

        {/* Review content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-full px-4 py-3 text-sm border-2 rounded-xl",
                  "focus:outline-none focus:ring-0",
                  `focus:${style.borderColor}`,
                  "resize-none transition-colors bg-white",
                  "placeholder:text-gray-400"
                )}
                rows={4}
                placeholder="Reflect on your week..."
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors",
                    style.tabBg,
                    style.tabHover
                  )}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <span className="text-xs text-gray-400 ml-2">
                  Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to save
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                "cursor-text rounded-xl px-4 py-3 -ml-4 min-h-16 flex items-start",
                "transition-all duration-200",
                "hover:bg-white hover:shadow-sm",
                !review && "border-2 border-dashed border-transparent hover:border-gray-200"
              )}
            >
              {review ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Click to add your weekly reflection...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SeasonSectionProps {
  year: number
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter'
  weeks: number[]
  reviews: Record<number, { review: string }>
  onUpdate: (weekNumber: number, review: string) => void
  onDelete: (weekNumber: number) => void
  currentWeekNumber: number
}

function SeasonSection({ year, season, weeks, reviews, onUpdate, onDelete, currentWeekNumber }: SeasonSectionProps) {
  const style = getSeasonStyle(season)
  const SeasonIcon = style.icon
  const reviewCount = weeks.filter(w => reviews[w]?.review).length

  if (weeks.length === 0) return null

  return (
    <div className="mb-8">
      {/* Season header */}
      <div className={cn(
        "mb-4 px-5 py-4 rounded-xl border-2",
        "bg-linear-to-br",
        style.bgGradient,
        style.borderColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SeasonIcon className={cn("w-6 h-6", style.accentColor)} strokeWidth={2.5} />
            <div>
              <h2 className={cn("text-xl font-bold", style.textColor)}>{season}</h2>
              <p className={cn("text-sm", style.accentColor)}>Weeks {weeks[0]} - {weeks[weeks.length - 1]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("px-3 py-1.5 rounded-full font-medium text-sm", style.badgeBg, style.badgeText)}>
              {reviewCount} / {weeks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {weeks.map((weekNumber) => (
          <WeekRow
            key={weekNumber}
            year={year}
            weekNumber={weekNumber}
            review={reviews[weekNumber]?.review}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isCurrentWeek={weekNumber === currentWeekNumber}
          />
        ))}
      </div>
    </div>
  )
}

interface AnnualReviewSectionProps {
  year: number
  review: string | undefined
  onUpdate: (review: string) => void
  onDelete: () => void
  isCurrentYear: boolean
}

function AnnualReviewSection({ year, review, onUpdate, onDelete, isCurrentYear }: AnnualReviewSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(review || '')

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(editValue.trim())
    } else if (review) {
      onDelete()
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(review || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="mb-8">
      <div className={cn(
        "rounded-xl border-2 overflow-hidden",
        "bg-linear-to-br from-purple-50 via-blue-50 to-indigo-50",
        isCurrentYear ? "border-purple-300 shadow-lg" : "border-purple-200"
      )}>
        {/* Header */}
        <div className="px-6 py-5 bg-linear-to-r from-purple-500 to-indigo-500">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
            <div>
              <h2 className="text-2xl font-bold text-white">{year} Annual Review</h2>
              <p className="text-purple-100 text-sm mt-0.5">Reflect on your entire year</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-full px-4 py-3 text-sm border-2 rounded-xl",
                  "focus:outline-none focus:ring-0 focus:border-purple-300",
                  "resize-none transition-colors bg-white",
                  "placeholder:text-gray-400"
                )}
                rows={8}
                placeholder="What were the highlights of your year? What did you learn? What would you do differently?"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <span className="text-xs text-gray-400 ml-2">
                  Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to save
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                "cursor-text rounded-xl px-4 py-3 min-h-32 flex items-start",
                "transition-all duration-200",
                "hover:bg-white hover:shadow-sm",
                !review && "border-2 border-dashed border-purple-200 hover:border-purple-300"
              )}
            >
              {review ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Click to add your annual review...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WeeklyReview() {
  const currentYear = new Date().getFullYear()
  const currentWeekNumber = getISOWeek(new Date())
  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('weekly-review-selected-year')
    return stored ? parseInt(stored, 10) : currentYear
  })
  const [activeSeason, setActiveSeason] = useState<'Spring' | 'Summer' | 'Fall' | 'Winter' | 'Annual'>(() => {
    const stored = localStorage.getItem('weekly-review-active-season')
    if (stored && ['Spring', 'Summer', 'Fall', 'Winter', 'Annual'].includes(stored)) {
      return stored as 'Spring' | 'Summer' | 'Fall' | 'Winter' | 'Annual'
    }
    return getSeason(currentWeekNumber)
  })
  const { reviews, updateReview, removeReview, syncStatus, hasUnsavedChanges, syncNow, isLoading: isLoadingReviews } = useWeekReviews(selectedYear)
  const { review: annualReview, updateReview: updateAnnualReview, removeReview: removeAnnualReview, hasUnsavedChanges: annualHasUnsavedChanges, syncNow: annualSyncNow, isLoading: isLoadingAnnual } = useAnnualReview(selectedYear)

  // Persist selectedYear to localStorage
  useEffect(() => {
    localStorage.setItem('weekly-review-selected-year', selectedYear.toString())
  }, [selectedYear])

  // Persist activeSeason to localStorage
  useEffect(() => {
    localStorage.setItem('weekly-review-active-season', activeSeason)
  }, [activeSeason])

  // Determine if we should show the Annual Review
  const isCurrentYear = selectedYear === currentYear
  const isLastWeekOfYear = currentWeekNumber >= 52
  const showAnnualReview = !isCurrentYear || isLastWeekOfYear

  // Organize weeks by season - only show weeks up to current week for current year
  const seasonData = useMemo(() => {
    const seasons: Record<'Spring' | 'Summer' | 'Fall' | 'Winter', number[]> = {
      Spring: [],
      Summer: [],
      Fall: [],
      Winter: []
    }

    const isCurrentYear = selectedYear === currentYear
    const maxWeek = isCurrentYear ? currentWeekNumber : 52

    // Get all weeks in the year up to maxWeek
    for (let week = 1; week <= maxWeek; week++) {
      const { start, end } = getWeekDateRange(selectedYear, week)
      // Include week if either start or end date is in the selected year
      // This handles week 1 which may start in the previous year
      if (start.getFullYear() === selectedYear || end.getFullYear() === selectedYear) {
        const season = getSeason(week)
        seasons[season].push(week)
      }
    }

    // Reverse each season's weeks to show most recent first
    Object.keys(seasons).forEach(season => {
      seasons[season as keyof typeof seasons].reverse()
    })

    return seasons
  }, [selectedYear, currentYear, currentWeekNumber])

  // Get seasons that have data - reverse order to show most recent season first
  const activeSeasons = useMemo(() => {
    return (['Winter', 'Fall', 'Summer', 'Spring'] as const).filter(s => seasonData[s].length > 0)
  }, [seasonData])

  // Scroll to season or annual review
  const scrollToSeason = (season: 'Spring' | 'Summer' | 'Fall' | 'Winter' | 'Annual') => {
    setActiveSeason(season)
    if (season === 'Annual') {
      const element = document.getElementById('annual-review')
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      const firstWeek = seasonData[season][0]
      if (firstWeek) {
        const element = document.getElementById(`week-${firstWeek}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }


  // Calculate statistics
  const stats = useMemo(() => {
    const totalWeeks = Object.values(seasonData).flatMap(weeks => weeks).length
    const reviewedWeeks = Object.values(reviews).filter(r => r.review).length
    const completionRate = totalWeeks > 0 ? Math.round((reviewedWeeks / totalWeeks) * 100) : 0

    return { totalWeeks, reviewedWeeks, completionRate }
  }, [seasonData, reviews])

  const isLoading = isLoadingReviews || isLoadingAnnual

  // Sidebar content - vertical season navigation
  const sidebarContent = (
    <div className="p-4 flex flex-col gap-2">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        Seasons
      </div>

        {/* Annual Review Tab */}
        {showAnnualReview && (
          <button
            onClick={() => scrollToSeason('Annual')}
            className={cn(
              "relative p-3 rounded-xl transition-all flex flex-col items-center gap-2",
              activeSeason === 'Annual'
                ? "bg-purple-500 text-white shadow-lg"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            )}
          >
            <div className="relative">
              <Sparkles className="w-7 h-7" strokeWidth={2.5} />
              {annualReview?.review && (
                <div className={cn(
                  "absolute -right-2 -top-2 w-2 h-2 rounded-full",
                  activeSeason === 'Annual' ? "bg-white" : "bg-purple-500"
                )} />
              )}
            </div>
            <span className={cn(
              "text-xs font-medium",
              activeSeason === 'Annual' ? "text-white" : "text-gray-700"
            )}>
              Annual
            </span>
          </button>
        )}

        {activeSeasons.map((season) => {
          const style = getSeasonStyle(season)
          const SeasonIcon = style.icon
          const weeks = seasonData[season]
          const reviewCount = weeks.filter(w => reviews[w]?.review).length
          const isActive = activeSeason === season

          return (
            <button
              key={season}
              onClick={() => scrollToSeason(season)}
              className={cn(
                "relative p-3 rounded-xl transition-all flex flex-col items-center gap-2",
                isActive ? cn(style.tabBg, "text-white shadow-lg") : "bg-gray-50 hover:bg-gray-100 text-gray-600"
              )}
            >
              <div className="relative">
                <SeasonIcon className="w-7 h-7" strokeWidth={2.5} />
                <div className={cn(
                  "absolute -right-2 -top-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
                  isActive ? "bg-white text-gray-900" : cn(style.badgeBg, style.badgeText)
                )}>
                  {reviewCount}
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-white" : "text-gray-700"
              )}>
                {season}
              </span>
            </button>
          )
        })}
    </div>
  )

  return (
    <PageContainer
      sidebar={sidebarContent}
      sidebarWidth="narrow"
      header={
        <PageHeader
          title="Weekly Reviews"
          subtitle="Reflect on your journey, week by week"
          icon={Sparkles}
          useGradientTitle={true}
          animateIcon={true}
          sync={{
            status: syncStatus,
            hasUnsavedChanges: hasUnsavedChanges || annualHasUnsavedChanges,
            onSyncNow: hasUnsavedChanges ? syncNow : annualHasUnsavedChanges ? annualSyncNow : undefined
          }}
          yearNav={{
            year: selectedYear,
            onYearChange: setSelectedYear
          }}
        >

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Total Weeks</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalWeeks}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Reviewed</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.reviewedWeeks}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Completion</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.completionRate}%</div>
              </div>
            </div>

            {/* Mobile Horizontal Season Navigation */}
            <div className="md:hidden mt-4 flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 scrollbar-hide">
              {/* Annual Review Tab */}
              {showAnnualReview && (
                <button
                  onClick={() => scrollToSeason('Annual')}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                    activeSeason === 'Annual'
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                  <span>Annual</span>
                  {annualReview?.review && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      activeSeason === 'Annual' ? "bg-white" : "bg-purple-500"
                    )} />
                  )}
                </button>
              )}

              {/* Season Tabs */}
              {activeSeasons.map((season) => {
                const style = getSeasonStyle(season)
                const SeasonIcon = style.icon
                const weeks = seasonData[season]
                const reviewCount = weeks.filter(w => reviews[w]?.review).length
                const isActive = activeSeason === season

                return (
                  <button
                    key={season}
                    onClick={() => scrollToSeason(season)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                      isActive
                        ? cn(style.tabBg, "text-white shadow-md")
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <SeasonIcon className="w-4 h-4" strokeWidth={2.5} />
                    <span>{season}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs font-bold",
                      isActive ? "bg-white/20 text-white" : cn(style.badgeBg, style.badgeText)
                    )}>
                      {reviewCount}
                    </span>
                  </button>
                )
              })}
            </div>
        </PageHeader>
      }
    >
      {/* Loading State */}
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonLoader variant="card" height="200px" />
              <SkeletonLoader variant="card" height="400px" />
              <SkeletonLoader variant="card" height="400px" />
            </div>
          ) : (
            <>
              {/* Annual Review - Only show during the last week of the year */}
              {showAnnualReview && (
                <div id="annual-review">
                  <AnnualReviewSection
                    year={selectedYear}
                    review={annualReview?.review}
                    onUpdate={updateAnnualReview}
                    onDelete={removeAnnualReview}
                    isCurrentYear={selectedYear === currentYear}
                  />
                </div>
              )}

              {/* Seasons */}
              <div className="space-y-0">
                {activeSeasons.map((season) => (
                  <SeasonSection
                    key={season}
                    year={selectedYear}
                    season={season}
                    weeks={seasonData[season]}
                    reviews={reviews}
                    onUpdate={updateReview}
                    onDelete={removeReview}
                    currentWeekNumber={selectedYear === currentYear ? currentWeekNumber : -1}
                  />
                ))}

                {activeSeasons.length === 0 && (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No weeks to review yet</p>
                    <p className="text-gray-400 text-sm mt-1">Start your journey in {selectedYear}</p>
                  </div>
                )}
              </div>
            </>
          )}
    </PageContainer>
  )
}
