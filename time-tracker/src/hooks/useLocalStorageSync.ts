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

  const isSyncingRef = useRef(false);
  const lastSyncedDataRef = useRef<string | null>(null);
  const syncToDatabaseRef = useRef(syncToDatabase);
  const loadFromDatabaseRef = useRef(loadFromDatabase);
  
  // Track hasUnsavedChanges in a ref for use in useCallback without dependency
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Keep refs up to date
  useEffect(() => {
    syncToDatabaseRef.current = syncToDatabase;
    loadFromDatabaseRef.current = loadFromDatabase;
  });

  // Check for updates from database
  const checkForUpdates = useCallback(async () => {
    if (isSyncingRef.current) return;

    try {
      const dbData = await loadFromDatabaseRef.current();
      
      // Get local data to compare
      let localDataParsed: T | null = null;
      let localTimestamp: number | null = null;
      
      try {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          const cached: CachedData<T> = JSON.parse(localData);
          localDataParsed = cached.data;
          localTimestamp = cached.timestamp;
        }
      } catch (e) {
        console.error('Failed to parse localStorage for comparison', e);
      }

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
                // Database is NEWER
                console.warn('[useLocalStorageSync] 🔔 Database has newer version!');
                
                // AUTO UPDATE if no unsaved changes
                if (!hasUnsavedChangesRef.current) {
                    console.log('[useLocalStorageSync] 🔄 Auto-updating data (no unsaved changes)');
                    setDataState(dbData);
                    
                    const cached: CachedData<T> = {
                        data: dbData,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(storageKey, JSON.stringify(cached));
                    lastSyncedDataRef.current = JSON.stringify(dbData);
                    setLastSynced(new Date());
                    setHasNewerVersion(false);
                } else {
                    // Notify user
                    newerVersionDataRef.current = dbData;
                    setHasNewerVersion(true);
                }
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
            // In sync
             if (!hasUnsavedChangesRef.current) {
                 setLastSynced(new Date());
                 setHasNewerVersion(false);
             }
        }
      } else if (!localDataParsed) {
        // No data in database AND no data in local storage
        console.log('[useLocalStorageSync] No data in database');
      }
    } catch (err) {
        console.error('[useLocalStorageSync] Failed to check for updates:', err);
    }
  }, [storageKey]); // removed data and hasUnsavedChanges dependencies

  // OPTIMIZED LOAD: Show local data immediately, then check database in background
  useEffect(() => {
    const loadLocalData = () => {
      // STEP 1: Load from localStorage IMMEDIATELY for instant UI
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const cached: CachedData<T> = JSON.parse(localData);
          const age = Date.now() - cached.timestamp;

          if (age < STALENESS_THRESHOLD) {
            // Validate data structure for user-settings
            if (storageKey === 'user-settings') {
              const settings = cached.data as any;
              if (!settings.subcategories) {
                console.warn('[useLocalStorageSync] ⚠️ Corrupted localStorage: missing subcategories, discarding');
                localStorage.removeItem(storageKey);
                return; // Let database load handle it
              }
            }

             // Show local data immediately (instant load!)
             setDataState(cached.data);
             lastSyncedDataRef.current = JSON.stringify(cached.data);
             console.log('[useLocalStorageSync] ⚡ Instant load from localStorage');
          } else {
            // Data is stale - remove it so checkForUpdates() will load from database
            console.log('[useLocalStorageSync] ⏰ Stale localStorage data, removing to load fresh from database');
            localStorage.removeItem(storageKey);
          }
        } catch (err) {
          console.error('Failed to parse localStorage data:', err);
          // Clear corrupted data
          localStorage.removeItem(storageKey);
        }
      }
    };

    loadLocalData();
    checkForUpdates();
  }, [storageKey, checkForUpdates]);

  // Auto-fetch on visibility change or focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useLocalStorageSync] 👁️ App became visible, checking for updates...');
        checkForUpdates();
      }
    };

    const handleFocus = () => {
        console.log('[useLocalStorageSync] 🎯 Window focused, checking for updates...');
        checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates]);

  // Listen for same-tab updates (e.g. Settings component updating user-settings)
  useEffect(() => {
    const handleLocalSync = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      if (customEvent.detail) {
        setDataState(customEvent.detail);
      }
    };
    
    window.addEventListener(`local-sync-${storageKey}`, handleLocalSync);
    return () => window.removeEventListener(`local-sync-${storageKey}`, handleLocalSync);
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
    
    // Notify other hooks in the same tab
    window.dispatchEvent(new CustomEvent(`local-sync-${storageKey}`, { detail: newData }));

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

  const lastInteractionTimeRef = useRef<number>(Date.now());
  const isPollingPausedRef = useRef(false);
  const startPollingRef = useRef<(() => void) | null>(null);

  // Track user activity to optimize polling
  useEffect(() => {
    const updateInteractionTime = () => {
      const wasPaused = isPollingPausedRef.current;
      lastInteractionTimeRef.current = Date.now();
      
      // If we were in sleep mode, wake up the polling loop
      if (wasPaused && startPollingRef.current) {
        console.debug('[useLocalStorageSync] ⚡ Activity detected, waking up from sleep mode');
        startPollingRef.current();
      }
    };

    // Throttle the event listeners to avoid performance impact
    let throttleTimer: number | null = null;
    const throttledHandler = () => {
      if (!throttleTimer) {
        throttleTimer = window.setTimeout(() => {
          updateInteractionTime();
          throttleTimer = null;
        }, 1000);
      }
    };

    window.addEventListener('mousemove', throttledHandler);
    window.addEventListener('keydown', throttledHandler);
    window.addEventListener('click', throttledHandler);
    window.addEventListener('scroll', throttledHandler);
    window.addEventListener('touchstart', throttledHandler);

    return () => {
      window.removeEventListener('mousemove', throttledHandler);
      window.removeEventListener('keydown', throttledHandler);
      window.removeEventListener('click', throttledHandler);
      window.removeEventListener('scroll', throttledHandler);
      window.removeEventListener('touchstart', throttledHandler);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  // Periodic sync and update check with adaptive interval
  useEffect(() => {
    if (syncInterval <= 0) return;

    let timeoutId: number;

    const tick = () => {
      isPollingPausedRef.current = false;
      // Determine the next interval based on state
      let nextInterval = syncInterval;

      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTimeRef.current;
      const isHidden = document.hidden;

      // ADAPTIVE POLLING STRATEGY:
      // 1. Active: Default interval (e.g., 30s)
      // 2. Idle (> 2 mins): 4x interval (e.g., 2 mins)
      // 3. Hidden: 10x interval (e.g., 5 mins)
      // 4. Sleep Mode (> 30 mins idle): Stop polling until activity

      if (timeSinceInteraction > 30 * 60 * 1000) {
        // Sleep mode: User hasn't touched the app in 30 mins
        console.debug('[useLocalStorageSync] 😴 Sleep mode: Polling paused due to inactivity');
        isPollingPausedRef.current = true;
        return; // Don't schedule next tick, wait for interaction
      }

      if (isHidden) {
        nextInterval = syncInterval * 10;
      } else if (timeSinceInteraction > 2 * 60 * 1000) {
        nextInterval = syncInterval * 4;
      }

      // Add Jitter (±10%) to avoid "thundering herd" on database
      const jitter = nextInterval * 0.1 * (Math.random() * 2 - 1);
      nextInterval = Math.max(1000, nextInterval + jitter);

      console.debug(`[useLocalStorageSync] 🕒 Next poll in ${Math.round(nextInterval / 1000)}s`);

      if (hasUnsavedChangesRef.current) {
        syncNow();
      } else {
        // If no local changes, check if there are updates from other devices
        checkForUpdates();
      }

      // Schedule next tick
      timeoutId = window.setTimeout(tick, nextInterval);
    };

    startPollingRef.current = tick;

    // Start the loop
    timeoutId = window.setTimeout(tick, syncInterval);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [syncInterval, syncNow, checkForUpdates]);

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
