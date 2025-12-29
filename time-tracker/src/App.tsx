import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { TimeBlock } from './types/time'
import HandsontableCalendar from './components/calendar/HandsontableCalendar'
import Dashboard from './components/Dashboard'
import { Settings } from './components/Settings'
import Memories from './components/Memories'
import Sidebar from './components/Sidebar'
import { formatWeekKey, calculateLastYearWeek, getCurrentYearWeeks } from './utils/date'
import { getWeek, getWeeksBatch, putWeek, exportCSV as apiExportCSV, getSettings, type UserSettings } from './api'
import AppLayout from './components/layout/AppLayout'
import Header from './components/layout/Header'
import { parseTimeCSV } from './utils/csvParser'
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { useLocalStorageSync } from './hooks/useLocalStorageSync'
import { ToastProvider } from './components/shared/ToastContext'
import { ToastContainer } from './components/shared/Toast'
import { Modal } from './components/shared/Modal'

function App() {
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth()
  const [showStartingHourWarning, setShowStartingHourWarning] = useState(false)
  const [pendingStartingHour, setPendingStartingHour] = useState<number | null>(null)

  // Initialize activeTab from localStorage, default to 'timesheet' if not found
  const [activeTab, setActiveTab] = useState<'timesheet' | 'trends' | 'annual' | 'memories' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('active-tab')
      if (saved && ['timesheet', 'trends', 'annual', 'memories', 'settings'].includes(saved)) {
        return saved as 'timesheet' | 'trends' | 'annual' | 'memories' | 'settings'
      }
    } catch (err) {
      console.error('Failed to load active tab from localStorage:', err)
    }
    return 'timesheet'
  })
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentDateState, setCurrentDateState] = useState<Date>(() => {
    const now = new Date()
    // Convert to UTC date at noon to avoid day boundary issues
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
  })
  const currentWeekKey = useMemo(() => formatWeekKey(currentDateState), [currentDateState])
  const [weekStore, setWeekStore] = useState<Record<string, TimeBlock[][]>>({})
  const weekStoreRef = useRef<Record<string, TimeBlock[][]>>({})
  // Staleness threshold for cached metadata (1 hour, consistent with weeksheet data)
  const METADATA_STALENESS_THRESHOLD = 60 * 60 * 1000 // 1 hour

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
            try {
              const parsed = JSON.parse(value)
              // Check if it's the new format with timestamp
              if (parsed.data && parsed.timestamp !== undefined) {
                const age = Date.now() - parsed.timestamp
                // Only use if fresh (within staleness threshold)
                if (age < METADATA_STALENESS_THRESHOLD) {
                  cached[weekKey] = parsed.data
                }
                // If stale, skip it (will be loaded from database)
              } else {
                // Old format without timestamp - still use it but it will be migrated
                cached[weekKey] = parsed
              }
            } catch (parseErr) {
              console.error(`Failed to parse metadata for ${weekKey}:`, parseErr)
            }
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
  // Initialize with default settings (timezone will be loaded from user-settings via useLocalStorageSync)
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    return {
      subcategories: {},
      timezone: 'Asia/Shanghai' // Default, will be overridden by settings load
    }
  })
  const fetchingWeeks = useRef<Set<string>>(new Set())
  
  // Get timezone from userSettings or default to Beijing
  const currentTimezone = userSettings?.timezone || 'Asia/Shanghai'

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

  // Wrapper for setCurrentDate that syncs before changing weeks
  const setCurrentDate = useCallback(async (newDate: Date) => {
    const newWeekKey = formatWeekKey(newDate)

    // If changing weeks and there are unsaved changes, sync first
    if (newWeekKey !== currentWeekKey && syncWeekNow && weekHasUnsavedChanges) {
      setIsNavigating(true)
      try {
        await syncWeekNow()
      } catch (err) {
        console.error('[App] Failed to sync before week change:', err)
        // Continue anyway - periodic sync will retry
      } finally {
        setIsNavigating(false)
      }
    }

    setCurrentDateState(newDate)
  }, [currentWeekKey, syncWeekNow, weekHasUnsavedChanges])

  const loadUserSettings = async () => {
    const s = await getSettings()
    if (s) {
      setUserSettings(s)
    }
  }

  useEffect(() => {
    loadUserSettings()
  }, [])

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('active-tab', activeTab)
    } catch (err) {
      console.error('Failed to save active tab to localStorage:', err)
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
      // Filter out weeks that are already in store OR currently being fetched
      const keysToFetch = weekKeys.filter(key => !weekStoreRef.current[key] && !fetchingWeeks.current.has(key))

      if (keysToFetch.length === 0) {
        return // All weeks already loaded or being fetched
      }

      // Mark these weeks as being fetched
      keysToFetch.forEach(key => fetchingWeeks.current.add(key))

      try {
        // Fetch missing weeks in batch
        const batchResult = await getWeeksBatch(keysToFetch)

        // Separate weekData and metadata
        const newWeekData: Record<string, TimeBlock[][]> = {}
        const newMetadata: Record<string, { startingHour: number; theme: string | null }> = {}

        Object.entries(batchResult).forEach(([key, metadata]) => {
          if (metadata) {
            newWeekData[key] = metadata.weekData
            const weekMetadata = { startingHour: metadata.startingHour, theme: metadata.theme }
            newMetadata[key] = weekMetadata
            // Cache metadata to localStorage with timestamp (for staleness detection)
            const cachedMetadata = {
              data: weekMetadata,
              timestamp: Date.now()
            }
            localStorage.setItem(`week-metadata-${key}`, JSON.stringify(cachedMetadata))
          } else {
            const defaultStartingHour = 8
            const weekMetadata = { startingHour: defaultStartingHour, theme: null }
            newWeekData[key] = createEmptyWeekData(defaultStartingHour)
            newMetadata[key] = weekMetadata
            // Cache metadata to localStorage with timestamp
            const cachedMetadata = {
              data: weekMetadata,
              timestamp: Date.now()
            }
            localStorage.setItem(`week-metadata-${key}`, JSON.stringify(cachedMetadata))
          }
        })

        const updatedWeeks = { ...weekStoreRef.current, ...newWeekData }
        const updatedMetadata = { ...weekMetadataStoreRef.current, ...newMetadata }

        weekStoreRef.current = updatedWeeks
        weekMetadataStoreRef.current = updatedMetadata

        setWeekStore(updatedWeeks)
        setWeekMetadataStore(updatedMetadata)
      } finally {
        // Remove from fetching set
        keysToFetch.forEach(key => fetchingWeeks.current.delete(key))
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
      // Try to load metadata from localStorage first (with staleness check)
      let cachedMetadata: { startingHour: number; theme: string | null } | null = null
      try {
        const localMetadata = localStorage.getItem(`week-metadata-${currentWeekKey}`)
        if (localMetadata) {
          const parsed = JSON.parse(localMetadata)
          // Check if it's the new format with timestamp
          if (parsed.data && parsed.timestamp !== undefined) {
            const age = Date.now() - parsed.timestamp
            // Only use if fresh (within staleness threshold)
            if (age < METADATA_STALENESS_THRESHOLD) {
              cachedMetadata = parsed.data
            }
            // If stale, skip it (will load from database)
          } else {
            // Old format without timestamp - use it but will be migrated
            cachedMetadata = parsed
          }
        }
      } catch (err) {
        console.error('[App] Failed to parse localStorage metadata:', err)
      }

      // Load current week data
      const existing = await getWeek(currentWeekKey)

      if (cancelled) return

      if (existing) {
        const updatedWeeks = { ...weekStoreRef.current, [currentWeekKey]: existing.weekData }
        // Use cached metadata if available and fresh, otherwise use database metadata
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

        // Save metadata to localStorage with timestamp if we got it from database
        if (!cachedMetadata) {
          const cachedMetadataWithTimestamp = {
            data: metadata,
            timestamp: Date.now()
          }
          localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(cachedMetadataWithTimestamp))
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

        // Save to localStorage with timestamp and database
        const cachedMetadataWithTimestamp = {
          data: emptyMetadata,
          timestamp: Date.now()
        }
        localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(cachedMetadataWithTimestamp))
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
        // Show modal instead of window.confirm
        setPendingStartingHour(newMetadata.startingHour)
        setShowStartingHourWarning(true)
        return
      }
    }

    // If no confirmation needed, apply changes directly
    applyMetadataChange(newMetadata)
  }

  // Apply metadata changes (called after confirmation or if no confirmation needed)
  const applyMetadataChange = async (newMetadata: { startingHour?: number; theme?: string | null }) => {

    const updatedMetadata = { ...currentWeekMetadata, ...newMetadata }
    const updated = { ...weekMetadataStoreRef.current, [currentWeekKey]: updatedMetadata }

    weekMetadataStoreRef.current = updated
    setWeekMetadataStore(updated)

    // Cache metadata to localStorage with timestamp (for staleness detection)
    const cachedMetadata = {
      data: updatedMetadata,
      timestamp: Date.now()
    }
    localStorage.setItem(`week-metadata-${currentWeekKey}`, JSON.stringify(cachedMetadata))

    // Persist metadata immediately so theme/starting hour changes aren't lost
    const weekDataForSave = weekStoreRef.current[currentWeekKey] || currentWeekData
    if (weekDataForSave) {
      try {
        await putWeek(currentWeekKey, weekDataForSave, updatedMetadata)
      } catch (err) {
        console.error('[App] Failed to persist metadata change:', err)
      }
    }

    // Trigger the sync hook by updating weekData to mark as "unsaved changes"
    // This keeps local cache aligned with metadata changes for the current session
    setWeekData([...currentWeekData])
  }

  // Update theme for any week (used by Annual Dashboard)
  const handleUpdateWeekTheme = useCallback(async (weekKey: string, theme: string) => {
    const existingMetadata = weekMetadataStoreRef.current[weekKey] || { startingHour: 8, theme: null }
    const updatedMetadata = { ...existingMetadata, theme: theme || null }

    // Update local state
    const updated = { ...weekMetadataStoreRef.current, [weekKey]: updatedMetadata }
    weekMetadataStoreRef.current = updated
    setWeekMetadataStore(updated)

    // Cache to localStorage
    const cachedMetadata = {
      data: updatedMetadata,
      timestamp: Date.now()
    }
    localStorage.setItem(`week-metadata-${weekKey}`, JSON.stringify(cachedMetadata))

    // Save to database - load week data if not in store
    let weekData = weekStoreRef.current[weekKey]
    if (!weekData) {
      // Load from database to get the week data
      const result = await getWeek(weekKey)
      if (result) {
        weekData = result.weekData
        // Update store with loaded data
        weekStoreRef.current = { ...weekStoreRef.current, [weekKey]: weekData }
        setWeekStore(weekStoreRef.current)
      } else {
        // Week doesn't exist yet, create empty week data
        weekData = createEmptyWeekData(updatedMetadata.startingHour)
        weekStoreRef.current = { ...weekStoreRef.current, [weekKey]: weekData }
        setWeekStore(weekStoreRef.current)
      }
    }

    // Now save with the week data and updated metadata
    await putWeek(weekKey, weekData, updatedMetadata)
  }, [])

  // Show loading while checking authentication or navigating
  if (authLoading || isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        {isNavigating ? 'Saving changes...' : 'Loading...'}
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <ToastProvider>
      <ToastContainer />
      <AppLayout
      sidebar={
        <Sidebar
          active={activeTab}
          onNavigate={setActiveTab}
          userEmail={user?.email}
          onLogout={signOut}
          currentDate={currentDateState}
        />
      }
      header={activeTab === 'timesheet' ? (
        <Header
          currentDate={currentDateState}
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
          startingHour={currentWeekMetadata.startingHour}
          onChangeStartingHour={(hour) => handleMetadataChange({ startingHour: hour })}
          weekTheme={currentWeekMetadata.theme}
          onChangeWeekTheme={(theme) => handleMetadataChange({ theme })}
        />
      ) : undefined}
    >
      {activeTab === 'timesheet' && currentWeekData && (
        <div className="flex flex-col h-full bg-white rounded-xl p-3 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Timesheet Grid */}
          <div className="flex-1 overflow-auto bg-white rounded-xl">
            <HandsontableCalendar
              weekData={currentWeekData}
              currentDate={currentDateState}
              onUpdateBlock={handleUpdateBlock}
              onUpdateBlocks={handleUpdateBlocks}
              referenceData={referenceData}
              userSettings={userSettings}
              timezone={currentTimezone}
            />
          </div>
        </div>
      )}
      {activeTab === 'trends' && (
        <div className="animate-in fade-in duration-200">
          <Dashboard
            weekData={currentWeekData}
            weeksStore={weekStore}
            weekMetadataStore={weekMetadataStoreRef.current}
            currentWeekKey={currentWeekKey}
            currentDate={currentDateState}
            loadWeeksForRange={loadWeeksForRange}
            loadYearWeeks={loadYearWeeks}
            onUpdateWeekTheme={handleUpdateWeekTheme}
            viewMode="trends"
          />
        </div>
      )}
      {activeTab === 'annual' && (
        <div className="animate-in fade-in duration-200">
          <Dashboard
            weekData={currentWeekData}
            weeksStore={weekStore}
            weekMetadataStore={weekMetadataStoreRef.current}
            currentWeekKey={currentWeekKey}
            currentDate={currentDateState}
            loadWeeksForRange={loadWeeksForRange}
            loadYearWeeks={loadYearWeeks}
            onUpdateWeekTheme={handleUpdateWeekTheme}
            viewMode="annual"
          />
        </div>
      )}
      {activeTab === 'memories' && (
        <div className="animate-in fade-in duration-200">
          <Memories />
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="animate-in fade-in duration-200">
          <Settings onSettingsSaved={loadUserSettings} />
        </div>
      )}
      </AppLayout>

      {/* Starting Hour Warning Modal */}
      <Modal
        isOpen={showStartingHourWarning}
        onClose={() => {
          setShowStartingHourWarning(false)
          setPendingStartingHour(null)
        }}
        title="Change Starting Hour?"
        description={`This week already has time entries. Changing the starting hour won't update existing time slots.\n\nCurrent range: ${currentWeekMetadata.startingHour}:00 - ${(currentWeekMetadata.startingHour + 17) % 24}:00\nNew range: ${pendingStartingHour}:00 - ${((pendingStartingHour || 0) + 17) % 24}:00`}
        icon={
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        variant="warning"
        actions={
          <>
            <button
              onClick={() => {
                setShowStartingHourWarning(false)
                setPendingStartingHour(null)
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (pendingStartingHour !== null) {
                  applyMetadataChange({ startingHour: pendingStartingHour })
                }
                setShowStartingHourWarning(false)
                setPendingStartingHour(null)
              }}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white font-semibold text-sm rounded-xl hover:bg-amber-500 transition-colors shadow-sm"
            >
              Continue Anyway
            </button>
          </>
        }
        closeOnBackdrop={false}
      />
    </ToastProvider>
  )
}

export default App
