import { useState, useRef, useEffect, useMemo } from 'react'
import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import { useDailyShipping } from '../../hooks/useDailyShipping'
import { KPICard } from './components/KPICard'
import { ActiveMissionCard } from './components/ActiveMissionCard'
import { CycleCard } from './components/CycleCard'
import { SyncStatusIndicator } from '../SyncStatusIndicator'
import { Package, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface MissionControlProps {
  data: UseQuarterlyPlanReturn
}

// Get the week dates for a given date
function getWeekRange(date: Date): { start: Date; end: Date; dates: Date[] } {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const start = new Date(d)
  start.setDate(d.getDate() - day) // Start from Sunday
  const end = new Date(start)
  end.setDate(start.getDate() + 6) // End on Saturday

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }

  return { start, end, dates }
}

// Format date for display
function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Weekly Shipping Component
function WeeklyShipping() {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const selectedDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(today.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekRange = useMemo(() => getWeekRange(selectedDate), [selectedDate])
  const year = weekRange.start.getFullYear()
  const endYear = weekRange.end.getFullYear()

  // We may need entries from two different years if week spans year boundary
  const { entries: entriesThisYear, updateEntry: updateEntryThisYear, isLoading: loadingThisYear, syncStatus } = useDailyShipping(year)
  const { entries: entriesNextYear, updateEntry: updateEntryNextYear, isLoading: loadingNextYear } = useDailyShipping(endYear !== year ? endYear : year)

  const isLoading = loadingThisYear || (endYear !== year && loadingNextYear)

  const getEntry = (date: Date) => {
    const dateKey = formatDateKey(date)
    const y = date.getFullYear()
    return y === year ? entriesThisYear[dateKey] : entriesNextYear[dateKey]
  }

  const handleUpdateEntry = (date: Date, shipped: string, completed: boolean) => {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    if (y === year) {
      updateEntryThisYear(y, m, d, shipped, completed)
    } else {
      updateEntryNextYear(y, m, d, shipped, completed)
    }
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    return date < todayStart
  }

  // Inline editing state
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingDate && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingDate])

  const startEditing = (date: Date) => {
    const dateKey = formatDateKey(date)
    const entry = getEntry(date)
    setEditingDate(dateKey)
    setTempValue(entry?.shipped || '')
  }

  const saveEdit = (date: Date) => {
    const entry = getEntry(date)
    handleUpdateEntry(date, tempValue, entry?.completed || false)
    setEditingDate(null)
    setTempValue('')
  }

  const toggleComplete = (date: Date) => {
    const entry = getEntry(date)
    if (entry?.shipped) {
      handleUpdateEntry(date, entry.shipped, !entry.completed)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const weekLabel = weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' - ' + weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-linear-to-br from-white via-emerald-50/30 to-white rounded-xl border border-emerald-200 shadow-lg shadow-emerald-100/20 p-5 h-full flex flex-col">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between mb-5 min-h-[28px]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-linear-to-br from-emerald-100 to-emerald-50 rounded-lg shadow-sm">
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Daily Shipping</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 min-w-[140px] text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            disabled={weekOffset >= 0}
            className={cn(
              'p-1 hover:bg-white rounded transition-colors',
              weekOffset >= 0 && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-emerald-600 hover:text-emerald-700 ml-2"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Week grid */}
      <div className="space-y-1 flex-1">
        {weekRange.dates.map((date) => {
          const dateKey = formatDateKey(date)
          const entry = getEntry(date)
          const hasContent = entry?.shipped && entry.shipped.trim().length > 0
          const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
          const dateLabel = date.getDate()

          return (
            <div
              key={dateKey}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                isToday(date) && 'bg-emerald-100/50 border border-emerald-200',
                !isToday(date) && isPast(date) && !hasContent && 'opacity-50'
              )}
            >
              {/* Date */}
              <div className="w-12 shrink-0 text-center">
                <div className={cn(
                  'text-xs font-medium',
                  isToday(date) ? 'text-emerald-700' : 'text-gray-500'
                )}>
                  {dayLabel}
                </div>
                <div className={cn(
                  'text-lg font-bold',
                  isToday(date) ? 'text-emerald-700' : 'text-gray-700'
                )}>
                  {dateLabel}
                </div>
              </div>

              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(date)}
                disabled={!hasContent}
                className={cn(
                  'shrink-0 transition-colors',
                  hasContent ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'
                )}
              >
                {entry?.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Input/Display */}
              {editingDate === dateKey ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      saveEdit(date)
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      setEditingDate(null)
                    }
                  }}
                  onBlur={() => saveEdit(date)}
                  placeholder="What did you ship?"
                  className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <div
                  onClick={() => startEditing(date)}
                  className={cn(
                    'flex-1 px-2 py-1 text-sm rounded cursor-pointer transition-colors min-h-[28px]',
                    entry?.completed && 'line-through text-gray-500',
                    hasContent && !entry?.completed && 'text-gray-900 hover:bg-white/50',
                    !hasContent && 'text-gray-400 italic hover:bg-white/50'
                  )}
                >
                  {entry?.shipped || (isToday(date) ? 'What will you ship today?' : 'What did you ship?')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sync status */}
      <div className="mt-3 pt-3 border-t border-emerald-200/50 flex justify-end">
        <SyncStatusIndicator
          status={syncStatus}
          lastSynced={null}
          hasUnsavedChanges={syncStatus === 'pending'}
          compact
        />
      </div>
    </div>
  )
}

export function MissionControl({ data }: MissionControlProps) {
  const {
    planData,
    trackers,
    updateTrackerValue,
    allWeeks,
    currentWeek,
    currentCycle,
    currentWeekIndex,
    cycles,
    updateTodoStatus,
    updateDeliverableStatus,
    updateCycleDetails,
    updateWeekComprehensive,
    deleteWeek
  } = data

  const areTrackersComputed = !!planData?.work_types

  // Get current cycle index (1-based)
  const currentCycleIndex = currentCycle
    ? cycles.findIndex(c => c.id === currentCycle.id) + 1
    : undefined

  // Calculate cycle-specific trackers
  const cycleTrackers = useMemo(() => {
    if (!currentCycle || !planData?.work_types) return trackers

    // For computed trackers (work_types), recalculate based on current cycle's weeks only
    return planData.work_types.map(wt => {
      let total = 0
      let completed = 0

      // Count todos in current cycle only
      for (const week of currentCycle.weeks) {
        for (const todo of week.todos) {
          if (todo.typeId === wt.name) {
            total++
            if (todo.status === 'done') {
              completed++
            }
          }
        }
      }

      return {
        id: wt.name,
        name: wt.name,
        unit: undefined,
        baseline: 0,
        target: total,
        current: completed,
        color: (wt as any).color
      }
    })
  }, [currentCycle, planData?.work_types, trackers])

  // Get upcoming weeks (next 3 after current)
  const upcomingWeeks = currentWeek
    ? allWeeks
        .filter(w => w.weekNumber > currentWeekIndex && w.weekNumber <= currentWeekIndex + 3)
        .sort((a, b) => a.weekNumber - b.weekNumber)
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* Cycle and KPIs Section */}
      <div className="space-y-6">
        {/* Current Cycle */}
        {currentCycle && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-1 bg-linear-to-b from-emerald-500 to-teal-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Current Cycle</h2>
            </div>
            <CycleCard
              cycle={currentCycle}
              cycleIndex={currentCycleIndex}
              onEdit={(details) => updateCycleDetails(currentCycle.id, details)}
              onStatusChange={(status) => updateCycleDetails(currentCycle.id, { status })}
            />
          </div>
        )}

        {/* KPIs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900">
              Key Performance Indicators
              {currentCycle && <span className="text-sm font-normal text-gray-500 ml-2">(Current Cycle)</span>}
            </h2>
          </div>
          {cycleTrackers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {cycleTrackers.map(tracker => (
                <KPICard
                  key={tracker.id}
                  tracker={tracker}
                  onUpdate={areTrackersComputed ? undefined : (value) => updateTrackerValue(tracker.id, value)}
                  compact={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No KPIs defined for this cycle</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* Left Column: Daily Shipping */}
        <WeeklyShipping />

        {/* Right Column: Active Mission */}
        {currentWeek ? (
          <ActiveMissionCard
            week={currentWeek}
            templates={planData?.templates}
            workTypes={planData?.work_types}
            onTodoStatusChange={(todoId, status) => {
              updateTodoStatus(currentWeek.weekNumber, todoId, status)
            }}
            onDeliverableStatusChange={(deliverableId, status) => {
              updateDeliverableStatus(currentWeek.weekNumber, deliverableId, status)
            }}
            onWeekEdit={(updates) => {
              updateWeekComprehensive(currentWeek.weekNumber, updates)
            }}
            onWeekDelete={() => {
              deleteWeek(currentWeek.weekNumber)
            }}
          />
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            {planData ? 'No active week found. You may be ahead of or behind the plan schedule.' : 'Import a plan to get started.'}
          </div>
        )}
      </div>

      {/* Upcoming Trajectory (Full Width) */}
      {upcomingWeeks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-linear-to-b from-purple-500 to-indigo-600 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Upcoming Trajectory</h3>
          </div>
          <div className="relative pl-6 space-y-4">
            {/* Connector line */}
            <div className="absolute left-6 top-2 bottom-4 w-0.5 bg-linear-to-b from-purple-200 via-indigo-200 to-transparent" />

            {upcomingWeeks.map((w) => (
              <div key={w.weekNumber} className="relative pl-8 group">
                {/* Node */}
                <div className="absolute left-[-4px] top-2 w-4 h-4 rounded-full border-2 border-white bg-linear-to-br from-purple-400 to-indigo-500 shadow-md shadow-purple-200 ring-2 ring-purple-50 transition-all group-hover:scale-125" />

                <div className="bg-linear-to-br from-white to-purple-50/20 rounded-xl border border-purple-100 p-4 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-linear-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Week {w.weekNumber}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {w.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{w.theme || w.name}</h4>
                  {w.goals && w.goals.length > 0 && (
                    <p className="text-sm text-gray-600">{w.goals.join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
