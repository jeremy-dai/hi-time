import type { PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'
import { Edit2, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { CycleEditModal } from './CycleEditModal'
import { useEditModal } from '../../../hooks/useEditModal'

interface CycleCardProps {
  cycle: PlanCycle
  cycleIndex?: number
  className?: string
  onStatusChange?: (status: PlanCycle['status']) => void
  onEdit?: (updates: { name?: string; theme?: string; description?: string }) => void
  isExpanded?: boolean
}

export function CycleCard({ cycle, cycleIndex, className, onStatusChange, onEdit, isExpanded }: CycleCardProps) {
  const isActive = cycle.status === 'in_progress'
  const isCompleted = cycle.status === 'completed'
  const { isOpen: isEditModalOpen, open: openEditModal, close: closeEditModal } = useEditModal()

  const handleStatusChange = (newStatus: PlanCycle['status']) => {
    if (onStatusChange && newStatus !== cycle.status) {
      onStatusChange(newStatus)
    }
  }

  const cycleNum = cycle.id.split('-')[1]?.replace('cycle', '') || cycleIndex

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        isActive
          ? 'bg-white/50 backdrop-blur-sm border-emerald-100 shadow-sm'
          : isCompleted
          ? 'bg-gray-50/50 border-gray-200 opacity-90'
          : 'bg-white/30 border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200',
        className
      )}
    >
      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
      )}

      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-emerald-500 to-transparent blur-3xl" />
      </div>

      <div className="relative p-5 pl-6">
        {/* Header Row: Title and Status */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {/* Expand/Collapse Indicator - Left side */}
            {isExpanded !== undefined && (
              <div className={cn(
                "mt-0.5 p-1 rounded-md transition-colors",
                isActive ? "text-emerald-500" : "text-gray-400"
              )}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-900 transition-colors leading-snug flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold uppercase tracking-wider shadow-sm",
                isActive ? "bg-linear-to-br from-emerald-100 to-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                isCompleted ? "bg-linear-to-br from-green-100 to-green-50 text-green-700 ring-1 ring-green-200" :
                "bg-linear-to-br from-gray-100 to-gray-50 text-gray-600 ring-1 ring-gray-200"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isActive ? "bg-emerald-500 animate-pulse" :
                  isCompleted ? "bg-green-500" :
                  "bg-gray-400"
                )} />
                Cycle {cycleNum}
              </span>
              <span>{cycle.name}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal()
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit cycle"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {onStatusChange && (
              <div className="relative">
                <select
                  value={cycle.status}
                  onChange={(e) => handleStatusChange(e.target.value as PlanCycle['status'])}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "appearance-none pl-2.5 pr-7 py-1.5 text-2xs font-bold rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm uppercase tracking-wider",
                    isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                    isCompleted ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" :
                    "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                  )}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">Active</option>
                  <option value="completed">Done</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta Row: Date & Theme */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium">
              Week {cycle.startWeek} - {cycle.endWeek}
              {cycle.weeks.length > 0 && (
                <>
                  <span className="mx-1.5">•</span>
                  {cycle.weeks[0].startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {cycle.weeks[cycle.weeks.length - 1].endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </>
              )}
            </span>
          </div>
          {cycle.theme && (
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span className="text-xs italic text-gray-700">"{cycle.theme}"</span>
            </div>
          )}
        </div>

        {/* Description & Competencies */}
        <div className="space-y-3">
          {cycle.description && (
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
              {cycle.description}
            </p>
          )}

          {cycle.coreCompetencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {cycle.coreCompetencies.map((skill) => (
                <span
                  key={skill}
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-semibold border transition-all hover:scale-105",
                    isActive
                      ? "bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50 shadow-sm"
                      : "bg-linear-to-r from-gray-50 to-gray-100/50 text-gray-600 border-gray-200"
                  )}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {onEdit && (
        <CycleEditModal
          cycle={cycle}
          cycleIndex={cycleIndex}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={onEdit}
        />
      )}
    </div>
  )
}
