import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface SidebarItemProps {
  icon: ReactNode
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
        'w-full flex items-center gap-2 px-4 py-3 rounded-full mb-1 transition-all text-left border',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60',
        active
          ? 'bg-[hsl(var(--color-brand-primary))] text-black border-transparent shadow-md shadow-lime-900/20'
          : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <span className={cn(active ? 'text-black' : 'text-current')}>{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  )
}
