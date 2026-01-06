import { useState, useEffect, useCallback } from 'react';
import type { TimeBlock } from '../types/time';

export type HistorySnapshot = {
  id: string;
  timestamp: number;
  description: string;
  data: TimeBlock[][];
  metadata: { startingHour: number; theme: string | null };
  type: 'manual' | 'auto';
};

interface UseLocalHistoryReturn {
  snapshots: HistorySnapshot[];
  saveSnapshot: (data: TimeBlock[][], metadata: { startingHour: number; theme: string | null }, description?: string) => void;
  deleteSnapshot: (id: string) => void;
  clearHistory: () => void;
  maxSnapshots: number;
}

const HISTORY_STORAGE_PREFIX = 'history-week-';
const MAX_SNAPSHOTS = 50;
const HISTORY_RETENTION_DAYS = 7;

export function useLocalHistory(weekKey: string): UseLocalHistoryReturn {
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);

  // Load history from localStorage on mount or when weekKey changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${weekKey}`);
      if (saved) {
        const parsed: HistorySnapshot[] = JSON.parse(saved);
        
        // Filter out snapshots older than retention period (e.g. 7 days)
        // unless it's the only snapshot available (safety net)
        const now = Date.now();
        const retentionMs = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        
        const validSnapshots = parsed.filter(s => {
          // Keep manual snapshots regardless of age if desired, 
          // but user asked for "only saving last few days" so we filter all.
          // Optional: Could add `|| s.type === 'manual'` to keep manual ones forever.
          return (now - s.timestamp) < retentionMs;
        });

        // If all snapshots expired but we had some, maybe keep the very latest one just in case?
        // For now, strict cleanup as requested.
        if (validSnapshots.length !== parsed.length) {
            console.log(`[History] Cleaned up ${parsed.length - validSnapshots.length} expired snapshots`);
            // Update storage immediately with cleaned list
            if (validSnapshots.length > 0) {
                localStorage.setItem(`${HISTORY_STORAGE_PREFIX}${weekKey}`, JSON.stringify(validSnapshots));
            } else {
                localStorage.removeItem(`${HISTORY_STORAGE_PREFIX}${weekKey}`);
            }
        }
        
        setSnapshots(validSnapshots);
      } else {
        setSnapshots([]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setSnapshots([]);
    }
  }, [weekKey]);

  // Save snapshots to localStorage whenever they change
  useEffect(() => {
    try {
      if (snapshots.length > 0) {
        localStorage.setItem(`${HISTORY_STORAGE_PREFIX}${weekKey}`, JSON.stringify(snapshots));
      } else {
        localStorage.removeItem(`${HISTORY_STORAGE_PREFIX}${weekKey}`);
      }
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, [snapshots, weekKey]);

  const saveSnapshot = useCallback((
    data: TimeBlock[][],
    metadata: { startingHour: number; theme: string | null },
    description: string = 'Manual Save'
  ) => {
    setSnapshots(prev => {
      // For auto-saves, check if we already have a recent snapshot (e.g. within 30 mins)
      if (description === 'Auto Save') {
        const lastAutoSnapshot = prev.find(s => s.type === 'auto');
        if (lastAutoSnapshot) {
          const timeSinceLast = Date.now() - lastAutoSnapshot.timestamp;
          // If less than 30 minutes since last auto-save, skip
          if (timeSinceLast < 30 * 60 * 1000) {
            return prev;
          }
        }
      }

      const newSnapshot: HistorySnapshot = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        description,
        data: JSON.parse(JSON.stringify(data)), // Deep copy
        metadata: JSON.parse(JSON.stringify(metadata)), // Deep copy
        type: description.startsWith('Auto') ? 'auto' : 'manual'
      };

      const updated = [newSnapshot, ...prev];
      // Limit number of snapshots
      return updated.slice(0, MAX_SNAPSHOTS);
    });
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setSnapshots([]);
  }, []);

  return {
    snapshots,
    saveSnapshot,
    deleteSnapshot,
    clearHistory,
    maxSnapshots: MAX_SNAPSHOTS
  };
}
