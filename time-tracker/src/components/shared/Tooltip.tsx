import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
}

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className={cn(
        'absolute z-50 px-2 py-1 text-xs rounded-md border',
        'bg-white text-gray-800 border-gray-200',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        'pointer-events-none',
        'translate-y-2 left-1/2 -translate-x-1/2'
      )}>
        {content}
      </div>
    </div>
  )
}

