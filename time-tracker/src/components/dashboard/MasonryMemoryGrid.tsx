import { useMemo } from 'react'
import type { DailyMemory } from '../../types/time'
import { cn } from '../../utils/classNames'
import {
  Clapperboard,
  Code,
  Heart,
  Calendar,
  Lightbulb,
  Dumbbell,
  Music,
  Utensils,
  Briefcase,
  BookOpen,
  Gamepad2,
  Sparkles,
  PartyPopper,
  Plane
} from 'lucide-react'

interface MasonryMemoryGridProps {
  memories: Record<string, DailyMemory>
  year: number
}

// Modern soft gradients for default cards
const GRADIENTS = [
  'bg-white',
  'bg-zinc-50/50',
  'bg-stone-50/50',
]

export default function MasonryMemoryGrid({ memories, year }: MasonryMemoryGridProps) {
  // Convert record to sorted array (descending date)
  const memoryList = useMemo(() => {
    return Object.values(memories)
      .filter(m => m.memory.trim().length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [memories])

  // Helper to determine card style based on content
  const getCardStyle = (memory: string) => {
    const text = memory.toLowerCase()
    const len = memory.length

    // Media / Entertainment (Movie, TV, Cinema)
    if (text.match(/\b(movie|film|watch|cinema|show|series)\b|电影|剧|看/)) {
      return { 
        type: 'media', 
        icon: Clapperboard, 
        color: 'bg-indigo-50/80 hover:bg-indigo-50 text-indigo-900 border-indigo-100', 
        iconColor: 'text-indigo-400',
        span: 'col-span-1 row-span-1' 
      }
    }
    
    // Tech / Coding
    if (text.match(/\b(code|coding|bug|feature|pr|commit|deploy|refactor|typescript|react|api|hack)\b|代码|开发|上线|写bug/)) {
      return { 
        type: 'tech', 
        icon: Code, 
        color: 'bg-zinc-900 text-zinc-50 border-zinc-800', 
        iconColor: 'text-zinc-500',
        span: len > 60 ? 'col-span-1 md:col-span-2 row-span-1' : 'col-span-1 row-span-1' 
      }
    }
    
    // Travel / Places / Kenya / Trips
    if (text.match(/\b(trip|travel|visit|journey|flight|hotel|beach|mountain|hike|kenya)\b|旅行|游|去|肯尼亚|出差|酒店/)) {
      return { 
        type: 'travel', 
        icon: Plane, 
        color: 'bg-emerald-50/80 hover:bg-emerald-50 text-emerald-900 border-emerald-100', 
        iconColor: 'text-emerald-400',
        span: 'col-span-1 md:col-span-2 row-span-2' 
      }
    }
    
    // Celebration / Birthday / Party
    if (text.match(/\b(birthday|party|celebrate|festival|year)\b|生日|庆生|快乐|节|年/)) {
      return { 
        type: 'party', 
        icon: PartyPopper, 
        color: 'bg-amber-50/80 hover:bg-amber-50 text-amber-900 border-amber-100', 
        iconColor: 'text-amber-400',
        span: 'col-span-1 md:col-span-2 row-span-1' 
      }
    }

    // Love / Relationships / Date
    if (text.match(/\b(love|date|anniversary|wedding|girlfriend|boyfriend|wife|husband)\b|爱|喜欢|约会|纪念日/)) {
      return { 
        type: 'love', 
        icon: Heart, 
        color: 'bg-rose-50/80 hover:bg-rose-50 text-rose-900 border-rose-100', 
        iconColor: 'text-rose-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Ideas / Thoughts
    if (text.match(/\b(idea|think|thought|brainstorm|plan|strategy)\b|想法|思考|计划|想/)) {
      return { 
        type: 'idea', 
        icon: Lightbulb, 
        color: 'bg-yellow-50/80 hover:bg-yellow-50 text-yellow-900 border-yellow-100', 
        iconColor: 'text-yellow-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Fitness / Health
    if (text.match(/\b(gym|run|workout|fitness|exercise|yoga|sport|swim)\b|健身|跑|运动|游泳/)) {
      return { 
        type: 'fitness', 
        icon: Dumbbell, 
        color: 'bg-orange-50/80 hover:bg-orange-50 text-orange-900 border-orange-100', 
        iconColor: 'text-orange-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Food / Drink / Hotpot / BBQ
    if (text.match(/\b(food|dinner|lunch|breakfast|cook|eat|restaurant|meal|bbq|hotpot)\b|吃|饭|餐|烧烤|火锅|聚餐|宴/)) {
      return { 
        type: 'food', 
        icon: Utensils, 
        color: 'bg-orange-50/80 hover:bg-orange-50 text-orange-900 border-orange-100', 
        iconColor: 'text-orange-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Music / Audio
    if (text.match(/\b(music|song|album|concert|listen|spotify)\b|音乐|歌|听/)) {
      return { 
        type: 'music', 
        icon: Music, 
        color: 'bg-fuchsia-50/80 hover:bg-fuchsia-50 text-fuchsia-900 border-fuchsia-100', 
        iconColor: 'text-fuchsia-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Work / Business
    if (text.match(/\b(work|job|meeting|call|client|project|business)\b|工作|会|客户|项目/)) {
      return { 
        type: 'work', 
        icon: Briefcase, 
        color: 'bg-blue-50/80 hover:bg-blue-50 text-blue-900 border-blue-100', 
        iconColor: 'text-blue-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Reading / Learning
    if (text.match(/\b(read|book|article|learn|study|course)\b|读|书|学|课/)) {
      return { 
        type: 'learn', 
        icon: BookOpen, 
        color: 'bg-slate-50/80 hover:bg-slate-50 text-slate-900 border-slate-100', 
        iconColor: 'text-slate-400',
        span: 'col-span-1 row-span-1' 
      }
    }

    // Gaming
    if (text.match(/\b(game|play|steam|ps5|switch|xbox)\b|游戏|玩|积木/)) {
      return { 
        type: 'game', 
        icon: Gamepad2, 
        color: 'bg-violet-50/80 hover:bg-violet-50 text-violet-900 border-violet-100', 
        iconColor: 'text-violet-400',
        span: 'col-span-1 row-span-1' 
      }
    }
    
    // Default Long
    if (len > 120) {
      return { 
        type: 'long', 
        icon: Sparkles, 
        color: 'bg-white border-zinc-100', 
        iconColor: 'text-zinc-200',
        span: 'col-span-1 md:col-span-2 row-span-1' 
      }
    }
    
    return { 
      type: 'default', 
      icon: null, 
      color: 'bg-white border-zinc-100', 
      iconColor: '',
      span: 'col-span-1 row-span-1' 
    }
  }

  if (memoryList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Calendar className="w-12 h-12 mb-4 opacity-20" />
        <p>No memories recorded for {year} yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px] pb-20">
      {memoryList.map((item, index) => {
        const style = getCardStyle(item.memory)
        const date = new Date(item.date)
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        
        // Pseudo-random gradient for default cards to add variety
        const gradientClass = style.type === 'default' 
          ? GRADIENTS[index % GRADIENTS.length] 
          : ''

        return (
          <div 
            key={item.date}
            className={cn(
              "glass-card p-6 flex flex-col relative group transition-all duration-300 rounded-2xl",
              "hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/5",
              style.span,
              style.color,
              gradientClass,
              // Special tech style override
              style.type === 'tech' ? 'bg-zinc-900 text-zinc-100 border-zinc-800 shadow-2xl shadow-black/20' : ''
            )}
          >
            {/* Background Icon (Decorative) */}
            {style.icon && (
              <style.icon className={cn(
                "absolute -bottom-4 -right-4 w-32 h-32 opacity-5 pointer-events-none transform rotate-12 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110",
                style.type === 'tech' ? "text-white opacity-10" : "text-current"
              )} />
            )}

            {/* Header: Date & Icon */}
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div className="flex flex-col">
                <span className={cn(
                  "text-2xs font-bold uppercase tracking-widest mb-0.5",
                  style.type === 'tech' ? "text-zinc-500" : "text-zinc-400"
                )}>
                  {dayName}
                </span>
                <span className={cn(
                  "text-sm font-mono font-medium",
                  style.type === 'tech' ? "text-emerald-400" : "text-zinc-900"
                )}>
                  {formattedDate}
                </span>
              </div>
              
              {style.icon && style.type !== 'default' && (
                <div className={cn(
                  "p-2 rounded-xl backdrop-blur-sm",
                  style.type === 'tech' ? "bg-zinc-800/50" : "bg-white/50"
                )}>
                  <style.icon className={cn(
                    "w-4 h-4", 
                    style.type === 'tech' ? "text-emerald-400" : style.iconColor
                  )} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10 overflow-hidden">
              <div className={cn(
                "font-medium leading-relaxed overflow-y-auto custom-scrollbar h-full pr-2",
                style.type === 'tech' ? "font-mono text-xs leading-relaxed text-zinc-300" : "text-base",
                // If text is long, make it smaller
                item.memory.length > 80 && style.type !== 'tech' ? "text-sm" : ""
              )}>
                {item.memory}
              </div>
            </div>
            
            {/* Hover overlay gradient for "shine" effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        )
      })}
    </div>
  )
}
