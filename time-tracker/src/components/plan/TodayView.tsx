import { useState } from 'react'
import { useQuarterlyPlan } from '../../hooks/useQuarterlyPlan'
import { MissionControl } from './MissionControl'
import { Timeline } from './Timeline'
import { PlanSettings } from './PlanSettings'
import { LayoutDashboard, Calendar, Settings, Target } from 'lucide-react'
import { SegmentedTabs } from '../shared/SegmentedTabs'
import { PageContainer } from '../layout/PageContainer'
import { PageHeader } from '../layout/PageHeader'

type PlanTab = 'mission' | 'timeline' | 'settings'

const TABS = [
  { id: 'mission', label: 'Mission Control', icon: <LayoutDashboard size={16} /> },
  { id: 'timeline', label: 'Timeline', icon: <Calendar size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
]

export function TodayView() {
  const planData = useQuarterlyPlan()
  const [activeTab, setActiveTab] = useState<PlanTab>('mission')

  if (planData.isLoading) {
    return (
      <PageContainer>
        <PageHeader 
          title="Today's Plan" 
          subtitle="Loading your mission control..."
        />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <PageHeader
            title="Today's Plan"
            subtitle="Execute your quarterly goals, one day at a time."
            icon={Target}
            useGradientTitle={true}
            animateIcon={true}
          />
        </div>

        <div className="mb-6">
          <SegmentedTabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as PlanTab)} />
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === 'mission' && planData.planData && (
            <MissionControl data={planData} />
          )}

          {activeTab === 'timeline' && planData.planData && (
            <Timeline data={planData} />
          )}

          {activeTab === 'settings' && planData.planData && (
            <PlanSettings data={planData} />
          )}
        </div>
      </div>
    </PageContainer>
  )
}
