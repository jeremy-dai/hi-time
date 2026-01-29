import type { ReactNode } from 'react'
import { cn } from '../../utils/classNames'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'interactive'
}

export default function Card({ children, className, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'glass-card hover:translate-y-[-2px] hover:border-white/60 hover:shadow-emerald-900/10 transition-all duration-300 ease-out',
    glass: 'glass-card hover:translate-y-[-2px] hover:border-white/60 hover:shadow-emerald-900/10 transition-all duration-300 ease-out',
    interactive: 'glass-card hover:translate-y-[-2px] hover:shadow-lg hover:border-emerald-200/50 transition-all duration-300 ease-out'
  }

  return (
    <div className={cn('rounded-2xl p-5', variantStyles[variant], className)}>
      {children}
    </div>
  )
}

