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
        'group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
      )}
    >
      <span className={cn(
        "transition-colors flex-shrink-0",
        active ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-600'
      )}>
        {cloneElement(icon as any, { strokeWidth: active ? 2 : 1.5, size: 18 })}
      </span>
      <span className={cn(
        "text-sm transition-all",
        active ? "font-semibold" : "font-medium"
      )}>{label}</span>
    </button>
  )
}
