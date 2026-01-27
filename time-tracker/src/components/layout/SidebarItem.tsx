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
        'group w-full flex items-center gap-3 px-3 py-1.5 rounded-lg mb-0.5 transition-all text-left relative',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        active
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900'
      )}
    >
      {/* Active Indicator Bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-emerald-600 rounded-r-full" />
      )}

      <span className={cn(
        "transition-colors",
        active ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-600'
      )}>
        {cloneElement(icon as any, { strokeWidth: 1.5, size: 20 })}
      </span>
      <span className={cn("text-sm font-medium", active ? "font-semibold" : "")}>{label}</span>
    </button>
  )
}
