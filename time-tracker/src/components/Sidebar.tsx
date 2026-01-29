import { TrendingUp, LogOut, CalendarDays, Sun, CloudRain, Snowflake, Leaf, CalendarRange, Sparkles, BookOpen, Target, Calendar } from 'lucide-react'
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
      className="h-full bg-transparent pb-6 pr-4 flex flex-col gap-6"
    >
      {/* Season Display */}
      {currentDate && (() => {
        const info = getWeekInfo(currentDate)
        const style = getSeasonStyle(info.season)
        const SeasonIcon = style.icon

        const progress = Math.round((info.weekInSeason / 13) * 100)

        return (
          <div className="mx-2 mt-4 p-4 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 relative z-10">
              <div className={cn("p-2 rounded-xl shadow-sm ring-1 ring-black/5", style.badgeBg)}>
                <SeasonIcon size={18} className={style.accentColor} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-zinc-800 leading-none mb-1">
                  {info.season}
                </div>
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                  style.badgeBg,
                  style.badgeText
                )}>
                  Week {info.weekInSeason}
                </div>
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex justify-between text-2xs font-medium text-zinc-400 mb-1.5 px-0.5">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className={cn("h-1.5 rounded-full overflow-hidden shadow-inner", style.barTrack)}>
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", style.barColor)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex-1 space-y-1.5 px-2 overflow-y-auto scrollbar-thin min-h-0">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400/80 mb-3 px-4 py-1">Menu</div>
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
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-200/60 mx-2 px-1">
        <button
          onClick={onLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-out text-left text-zinc-500 hover:bg-white/40 hover:text-zinc-900 hover:shadow-sm hover:shadow-zinc-200/20"
        >
          {userEmail && (
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold ring-1 ring-white/60 shadow-sm flex-shrink-0 -ml-0.5" title={userEmail}>
              {userEmail[0].toUpperCase()}
            </div>
          )}
          <span className="text-[15px] font-medium flex-1">Logout</span>
          <LogOut size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  )
}
