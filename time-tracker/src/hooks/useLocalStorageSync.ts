import { useState, useEffect, useRef, useCallback } from 'react';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

// Cached data structure with timestamp
interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Consider localStorage data stale after 1 hour (in milliseconds)
const STALENESS_THRESHOLD = 60 * 60 * 1000; // 1 hour

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

  // Load data on mount: Try localStorage first (if fresh), then database
  useEffect(() => {
    const loadData = async () => {
      let useLocalStorage = false;
      let localDataParsed: T | null = null;

      // Try localStorage first
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const cached: CachedData<T> = JSON.parse(localData);
          const age = Date.now() - cached.timestamp;

          // Only use localStorage if it's fresh (within staleness threshold)
          if (age < STALENESS_THRESHOLD) {
            console.log(`[useLocalStorageSync] Using fresh localStorage data (age: ${Math.round(age / 1000 / 60)}min)`);
            localDataParsed = cached.data;
            useLocalStorage = true;
          } else {
            console.log(`[useLocalStorageSync] localStorage data is stale (age: ${Math.round(age / 1000 / 60)}min), fetching from database`);
          }
        } catch (err) {
          console.error('Failed to parse localStorage data:', err);
        }
      }

      // Use fresh localStorage data
      if (useLocalStorage && localDataParsed) {
        setDataState(localDataParsed);
        lastSyncedDataRef.current = JSON.stringify(localDataParsed);
        return;
      }

      // Fall back to database (if localStorage is empty or stale)
      try {
        const dbData = await loadFromDatabaseRef.current();
        if (dbData) {
          setDataState(dbData);
          // Save to localStorage with timestamp
          const cached: CachedData<T> = {
            data: dbData,
            timestamp: Date.now()
          };
          localStorage.setItem(storageKey, JSON.stringify(cached));
          lastSyncedDataRef.current = JSON.stringify(dbData);
          setLastSynced(new Date());
        }
      } catch (err) {
        console.error('Failed to load from database:', err);
      }
    };

    loadData();
  }, [storageKey]);

  // Save to localStorage immediately when data changes
  const setData = useCallback((newData: T) => {
    setDataState(newData);

    // Save to localStorage with timestamp
    const cached: CachedData<T> = {
      data: newData,
      timestamp: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(cached));

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
      // Safety check: Verify database state before overwriting
      // This prevents stale localStorage from overwriting fresh database data
      const currentDbData = await loadFromDatabaseRef.current();

      if (currentDbData) {
        const dbDataStr = JSON.stringify(currentDbData);
        const localDataStr = JSON.stringify(data);

        // If database has different data, it might be fresher
        if (dbDataStr !== localDataStr) {
          console.warn('[useLocalStorageSync] Database has different data than local. Potential conflict detected.');

          // Check if local data is "empty" (all categories are empty strings)
          const isLocalDataEmpty = Array.isArray(data) &&
            (data as any[]).every((day: any[]) =>
              Array.isArray(day) && day.every((block: any) =>
                !block.category || block.category === ''
              )
            );

          if (isLocalDataEmpty && dbDataStr !== localDataStr) {
            // Local data is empty but database has data - DO NOT OVERWRITE
            console.error('[useLocalStorageSync] PREVENTED DATA LOSS: Local data is empty but database has data. Refusing to sync.');
            setError(new Error('Sync cancelled: Local data appears empty while database has data'));
            setSyncStatus('error');
            isSyncingRef.current = false;
            return;
          }
        }
      }

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
