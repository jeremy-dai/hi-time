import { useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface ExportInfoProps {
  reportType: 'trends' | 'annual'
}

export default function ExportInfo({ reportType }: ExportInfoProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const trendsContent = [
    'Time blocks (4 weeks)',
    'Weekly reviews',
    'Daily shipping logs',
    'Daily memories',
  ]

  const annualContent = [
    'Time blocks (full year)',
    'Weekly reviews',
    'Daily shipping logs',
    'Daily memories',
    'Quarterly goals',
  ]

  const content = reportType === 'trends' ? trendsContent : annualContent

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={cn(
          'flex items-center justify-center',
          'w-6 h-6 rounded-full',
          'text-emerald-600 hover:text-emerald-700',
          'hover:bg-emerald-100',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1'
        )}
        aria-label="Export contents information"
      >
        <Info className="w-4 h-4" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute right-0 top-8 z-50',
            'w-56 p-3 rounded-lg',
            'bg-white shadow-lg border border-gray-200',
            'text-sm text-gray-700'
          )}
        >
          <div className="font-semibold text-gray-900 mb-2">
            Export includes:
          </div>
          <ul className="space-y-1">
            {content.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-emerald-600 mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
