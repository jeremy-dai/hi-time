import { LayoutDashboard, Calendar } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'

interface SidebarProps {
  active: 'log' | 'dashboard'
  onNavigate: (tab: 'log' | 'dashboard') => void
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className="h-full bg-white rounded-xl border p-4 dark:bg-[hsl(var(--color-dark-surface))] dark:border-[hsl(var(--color-dark-border))]"
    >
      <div className="text-xs uppercase text-gray-500 mb-3 dark:text-gray-400">Management</div>
      <SidebarItem
        icon={<LayoutDashboard size={18} />}
        label="Dashboard"
        active={active === 'dashboard'}
        onClick={() => onNavigate('dashboard')}
      />
      <SidebarItem
        icon={<Calendar size={18} />}
        label="Timesheet"
        active={active === 'log'}
        onClick={() => onNavigate('log')}
      />
    </nav>
  )
}
