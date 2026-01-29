import { cloneElement, type ReactElement } from 'react'
import { cn } from '../../utils/classNames'

interface SidebarItemProps {
  icon: ReactElement
  label: string
  active?: boolean
  onClick?: () => void
}

export default function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-out text-left relative overflow-hidden',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        active
          ? 'bg-white/80 shadow-[0_2px_12px_-3px_rgba(16,185,129,0.15),0_0_0_1px_rgba(16,185,129,0.1)] text-emerald-800 backdrop-blur-sm'
          : 'text-zinc-500 hover:bg-white/40 hover:text-zinc-900 hover:shadow-sm hover:shadow-zinc-200/20'
      )}
    >
      <span className={cn(
        "transition-colors duration-300 flex-shrink-0 relative z-10",
        active ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-emerald-600/80'
      )}>
        {cloneElement(icon as any, { strokeWidth: active ? 2.5 : 1.5, size: 20 })}
      </span>
      <span className={cn(
        "text-[15px] transition-all duration-300 relative z-10",
        active ? "font-semibold tracking-wide" : "font-medium"
      )}>{label}</span>
    </button>
  )
}
