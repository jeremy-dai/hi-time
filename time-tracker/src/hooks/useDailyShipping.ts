import { useState, useEffect, useCallback, useRef } from 'react'
import type { DailyShipping, YearDailyShipping } from '../types/time'
import { getYearDailyShipping, saveDailyShipping, deleteDailyShipping } from '../api'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'error'

// Helper to format date as YYYY-MM-DD
function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function useDailyShipping(year: number) {
  const [entries, setEntries] = useState<Record<string, { shipped: string; completed: boolean }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const pendingEntryRef = useRef<DailyShipping | null>(null)

  // Load from database on mount, fallback to localStorage
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadEntries = async () => {
      setIsLoading(true)
      const localKey = `daily-shipping-${year}`

      // Try loading from database first
      try {
        const dbData = await getYearDailyShipping(year)
        if (!cancelled && dbData) {
          // Convert DailyShipping objects to our format
          const entriesMap: Record<string, { shipped: string; completed: boolean }> = {}
          Object.entries(dbData.entries || {}).forEach(([dateKey, entry]) => {
            entriesMap[dateKey] = {
              shipped: entry.shipped,
              completed: entry.completed || false
            }
          })
          setEntries(entriesMap)
          // Update localStorage cache
          localStorage.setItem(localKey, JSON.stringify(dbData))
          setSyncStatus('synced')
          setLastSynced(new Date())
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to load daily shipping from database:', err)
      }

      // Fallback to localStorage if database fails or returns null
      if (!cancelled) {
        const stored = localStorage.getItem(localKey)
        if (stored) {
          try {
            const parsed: YearDailyShipping = JSON.parse(stored)
            const entriesMap: Record<string, { shipped: string; completed: boolean }> = {}
            Object.entries(parsed.entries || {}).forEach(([dateKey, entry]) => {
              entriesMap[dateKey] = {
                shipped: entry.shipped,
                completed: entry.completed || false
              }
            })
            setEntries(entriesMap)
            // Mark as pending sync since we loaded from localStorage
            setSyncStatus('pending')
          } catch (err) {
            console.error('Failed to parse daily shipping from localStorage:', err)
          }
        }
        setIsLoading(false)
      }
    }

    loadEntries()

    return () => {
      cancelled = true
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [year])

  // Sync single entry to database with debouncing
  const syncEntryToDatabase = useCallback(async (entry: DailyShipping) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await saveDailyShipping(entry)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync daily shipping to database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [])

  // Delete entry from database
  const syncDeleteToDatabase = useCallback(async (dateKey: string) => {
    if (!isMountedRef.current) return

    const [, monthStr, dayStr] = dateKey.split('-')
    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    setSyncStatus('syncing')

    try {
      const success = await deleteDailyShipping(year, month, day)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to delete daily shipping from database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year])

  const updateEntry = useCallback((year: number, month: number, day: number, shipped: string, completed: boolean) => {
    const dateKey = formatDateKey(year, month, day)

    // If shipped is empty, remove the entry
    if (!shipped.trim()) {
      const { [dateKey]: _, ...rest } = entries
      setEntries(rest)

      // Save to localStorage immediately
      const localKey = `daily-shipping-${year}`
      const fullEntries: Record<string, DailyShipping> = {}
      Object.entries(rest).forEach(([key, value]) => {
        const [y, m, d] = key.split('-').map(Number)
        fullEntries[key] = {
          year: y,
          month: m,
          day: d,
          shipped: value.shipped,
          completed: value.completed,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      })
      const data: YearDailyShipping = { year, entries: fullEntries }
      localStorage.setItem(localKey, JSON.stringify(data))

      // Clear any pending sync for this entry
      if (pendingEntryRef.current && formatDateKey(pendingEntryRef.current.year, pendingEntryRef.current.month, pendingEntryRef.current.day) === dateKey) {
        pendingEntryRef.current = null
      }

      // Cancel pending timeout and sync deletion immediately
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }

      syncDeleteToDatabase(dateKey)
      return
    }

    // Create the entry object
    const entry: DailyShipping = {
      year,
      month,
      day,
      shipped,
      completed,
      createdAt: Date.now(), // In a real implementation, we'd preserve the original createdAt
      updatedAt: Date.now()
    }

    const updated = { ...entries, [dateKey]: { shipped, completed } }
    setEntries(updated)

    // Save to localStorage immediately (with full objects for compatibility)
    const localKey = `daily-shipping-${year}`
    const fullEntries: Record<string, DailyShipping> = {}
    Object.entries(updated).forEach(([key, value]) => {
      const [y, m, d] = key.split('-').map(Number)
      fullEntries[key] = {
        year: y,
        month: m,
        day: d,
        shipped: value.shipped,
        completed: value.completed,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    })
    const data: YearDailyShipping = { year, entries: fullEntries }
    localStorage.setItem(localKey, JSON.stringify(data))

    // Debounce database sync (5 seconds)
    setSyncStatus('pending')
    pendingEntryRef.current = entry

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (pendingEntryRef.current) {
        syncEntryToDatabase(pendingEntryRef.current)
        pendingEntryRef.current = null
      }
    }, 5000)
  }, [entries, syncEntryToDatabase, syncDeleteToDatabase])

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (syncStatus === 'syncing' || !pendingEntryRef.current) return

    // Clear any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    // Sync immediately
    const entryToSync = pendingEntryRef.current
    pendingEntryRef.current = null
    await syncEntryToDatabase(entryToSync)
  }, [syncEntryToDatabase, syncStatus])

  // Track if there are unsaved changes
  const hasUnsavedChanges = syncStatus === 'pending'

  return {
    entries,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    updateEntry,
    syncNow
  }
}
