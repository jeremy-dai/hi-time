import { useState, useCallback, useRef } from 'react'

/**
 * Standard sync status type used across all data sync hooks
 */
export type SyncStatus = 'idle' | 'synced' | 'pending' | 'syncing' | 'error'

/**
 * Shared state management for data synchronization
 * Provides consistent sync status, error handling, and timestamps
 */
export function useSyncState() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const isSyncingRef = useRef(false)

  const startSync = useCallback(() => {
    isSyncingRef.current = true
    setSyncStatus('syncing')
    setError(null)
  }, [])

  const syncSuccess = useCallback(() => {
    isSyncingRef.current = false
    setSyncStatus('synced')
    setLastSynced(new Date())
    setError(null)
  }, [])

  const syncError = useCallback((err: Error | string) => {
    isSyncingRef.current = false
    setSyncStatus('error')
    setError(err instanceof Error ? err : new Error(err))
  }, [])

  const markPending = useCallback(() => {
    setSyncStatus('pending')
  }, [])

  const isSyncing = () => isSyncingRef.current

  return {
    syncStatus,
    lastSynced,
    error,
    isSyncing,
    startSync,
    syncSuccess,
    syncError,
    markPending
  }
}
