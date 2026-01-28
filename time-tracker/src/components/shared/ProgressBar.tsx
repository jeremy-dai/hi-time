import { cn } from '../../utils/classNames'
import type { CSSProperties } from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  style?: CSSProperties
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  style
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("w-full bg-zinc-100 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all duration-500 rounded-full", barClassName)}
        style={{ 
          width: `${percentage}%`,
          ...style 
        }}
      />
    </div>
  )
}
