import { useState } from 'react'
import { useQuarterlyPlan } from '../../hooks/useQuarterlyPlan'
import { MissionControl } from './MissionControl'
import { Timeline } from './Timeline'
import { PlanSettings } from './PlanSettings'
import { LayoutDashboard, Calendar, Settings, Target } from 'lucide-react'
import { Tabs } from '../shared/Tabs'
import Card from '../shared/Card'
import { SyncStatusIndicator } from '../SyncStatusIndicator'

type PlanTab = 'mission' | 'timeline' | 'settings'

const TABS = [
  { id: 'mission', label: 'Mission Control', icon: <LayoutDashboard size={16} /> },
  { id: 'timeline', label: 'Timeline', icon: <Calendar size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
]

export function QuarterlyPlan() {
  const [activeTab, setActiveTab] = useState<PlanTab>('mission')
  const planData = useQuarterlyPlan()

  if (planData.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading plan...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-linear-to-br from-gray-50 to-gray-100/50">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-6 pb-12">
          <Card className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-emerald-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {planData.planName || 'Quarterly Plan'}
                </h1>
              </div>
              <SyncStatusIndicator
                status={planData.syncStatus}
                lastSynced={planData.lastSynced}
                hasUnsavedChanges={planData.hasUnsavedChanges}
                onSyncNow={planData.syncNow}
                compact={true}
              />
            </div>

            {/* Tabs */}
            <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as PlanTab)} />

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'mission' && <MissionControl data={planData} />}
              {activeTab === 'timeline' && <Timeline data={planData} />}
              {activeTab === 'settings' && <PlanSettings data={planData} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
