import { useState } from 'react'
import { parseTimeCSV } from '../utils/csvParser'
import type { TimeBlock } from '../types/time'

interface CSVImportProps {
  onImport: (weekData: TimeBlock[][]) => void
  onImportReference?: (weekData: TimeBlock[][]) => void
}

export function CSVImport({ onImport, onImportReference }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>('')
  const [asReference, setAsReference] = useState(false)

  const handleFileUpload = (file: File) => {
    setError('')
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const { weekData } = parseTimeCSV(content)
        if (asReference && onImportReference) {
          onImportReference(weekData)
        } else {
          onImport(weekData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import CSV Data</h2>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        
        <p className="text-lg text-gray-600 mb-2">
          Drop your CSV file here, or{' '}
          <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
            browse to upload
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </p>
        
        <div className="mt-4 flex items-center justify-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={asReference} onChange={(e) => setAsReference(e.target.checked)} />
            Import as previous (grayed look-back)
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Expected CSV format:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>First column: Time slots (e.g., 08:00, 08:30)</li>
          <li>Next 7 columns: Monday through Sunday</li>
          <li>Cell format: "Category:subcategory" (e.g., "W:meeting", "R:")</li>
          <li>Categories: R=Rest, W=Work, G=Growth, P=Personal, M=Mandatory</li>
        </ul>
      </div>
    </div>
  )
}

export default CSVImport
