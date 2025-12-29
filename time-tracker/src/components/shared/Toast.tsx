import { useEffect, useState } from 'react'
import { useToast, type ToastVariant } from './ToastContext'

interface ToastItemProps {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  onRemove: (id: string) => void
}

function ToastItem({ id, message, variant, duration = 4000, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration <= 0) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [duration])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(id), 300) // Match animation duration
  }

  const variantStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      icon: 'text-emerald-600',
      progress: 'bg-emerald-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: 'text-red-600',
      progress: 'bg-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: 'text-amber-600',
      progress: 'bg-amber-600'
    },
    info: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      icon: 'text-emerald-600',
      progress: 'bg-emerald-600'
    }
  }

  const styles = variantStyles[variant]

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-[400px] opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={`${styles.bg} ${styles.border} ${styles.text} border rounded-xl shadow-lg overflow-hidden min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3 p-4">
          <div className={styles.icon}>
            {icons[variant]}
          </div>
          <p className="flex-1 text-sm font-medium leading-relaxed">
            {message}
          </p>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  )
}
