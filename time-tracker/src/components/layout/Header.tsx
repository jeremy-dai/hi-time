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
  timezone?: string
  onChangeTimezone?: (timezone: string) => void
}

function toInputDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function Header({ currentDate, onChangeDate, syncStatus, lastSynced, hasUnsavedChanges, syncError, onSyncNow, startingHour = 8, onChangeStartingHour, weekTheme, onChangeWeekTheme, timezone = 'Asia/Shanghai', onChangeTimezone }: HeaderProps) {

  return (
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
                  const dt = new Date(parts[0], parts[1] - 1, parts[2])
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

        {onChangeTimezone && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-400 font-medium">TZ</span>
            <select
              value={timezone}
              onChange={(e) => onChangeTimezone(e.target.value)}
              className="text-xs bg-transparent border-none text-gray-500 focus:outline-none cursor-pointer hover:text-gray-700 font-medium -mt-0.5"
            >
              <option value="Asia/Shanghai">Beijing</option>
              <option value="America/New_York">New York</option>
              <option value="America/Los_Angeles">Los Angeles</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Australia/Sydney">Sydney</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
