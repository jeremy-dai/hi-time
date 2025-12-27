import { useState } from 'react'
import type { EnhancedAnalysis } from '../../types/insights'
import { cn } from '../../utils/classNames'
import { generateTrendsReport, downloadMarkdownReport } from '../../utils/markdownGenerator'
import { Download, Check } from 'lucide-react'

interface ExportButtonProps {
  analysis: EnhancedAnalysis
  weekRange: string
}

export default function ExportButton({ analysis, weekRange }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Generate markdown report
      const markdownContent = generateTrendsReport(analysis)

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
          : 'bg-blue-600 hover:bg-blue-700 text-white',
        'shadow-sm hover:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'dark:bg-blue-500 dark:hover:bg-blue-600'
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
