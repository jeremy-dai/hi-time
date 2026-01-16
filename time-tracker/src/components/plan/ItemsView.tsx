import { useMemo } from 'react'
import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface ItemsViewProps {
  data: UseQuarterlyPlanReturn
}

function getPriorityLabel(priority: 1 | 2 | 3): string {
  switch (priority) {
    case 1: return 'Low'
    case 2: return 'Medium'
    case 3: return 'High'
  }
}

function getPriorityColor(priority: 1 | 2 | 3): string {
  switch (priority) {
    case 1: return 'text-gray-500'
    case 2: return 'text-yellow-600'
    case 3: return 'text-red-600'
  }
}

export function ItemsView({ data }: ItemsViewProps) {
  const { planData, workTypeStats, updateItemStatus } = data

  // Collect all items from all cycles with their cycle context
  const allItems = useMemo(() => {
    if (!planData?.cycles) return []

    return planData.cycles.flatMap(cycle =>
      (cycle.items || []).map(item => ({
        ...item,
        cycleId: cycle.id,
        cycleName: cycle.name
      }))
    )
  }, [planData])

  // Group items by work type
  const itemsByType = useMemo(() => {
    if (!planData?.work_types) return new Map()

    const grouped = new Map<string, typeof allItems>()

    planData.work_types.forEach(workType => {
      const items = allItems.filter(item => item.type === workType.name)
      grouped.set(workType.name, items)
    })

    return grouped
  }, [planData?.work_types, allItems])

  if (!planData?.work_types || !planData?.cycles) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No plan loaded. Import a V4 plan to get started.</p>
      </div>
    )
  }

  if (allItems.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No items in your plan yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {planData.work_types.map((workType, workTypeIndex) => {
        const items = itemsByType.get(workType.name) || []
        const stats = workTypeStats.find(s => s.name === workType.name)

        if (items.length === 0) return null

        return (
          <div key={workTypeIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Work Type Header with Stats */}
            <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{workType.name}</h3>
                  {workType.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{workType.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats?.completionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats?.completed || 0} of {stats?.total || 0} completed
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-100">
              {items.map((item, itemIndex) => {
                // Find the cycle and item index within that cycle
                const cycle = planData.cycles.find(c => c.id === item.cycleId)
                const actualItemIndex = cycle?.items?.findIndex(i =>
                  i.title === item.title && i.type === item.type && i.priority === item.priority
                ) ?? -1
                const isCompleted = item.status === 'completed'

                return (
                  <div
                    key={itemIndex}
                    className={cn(
                      'px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors',
                      isCompleted && 'bg-gray-50/50'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => updateItemStatus(item.cycleId, actualItemIndex, isCompleted ? 'pending' : 'completed')}
                      className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                      disabled={actualItemIndex === -1}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-emerald-500 transition-colors" />
                      )}
                    </button>

                    {/* Title with cycle info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-gray-900',
                            isCompleted && 'line-through text-gray-400'
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-500">({item.cycleName})</span>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className={cn(
                      'flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full',
                      getPriorityColor(item.priority)
                    )}>
                      {getPriorityLabel(item.priority)}
                    </div>

                    {/* Template Icon */}
                    {item.template_id && (
                      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        <RefreshCw className="h-3 w-3" />
                        <span>Template</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
