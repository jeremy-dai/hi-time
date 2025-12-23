import { useState, useEffect, useRef, useCallback } from 'react';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

interface UseLocalStorageSyncOptions<T> {
  storageKey: string;
  syncInterval?: number; // milliseconds between auto-syncs (default: 30000 = 30 seconds)
  syncToDatabase: (data: T) => Promise<boolean>;
  loadFromDatabase: () => Promise<T | null>;
}

interface UseLocalStorageSyncReturn<T> {
  data: T | null;
  setData: (data: T) => void;
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  hasUnsavedChanges: boolean;
  syncNow: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for local-first storage with periodic database sync
 * - Saves to localStorage immediately (no database writes)
 * - Syncs to database periodically if there are changes
 * - Shows sync status to user
 */
export function useLocalStorageSync<T>(
  options: UseLocalStorageSyncOptions<T>
): UseLocalStorageSyncReturn<T> {
  const { storageKey, syncInterval = 30000, syncToDatabase, loadFromDatabase } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const syncIntervalRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);
  const lastSyncedDataRef = useRef<string | null>(null);
  const syncToDatabaseRef = useRef(syncToDatabase);
  const loadFromDatabaseRef = useRef(loadFromDatabase);

  // Keep refs up to date
  useEffect(() => {
    syncToDatabaseRef.current = syncToDatabase;
    loadFromDatabaseRef.current = loadFromDatabase;
  });

  // Load data on mount: Try localStorage first, then database
  useEffect(() => {
    const loadData = async () => {
      // Try localStorage first
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setDataState(parsed);
          lastSyncedDataRef.current = localData;
          return;
        } catch (err) {
          console.error('Failed to parse localStorage data:', err);
        }
      }

      // Fall back to database
      try {
        const dbData = await loadFromDatabaseRef.current();
        if (dbData) {
          setDataState(dbData);
          localStorage.setItem(storageKey, JSON.stringify(dbData));
          lastSyncedDataRef.current = JSON.stringify(dbData);
          setLastSynced(new Date());
        }
      } catch (err) {
        console.error('Failed to load from database:', err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save to localStorage immediately when data changes
  const setData = useCallback((newData: T) => {
    setDataState(newData);
    localStorage.setItem(storageKey, JSON.stringify(newData));

    // Check if data has changed since last sync
    const currentDataStr = JSON.stringify(newData);
    if (currentDataStr !== lastSyncedDataRef.current) {
      setHasUnsavedChanges(true);
      setSyncStatus('pending');
    }
  }, [storageKey]);

  // Sync to database
  const syncNow = useCallback(async () => {
    if (isSyncingRef.current || !data || !hasUnsavedChanges) {
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus('syncing');
    setError(null);

    try {
      const success = await syncToDatabaseRef.current(data);
      if (success) {
        lastSyncedDataRef.current = JSON.stringify(data);
        setLastSynced(new Date());
        setHasUnsavedChanges(false);
        setSyncStatus('synced');
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [data, hasUnsavedChanges]);

  // Periodic sync
  useEffect(() => {
    if (syncInterval <= 0) return;

    syncIntervalRef.current = window.setInterval(() => {
      if (hasUnsavedChanges) {
        syncNow();
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncInterval, hasUnsavedChanges, syncNow]);

  // Sync on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && data) {
        // Fire and forget - sync on unmount
        syncToDatabaseRef.current(data);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn user before closing tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers show a generic message
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    data,
    setData,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    syncNow,
    error
  };
}
