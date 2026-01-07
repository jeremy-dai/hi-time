import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimeBlock } from '../types/time'
import { getSnapshots, createSnapshot, deleteSnapshot, deleteAllSnapshots } from '../api'
import type { SyncStatus } from './useSyncState'

export type HistorySnapshot = {
  id: string
  timestamp: number
  description: string
  data: TimeBlock[][]
  metadata: { startingHour: number; theme: string | null }
  type: 'manual' | 'auto' | 'restore'
}

interface UseHistoryReturn {
  snapshots: HistorySnapshot[]
  isLoading: boolean
  syncStatus: SyncStatus
  lastSynced: Date | null
  hasUnsavedChanges: boolean
  saveSnapshot: (
    data: TimeBlock[][],
    metadata: { startingHour: number; theme: string | null },
    description?: string,
    type?: 'manual' | 'auto' | 'restore'
  ) => Promise<void>
  deleteSnapshot: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  syncNow: () => Promise<void>
  maxSnapshots: number
}

const ENTITY_TYPE = 'week'
const MAX_SNAPSHOTS = 50
const AUTO_SAVE_THROTTLE_MS = 30 * 60 * 1000 // 30 minutes

export function useHistory(weekKey: string): UseHistoryReturn {
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const isMountedRef = useRef(true)
  const lastAutoSaveRef = useRef<number>(0)

  // Load snapshots from database on mount or when weekKey changes
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadSnapshots = async () => {
      setIsLoading(true)
      setSyncStatus('syncing')

      try {
        const dbSnapshots = await getSnapshots<TimeBlock[][]>(ENTITY_TYPE, weekKey)

        if (!cancelled) {
          // Transform to HistorySnapshot format
          const transformed: HistorySnapshot[] = dbSnapshots.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            description: s.description,
            data: s.data,
            metadata: (s.metadata as { startingHour: number; theme: string | null }) || { startingHour: 8, theme: null },
            type: s.type,
          }))

          setSnapshots(transformed)
          setSyncStatus('synced')
          setLastSynced(new Date())
        }
      } catch (err) {
        console.error('Failed to load snapshots from database:', err)
        if (!cancelled) {
          setSyncStatus('error')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSnapshots()

    return () => {
      cancelled = true
      isMountedRef.current = false
    }
  }, [weekKey])

  // Save a new snapshot
  const saveSnapshotFn = useCallback(async (
    data: TimeBlock[][],
    metadata: { startingHour: number; theme: string | null },
    description: string = 'Manual Save',
    type: 'manual' | 'auto' | 'restore' = 'manual'
  ) => {
    // For auto-saves, check throttle
    if (type === 'auto') {
      const now = Date.now()
      if (now - lastAutoSaveRef.current < AUTO_SAVE_THROTTLE_MS) {
        return // Skip if within throttle period
      }
      lastAutoSaveRef.current = now
    }

    setSyncStatus('syncing')

    try {
      const newSnapshot = await createSnapshot<TimeBlock[][]>(
        ENTITY_TYPE,
        weekKey,
        JSON.parse(JSON.stringify(data)), // Deep copy
        JSON.parse(JSON.stringify(metadata)), // Deep copy
        description,
        type
      )

      if (!isMountedRef.current) return

      if (newSnapshot) {
        const transformed: HistorySnapshot = {
          id: newSnapshot.id,
          timestamp: newSnapshot.timestamp,
          description: newSnapshot.description,
          data: newSnapshot.data,
          metadata: (newSnapshot.metadata as { startingHour: number; theme: string | null }) || metadata,
          type: newSnapshot.type,
        }

        // Add to front of list, keep max limit
        setSnapshots(prev => [transformed, ...prev].slice(0, MAX_SNAPSHOTS))
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to save snapshot:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [weekKey])

  // Delete a specific snapshot
  const deleteSnapshotFn = useCallback(async (id: string) => {
    setSyncStatus('syncing')

    try {
      const success = await deleteSnapshot(id)

      if (!isMountedRef.current) return

      if (success) {
        setSnapshots(prev => prev.filter(s => s.id !== id))
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to delete snapshot:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [])

  // Clear all history for this week
  const clearHistory = useCallback(async () => {
    setSyncStatus('syncing')

    try {
      const success = await deleteAllSnapshots(ENTITY_TYPE, weekKey)

      if (!isMountedRef.current) return

      if (success) {
        setSnapshots([])
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to clear history:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [weekKey])

  // Refresh snapshots from database
  const syncNow = useCallback(async () => {
    if (syncStatus === 'syncing') return

    setSyncStatus('syncing')

    try {
      const dbSnapshots = await getSnapshots<TimeBlock[][]>(ENTITY_TYPE, weekKey)

      if (!isMountedRef.current) return

      const transformed: HistorySnapshot[] = dbSnapshots.map(s => ({
        id: s.id,
        timestamp: s.timestamp,
        description: s.description,
        data: s.data,
        metadata: (s.metadata as { startingHour: number; theme: string | null }) || { startingHour: 8, theme: null },
        type: s.type,
      }))

      setSnapshots(transformed)
      setSyncStatus('synced')
      setLastSynced(new Date())
    } catch (err) {
      console.error('Failed to refresh snapshots:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [weekKey, syncStatus])

  // No local changes to track since we sync immediately
  const hasUnsavedChanges = false

  return {
    snapshots,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    saveSnapshot: saveSnapshotFn,
    deleteSnapshot: deleteSnapshotFn,
    clearHistory,
    syncNow,
    maxSnapshots: MAX_SNAPSHOTS,
  }
}
