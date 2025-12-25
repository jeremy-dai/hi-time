import { TrendingUp, Calendar, Settings, LogOut, CalendarDays } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'
import { cn } from '../utils/classNames'

interface SidebarProps {
  active: 'log' | 'trends' | 'annual' | 'settings'
  onNavigate: (tab: 'log' | 'trends' | 'annual' | 'settings') => void
  userEmail?: string
  onLogout: () => void
}

export default function Sidebar({ active, onNavigate, userEmail, onLogout }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className="h-full bg-white md:bg-transparent rounded-3xl border border-gray-200 md:border-none p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-brand-primary))] flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-lime-900/20 shrink-0">
          H
        </div>
        <div className="font-bold text-lg tracking-tight text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">Hi-Time</div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-2 mt-2">Menu</div>
        <SidebarItem
          icon={<Calendar size={20} />}
          label="Timesheet"
          active={active === 'log'}
          onClick={() => onNavigate('log')}
        />
        <SidebarItem
          icon={<TrendingUp size={20} />}
          label="Reports"
          active={active === 'trends'}
          onClick={() => onNavigate('trends')}
        />
        <SidebarItem
          icon={<CalendarDays size={20} />}
          label="Annual"
          active={active === 'annual'}
          onClick={() => onNavigate('annual')}
        />
        <div className="mt-8 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">System</div>
        <SidebarItem
          icon={<Settings size={20} />}
          label="Settings"
          active={active === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </div>

      <div className={cn(
        'mt-4 pt-4 border-t',
        'border-white/10'
      )}>
        {userEmail && (
          <div className={cn(
            'text-xs mb-3 px-2 py-1 truncate font-medium',
            'text-gray-500'
          )}>
            {userEmail}
          </div>
        )}
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all',
            'text-gray-400 hover:bg-red-500/10 hover:text-red-400'
          )}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
