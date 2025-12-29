import type { ReactNode } from 'react'

interface IconButtonProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'danger' | 'ghost'
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
  className?: string
}

export function IconButton({
  size = 'md',
  variant = 'default',
  icon,
  onClick,
  disabled = false,
  title,
  className = ''
}: IconButtonProps) {
  const sizeStyles = {
    sm: 'w-7 h-7 p-1',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5'
  }

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        rounded-xl
        flex items-center justify-center
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
        ${className}
      `}
      type="button"
    >
      {icon}
    </button>
  )
}
