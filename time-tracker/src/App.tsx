import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { TimeBlock } from './types/time'
import HandsontableCalendar from './components/calendar/HandsontableCalendar'
import Dashboard from './components/Dashboard'
import { Settings } from './components/Settings'
import Sidebar from './components/Sidebar'
import { formatWeekKey, calculateLastYearWeek, getCurrentYearWeeks } from './utils/date'
import { getWeek, getWeeksBatch, putWeek, exportCSV as apiExportCSV, getSettings, type UserSettings } from './api'
import AppLayout from './components/layout/AppLayout'
import Header from './components/layout/Header'
import { parseTimeCSV } from './utils/csvParser'
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { useLocalStorageSync } from './hooks/useLocalStorageSync'

function App() {
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'log' | 'trends' | 'annual' | 'settings'>('log')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const currentWeekKey = useMemo(() => formatWeekKey(currentDate), [currentDate])
  const [weekStore, setWeekStore] = useState<Record<string, TimeBlock[][]>>({})
  const weekStoreRef = useRef<Record<string, TimeBlock[][]>>({})
  // Initialize metadata synchronously from localStorage for faster loading
  const initialMetadata = useMemo(() => {
    const cached: Record<string, { startingHour: number; theme: string | null }> = {}
    try {
      // Get all localStorage keys that match our metadata pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('week-metadata-')) {
          const weekKey = key.replace('week-metadata-', '')
          const value = localStorage.getItem(key)
          if (value) {
            cached[weekKey] = JSON.parse(value)
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize metadata from localStorage:', err)
    }
    return cached
  }, [])

  const [, setWeekMetadataStore] = useState<Record<string, { startingHour: number; theme: string | null }>>(initialMetadata)
  const weekMetadataStoreRef = useRef<Record<string, { startingHour: number; theme: string | null }>>(initialMetadata)
  const [referenceData, setReferenceData] = useState<TimeBlock[][] | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings>({ subcategories: {} })
  const fetchingWeeks = useRef<Set<string>>(new Set())

  // Get current week metadata
  const currentWeekMetadata = weekMetadataStoreRef.current[currentWeekKey] || { startingHour: 8, theme: null }

  // Memoize sync functions to prevent recreating on every render
  const syncToDatabase = useCallback(async (data: TimeBlock[][]) => {
    const metadata = weekMetadataStoreRef.current[currentWeekKey]
    return await putWeek(currentWeekKey, data, metadata);
  }, [currentWeekKey]);

  const loadFromDatabase = useCallback(async () => {
    const result = await getWeek(currentWeekKey);
    return result?.weekData || null;
  }, [currentWeekKey]);

  // Local storage sync for current week data
  const {
    data: weekData,
    setData: setWeekData,
    syncStatus: weekSyncStatus,
    lastSynced: weekLastSynced,
    hasUnsavedChanges: weekHasUnsavedChanges,
    syncNow: syncWeekNow,
    error: weekSyncError
  } = useLocalStorageSync({
    storageKey: `week-${currentWeekKey}`,
    syncInterval: 30000, // Sync every 30 seconds
    syncToDatabase,
    loadFromDatabase
  })

  const loadUserSettings = async () => {
    const s = await getSettings()
    if (s) setUserSettings(s)
  }

  useEffect(() => {
    loadUserSettings()
  }, [])

  // Reload settings when navigating to log tab to pick up any changes from settings page
  useEffect(() => {
    if (activeTab === 'log') {
      loadUserSettings()
    }
  }, [activeTab])

  // Initialize weekData with empty data if null
  const currentWeekData = weekData || createEmptyWeekData(currentWeekMetadata.startingHour)

  function createEmptyWeekData(startingHour: number = 8): TimeBlock[][] {
    const timeSlots = 34 // 17 hours * 2 (30-min intervals)
    const days = 7
    return Array.from({ length: days }, (_, day) =>
      Array.from({ length: timeSlots }, (_, timeIndex) => {
        // Calculate time based on starting hour
        const totalMinutes = startingHour * 60 + timeIndex * 30
        const hours = Math.floor(totalMinutes / 60) % 24
        const minutes = totalMinutes % 60

        return {
          id: `${day}-${timeIndex}`,
          time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
          day,
          category: '',
          subcategory: null,
          notes: ''
        }
      })
    )
  }

  // Lazy loading functions for dashboard views
  const loadWeeksForRange = useCallback(async (weekKeys: string[]) => {
    try {
      console.log('loadWeeksForRange - START, weekKeys:', weekKeys)
      console.log('loadWeeksForRange - current store:', Object.keys(weekStoreRef.current))
      console.log('loadWeeksForRange - currently fetching:', Array.from(fetchingWeeks.current))

      // Filter out weeks that are already in store OR currently being fetched
      const keysToFetch = weekKeys.filter(key => !weekStoreRef.current[key] && !fetchingWeeks.current.has(key))

      console.log('loadWeeksForRange - keys to fetch:', keysToFetch)

      if (keysToFetch.length === 0) {
        console.log('loadWeeksForRange - early return, all weeks already loaded or being fetched')
        return // All weeks already loaded or being fetched
      }

      console.log('loadWeeksForRange - PAST THE CHECK, about to mark as fetching')

      // Mark these weeks as being fetched
      keysToFetch.forEach(key => fetchingWeeks.current.add(key))
      console.log('loadWeeksForRange - FETCHING weeks:', keysToFetch)

      try {
        // Fetch missing weeks in batch
        const batchResult = await getWeeksBatch(keysToFetch)
        console.log('loadWeeksForRange - Batch result:', Object.keys(batchResult))

        // Separate weekData and metadata
        const newWeekData: Record<string, TimeBlock[][]> = {}
        const newMetadata: Record<string, { startingHour: number; theme: string | null }> = {}

        Object.entries(batchResult).forEach(([key, metadata]) => {
          if (metadata) {
            newWeekData[key] = metadata.weekData
            const weekMetadata = { startingHour: metadata.startingHour, theme: metadata.theme }
            newMetadata[key] = weekMetadata
            // Cache metadata to localStorage
            localStorage.setItem(`week-metadata-${key}`, JSON.stringify(weekMetadata))
          } else {
            const defaultStartingHour = 8
            const weekMetadata = { startingHour: defaultStartingHour, theme: null }
            newWeekData[key] = createEmptyWeekData(defaultStartingHour)
            newMetadata[key] = weekMetadata
            // Cache metadata to localStorage
            localStorage.setItem(`week-metadata-${key}`, JSON.stringify(weekMetadata))
          }
        })

        console.log('loadWeeksForRange - Adding to store:', Object.keys(newWeekData))

        const updatedWeeks = { ...weekStoreRef.current, ...newWeekData }
        const updatedMetadata = { ...weekMetadataStoreRef.current, ...newMetadata }

        weekStoreRef.current = updatedWeeks
        weekMetadataStoreRef.current = updatedMetadata

        setWeekStore(updatedWeeks)
        setWeekMetadataStore(updatedMetadata)

        console.log('loadWeeksForRange - Updated store keys:', Object.keys(updatedWeeks))
      } finally {
        // Remove from fetching set
        keysToFetch.forEach(key => fetchingWeeks.current.delete(key))
        console.log('loadWeeksForRange - Finished fetching, removed from set')
      }
    } catch (error) {
      console.error('loadWeeksForRange - ERROR:', error)
      throw error
    }
  }, []) // No dependencies - uses refs

  const loadYearWeeks = useCallback(async (year: number) => {
    const yearKeys = getCurrentYearWeeks().filter(key => key.startsWith(`${year}-W`))
    await loadWeeksForRange(yearKeys)
  }, [loadWeeksForRange])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      console.log('[App] Loading week:', currentWeekKey)

      // Try to load metadata from localStorage first
      let cachedMetadata: { startingHour: number; theme: string | null } | null = null
      try {
        const localMetadata = localStorage.getItem(`week-metadata-${currentWeekKey}`)
        if (localMetadata) {
          cachedMetadata = JSON.parse(localMetadata)
          console.log('[App] Loaded metadata from localStorage:', cachedMetadata)
        }
      } catch (err) {
        console.error('[App] Failed to parse localStorage metadata:', err)
      }

      // Load current week data
      const existing = await getWeek(currentWeekKey)

      if (cancelled) return

      console.log('[App] Week data response:', existing)

      if (existing) {
        const updatedWeeks = { ...weekStoreRef.current, [currentWeekKey]: existing.weekData }
        // Use cached metadata if available, otherwise use database metadata
        const metadata = cachedMetadata || {
          startingHour: existing.startingHour ?? 8,
          theme: existing.theme ?? null
        }
        const updatedMetadata = {
          ...weekMetadataStoreRef.current,
          [currentWeekKey]: metadata
        }

        weekStoreRef.current = updatedWeeks
        weekMetadataStoreRef.current = updatedMetadata

        setWeekStore(updatedWeeks)
        setWeekMetadataStore(updatedMetadata)
        setWeekData(existing.weekData)

        // Save metadata to localStorage if we got it from database
        if (!cachedMetadata) {
          localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(metadata))
        }
      } else {
        const defaultStartingHour = 8
        const empty = createEmptyWeekData(defaultStartingHour)
        const emptyMetadata = cachedMetadata || { startingHour: defaultStartingHour, theme: null }

        weekStoreRef.current = { ...weekStoreRef.current, [currentWeekKey]: empty }
        weekMetadataStoreRef.current = { ...weekMetadataStoreRef.current, [currentWeekKey]: emptyMetadata }

        setWeekStore(weekStoreRef.current)
        setWeekMetadataStore(weekMetadataStoreRef.current)
        setWeekData(empty)

        // Save to localStorage and database
        localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(emptyMetadata))
        await putWeek(currentWeekKey, empty, emptyMetadata)
      }

      // Load ghost data (last year's same week)
      const lastYearWeekKey = calculateLastYearWeek(currentWeekKey)
      const ghostData = await getWeek(lastYearWeekKey)
      if (!cancelled) {
        setReferenceData(ghostData?.weekData || null)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekKey])

  const handleUpdateBlock = (day: number, timeIndex: number, block: TimeBlock) => {
    const current = currentWeekData
    const newWeek = [...current]
    newWeek[day] = [...newWeek[day]]
    newWeek[day][timeIndex] = block
    // Save to localStorage immediately, will sync to DB periodically
    setWeekData(newWeek)
    const updated = { ...weekStoreRef.current, [currentWeekKey]: newWeek }
    weekStoreRef.current = updated
    setWeekStore(updated)
  }

  const handleUpdateBlocks = (updates: { day: number, timeIndex: number, block: TimeBlock }[]) => {
    const current = currentWeekData
    // Deep copy enough to be safe
    const newWeek = current.map(dayArr => [...dayArr])

    updates.forEach(({ day, timeIndex, block }) => {
      newWeek[day][timeIndex] = block
    })

    // Save to localStorage immediately, will sync to DB periodically
    setWeekData(newWeek)
    const updated = { ...weekStoreRef.current, [currentWeekKey]: newWeek }
    weekStoreRef.current = updated
    setWeekStore(updated)
  }

  const handleImportCSV = (importedData: TimeBlock[][]) => {
    // Save to localStorage immediately
    setWeekData(importedData)
    const updated = { ...weekStoreRef.current, [currentWeekKey]: importedData }
    weekStoreRef.current = updated
    setWeekStore(updated)
  }
  // keep referenceData state to support future look-back imports
  const handleImportCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const { weekData } = parseTimeCSV(content)
        handleImportCSV(weekData)
      } catch {
        // ignore parsing errors for minimal flow; can surface UI later
      }
    }
    reader.readAsText(file)
  }

  // Handle metadata changes (theme, startingHour)
  const handleMetadataChange = async (newMetadata: { startingHour?: number; theme?: string | null }) => {
    // If changing starting hour and week has data, confirm first
    if (newMetadata.startingHour !== undefined && newMetadata.startingHour !== currentWeekMetadata.startingHour) {
      const hasData = currentWeekData.some(day => day.some(block => block.category || block.notes))

      if (hasData) {
        const confirmed = window.confirm(
          `Warning: This week already has time entries. Changing the starting hour won't update existing time slots.\n\n` +
          `Current range: ${currentWeekMetadata.startingHour}:00 - ${(currentWeekMetadata.startingHour + 17) % 24}:00\n` +
          `New range: ${newMetadata.startingHour}:00 - ${(newMetadata.startingHour + 17) % 24}:00\n\n` +
          `Continue anyway?`
        )

        if (!confirmed) {
          return
        }
      }
    }

    const updatedMetadata = { ...currentWeekMetadata, ...newMetadata }
    const updated = { ...weekMetadataStoreRef.current, [currentWeekKey]: updatedMetadata }

    weekMetadataStoreRef.current = updated
    setWeekMetadataStore(updated)

    // Cache metadata to localStorage for consistency with weekData
    localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(updatedMetadata))

    // Trigger the sync hook by updating weekData to mark as "unsaved changes"
    // This ensures metadata changes go through the same sync mechanism as timesheet data
    setWeekData(currentWeekData)
  }

  useEffect(() => {
    // Force light mode by removing dark class if present
    document.documentElement.classList.remove('dark')
  }, [])

  // Show loading while checking authentication
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Loading...</div>
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AppLayout
      sidebar={<Sidebar active={activeTab} onNavigate={setActiveTab} userEmail={user?.email} onLogout={signOut} />}
      header={
        <Header
          currentDate={currentDate}
          onChangeDate={(d) => setCurrentDate(d)}
          onImportCSVFile={handleImportCSVFile}
          onExportCSV={() => {
            apiExportCSV(currentWeekKey).then(csv => {
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${currentWeekKey}.csv`
              a.click()
            })
          }}
          syncStatus={weekSyncStatus}
          lastSynced={weekLastSynced}
          hasUnsavedChanges={weekHasUnsavedChanges}
          syncError={weekSyncError}
          onSyncNow={syncWeekNow}
        />
      }
    >
      {activeTab === 'log' && currentWeekData && (
        <div className="flex flex-col h-full bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
          {/* Week Theme and Settings */}
          <div className="flex items-center gap-6 mb-6">
            <input
              type="text"
              value={currentWeekMetadata?.theme || ''}
              onChange={(e) => handleMetadataChange({ theme: e.target.value })}
              placeholder="What are you working on this week?"
              className="flex-1 text-2xl font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-300"
            />

            {/* Starting Hour Selector */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Start</span>
              <select
                value={currentWeekMetadata?.startingHour || 8}
                onChange={(e) => handleMetadataChange({ startingHour: parseInt(e.target.value) })}
                className="text-sm font-semibold bg-transparent border-none text-gray-700 focus:outline-none cursor-pointer hover:text-gray-900"
              >
                {[5, 6, 7, 8, 9, 10].map(hour => (
                  <option key={hour} value={hour}>
                    {hour}:00 AM
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timesheet Grid */}
          <div className="flex-1 overflow-auto bg-white rounded-2xl">
            <HandsontableCalendar
              weekData={currentWeekData}
              currentDate={currentDate}
              onUpdateBlock={handleUpdateBlock}
              onUpdateBlocks={handleUpdateBlocks}
              referenceData={referenceData}
              userSettings={userSettings}
            />
          </div>
        </div>
      )}
      {activeTab === 'trends' && (
        <Dashboard
          weekData={currentWeekData}
          weeksStore={weekStore}
          currentWeekKey={currentWeekKey}
          currentDate={currentDate}
          loadWeeksForRange={loadWeeksForRange}
          loadYearWeeks={loadYearWeeks}
          viewMode="trends"
        />
      )}
      {activeTab === 'annual' && (
        <Dashboard
          weekData={currentWeekData}
          weeksStore={weekStore}
          currentWeekKey={currentWeekKey}
          currentDate={currentDate}
          loadWeeksForRange={loadWeeksForRange}
          loadYearWeeks={loadYearWeeks}
          viewMode="annual"
        />
      )}
      {activeTab === 'settings' && <Settings onSettingsSaved={loadUserSettings} />}
    </AppLayout>
  )
}

export default App
