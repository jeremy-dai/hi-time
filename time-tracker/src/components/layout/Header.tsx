import { addWeeks, startOfISOWeek } from '../../utils/date'
import { cn } from '../../utils/classNames'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  currentDate: Date
  onChangeDate: (d: Date) => void
  onExportCSV: () => void
  onImportCSVFile: (file: File) => void
}

function toInputDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function Header({ currentDate, onChangeDate, onExportCSV, onImportCSVFile }: HeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className={cn('text-2xl font-bold', 'text-gray-900 dark:text-gray-100')}>Time Tracker</h1>
        <p className={cn('text-sm mt-1', 'text-gray-600 dark:text-gray-300')}>
          {user?.email || 'Log time, analyze patterns, import CSV'}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <label
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium cursor-pointer',
            'bg-white text-gray-700 border hover:bg-gray-50',
            'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
          )}
        >
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                onImportCSVFile(files[0])
                e.currentTarget.value = ''
              }
            }}
          />
        </label>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            'bg-white text-gray-700 border hover:bg-gray-50',
            'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
          )}
          onClick={onExportCSV}
        >
          Export CSV
        </button>
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md',
          'bg-white border',
          'dark:bg-gray-800 dark:border-gray-700'
        )}>
          <button
            className={cn('px-2 py-1 rounded border text-sm', 'dark:border-gray-600')}
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
                const monday = startOfISOWeek(dt)
                onChangeDate(monday)
              }
            }}
          />
          <button
            className={cn('px-2 py-1 rounded border text-sm', 'dark:border-gray-600')}
            onClick={() => onChangeDate(addWeeks(currentDate, 1))}
          >
            Next
          </button>
        </div>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            'bg-red-600 text-white hover:bg-red-700',
            'dark:bg-red-700 dark:hover:bg-red-800'
          )}
          onClick={signOut}
          title="Sign out"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
