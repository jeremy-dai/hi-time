import { IconButton } from './IconButton'

interface ClearableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  showCharCount?: boolean
  backgroundColor?: string
  className?: string
  onClear?: () => void
}

export function ClearableInput({
  value,
  onChange,
  placeholder,
  maxLength,
  showCharCount = false,
  backgroundColor,
  className = '',
  onClear
}: ClearableInputProps) {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  const charCount = value.length
  const isNearLimit = maxLength && charCount >= maxLength * 0.8
  const isAtLimit = maxLength && charCount >= maxLength

  const charCountColor = isAtLimit
    ? 'text-red-600'
    : isNearLimit
    ? 'text-amber-600'
    : 'text-gray-500'

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const newValue = e.target.value
          if (!maxLength || newValue.length <= maxLength) {
            onChange(newValue)
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full rounded-xl px-4 py-3 text-sm font-medium
          border border-transparent
          focus:outline-none focus:ring-2 focus:ring-emerald-500
          transition-all
          placeholder:text-gray-400 text-gray-900 shadow-sm
          ${value ? 'pr-10' : ''}
          ${className}
        `}
        style={backgroundColor ? { backgroundColor } : undefined}
      />

      {/* Clear button - only show when input has content */}
      {value && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <IconButton
            size="sm"
            variant="ghost"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            onClick={handleClear}
            title="Clear"
          />
        </div>
      )}

      {/* Character counter */}
      {showCharCount && maxLength && value && (
        <div className={`absolute -bottom-5 right-0 text-xs font-medium ${charCountColor}`}>
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  )
}
