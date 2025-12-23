import { LayoutDashboard, Calendar, Settings, LogOut } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'
import { cn } from '../utils/classNames'

interface SidebarProps {
  active: 'log' | 'dashboard' | 'settings'
  onNavigate: (tab: 'log' | 'dashboard' | 'settings') => void
  userEmail?: string
  onLogout: () => void
}

export default function Sidebar({ active, onNavigate, userEmail, onLogout }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className="h-full bg-white rounded-xl border p-4 flex flex-col dark:bg-[hsl(var(--color-dark-surface))] dark:border-[hsl(var(--color-dark-border))]"
    >
      <div className="flex-1">
        <div className="text-xs uppercase text-gray-500 mb-3 dark:text-gray-400">Management</div>
        <SidebarItem
          icon={<Calendar size={18} />}
          label="Timesheet"
          active={active === 'log'}
          onClick={() => onNavigate('log')}
        />
        <SidebarItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={active === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <div className="mt-4 text-xs uppercase text-gray-500 mb-3 dark:text-gray-400">System</div>
        <SidebarItem
          icon={<Settings size={18} />}
          label="Settings"
          active={active === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </div>

      <div className={cn(
        'mt-4 pt-4 border-t',
        'border-gray-200 dark:border-gray-700'
      )}>
        {userEmail && (
          <div className={cn(
            'text-xs mb-2 px-2 py-1 truncate',
            'text-gray-600 dark:text-gray-400'
          )}>
            {userEmail}
          </div>
        )}
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
            'text-red-600 hover:bg-red-50',
            'dark:text-red-400 dark:hover:bg-red-950/30'
          )}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
