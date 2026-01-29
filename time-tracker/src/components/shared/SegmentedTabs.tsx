import type { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface SegmentedTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function SegmentedTabs({ tabs, activeTab, onChange }: SegmentedTabsProps) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab)
  
  return (
    <div className="p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl inline-flex relative">
      {/* Sliding Background Pill */}
      <div 
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          left: `4px`,
          width: `calc((100% - 8px) / ${tabs.length})`,
          transform: `translateX(${activeIndex * 100}%)`
        }}
      />

      <div 
        className="grid relative w-full"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 z-10 select-none ${
                isActive
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
