import { addWeeks, startOfISOWeek, formatMonthWeekTitle, formatWeekRangeLabel } from '../../utils/date'
import { cn } from '../../utils/classNames'
import { SyncStatusIndicator } from '../SyncStatusIndicator'
import type { SyncStatus } from '../../hooks/useLocalStorageSync'

interface HeaderProps {
  currentDate: Date
  onChangeDate: (d: Date) => void
  onExportCSV: () => void
  onImportCSVFile: (file: File) => void
  syncStatus?: SyncStatus
  lastSynced?: Date | null
  hasUnsavedChanges?: boolean
  syncError?: Error | null
  onSyncNow?: () => Promise<void>
}

function toInputDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function Header({ currentDate, onChangeDate, onExportCSV: _onExportCSV, onImportCSVFile: _onImportCSVFile, syncStatus, lastSynced, hasUnsavedChanges, syncError, onSyncNow }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className={cn('text-2xl font-bold', 'text-gray-900 dark:text-gray-100')}>
          {formatMonthWeekTitle(currentDate)}
        </h1>
        <p className={cn('text-sm mt-1', 'text-gray-600 dark:text-gray-400')}>
          {formatWeekRangeLabel(currentDate)}
        </p>
      </div>
      <div className="flex gap-4 items-center">
        {syncStatus && (
          <SyncStatusIndicator
            status={syncStatus}
            lastSynced={lastSynced}
            hasUnsavedChanges={hasUnsavedChanges || false}
            error={syncError}
            onSyncNow={onSyncNow}
          />
        )}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md',
          'bg-white border',
          'dark:bg-gray-800 dark:border-gray-700'
        )}>
          <button
            className={cn('px-2 py-1 rounded border text-sm', 'dark:border-gray-600 dark:text-gray-100')}
            onClick={() => onChangeDate(addWeeks(currentDate, -1))}
          >
            Prev
          </button>
          <input
            type="date"
            className={cn('text-sm border rounded px-2 py-1', 'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100')}
            value={toInputDate(currentDate)}
            onChange={(e) => {
              const val = e.target.value
              const parts = val.split('-').map(Number)
              if (parts.length === 3) {
                const dt = new Date(parts[0], parts[1] - 1, parts[2])
                const sunday = startOfISOWeek(dt)
                onChangeDate(sunday)
              }
            }}
          />
          <button
            className={cn('px-2 py-1 rounded border text-sm', 'dark:border-gray-600 dark:text-gray-100')}
            onClick={() => onChangeDate(addWeeks(currentDate, 1))}
          >
            Next
          </button>
          <button
            className={cn(
              'px-2 py-1 rounded border text-sm font-medium',
              'bg-blue-600 text-white hover:bg-blue-700',
              'dark:bg-blue-700 dark:hover:bg-blue-800 dark:border-blue-600'
            )}
            onClick={() => onChangeDate(new Date())}
          >
            Now
          </button>
        </div>
      </div>
    </div>
  )
}
