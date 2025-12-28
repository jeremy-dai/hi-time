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
      'min-h-screen transition-colors duration-300',
      'bg-gray-50 text-gray-900'
    )}>
      <div className="max-w-[1920px] mx-auto p-2 md:p-4 flex flex-col md:flex-row gap-4">
        <aside className="w-full md:w-[200px] md:sticky md:top-4 md:self-start md:h-[calc(100vh-2rem)] shrink-0 z-10">
          {sidebar}
        </aside>
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {header && (
            <div className={cn(
              'mb-2',
              'bg-white rounded-xl py-2 px-3 shadow-sm'
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
