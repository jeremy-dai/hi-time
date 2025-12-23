import { useState, useEffect } from 'react'
import { getSettings, saveSettings, type UserSettings } from '../api'
import { CATEGORY_LABELS } from '../constants/colors'
import { CATEGORY_KEYS } from '../types/time'
import Card from './shared/Card'
import { cn } from '../utils/classNames'
import { useLocalStorageSync } from '../hooks/useLocalStorageSync'
import { SyncStatusIndicator } from './SyncStatusIndicator'

interface SettingsProps {
  onSettingsSaved?: () => void
}

export function Settings({ onSettingsSaved }: SettingsProps) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [exportStartWeek, setExportStartWeek] = useState('')
  const [exportEndWeek, setExportEndWeek] = useState('')
  const [exporting, setExporting] = useState(false)

  // Local storage sync for settings
  const {
    data: settings,
    setData: setSettings,
    syncStatus: settingsSyncStatus,
    lastSynced: settingsLastSynced,
    hasUnsavedChanges: settingsHasUnsavedChanges,
    syncNow: syncSettingsNow
  } = useLocalStorageSync({
    storageKey: 'user-settings',
    syncInterval: 30000, // Sync every 30 seconds
    syncToDatabase: async (data: UserSettings) => {
      const success = await saveSettings(data);
      if (success && onSettingsSaved) {
        onSettingsSaved();
      }
      return success;
    },
    loadFromDatabase: async () => {
      return await getSettings();
    }
  })

  useEffect(() => {
    // Loading is handled by the hook
    if (settings !== null) {
      setLoading(false)
    }
  }, [settings])

  async function handleBulkExport() {
    if (!exportStartWeek || !exportEndWeek) {
      setMessage('Please select both start and end weeks')
      return
    }
    setExporting(true)
    setMessage('')
    try {
      const csv = await import('../api').then(m => m.exportBulkCSV(exportStartWeek, exportEndWeek))
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timesheet_export_${exportStartWeek}_to_${exportEndWeek}.csv`
      a.click()
      setMessage('Export successful!')
    } catch (e) {
      console.error(e)
      setMessage('Export failed')
    } finally {
      setExporting(false)
    }
  }

  function addSubcategory(category: string, value: string) {
    if (!value.trim() || !settings) return
    const current = settings.subcategories[category] || []
    if (current.includes(value.trim())) return

    const updated = {
      ...settings,
      subcategories: {
        ...settings.subcategories,
        [category]: [...current, value.trim()].sort()
      }
    }
    // Save to localStorage immediately, will sync to DB periodically
    setSettings(updated)
  }

  function removeSubcategory(category: string, value: string) {
    if (!settings) return
    const current = settings.subcategories[category] || []
    const updated = {
      ...settings,
      subcategories: {
        ...settings.subcategories,
        [category]: current.filter(item => item !== value)
      }
    }
    // Save to localStorage immediately, will sync to DB periodically
    setSettings(updated)
  }

  // Get variant color for a subcategory based on its index
  function getSubcategoryColor(category: string, index: number) {
    const shades = {
      'R': ['bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700'],
      'W': ['bg-yellow-200', 'bg-yellow-300', 'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600'],
      'G': ['bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'],
      'P': ['bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700'],
      'M': ['bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700', 'bg-orange-800'],
      '': ['bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600']
    }
    const categoryShades = shades[category as keyof typeof shades] || shades['']
    return categoryShades[index % categoryShades.length]
  }

  if (loading || !settings) return <div className="p-8">Loading settings...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <div className="flex items-center gap-4">
          <SyncStatusIndicator
            status={settingsSyncStatus}
            lastSynced={settingsLastSynced}
            hasUnsavedChanges={settingsHasUnsavedChanges}
            onSyncNow={syncSettingsNow}
          />
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Export</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Export timesheet data for a range of weeks.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Week
              </label>
              <input
                type="week"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={exportStartWeek}
                onChange={(e) => setExportStartWeek(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Week
              </label>
              <input
                type="week"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={exportEndWeek}
                onChange={(e) => setExportEndWeek(e.target.value)}
              />
            </div>
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subcategories Management</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Define subcategories for each category. These will appear in the context menu when editing time blocks. Changes are saved automatically after you stop editing. Each subcategory gets a variant color shade automatically.
          </p>
          
          <div className="space-y-6">
            {CATEGORY_KEYS.filter(k => k !== '').map(category => (
              <div key={category} className="border-b pb-4 last:border-0 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-white",
                    category === 'R' ? "bg-green-500" :
                    category === 'W' ? "bg-yellow-400" :
                    category === 'G' ? "bg-blue-500" :
                    category === 'P' ? "bg-red-500" :
                    category === 'M' ? "bg-orange-700" : "bg-gray-400"
                  )}>
                    {category}
                  </span>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {(settings.subcategories[category] || []).map((sub, idx) => (
                    <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                      <span className={`w-3 h-3 ${getSubcategoryColor(category, idx)} rounded flex-shrink-0`}></span>
                      {sub}
                      <button
                        onClick={() => removeSubcategory(category, sub)}
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(settings.subcategories[category] || []).length === 0 && (
                    <span className="text-sm text-gray-400 italic">No subcategories defined</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Add subcategory for ${category}...`}
                    className="flex-1 px-3 py-1 border rounded text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addSubcategory(category, e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <button
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      addSubcategory(category, input.value)
                      input.value = ''
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
