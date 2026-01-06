import { useState, useEffect, useRef, useCallback } from 'react';
import type { SyncStatus } from './useSyncState';

// Re-export SyncStatus for consumers
export type { SyncStatus };

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
  hasNewerVersion: boolean;  // True if database has newer data
  loadNewerVersion: () => Promise<void>;  // Function to load the newer version
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
  const [hasNewerVersion, setHasNewerVersion] = useState(false);
  const newerVersionDataRef = useRef<T | null>(null);

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

  // OPTIMIZED LOAD: Show local data immediately, then check database in background
  useEffect(() => {
    const loadData = async () => {
      let localDataParsed: T | null = null;
      let localTimestamp: number | null = null;

      // STEP 1: Load from localStorage IMMEDIATELY for instant UI
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const cached: CachedData<T> = JSON.parse(localData);
          const age = Date.now() - cached.timestamp;

          if (age < STALENESS_THRESHOLD) {
            localDataParsed = cached.data;
            localTimestamp = cached.timestamp;

            // Show local data immediately (instant load!)
            setDataState(localDataParsed);
            lastSyncedDataRef.current = JSON.stringify(localDataParsed);
            console.log('[useLocalStorageSync] ⚡ Instant load from localStorage');
          }
        } catch (err) {
          console.error('Failed to parse localStorage data:', err);
        }
      }

      // STEP 2: Fetch database in BACKGROUND to check for newer version
      try {
        const dbData = await loadFromDatabaseRef.current();

        if (dbData) {
          const dbDataStr = JSON.stringify(dbData);
          const localDataStr = localDataParsed ? JSON.stringify(localDataParsed) : null;

          // Compare database with local
          if (dbDataStr !== localDataStr) {
            // Data is different - check which is newer
            const dbUpdatedAt = (dbData as any)?.updatedAt;

            // If we have timestamps, compare them
            if (dbUpdatedAt && localTimestamp) {
              if (dbUpdatedAt > localTimestamp) {
                // Database is NEWER - save it and notify user
                console.warn('[useLocalStorageSync] 🔔 Database has newer version!');
                console.warn(`  DB: ${new Date(dbUpdatedAt).toISOString()}`);
                console.warn(`  Local: ${new Date(localTimestamp).toISOString()}`);

                // Store newer version in ref for user to load
                newerVersionDataRef.current = dbData;
                setHasNewerVersion(true);
              } else {
                console.log('[useLocalStorageSync] ✓ Local version is up to date');
              }
            } else if (!localDataParsed) {
              // No local data, use database
              console.log('[useLocalStorageSync] 📥 Loading from database (no local data)');
              setDataState(dbData);

              const cached: CachedData<T> = {
                data: dbData,
                timestamp: Date.now()
              };
              localStorage.setItem(storageKey, JSON.stringify(cached));
              lastSyncedDataRef.current = JSON.stringify(dbData);
              setLastSynced(new Date());
            }
          } else {
            console.log('[useLocalStorageSync] ✓ Local and database are in sync');
            setLastSynced(new Date());
          }
        } else if (!localDataParsed) {
          // No data anywhere
          console.log('[useLocalStorageSync] No data in database or localStorage');
        }
      } catch (err) {
        console.error('[useLocalStorageSync] Failed to fetch from database:', err);
        // Local data already shown, continue with it
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
          // ENHANCED SAFETY CHECK 1: Check if local data is "empty"
          const isLocalDataEmpty = Array.isArray(data) &&
            (data as any[]).every((day: any[]) =>
              Array.isArray(day) && day.every((block: any) =>
                !block.category || block.category === ''
              )
            );

          if (isLocalDataEmpty) {
            // Local data is empty but database has data - DO NOT OVERWRITE
            console.error('[useLocalStorageSync] PREVENTED DATA LOSS: Local data is empty but database has data. Refusing to sync.');
            setError(new Error('Sync cancelled: Local data appears empty while database has data'));
            setSyncStatus('error');
            isSyncingRef.current = false;
            return;
          }

          // ENHANCED SAFETY CHECK 2: Timestamp comparison (if available)
          const dbUpdatedAt = (currentDbData as any)?.updatedAt;
          const localUpdatedAt = (data as any)?.updatedAt;

          if (dbUpdatedAt && localUpdatedAt && dbUpdatedAt > localUpdatedAt) {
            // Database has newer data - DO NOT OVERWRITE
            console.error('[useLocalStorageSync] PREVENTED DATA LOSS: Database has newer data (timestamp check).');
            console.error(`  DB timestamp: ${new Date(dbUpdatedAt).toISOString()}`);
            console.error(`  Local timestamp: ${new Date(localUpdatedAt).toISOString()}`);
            setError(new Error('Sync cancelled: Database has newer changes. Please refresh to get latest data.'));
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

  // Function to load the newer version from database
  const loadNewerVersion = useCallback(async () => {
    if (newerVersionDataRef.current) {
      setDataState(newerVersionDataRef.current);

      const cached: CachedData<T> = {
        data: newerVersionDataRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(cached));
      lastSyncedDataRef.current = JSON.stringify(newerVersionDataRef.current);
      setLastSynced(new Date());
      setHasNewerVersion(false);
      newerVersionDataRef.current = null;

      console.log('[useLocalStorageSync] ✅ Loaded newer version from database');
    }
  }, [storageKey]);

  return {
    data,
    setData,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    syncNow,
    error,
    hasNewerVersion,
    loadNewerVersion
  };
}
