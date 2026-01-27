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
  const planData = useQuarterlyPlan()
  const [activeTab, setActiveTab] = useState<PlanTab>('mission')

  // Segmented Control Tab Switcher
  const renderTabs = () => (
    <div className="p-1 bg-zinc-100/50 rounded-lg inline-flex mb-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as PlanTab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              isActive 
                ? "bg-white shadow-sm text-zinc-900 ring-1 ring-black/5" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )

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
          />
        </div>

        {renderTabs()}

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
