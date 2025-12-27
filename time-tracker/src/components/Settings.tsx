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
  const [showClearConfirm, setShowClearConfirm] = useState(false)

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

  function addTimeDivider() {
    if (!settings) return
    const newDividers = [...(settings.timeDividers || []), '12:00']
    setSettings({ ...settings, timeDividers: newDividers })
  }

  function updateTimeDivider(index: number, value: string) {
    if (!settings) return
    const newDividers = [...(settings.timeDividers || [])]
    newDividers[index] = value
    setSettings({ ...settings, timeDividers: newDividers })
  }

  function removeTimeDivider(index: number) {
    if (!settings) return
    const newDividers = settings.timeDividers?.filter((_, i) => i !== index) || []
    setSettings({ ...settings, timeDividers: newDividers })
  }

  const timezoneOptions = [
    { value: 'Asia/Shanghai', label: 'Beijing (UTC+8)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'UTC', label: 'UTC' }
  ]

  const handleClearAll = () => {
    setSettings({
      ...settings,
      subcategories: {}
    })
    setMessage('All subcategories cleared')
    setTimeout(() => setMessage(''), 3000)
    setShowClearConfirm(false)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Sync Status Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          {settingsSyncStatus && (
            <SyncStatusIndicator
              status={settingsSyncStatus}
              lastSynced={settingsLastSynced}
              hasUnsavedChanges={settingsHasUnsavedChanges || false}
              onSyncNow={syncSettingsNow}
            />
          )}
          {settingsHasUnsavedChanges ? (
            <span className="text-sm text-amber-600 font-medium">Unsaved changes (auto-syncing...)</span>
          ) : (
            <span className="text-sm text-gray-500">All changes saved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {settingsHasUnsavedChanges && (
            <button
              onClick={syncSettingsNow}
              className="px-5 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
            >
              Save Now
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>

      {/* Display Preferences */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Display</h2>
            <p className="text-sm text-gray-500">Customize how your timesheet is displayed</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between py-4 border-b border-gray-100">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Timezone
                </label>
                <p className="text-sm text-gray-500">
                  Sets your local timezone for the current time indicator
                </p>
              </div>
              <select
                value={settings.timezone || 'Asia/Shanghai'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="ml-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-300"
              >
                {timezoneOptions.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-0.5">
                  Time Dividers
                </label>
                <p className="text-xs text-gray-500">
                  Add visual dividers to mark different periods of the day
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(settings?.timeDividers || []).length === 0 && (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
                {(settings?.timeDividers || []).map((time, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-50 rounded-lg pl-2 pr-1 py-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeDivider(index, e.target.value)}
                      className="bg-transparent border-none text-sm text-gray-900 focus:outline-none w-24"
                    />
                    <button
                      onClick={() => removeTimeDivider(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Remove"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addTimeDivider}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                >
                  <span>+</span>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Categories & Subcategories */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Categories & Subcategories</h2>
              <p className="text-sm text-gray-500">Define up to 5 subcategories for each category</p>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium text-sm rounded-xl hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading settings...</div>
          ) : (
            <div className="space-y-6">
              {CATEGORY_KEYS.filter(k => k !== '').map(cat => (
                <div key={cat} className="pb-6 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{
                        backgroundColor: CATEGORY_COLORS_HEX[cat].bg,
                        color: CATEGORY_COLORS_HEX[cat].text
                      }}
                    >
                      {cat}
                    </span>
                    <span className="font-bold text-base text-gray-900">{CATEGORY_LABELS[cat]}</span>
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
                          className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-all placeholder:text-gray-400 text-gray-900 shadow-sm"
                          style={{ backgroundColor: shade }}
                          value={value}
                          onChange={(e) => updateSubcategory(cat, index, e.target.value)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Data Management</h2>
            <p className="text-sm text-gray-500">Export and manage your timesheet data</p>
          </div>

          <div className="space-y-4">
            <div className="py-4 border-b border-gray-100 last:border-0">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Bulk Export
                </label>
                <p className="text-sm text-gray-500">
                  Export timesheet data for a range of weeks as CSV
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="w-full sm:flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Start Week</label>
                  <input
                    type="week"
                    value={exportStartWeek}
                    onChange={(e) => setExportStartWeek(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">End Week</label>
                  <input
                    type="week"
                    value={exportEndWeek}
                    onChange={(e) => setExportEndWeek(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={handleBulkExport}
                  disabled={exporting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
              {message && (
                <div className="mt-3 px-4 py-2 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Clear All Subcategories?</h3>
                <p className="text-sm text-gray-600">
                  This will permanently remove all subcategories from all categories. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-500 transition-colors shadow-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
