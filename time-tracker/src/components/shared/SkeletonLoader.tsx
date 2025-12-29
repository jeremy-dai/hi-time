interface SkeletonLoaderProps {
  variant?: 'card' | 'grid' | 'text'
  count?: number
  height?: string
  className?: string
}

export function SkeletonLoader({
  variant = 'card',
  count = 1,
  height,
  className = ''
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-emerald-50 to-gray-200 rounded-xl'

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} p-6 ${className}`} style={{ height }}>
        <div className="space-y-4">
          <div className="h-6 bg-gray-300 rounded-xl w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded-xl w-2/3"></div>
          <div className="h-4 bg-gray-300 rounded-xl w-1/2"></div>
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${baseClasses} h-12 ${className}`} />
        ))}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4 ${className}`}
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </div>
    )
  }

  return null
}
