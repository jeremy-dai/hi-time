import { cn } from "@/utils/classNames"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton - use Tailwind classes like "w-full", "w-32" */
  className?: string
}

/**
 * Skeleton loading placeholder component.
 * Use for indicating loading states before content appears.
 *
 * @example
 * // Basic usage
 * <Skeleton className="h-4 w-32" />
 *
 * // Card skeleton
 * <Skeleton className="h-48 w-full rounded-xl" />
 *
 * // Text block skeleton
 * <div className="space-y-2">
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-3/4" />
 * </div>
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  )
}

/**
 * Pre-built skeleton for a typical dashboard card.
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  )
}

/**
 * Pre-built skeleton for a chart container.
 */
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

/**
 * Pre-built skeleton for text lines.
 */
function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, ChartSkeleton, TextSkeleton }
