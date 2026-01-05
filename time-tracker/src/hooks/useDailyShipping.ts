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
  const isMountedRef = useRef(true)

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
    }
  }, [year])

  // Helper to save entries to localStorage
  const saveToLocalStorage = useCallback((updatedEntries: Record<string, { shipped: string; completed: boolean }>) => {
    const localKey = `daily-shipping-${year}`
    const fullEntries: Record<string, DailyShipping> = {}
    Object.entries(updatedEntries).forEach(([key, value]) => {
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
  }, [year])

  const updateEntry = useCallback(async (year: number, month: number, day: number, shipped: string, completed: boolean) => {
    const dateKey = formatDateKey(year, month, day)
    setSyncStatus('syncing')

    // If shipped is empty, remove the entry
    if (!shipped.trim()) {
      // Optimistically remove from UI
      const optimisticEntries = { ...entries }
      delete optimisticEntries[dateKey]
      setEntries(optimisticEntries)
      saveToLocalStorage(optimisticEntries)

      // Delete from database
      const [, monthStr, dayStr] = dateKey.split('-')
      const month = parseInt(monthStr, 10)
      const day = parseInt(dayStr, 10)

      try {
        const success = await deleteDailyShipping(year, month, day)

        if (!isMountedRef.current) return

        if (success) {
          setSyncStatus('synced')
          setLastSynced(new Date())
        } else {
          // Revert on failure
          setEntries(entries)
          saveToLocalStorage(entries)
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to delete daily shipping from database:', err)
        if (isMountedRef.current) {
          // Revert on failure
          setEntries(entries)
          saveToLocalStorage(entries)
          setSyncStatus('error')
        }
      }
      return
    }

    // Optimistically update UI
    const optimisticEntries = { ...entries, [dateKey]: { shipped, completed } }
    setEntries(optimisticEntries)
    saveToLocalStorage(optimisticEntries)

    // Create the entry object for database
    const entry: DailyShipping = {
      year,
      month,
      day,
      shipped,
      completed,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Sync to database
    try {
      const success = await saveDailyShipping(entry)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        // Revert on failure
        setEntries(entries)
        saveToLocalStorage(entries)
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync daily shipping to database:', err)
      if (isMountedRef.current) {
        // Revert on failure
        setEntries(entries)
        saveToLocalStorage(entries)
        setSyncStatus('error')
      }
    }
  }, [entries, saveToLocalStorage, year])

  // Track if there are unsaved changes
  const hasUnsavedChanges = syncStatus === 'syncing'

  return {
    entries,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    updateEntry
  }
}
