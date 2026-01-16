import { useState } from 'react'
import { useQuarterlyPlan } from '../../hooks/useQuarterlyPlan'
import { MissionControl } from './MissionControl'
import { Timeline } from './Timeline'
import { PlanSettings } from './PlanSettings'
import { LayoutDashboard, Calendar, Settings } from 'lucide-react'
import { cn } from '../../utils/classNames'

type PlanTab = 'mission' | 'timeline' | 'settings'

const TABS: { id: PlanTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'mission', label: 'Mission Control', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    isActive
                      ? 'text-emerald-600 border-emerald-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-50">
        {activeTab === 'timeline' ? (
          <Timeline data={planData} />
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'mission' && <MissionControl data={planData} />}
              {activeTab === 'settings' && <PlanSettings data={planData} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
