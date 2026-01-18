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
      {/* Compact Modern Sub-navigation */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
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
          <div className="flex-1 overflow-y-auto px-6 py-4">
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
