import { addWeeks, startOfISOWeek } from '../../utils/date'
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
  startingHour?: number
  onChangeStartingHour?: (hour: number) => void
  weekTheme?: string | null
  onChangeWeekTheme?: (theme: string) => void
  onOpenHistory?: () => void
  hasNewerVersion?: boolean
  onLoadNewerVersion?: () => Promise<void>
}

function toInputDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function Header({ currentDate, onChangeDate, syncStatus, lastSynced, hasUnsavedChanges, syncError, onSyncNow, startingHour = 8, onChangeStartingHour, weekTheme, onChangeWeekTheme, onOpenHistory, hasNewerVersion, onLoadNewerVersion }: HeaderProps) {

  return (
    <div className="flex flex-col gap-2">
      {/* Newer Version Banner */}
      {hasNewerVersion && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-900 font-medium">
              A newer version is available from the database
            </span>
          </div>
          <button
            onClick={onLoadNewerVersion}
            className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load Now
          </button>
        </div>
      )}

      <div className="flex flex-row items-center justify-between gap-4">
      {/* Left: Theme Input */}
      <div className="flex-1 min-w-0 max-w-xl">
        {onChangeWeekTheme && (
          <input
            type="text"
            value={weekTheme || ''}
            onChange={(e) => onChangeWeekTheme(e.target.value)}
            placeholder="welcome to new york! it's been waiting for you"
            className="w-full text-base font-semibold bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-300"
          />
        )}
      </div>

      {/* Right: Date Navigation + Sync Status + Start Time */}
      <div className="flex items-center gap-3 shrink-0">
        {syncStatus && (
          <SyncStatusIndicator
            status={syncStatus}
            lastSynced={lastSynced}
            hasUnsavedChanges={hasUnsavedChanges || false}
            error={syncError}
            onSyncNow={onSyncNow}
            compact={true}
          />
        )}

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="History"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        <div className={cn(
          'flex items-center gap-1 p-1 rounded-full shadow-sm',
          'bg-white border border-gray-200'
        )}>
          <button
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
              'text-gray-500 hover:bg-gray-100'
            )}
            onClick={() => onChangeDate(addWeeks(currentDate, -1))}
            title="Previous Week"
          >
            ←
          </button>

          <div className="relative">
            <input
              type="date"
              className={cn(
                'text-sm font-medium px-2 py-1 bg-transparent outline-none cursor-pointer',
                'text-gray-900 pointer-events-auto',
                '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10'
              )}
              value={toInputDate(currentDate)}
              onChange={(e) => {
                const val = e.target.value
                if (!val) return
                const parts = val.split('-').map(Number)
                if (parts.length === 3 && !parts.some(isNaN)) {
                  // Create date in UTC (noon to avoid day boundary issues)
                  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12))
                  const sunday = startOfISOWeek(dt)
                  onChangeDate(sunday)
                }
              }}
              onClick={(e) => {
                e.currentTarget.showPicker?.()
              }}
            />
          </div>

          <button
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
              'text-gray-500 hover:bg-gray-100'
            )}
            onClick={() => onChangeDate(addWeeks(currentDate, 1))}
            title="Next Week"
          >
            →
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <button
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-bold transition-all ml-1',
              'bg-[hsl(var(--color-brand-primary))] text-black hover:brightness-110 shadow-sm'
            )}
            onClick={() => onChangeDate(new Date())}
          >
            Today
          </button>
        </div>

        {onChangeStartingHour && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-400 font-medium">Start</span>
            <select
              value={startingHour}
              onChange={(e) => onChangeStartingHour(parseInt(e.target.value))}
              className="text-xs bg-transparent border-none text-gray-500 focus:outline-none cursor-pointer hover:text-gray-700 font-medium -mt-0.5"
            >
              {[5, 6, 7, 8, 9, 10].map(hour => (
                <option key={hour} value={hour}>
                  {hour} AM
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
