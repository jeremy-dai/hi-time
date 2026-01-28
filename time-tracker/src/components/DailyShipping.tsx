import { useState, useMemo, useEffect, useRef } from 'react'
import { useDailyShipping } from '../hooks/useDailyShipping'
import { useQuarterlyPlan } from '../hooks/useQuarterlyPlan'
import YearNavigator from './shared/YearNavigator'
import TodayPlanBanner from './plan/TodayPlanBanner'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { Package, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '../utils/classNames'

// Helper to format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Helper to get month name
function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('default', { month: 'long' })
}

// Get all dates from start of year to today (or all year if viewing past year)
function getAllDates(year: number): Date[] {
  const today = new Date()
  const currentYear = today.getFullYear()
  const isCurrentYear = year === currentYear

  const endDate = isCurrentYear ? today : new Date(year, 11, 31)
  const dates: Date[] = []

  // Start from most recent and go backwards
  for (let d = new Date(endDate); d >= new Date(year, 0, 1); d.setDate(d.getDate() - 1)) {
    dates.push(new Date(d))
  }

  return dates
}

interface DayRowProps {
  date: Date
  entry: { shipped: string; completed: boolean } | null
  onUpdate: (date: Date, shipped: string, completed: boolean) => void
  isToday: boolean
}

function DayRow({ date, entry, onUpdate, isToday }: DayRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(entry?.shipped || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const monthName = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleEdit = () => {
    setTempValue(entry?.shipped || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(date, tempValue, entry?.completed || false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(entry?.shipped || '')
    setIsEditing(false)
  }

  const handleToggleComplete = () => {
    onUpdate(date, entry?.shipped || '', !(entry?.completed || false))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const hasContent = entry && entry.shipped.trim().length > 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-colors',
        isToday ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        disabled={!hasContent}
        className={cn(
          'flex-shrink-0 transition-colors',
          hasContent ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'
        )}
      >
        {entry?.completed ? (
          <CheckCircle2 size={20} className="text-green-600" />
        ) : (
          <Circle size={20} className="text-gray-400" />
        )}
      </button>

      {/* Date */}
      <div className="flex items-center gap-2 w-navigator-lg">
        <span className={cn(
          'text-sm font-medium',
          isToday ? 'text-emerald-700' : 'text-gray-700'
        )}>
          {dayName}, {monthName} {day}
        </span>
        {isToday && (
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white rounded">
            Today
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center gap-2">
        <Package size={16} className="text-gray-400 flex-shrink-0" />
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="What did you ship today?"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            onClick={handleEdit}
            className={cn(
              'flex-1 px-3 py-1.5 rounded cursor-pointer transition-colors',
              entry?.completed && 'line-through text-gray-500',
              hasContent && !entry?.completed && 'text-gray-900 hover:bg-gray-100',
              !hasContent && 'text-gray-400 italic hover:bg-gray-100'
            )}
          >
            {entry?.shipped || 'What did you ship today?'}
          </div>
        )}
      </div>
    </div>
  )
}

interface MonthSectionProps {
  month: number
  year: number
  dates: Date[]
  entries: Record<string, { shipped: string; completed: boolean }>
  onUpdate: (date: Date, shipped: string, completed: boolean) => void
}

function MonthSection({ month, year, dates, entries, onUpdate }: MonthSectionProps) {
  const monthName = getMonthName(month)
  const today = new Date()

  // Count stats for this month
  const monthDates = dates.filter(d => d.getMonth() + 1 === month)
  const totalDays = monthDates.length
  const filledDays = monthDates.filter(d => {
    const entry = entries[formatDateKey(d)]
    return entry && entry.shipped.trim().length > 0
  }).length
  const completedDays = monthDates.filter(d => {
    const entry = entries[formatDateKey(d)]
    return entry && entry.completed
  }).length

  if (monthDates.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{monthName} {year}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {filledDays}/{totalDays} logged
          </span>
          <span className="text-green-600">
            {completedDays} completed
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {monthDates.map((date) => {
          const dateKey = formatDateKey(date)
          const entry = entries[dateKey] || null
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

          return (
            <DayRow
              key={dateKey}
              date={date}
              entry={entry}
              onUpdate={onUpdate}
              isToday={isToday}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function DailyShipping() {
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState(currentYear)

  const { entries: entriesData, isLoading, syncStatus, lastSynced, hasUnsavedChanges, updateEntry } = useDailyShipping(selectedYear)
  const planData = useQuarterlyPlan()

  // Convert simple string entries to full objects
  const entries = useMemo(() => {
    const result: Record<string, { shipped: string; completed: boolean }> = {}
    Object.entries(entriesData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = { shipped: value, completed: false }
      } else {
        result[key] = value
      }
    })
    return result
  }, [entriesData])

  const allDates = useMemo(() => getAllDates(selectedYear), [selectedYear])

  const handleUpdate = (date: Date, shipped: string, completed: boolean) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    updateEntry(year, month, day, shipped, completed)
  }

  // Calculate stats
  const totalDays = allDates.length
  const filledDays = allDates.filter(d => {
    const entry = entries[formatDateKey(d)]
    return entry && entry.shipped.trim().length > 0
  }).length
  const completedDays = allDates.filter(d => {
    const entry = entries[formatDateKey(d)]
    return entry && entry.completed
  }).length
  const emptyDays = totalDays - filledDays

  // Get unique months present in the dates
  const monthsPresent = useMemo(() => {
    const months = new Set(allDates.map(d => d.getMonth() + 1))
    return Array.from(months).sort((a, b) => b - a)
  }, [allDates])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Plan Banner */}
      <TodayPlanBanner planData={planData} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Shipping Log</h1>
              <p className="text-gray-600">
                📦 What did you ship today? Check it off when done.
              </p>
            </div>

            {/* Year Navigator */}
            <YearNavigator
              year={selectedYear}
              onYearChange={setSelectedYear}
              maxYear={currentYear}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xl font-bold text-gray-900">{totalDays}</div>
              <div className="text-xs text-gray-600">Total Days</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="text-xl font-bold text-emerald-900">{filledDays}</div>
              <div className="text-xs text-emerald-700">Logged</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xl font-bold text-green-900">{completedDays}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-xl font-bold text-red-900">{emptyDays}</div>
              <div className="text-xs text-red-700">Empty</div>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mt-4 flex items-center justify-end px-4 py-2 bg-white/60 rounded-xl">
            <SyncStatusIndicator
              status={syncStatus}
              lastSynced={lastSynced}
              hasUnsavedChanges={hasUnsavedChanges}
              compact={true}
            />
          </div>

        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {monthsPresent.map((month) => (
            <MonthSection
              key={month}
              month={month}
              year={selectedYear}
              dates={allDates}
              entries={entries}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
