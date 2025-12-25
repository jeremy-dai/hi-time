import { useState, useEffect, useRef } from 'react'
import { getSettings, saveSettings, type UserSettings, type SubcategoryDef } from '../api'
import { CATEGORY_LABELS, SUBCATEGORY_SHADES_HEX, CATEGORY_COLORS_HEX } from '../constants/colors'
import { CATEGORY_KEYS } from '../types/time'
import Card from './shared/Card'
import { cn } from '../utils/classNames'
import { useLocalStorageSync } from '../hooks/useLocalStorageSync'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { normalizeSubcategories } from '../utils/subcategoryHelpers'

interface SettingsProps {
  onSettingsSaved?: () => void
}

export function Settings({ onSettingsSaved }: SettingsProps) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [exportStartWeek, setExportStartWeek] = useState('')
  const [exportEndWeek, setExportEndWeek] = useState('')
  const [exporting, setExporting] = useState(false)
  const hasMigratedRef = useRef(false)

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
    if (settings !== null && !hasMigratedRef.current) {
      // Migrate old string format to new object format
      let needsMigration = false
      const migratedSubcategories: Record<string, SubcategoryDef[]> = {}

      Object.entries(settings.subcategories).forEach(([category, subs]) => {
        if (Array.isArray(subs) && subs.length > 0) {
          // Check if any items are strings (old format)
          const hasStrings = subs.some(sub => typeof sub === 'string')
          if (hasStrings) {
            needsMigration = true
            // Convert strings to objects
            migratedSubcategories[category] = subs
              .map((sub, index) => {
                if (typeof sub === 'string') {
                  return { index, name: sub }
                }
                return sub as SubcategoryDef
              })
              .filter(sub => sub.name && sub.name.trim().length > 0)
          } else {
            migratedSubcategories[category] = subs as SubcategoryDef[]
          }
        } else {
          migratedSubcategories[category] = subs as SubcategoryDef[]
        }
      })

      if (needsMigration) {
        console.log('Migrating old subcategory format to new format')
        hasMigratedRef.current = true
        setSettings({
          ...settings,
          subcategories: migratedSubcategories
        })
      }

      setLoading(false)
    } else if (settings !== null) {
      setLoading(false)
    }
  }, [settings, setSettings])

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

  function updateSubcategory(category: string, slotIndex: number, value: string) {
    if (!settings) return

    const current = settings.subcategories[category] || []
    // Normalize to new format
    const normalized = normalizeSubcategories(current)

    // Find or create subcategory at this slot
    const trimmedValue = value.trim()

    if (trimmedValue === '') {
      // Remove subcategory at this slot
      const filtered = normalized.filter((_, idx) => idx !== slotIndex)
      const updated = {
        ...settings,
        subcategories: {
          ...settings.subcategories,
          [category]: filtered
        }
      }
      setSettings(updated)
      return
    }

    // Update or add subcategory
    const newSubcategories = [...normalized]

    // Extend array if needed
    while (newSubcategories.length <= slotIndex) {
      newSubcategories.push({ index: newSubcategories.length, name: '' })
    }

    // Preserve the index, update the name
    const existingIndex = newSubcategories[slotIndex]?.index ?? slotIndex
    newSubcategories[slotIndex] = {
      index: existingIndex,
      name: trimmedValue
    }

    // Filter out empty names
    const filtered = newSubcategories.filter(s => s.name.length > 0)

    const updated = {
      ...settings,
      subcategories: {
        ...settings.subcategories,
        [category]: filtered
      }
    }
    // Save to localStorage immediately, will sync to DB periodically
    setSettings(updated)
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
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subcategories</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await syncSettingsNow()
                  setMessage('Subcategories saved to database!')
                  setTimeout(() => setMessage(''), 3000)
                }}
                disabled={!settingsHasUnsavedChanges}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded transition-all",
                  settingsHasUnsavedChanges
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                )}
              >
                {settingsHasUnsavedChanges ? '💾 Save Changes' : '✓ Saved'}
              </button>
              <button
                onClick={async () => {
                  // Clear localStorage and reload from database
                  localStorage.removeItem('user-settings')
                  const freshSettings = await getSettings()
                  setSettings(freshSettings)
                  setMessage('Reloaded from database!')
                  setTimeout(() => setMessage(''), 2000)
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                Reload
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all subcategories? This will remove all subcategories from all categories.')) {
                    setSettings({
                      ...settings,
                      subcategories: {}
                    })
                    setMessage('Subcategories cleared!')
                    setTimeout(() => setMessage(''), 2000)
                  }
                }}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Clear All
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Define up to 5 subcategories for each category. Click <strong>Save Changes</strong> to make them available in the timesheet.
          </p>

          <div className="space-y-6">
            {CATEGORY_KEYS.filter(k => k !== '').map(category => {
              const currentSubs = settings.subcategories[category] || []
              const normalizedSubs = normalizeSubcategories(currentSubs)

              return (
                <div key={category} className="border-b pb-4 last:border-0 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
                      style={{
                        backgroundColor: CATEGORY_COLORS_HEX[category as keyof typeof CATEGORY_COLORS_HEX].bg,
                        color: CATEGORY_COLORS_HEX[category as keyof typeof CATEGORY_COLORS_HEX].text
                      }}
                    >
                      {category}
                    </span>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map((slotIndex) => {
                      const subcategory = normalizedSubs[slotIndex]
                      const value = subcategory?.name || ''
                      const shades = SUBCATEGORY_SHADES_HEX[category as keyof typeof SUBCATEGORY_SHADES_HEX]
                      const bgColor = shades[slotIndex % shades.length]

                      return (
                        <input
                          key={slotIndex}
                          type="text"
                          value={value}
                          placeholder={`Subcategory ${slotIndex + 1}`}
                          style={{
                            backgroundColor: bgColor,
                            color: '#1f2937', // dark gray text for readability
                          }}
                          className="px-3 py-2 border-2 border-transparent rounded text-sm font-medium placeholder:text-gray-400 placeholder:opacity-60 placeholder:font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          onChange={(e) => updateSubcategory(category, slotIndex, e.target.value)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
