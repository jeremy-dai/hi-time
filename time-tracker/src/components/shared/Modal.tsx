import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  variant?: 'default' | 'danger' | 'warning'
  children?: ReactNode
  actions: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  variant = 'default',
  children,
  actions,
  closeOnBackdrop = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Icon background colors based on variant
  const iconBgColors = {
    default: 'bg-emerald-100',
    danger: 'bg-red-100',
    warning: 'bg-amber-100'
  }

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the first focusable element in the modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTab)

    return () => {
      document.removeEventListener('keydown', handleTab)
      // Restore focus when modal closes
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className={`w-12 h-12 rounded-full ${iconBgColors[variant]} flex items-center justify-center shrink-0`}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 id="modal-title" className="text-lg font-bold text-gray-900 mb-1">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="flex gap-3 pt-2">
          {actions}
        </div>
      </div>
    </div>
  )
}
