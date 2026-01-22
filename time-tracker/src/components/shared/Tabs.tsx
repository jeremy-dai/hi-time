import { type ReactNode } from 'react'
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <ShadcnTabs value={activeTab} onValueChange={onChange} className="w-full">
      <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 rounded-none space-x-1">
        {tabs.map((tab) => (
           <TabsTrigger 
             key={tab.id} 
             value={tab.id}
             className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl rounded-b-none px-5 py-3 h-auto gap-2 border-b-2 border-transparent transition-all"
           >
             {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
             {tab.label}
           </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  )
}
