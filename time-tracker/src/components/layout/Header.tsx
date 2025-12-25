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

export default function Header({ currentDate, onChangeDate, syncStatus, lastSynced, hasUnsavedChanges, syncError, onSyncNow }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className={cn('text-3xl font-bold tracking-tight', 'text-gray-900')}>
          {formatMonthWeekTitle(currentDate)}
        </h1>
        <p className={cn('text-sm font-medium mt-1', 'text-gray-500')}>
          {formatWeekRangeLabel(currentDate)}
        </p>
      </div>
      <div className="flex gap-4 items-center self-end md:self-auto">
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
                'text-gray-900',
                '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer'
              )}
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
      </div>
    </div>
  )
}
