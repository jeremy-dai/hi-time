import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface AppLayoutProps {
  sidebar: ReactNode
  header?: ReactNode
  children: ReactNode
}

export default function AppLayout({ sidebar, header, children }: AppLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen',
      'bg-gray-100',
      'dark:bg-[hsl(var(--color-dark-background))]'
    )}>
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        <aside className="w-[200px] sticky top-6 self-start h-[calc(100vh-3rem)]">{sidebar}</aside>
        <div className="flex-1">
          {header && (
            <div className={cn(
              'mb-6',
              'bg-white border rounded-xl p-4',
              'dark:bg-[hsl(var(--color-dark-surface))]',
              'dark:border-[hsl(var(--color-dark-border))]'
            )}>
              {header}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
