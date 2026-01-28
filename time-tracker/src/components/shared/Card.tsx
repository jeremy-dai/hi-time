import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'interactive'
}

export default function Card({ children, className, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'glass-card hover:translate-y-[-2px] transition-all duration-200 ease-out',
    glass: 'glass-card hover:translate-y-[-2px] transition-all duration-200 ease-out',
    interactive: 'glass-card hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ease-out'
  }

  return (
    <div className={cn('rounded-xl p-5', variantStyles[variant], className)}>
      {children}
    </div>
  )
}

