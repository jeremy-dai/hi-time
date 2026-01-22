import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/utils/classNames"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  variant?: 'default' | 'danger' | 'warning'
  children?: ReactNode
  actions?: ReactNode
  closeOnBackdrop?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
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
  closeOnBackdrop = true,
  maxWidth = 'md'
}: ModalProps) {
  const iconBgColors = {
    default: 'bg-emerald-100',
    danger: 'bg-red-100',
    warning: 'bg-amber-100'
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(maxWidthClasses[maxWidth])}
        onInteractOutside={(e) => {
          if (!closeOnBackdrop) {
             e.preventDefault()
          }
        }}
      >
        <div className="flex items-start gap-4">
          {icon && (
             <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBgColors[variant])}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <DialogHeader className="text-left">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            
            {children && <div className="mt-4">{children}</div>}
            
            {actions && (
              <DialogFooter className="mt-6 sm:justify-end gap-2">
                {actions}
              </DialogFooter>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
