import { useState, useEffect, useMemo, useCallback } from 'react'
import type { TimeBlock } from './types/time'
import HandsontableCalendar from './components/calendar/HandsontableCalendar'
import Dashboard from './components/Dashboard'
import { Settings } from './components/Settings'
import Sidebar from './components/Sidebar'
import { formatWeekKey, calculateLastYearWeek } from './utils/date'
import { listWeeks, getWeek, putWeek, exportCSV as apiExportCSV, getSettings, type UserSettings } from './api'
import AppLayout from './components/layout/AppLayout'
import Header from './components/layout/Header'
import { parseTimeCSV } from './utils/csvParser'
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { useLocalStorageSync } from './hooks/useLocalStorageSync'

function App() {
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'log' | 'dashboard' | 'settings'>('log')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const currentWeekKey = useMemo(() => formatWeekKey(currentDate), [currentDate])
  const [weekStore, setWeekStore] = useState<Record<string, TimeBlock[][]>>({})
  const [referenceData, setReferenceData] = useState<TimeBlock[][] | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings>({ subcategories: {} })

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
        category: '',
        subcategory: '',
        notes: ''
      }))
    )
  }

  useEffect(() => {
    ;(async () => {
      const keys = await listWeeks()
      const store: Record<string, TimeBlock[][]> = {}
      for (const k of keys) {
        const wd = await getWeek(k)
        if (wd) store[k] = wd
      }
      setWeekStore(store)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      // Load current week data
      const existing = await getWeek(currentWeekKey)
      if (existing) {
        setWeekStore(prev => ({ ...prev, [currentWeekKey]: existing }))
        setWeekData(existing)
      } else {
        const empty = createEmptyWeekData()
        setWeekStore(prev => ({ ...prev, [currentWeekKey]: empty }))
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
    setWeekStore(prev => ({ ...prev, [currentWeekKey]: newWeek }))
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
    setWeekStore(prev => ({ ...prev, [currentWeekKey]: newWeek }))
  }

  const handleImportCSV = (importedData: TimeBlock[][]) => {
    // Save to localStorage immediately
    setWeekData(importedData)
    setWeekStore(prev => ({ ...prev, [currentWeekKey]: importedData }))
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
      {activeTab === 'dashboard' && <Dashboard weekData={currentWeekData} weeksStore={weekStore} />}
      {activeTab === 'settings' && <Settings onSettingsSaved={loadUserSettings} />}
    </AppLayout>
  )
}

export default App
