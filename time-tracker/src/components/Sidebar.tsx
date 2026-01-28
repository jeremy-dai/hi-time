import { TrendingUp, Calendar, Settings, LogOut, CalendarDays, Sun, CloudRain, Snowflake, Leaf, CalendarRange, Sparkles, Target, BookOpen } from 'lucide-react'
import SidebarItem from './layout/SidebarItem'
import { cn } from '../utils/classNames'
import { getISOWeekYear } from '../utils/date'

interface SidebarProps {
  active: 'timesheet' | 'trends' | 'annual' | 'memories' | 'review' | 'today' | 'learning' | 'settings'
  onNavigate: (tab: 'timesheet' | 'trends' | 'annual' | 'memories' | 'review' | 'today' | 'learning' | 'settings') => void
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
          accentColor: 'text-emerald-600',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-700',
          barColor: 'bg-emerald-400',
          barTrack: 'bg-emerald-100',
        }
      case 'Summer':
        return {
          icon: Sun,
          accentColor: 'text-amber-500',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-700',
          barColor: 'bg-amber-400',
          barTrack: 'bg-amber-100',
        }
      case 'Fall':
        return {
          icon: CloudRain,
          accentColor: 'text-orange-500',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          barColor: 'bg-orange-400',
          barTrack: 'bg-orange-100',
        }
      case 'Winter':
        return {
          icon: Snowflake,
          accentColor: 'text-sky-500',
          badgeBg: 'bg-sky-100',
          badgeText: 'text-sky-700',
          barColor: 'bg-sky-400',
          barTrack: 'bg-sky-100',
        }
      default:
        return {
          icon: CalendarDays,
          accentColor: 'text-gray-500',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-600',
          barColor: 'bg-gray-400',
          barTrack: 'bg-gray-100',
        }
    }
  }

  return (
    <nav
      aria-label="Primary"
      className="h-full bg-transparent pb-4 pr-4 flex flex-col"
    >
      {/* Season Display */}
      {currentDate && (() => {
        const info = getWeekInfo(currentDate)
        const style = getSeasonStyle(info.season)
        const SeasonIcon = style.icon

        const progress = Math.round((info.weekInSeason / 13) * 100)

        return (
          <div className="mx-2 mt-3 mb-4 p-3 rounded-xl bg-white/60 border border-zinc-200/50">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", style.badgeBg)}>
                <SeasonIcon size={16} className={style.accentColor} strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-zinc-700">
                {info.season}
              </span>
              <span className={cn(
                "ml-auto text-2xs font-bold px-2 py-0.5 rounded-full",
                style.badgeBg,
                style.badgeText
              )}>
                W{info.weekInSeason}
              </span>
            </div>
            <div className={cn("mt-2.5 h-1 rounded-full overflow-hidden", style.barTrack)}>
              <div
                className={cn("h-full rounded-full transition-all", style.barColor)}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )
      })()}

      <div className="flex-1 space-y-1 px-2">
        <div className="text-2xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 px-3">Menu</div>
        <SidebarItem
          icon={<Target size={20} />}
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
          icon={<CalendarRange size={20} />}
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
          icon={<Sparkles size={20} />}
          label="Review"
          active={active === 'review'}
          onClick={() => onNavigate('review')}
        />
        <SidebarItem
          icon={<BookOpen size={20} />}
          label="Learning"
          active={active === 'learning'}
          onClick={() => onNavigate('learning')}
        />
        <div className="mt-5 text-2xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 px-3">System</div>
        <SidebarItem
          icon={<Settings size={20} />}
          label="Settings"
          active={active === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-200/60 mx-2 px-1">
        {userEmail && (
          <div className="text-xs mb-2 px-3 truncate font-medium text-zinc-400">
            {userEmail}
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-zinc-400 hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
