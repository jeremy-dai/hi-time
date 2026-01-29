import { type LucideIcon } from 'lucide-react'
import { cn } from '../../utils/classNames'
import type { ReactNode } from 'react'

interface CardHeaderProps {
  title: string
  icon?: LucideIcon
  className?: string
  titleClassName?: string
  iconClassName?: string
  children?: ReactNode
}

export default function CardHeader({ 
  title, 
  icon: Icon, 
  className,
  titleClassName,
  iconClassName,
  children
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h3 className={cn("text-base font-bold tracking-tight text-gray-900", titleClassName)}>
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {children}
        {Icon && <Icon className={cn("w-4 h-4 text-gray-400", iconClassName)} />}
      </div>
    </div>
  )
}
