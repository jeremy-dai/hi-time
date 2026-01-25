import { useState } from 'react'
import { useQuarterlyPlan } from '../../hooks/useQuarterlyPlan'
import { MissionControl } from './MissionControl'
import { Timeline } from './Timeline'
import { PlanSettings } from './PlanSettings'
import { LayoutDashboard, Calendar, Settings, Target } from 'lucide-react'
import { Tabs } from '../shared/Tabs'
import Card from '../shared/Card'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'

type PlanTab = 'mission' | 'timeline' | 'settings'

const TABS = [
  { id: 'mission', label: 'Mission Control', icon: <LayoutDashboard size={16} /> },
  { id: 'timeline', label: 'Timeline', icon: <Calendar size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
]

export function TodayView() {
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
    <PageContainer
      header={
        <PageHeader
          title={planData.planName || 'Quarterly Plan'}
          icon={Target}
          sync={{
            status: planData.syncStatus,
            lastSynced: planData.lastSynced,
            hasUnsavedChanges: planData.hasUnsavedChanges,
            onSyncNow: planData.syncNow
          }}
        />
      }
    >
      <Card className="p-4 sm:p-6">
        {/* Tabs */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as PlanTab)} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'mission' && <MissionControl data={planData} />}
          {activeTab === 'timeline' && <Timeline data={planData} />}
          {activeTab === 'settings' && <PlanSettings data={planData} />}
        </div>
      </Card>
    </PageContainer>
  )
}
