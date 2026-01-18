import { TrendingUp, Calendar, Settings, LogOut, CalendarDays, Sun, CloudRain, Snowflake, Leaf, BookHeart, FileText, Package } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'
import { cn } from '../utils/classNames'
import { getISOWeekYear } from '../utils/date'

interface SidebarProps {
  active: 'timesheet' | 'trends' | 'annual' | 'memories' | 'review' | 'today' | 'settings'
  onNavigate: (tab: 'timesheet' | 'trends' | 'annual' | 'memories' | 'review' | 'today' | 'settings') => void
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
      className="h-full bg-white md:bg-transparent rounded-xl border border-gray-200 md:border-none pb-4 pr-4 flex flex-col"
    >
      {/* Week Display */}
      {currentDate && (() => {
        const info = getWeekInfo(currentDate)
        const style = getSeasonStyle(info.season)
        const SeasonIcon = style.icon

        return (
          <div className="mb-4 pl-3 pt-3">
            {/* Week info card */}
            <div className={cn(
              'relative overflow-hidden rounded-xl bg-linear-to-br transition-all duration-300',
              style.bgGradient,
              'border',
              style.borderColor
            )}>
              <div className="relative z-10 px-3 py-3">
                {/* Season with icon */}
                <div className={cn("flex items-center justify-between mb-2", style.textColor)}>
                  <div className="flex items-center gap-1.5">
                    <SeasonIcon size={16} strokeWidth={2.5} />
                    <span className="text-sm font-bold">{info.season}</span>
                  </div>
                  <span className="text-xs font-semibold opacity-50">#{info.weekNumber}</span>
                </div>

                {/* Main week number */}
                <div className={cn("text-2xl font-bold leading-none", style.textColor)}>
                  Week {info.weekInSeason}
                </div>
              </div>

              {/* Background icon */}
              <SeasonIcon
                className={cn(
                  "absolute -right-2 -bottom-2 w-20 h-20 opacity-[0.06]",
                  style.textColor
                )}
                strokeWidth={1}
              />
            </div>
          </div>
        )
      })()}

      <div className="flex-1 space-y-1 pl-3">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">Menu</div>
        <SidebarItem
          icon={<Package size={20} />}
          label="Today"
          active={active === 'today'}
          onClick={() => onNavigate('today')}
        />
        <SidebarItem
          icon={<Calendar size={20} />}
          label="Timesheet"
          active={active === 'timesheet'}
          onClick={() => onNavigate('timesheet')}
        />
        <SidebarItem
          icon={<BookHeart size={20} />}
          label="Memories"
          active={active === 'memories'}
          onClick={() => onNavigate('memories')}
        />
        <SidebarItem
          icon={<TrendingUp size={20} />}
          label="Trends"
          active={active === 'trends'}
          onClick={() => onNavigate('trends')}
        />
        <SidebarItem
          icon={<CalendarDays size={20} />}
          label="Annual"
          active={active === 'annual'}
          onClick={() => onNavigate('annual')}
        />
        <SidebarItem
          icon={<FileText size={20} />}
          label="Review"
          active={active === 'review'}
          onClick={() => onNavigate('review')}
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
        'mt-4 pt-4 border-t pl-3',
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
