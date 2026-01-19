import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import { KPICard } from './components/KPICard'
import { SyncStatusIndicator } from '../SyncStatusIndicator'

interface KPIsViewProps {
  data: UseQuarterlyPlanReturn
}

export function KPIsView({ data }: KPIsViewProps) {
  const {
    trackers,
    updateTrackerValue,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    syncNow,
    allWeeks
  } = data

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trackers</h1>
          <p className="text-gray-600">Quantifying the transformation journey.</p>
        </div>
        <SyncStatusIndicator
          status={syncStatus}
          lastSynced={lastSynced}
          hasUnsavedChanges={hasUnsavedChanges}
          onSyncNow={syncNow}
          compact={false}
        />
      </div>

      {/* Trackers Grid */}
      {trackers.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No trackers defined. Import a plan with trackers to get started.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {trackers.map(tracker => (
              <div key={tracker.id} className="flex-shrink-0 w-48">
                <KPICard
                  tracker={tracker}
                  onUpdate={(value) => updateTrackerValue(tracker.id, value)}
                  compact={true}
                  weeks={allWeeks}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
