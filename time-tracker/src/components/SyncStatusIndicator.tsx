import type { SyncStatus } from '../hooks/useLocalStorageSync';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSynced?: Date | null;
  hasUnsavedChanges: boolean;
  error?: Error | null;
  onSyncNow?: () => void;
  compact?: boolean;
}

export function SyncStatusIndicator({ status, lastSynced, hasUnsavedChanges, onSyncNow, compact = false }: SyncStatusIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'synced' && !hasUnsavedChanges && lastSynced && (
        <span
          className="text-gray-500 dark:text-gray-400 flex items-center gap-1"
          title={compact ? `Synced at ${formatTime(lastSynced)}` : undefined}
        >
          <span className="text-green-600 dark:text-green-400">✓</span>
          {compact ? 'Synced' : `Synced at ${formatTime(lastSynced)}`}
        </span>
      )}

      {status === 'pending' && hasUnsavedChanges && (
        <div className="flex items-center gap-2">
          {!compact && (
            <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>●</span> Unsaved changes
            </span>
          )}
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
              title={compact ? "Unsaved changes" : undefined}
            >
              {compact ? <span><span className="text-red-400">●</span> Save</span> : 'Save Now'}
            </button>
          )}
        </div>
      )}

      {status === 'syncing' && (
        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <span className="animate-pulse">⋯</span> Syncing to database...
        </span>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2">
          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
            <span>⚠</span> Sync failed
          </span>
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
