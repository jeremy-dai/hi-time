import { useState, useEffect, useCallback, useRef } from 'react'
import type { DailyMemory, YearMemories } from '../types/time'
import { getYearMemories, saveYearMemories } from '../api'
import type { SyncStatus } from './useSyncState'

export function useYearMemories(year: number) {
  const [memories, setMemories] = useState<Record<string, DailyMemory>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  // Load from localStorage first for instant UI, then sync with database
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadMemories = async () => {
      setIsLoading(true)
      const localKey = `year-memories-${year}`

      // Load from localStorage FIRST for instant UI
      const stored = localStorage.getItem(localKey)
      if (stored && !cancelled) {
        try {
          const parsed: YearMemories = JSON.parse(stored)
          setMemories(parsed.memories || {})
          setIsLoading(false) // Show cached data immediately
          setSyncStatus('pending')
        } catch (err) {
          console.error('Failed to parse year memories from localStorage:', err)
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }

      // Then fetch from database to update with fresh data
      try {
        const dbData = await getYearMemories(year)
        if (!cancelled && dbData) {
          setMemories(dbData.memories || {})
          // Update localStorage cache
          localStorage.setItem(localKey, JSON.stringify(dbData))
          setSyncStatus('synced')
          setLastSynced(new Date())
        } else if (!cancelled && !stored) {
          // No data in DB or cache, stay at idle
          setSyncStatus('idle')
        }
      } catch (err) {
        console.error('Failed to load memories from database:', err)
        if (!cancelled && stored) {
          // We have cached data, mark as error but keep showing it
          setSyncStatus('error')
        }
      }
    }

    loadMemories()

    return () => {
      cancelled = true
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [year])

  // Sync to database with debouncing
  const syncToDatabase = useCallback(async (memoriesToSync: Record<string, DailyMemory>) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await saveYearMemories({ year, memories: memoriesToSync })

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync memories to database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year])

  // Save to both localStorage and database (debounced)
  const saveMemories = useCallback((newMemories: Record<string, DailyMemory>) => {
    const key = `year-memories-${year}`
    const data: YearMemories = { year, memories: newMemories }

    // Save to localStorage immediately
    localStorage.setItem(key, JSON.stringify(data))
    setMemories(newMemories)

    // Debounce database sync (5 seconds)
    setSyncStatus('pending')
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToDatabase(newMemories)
    }, 5000)
  }, [year, syncToDatabase])

  const updateMemory = useCallback((date: string, memory: DailyMemory) => {
    const updated = { ...memories, [date]: { ...memory, updatedAt: Date.now() } }
    saveMemories(updated)
  }, [memories, saveMemories])

  const deleteMemory = useCallback((date: string) => {
    const { [date]: _, ...rest } = memories
    saveMemories(rest)
  }, [memories, saveMemories])

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (syncStatus === 'syncing') return

    // Clear any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    // Sync immediately
    await syncToDatabase(memories)
  }, [memories, syncToDatabase, syncStatus])

  // Track if there are unsaved changes
  const hasUnsavedChanges = syncStatus === 'pending'

  return {
    memories,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    updateMemory,
    deleteMemory,
    syncNow
  }
}
