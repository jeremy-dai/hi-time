import type { PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'

interface CycleCardProps {
  cycle: PlanCycle
  className?: string
  onStatusChange?: (status: PlanCycle['status']) => void
}

export function CycleCard({ cycle, className, onStatusChange }: CycleCardProps) {
  const isActive = cycle.status === 'in_progress'
  const isCompleted = cycle.status === 'completed'

  const handleStatusChange = (newStatus: PlanCycle['status']) => {
    if (onStatusChange && newStatus !== cycle.status) {
      onStatusChange(newStatus)
    }
  }

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border p-4 transition-all',
        isActive
          ? 'border-emerald-400 shadow-lg shadow-emerald-100'
          : isCompleted
          ? 'border-green-300 bg-green-50/30'
          : 'border-gray-200 opacity-80',
        className
      )}
    >
      {/* Status badge with dropdown */}
      <div className="absolute top-0 right-0 overflow-hidden rounded-tr-xl rounded-bl-lg">
        {onStatusChange ? (
          <select
            value={cycle.status}
            onChange={(e) => handleStatusChange(e.target.value as PlanCycle['status'])}
            className={cn(
              "px-3 py-1 text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
              isActive ? "bg-emerald-600 text-white focus:ring-emerald-500" :
              isCompleted ? "bg-green-600 text-white focus:ring-green-500" :
              "bg-gray-600 text-white focus:ring-gray-500"
            )}
          >
            <option value="not_started">NOT STARTED</option>
            <option value="in_progress">ACTIVE</option>
            <option value="completed">DONE</option>
          </select>
        ) : (
          <>
            {isActive && (
              <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold">
                ACTIVE
              </div>
            )}
            {isCompleted && (
              <div className="px-3 py-1 bg-green-600 text-white text-xs font-bold">
                DONE
              </div>
            )}
            {!isActive && !isCompleted && (
              <div className="px-3 py-1 bg-gray-600 text-white text-xs font-bold">
                NOT STARTED
              </div>
            )}
          </>
        )}
      </div>

      {/* Title and date */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 pr-16">{cycle.name}</h3>
        <div className="text-sm text-gray-500">
          Week {cycle.startWeek} - {cycle.endWeek}
        </div>
      </div>

      {/* Theme */}
      {cycle.theme && (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
            Theme
          </div>
          <div className="text-sm font-medium text-gray-700">{cycle.theme}</div>
        </div>
      )}

      {/* Core Competencies */}
      {cycle.coreCompetencies.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
            Core Competencies
          </div>
          <div className="flex flex-wrap gap-2">
            {cycle.coreCompetencies.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
