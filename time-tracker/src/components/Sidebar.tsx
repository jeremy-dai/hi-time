import { TrendingUp, Calendar, Settings, LogOut, CalendarDays, Sun, CloudRain, Snowflake, Leaf } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'
import { cn } from '../utils/classNames'
import { getISOWeekYear } from '../utils/date'

interface SidebarProps {
  active: 'log' | 'trends' | 'annual' | 'settings'
  onNavigate: (tab: 'log' | 'trends' | 'annual' | 'settings') => void
  userEmail?: string
  onLogout: () => void
  currentDate?: Date
}

export default function Sidebar({ active, onNavigate, userEmail, onLogout, currentDate }: SidebarProps) {
  // Calculate season and week within season for display
  const getWeekInfo = (date: Date) => {
    const { isoWeek } = getISOWeekYear(date)

    // Calculate season and week within season
    // Spring: 1-13, Summer: 14-26, Fall: 27-39, Winter: 40-52
    let season: string
    let weekInSeason: number

    if (isoWeek >= 1 && isoWeek <= 13) {
      season = 'Spring'
      weekInSeason = isoWeek
    } else if (isoWeek >= 14 && isoWeek <= 26) {
      season = 'Summer'
      weekInSeason = isoWeek - 13
    } else if (isoWeek >= 27 && isoWeek <= 39) {
      season = 'Fall'
      weekInSeason = isoWeek - 26
    } else {
      season = 'Winter'
      weekInSeason = isoWeek - 39
    }

    return {
      weekNumber: isoWeek,
      season,
      weekInSeason
    }
  }

  const getSeasonStyle = (season: string) => {
    switch (season) {
      case 'Spring':
        return {
          icon: Leaf,
          bgGradient: 'from-emerald-50 to-teal-50',
          borderColor: 'border-emerald-100',
          textColor: 'text-emerald-900',
          subTextColor: 'text-emerald-600/80',
        }
      case 'Summer':
        return {
          icon: Sun,
          bgGradient: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-100',
          textColor: 'text-amber-900',
          subTextColor: 'text-amber-600/80',
        }
      case 'Fall':
        return {
          icon: CloudRain,
          bgGradient: 'from-orange-50 to-amber-50',
          borderColor: 'border-orange-100',
          textColor: 'text-orange-900',
          subTextColor: 'text-orange-600/80',
        }
      case 'Winter':
        return {
          icon: Snowflake,
          bgGradient: 'from-sky-50 to-blue-50',
          borderColor: 'border-sky-100',
          textColor: 'text-sky-900',
          subTextColor: 'text-sky-600/80',
        }
      default:
        return {
          icon: CalendarDays,
          bgGradient: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          subTextColor: 'text-gray-500',
        }
    }
  }

  return (
    <nav
      aria-label="Primary"
      className="h-full bg-white md:bg-transparent rounded-3xl border border-gray-200 md:border-none p-4 flex flex-col"
    >
      {/* Week Display */}
      {currentDate && (() => {
        const info = getWeekInfo(currentDate)
        const style = getSeasonStyle(info.season)
        const SeasonIcon = style.icon
        
        return (
          <div className="mb-6 px-2">
            <div className={cn(
              'relative overflow-hidden px-5 py-5 rounded-2xl bg-gradient-to-br transition-all duration-300',
              style.bgGradient,
              'border shadow-sm hover:shadow-md',
              style.borderColor
            )}>
              <div className="relative z-10">
                <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", style.subTextColor)}>
                  Week {info.weekNumber}
                </div>
                <div className={cn("text-xl font-bold tracking-tight flex items-center gap-2", style.textColor)}>
                  {info.season}
                  <span className="opacity-40">/</span>
                  <span>W{info.weekInSeason}</span>
                </div>
              </div>
              
              <SeasonIcon 
                className={cn(
                  "absolute -right-2 -bottom-2 w-24 h-24 opacity-10 transform rotate-12",
                  style.textColor
                )} 
                strokeWidth={1.5}
              />
            </div>
          </div>
        )
      })()}

      <div className="flex-1 space-y-1">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">Menu</div>
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
