import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]', className)}>
      {children}
    </div>
  )
}

