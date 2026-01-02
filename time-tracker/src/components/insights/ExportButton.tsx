import { useState } from 'react'
import type { EnhancedAnalysis } from '../../types/insights'
import type { WeekReview, DailyShipping, DailyMemory } from '../../types/time'
import { cn } from '../../utils/classNames'
import { generateTrendsReport, downloadMarkdownReport } from '../../utils/markdownGenerator'
import { Download, Check } from 'lucide-react'

interface ExportButtonProps {
  analysis: EnhancedAnalysis
  weekRange: string
  weekReviews?: Record<number, WeekReview>
  dailyShipping?: Record<string, DailyShipping>
  memories?: Record<string, DailyMemory>
}

export default function ExportButton({ analysis, weekRange, weekReviews, dailyShipping, memories }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Generate markdown report with all optional data
      const markdownContent = generateTrendsReport(analysis, weekReviews, dailyShipping, memories)

      // Download file
      downloadMarkdownReport(markdownContent, weekRange)

      // Show success state
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to export report:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all',
        exportSuccess
          ? 'bg-green-500 text-white'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white',
        'shadow-sm hover:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {exportSuccess ? (
        <>
          <Check className="w-4 h-4" />
          <span>Exported!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
        </>
      )}
    </button>
  )
}
