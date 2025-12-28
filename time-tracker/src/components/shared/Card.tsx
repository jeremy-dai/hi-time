import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl p-6', 'bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

