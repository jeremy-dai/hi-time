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
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-2 border transition text-left',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
        active
          ? 'bg-white shadow-sm border-gray-200 dark:bg-[hsl(var(--color-dark-surface))] dark:border-[hsl(var(--color-dark-border))]'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'
      )}
    >
      <span className="text-gray-700 dark:text-gray-200">{icon}</span>
      <span className={cn('text-sm font-medium', 'text-gray-800 dark:text-gray-100')}>{label}</span>
    </button>
  )
}
