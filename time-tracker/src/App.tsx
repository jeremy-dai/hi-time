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
  const [referenceData, setReferenceData] = useState<TimeBlock[][] | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings>({ subcategories: {} })
  const fetchingWeeks = useRef<Set<string>>(new Set())

  // Memoize sync functions to prevent recreating on every render
  const syncToDatabase = useCallback(async (data: TimeBlock[][]) => {
    return await putWeek(currentWeekKey, data);
  }, [currentWeekKey]);

  const loadFromDatabase = useCallback(async () => {
    return await getWeek(currentWeekKey);
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
  const currentWeekData = weekData || createEmptyWeekData()

  function createEmptyWeekData(): TimeBlock[][] {
    const timeSlots = 32
    const days = 7
    return Array.from({ length: days }, (_, day) =>
      Array.from({ length: timeSlots }, (_, timeIndex) => ({
        id: `${day}-${timeIndex}`,
        time: `${String(8 + Math.floor(timeIndex / 2)).padStart(2, '0')}:${timeIndex % 2 === 0 ? '00' : '30'}`,
        day,
        category: '' as any,
        subcategory: null,
        notes: ''
      }))
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
        console.log('loadWeeksForRange - Batch result:', Object.keys(batchResult), 'with data:', Object.entries(batchResult).map(([k, v]) => ({ key: k, hasData: v !== null, dataLength: v?.length })))

        // Update weekStore with fetched weeks (or empty data for weeks that don't exist)
        const newEntries = Object.fromEntries(
          Object.entries(batchResult).map(([key, data]) => [
            key,
            data || createEmptyWeekData()
          ])
        ) as Record<string, TimeBlock[][]>

        console.log('loadWeeksForRange - Adding to store:', Object.keys(newEntries))

        const updated = { ...weekStoreRef.current, ...newEntries }
        weekStoreRef.current = updated
        setWeekStore(updated)
        console.log('loadWeeksForRange - Updated store keys:', Object.keys(updated))
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
    ;(async () => {
      // Load current week data
      const existing = await getWeek(currentWeekKey)
      if (existing) {
        const updated = { ...weekStoreRef.current, [currentWeekKey]: existing }
        weekStoreRef.current = updated
        setWeekStore(updated)
        setWeekData(existing)
      } else {
        const empty = createEmptyWeekData()
        const updated = { ...weekStoreRef.current, [currentWeekKey]: empty }
        weekStoreRef.current = updated
        setWeekStore(updated)
        setWeekData(empty)
        await putWeek(currentWeekKey, empty)
      }

      // Load ghost data (last year's same week)
      const lastYearWeekKey = calculateLastYearWeek(currentWeekKey)
      const ghostData = await getWeek(lastYearWeekKey)
      setReferenceData(ghostData)
    })()
  }, [currentWeekKey])

  useEffect(() => {
    const data = weekStore[currentWeekKey]
    if (data) setWeekData(data)
  }, [weekStore, currentWeekKey])

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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
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
      {activeTab === 'log' && (
        <HandsontableCalendar
          weekData={currentWeekData}
          onUpdateBlock={handleUpdateBlock}
          onUpdateBlocks={handleUpdateBlocks}
          referenceData={referenceData}
          userSettings={userSettings}
        />
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
