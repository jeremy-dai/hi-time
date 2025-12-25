import { useState, useEffect, useRef } from 'react'
import { getSettings, saveSettings, exportBulkCSV, type UserSettings, type SubcategoryDef } from '../api'
import { CATEGORY_LABELS, SUBCATEGORY_SHADES_HEX, CATEGORY_COLORS_HEX } from '../constants/colors'
import { CATEGORY_KEYS } from '../types/time'
import Card from './shared/Card'
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
      const csv = await exportBulkCSV(exportStartWeek, exportEndWeek)
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
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Export</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Export timesheet data for a range of weeks.</p>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Start Week</label>
              <input
                type="week"
                value={exportStartWeek}
                onChange={(e) => setExportStartWeek(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">End Week</label>
              <input
                type="week"
                value={exportEndWeek}
                onChange={(e) => setExportEndWeek(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          {message && <p className="text-sm text-amber-600 mt-2">{message}</p>}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Subcategories</h2>
          <div className="flex items-center gap-3">
            {settingsSyncStatus && (
              <SyncStatusIndicator 
                status={settingsSyncStatus} 
                lastSynced={settingsLastSynced}
                hasUnsavedChanges={settingsHasUnsavedChanges || false}
                onSyncNow={syncSettingsNow}
              />
            )}
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/10 text-blue-600 font-bold text-sm rounded-full hover:bg-blue-500/20 transition-colors"
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
              className="px-4 py-2 bg-red-500/10 text-red-600 font-bold text-sm rounded-full hover:bg-red-500/20 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-8">
          Define up to 5 subcategories for each category. Click <strong className="text-gray-900">Save Now</strong> above to persist changes immediately.
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading settings...</div>
        ) : (
          <div className="space-y-8">
            {CATEGORY_KEYS.filter(k => k !== '').map(cat => (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
                    style={{ 
                      backgroundColor: CATEGORY_COLORS_HEX[cat].bg, 
                      color: CATEGORY_COLORS_HEX[cat].text 
                    }}
                  >
                    {cat}
                  </span>
                  <span className="font-bold text-lg text-gray-900">{CATEGORY_LABELS[cat]}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const savedSubs = settings?.subcategories[cat] || []
                    const subDef = savedSubs.find(s => s.index === index)
                    const value = subDef?.name || ''
                    const shade = SUBCATEGORY_SHADES_HEX[cat][index]
                    
                    return (
                      <input
                        key={`${cat}-${index}`}
                        type="text"
                        placeholder={`Subcategory ${index + 1}`}
                        className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-all placeholder:text-gray-500 text-gray-900 shadow-sm"
                        style={{ backgroundColor: shade }}
                        value={value}
                        onChange={(e) => updateSubcategory(cat, index, e.target.value)}
                      />
                    )
                  })}
                </div>
                <div className="h-px bg-gray-200 w-full my-6" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
