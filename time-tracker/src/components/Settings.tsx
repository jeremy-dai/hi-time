import { useState, useEffect, useRef } from 'react'
import { getSettings, saveSettings, exportBulkCSV, type UserSettings, type SubcategoryDef } from '../api'
import { SUBCATEGORY_SHADES_HEX } from '../constants/colors'
import { getCategoryLabel, getCategoryColor, isDarkColor } from '../utils/colorHelpers'
import { CATEGORY_KEYS } from '../types/time'
import { useLocalStorageSync } from '../hooks/useLocalStorageSync'
import { normalizeSubcategories } from '../utils/subcategoryHelpers'
import { toast } from 'sonner'
import { IconButton } from './shared/IconButton'
import { ClearableInput } from './shared/ClearableInput'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { Modal } from './shared/Modal'
import { PageContainer } from './layout/PageContainer'
import { PageHeader } from './layout/PageHeader'
import { SegmentedTabs } from './shared/SegmentedTabs'
import { EmojiPickerPopover } from './shared/EmojiPickerPopover'
import { Settings as SettingsIcon, Tag, Monitor, Download } from 'lucide-react'

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: 'Beijing (UTC+8)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' }
]

const TABS = [
  { id: 'categories', label: 'Categories', icon: <Tag size={16} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={16} /> },
  { id: 'data', label: 'Data', icon: <Download size={16} /> },
]

export function Settings({ section }: { section?: string }) {
  const [loading, setLoading] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('categories')
  
  // If section prop is provided, use it as activeTab
  const effectiveTab = section || activeTab

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
      // No need to call onSettingsSaved - App.tsx now uses the same hook
      return success;
    },
    loadFromDatabase: async () => {
      return await getSettings();
    }
  })

  useEffect(() => {
    // Loading is handled by the hook
    if (settings !== null && !hasMigratedRef.current) {
      // Safety check: if subcategories is missing, don't attempt migration
      // The hook should have caught this, but defense in depth
      if (!settings.subcategories) {
        console.warn('[Settings] Received settings without subcategories, waiting for database load');
        setLoading(false);
        return;
      }

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

  // Helper function to sort time dividers chronologically
  function sortTimeDividers(dividers: string[]): string[] {
    return [...dividers].sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number)
      const [bHour, bMin] = b.split(':').map(Number)
      return aHour * 60 + aMin - (bHour * 60 + bMin)
    })
  }

  // Helper function to calculate week difference
  function calculateWeekDiff(startWeek: string, endWeek: string): number {
    const start = new Date(startWeek)
    const end = new Date(endWeek)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  // Validate export date range
  function validateExportRange(): { valid: boolean; error?: string } {
    if (!exportStartWeek || !exportEndWeek) {
      return { valid: false, error: 'Please select both start and end weeks' }
    }
    if (exportStartWeek > exportEndWeek) {
      return { valid: false, error: 'Start week must be before end week' }
    }
    const weekDiff = calculateWeekDiff(exportStartWeek, exportEndWeek)
    if (weekDiff > 52) {
      return { valid: false, error: 'Export range cannot exceed 52 weeks' }
    }
    return { valid: true }
  }

  async function handleBulkExport() {
    const validation = validateExportRange()
    if (!validation.valid) {
      toast.warning(validation.error!)
      return
    }

    setExporting(true)
    try {
      const csv = await exportBulkCSV(exportStartWeek, exportEndWeek)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timesheet_export_${exportStartWeek}_to_${exportEndWeek}.csv`
      a.click()

      const weekDiff = calculateWeekDiff(exportStartWeek, exportEndWeek)
      toast.success(`Successfully exported ${weekDiff} weeks of data!`)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Export failed'
      toast.error(`Export failed: ${errorMsg}`)
    } finally {
      setExporting(false)
    }
  }

  function updateSubcategory(category: string, slotIndex: number, value: string, icon?: string) {
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

    // Preserve the index, update the name and icon
    const existingIndex = newSubcategories[slotIndex]?.index ?? slotIndex
    // Preserve existing icon if not provided
    const existingIcon = newSubcategories[slotIndex]?.icon
    
    newSubcategories[slotIndex] = {
      index: existingIndex,
      name: trimmedValue,
      // If icon is provided (including empty string), use it. Otherwise keep existing.
      icon: icon !== undefined ? icon : existingIcon
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

  if (loading || !settings) {
    return (
      <div className="space-y-6 max-w-6xl">
        <SkeletonLoader variant="card" height="120px" />
        <SkeletonLoader variant="card" height="400px" />
        <SkeletonLoader variant="card" height="200px" />
      </div>
    )
  }

  function addTimeDivider() {
    if (!settings) return
    const newTime = '12:00'

    // Check for duplicates
    if (settings.timeDividers?.includes(newTime)) {
      toast.warning('This time divider already exists')
      return
    }

    const newDividers = sortTimeDividers([...(settings.timeDividers || []), newTime])
    setSettings({ ...settings, timeDividers: newDividers })
  }

  function updateTimeDivider(index: number, value: string) {
    if (!settings) return
    const currentDividers = [...(settings.timeDividers || [])]

    // Check if the new value is a duplicate (excluding the current index)
    const isDuplicate = currentDividers.some((time, i) => i !== index && time === value)
    if (isDuplicate) {
      toast.warning('This time divider already exists')
      return
    }

    currentDividers[index] = value
    // Don't sort immediately - wait for onBlur
    setSettings({ ...settings, timeDividers: currentDividers })
  }

  function sortTimeDividersOnBlur() {
    if (!settings) return
    const sortedDividers = sortTimeDividers(settings.timeDividers || [])
    setSettings({ ...settings, timeDividers: sortedDividers })
  }

  function removeTimeDivider(index: number) {
    if (!settings) return
    const newDividers = settings.timeDividers?.filter((_, i) => i !== index) || []
    setSettings({ ...settings, timeDividers: newDividers })
  }

  const handleClearAll = () => {
    setSettings({
      ...settings,
      subcategories: {}
    })
    toast.success('All subcategories cleared')
    setShowClearConfirm(false)
  }

  if (section) {
    // Render content only, without PageContainer/Header/Tabs
    return (
      <div className="space-y-6">
        {effectiveTab === 'categories' && renderCategoriesContent()}
        {effectiveTab === 'display' && renderDisplayContent()}
        {effectiveTab === 'data' && renderDataContent()}
        {renderClearConfirmModal()}
      </div>
    )
  }

  return (
    <PageContainer
      header={
        <PageHeader
          title="Settings"
          icon={SettingsIcon}
          useGradientTitle={true}
          animateIcon={true}
          sync={{
            status: settingsSyncStatus,
            lastSynced: settingsLastSynced,
            hasUnsavedChanges: settingsHasUnsavedChanges || false,
            onSyncNow: syncSettingsNow
          }}
        />
      }
    >
      {/* Tabs Navigation */}
      <div className="mb-6">
        <SegmentedTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {effectiveTab === 'categories' && renderCategoriesContent()}
      {effectiveTab === 'display' && renderDisplayContent()}
      {effectiveTab === 'data' && renderDataContent()}
      {renderClearConfirmModal()}
    </PageContainer>
  )

  function renderCategoriesContent() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Categories & Subcategories</h2>
          <p className="text-xs text-gray-500">Define up to 5 subcategories for each category</p>
        </div>

          <div className="space-y-4">
            {CATEGORY_KEYS.filter(k => k !== '').map(cat => {
              const savedSubs = settings?.subcategories?.[cat] || []
              const hasSubcategories = savedSubs.length > 0

              return (
                <div key={cat} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform duration-200 active:scale-75 hover:shadow-md cursor-pointer select-none"
                      style={{
                        backgroundColor: getCategoryColor(cat).bg,
                        color: getCategoryColor(cat).text
                      }}
                      onClick={() => {
                        // Toy interaction: just a squish visual
                      }}
                    >
                      {cat}
                    </button>
                    <span className="font-semibold text-sm text-gray-900">{getCategoryLabel(cat)}</span>
                    {hasSubcategories && (
                      <span className="text-xs text-gray-400">({savedSubs.length})</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((index) => {
                      const subDef = savedSubs.find(s => s.index === index)
                      const value = subDef?.name || ''
                      const icon = subDef?.icon || ''
                      const shade = SUBCATEGORY_SHADES_HEX[cat][index]
                      const isDark = isDarkColor(shade)

                      return (
                        <div key={`${cat}-${index}`} className="relative flex items-center gap-1">
                          <EmojiPickerPopover
                            icon={icon}
                            onChange={(newIcon: string) => updateSubcategory(cat, index, value, newIcon)}
                          />
                          <div className="flex-1">
                            <ClearableInput
                              value={value}
                              onChange={(val) => updateSubcategory(cat, index, val)}
                              placeholder={`Sub ${index + 1}`}
                              maxLength={30}
                              showCharCount={value.length > 20}
                              backgroundColor={shade}
                              className={isDark ? '!text-white placeholder:!text-white/60' : 'text-gray-900'}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Clear All Button - Moved to bottom */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium text-xs rounded-xl hover:bg-red-100 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Subcategories
            </button>
          </div>
      </div>
    )
  }

  function renderDisplayContent() {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Display Preferences</h2>
          <p className="text-xs text-gray-500">Customize how your timesheet is displayed</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between py-4 border-b border-gray-100">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Timezone
              </label>
              <p className="text-xs text-gray-500">
                Sets your local timezone for the current time indicator
              </p>
            </div>
            <select
              value={settings?.timezone || 'Asia/Shanghai'}
              onChange={(e) => settings && setSettings({ ...settings, timezone: e.target.value })}
              className="ml-4 bg-transparent border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors hover:border-gray-400 cursor-pointer"
            >
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-start justify-between py-4">
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
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1.5 border border-transparent hover:border-gray-200 hover:shadow-sm transition-all">
                  <span className="text-gray-400 text-xs cursor-move" title="Drag to reorder (coming soon)">⋮⋮</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTimeDivider(index, e.target.value)}
                    onBlur={sortTimeDividersOnBlur}
                    className="bg-transparent border-none text-xs font-medium text-gray-900 focus:outline-none w-20 cursor-pointer"
                  />
                  <IconButton
                    size="sm"
                    variant="danger"
                    icon={
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                    onClick={() => removeTimeDivider(index)}
                    title="Remove divider"
                  />
                </div>
              ))}
              <button
                onClick={addTimeDivider}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all inline-flex items-center gap-1"
              >
                <span>+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderDataContent() {
    return (
      <div className="space-y-4 max-w-3xl">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Data Management</h2>
          <p className="text-xs text-gray-500">Export and manage your timesheet data</p>
        </div>

        <div>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Bulk Export
            </label>
            <p className="text-xs text-gray-500">
              Export timesheet data for a range of weeks as CSV
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Start Week</label>
              <input
                type="week"
                value={exportStartWeek}
                onChange={(e) => setExportStartWeek(e.target.value)}
                className="w-full bg-transparent border-b border-gray-200 rounded-t-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              />
            </div>
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">End Week</label>
              <input
                type="week"
                value={exportEndWeek}
                onChange={(e) => setExportEndWeek(e.target.value)}
                className="w-full bg-transparent border-b border-gray-200 rounded-t-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              />
            </div>
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-500 text-white font-semibold text-sm rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {exporting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          {exportStartWeek && exportEndWeek && exportStartWeek <= exportEndWeek && (
            <p className="text-xs text-gray-500 mt-2">
              Exporting {calculateWeekDiff(exportStartWeek, exportEndWeek)} weeks of data
            </p>
          )}
        </div>
      </div>
    )
  }

  function renderClearConfirmModal() {
    return (
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Subcategories?"
        description="This will permanently remove all subcategories from all categories. This action cannot be undone."
        icon={
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        variant="danger"
        actions={
          <>
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
          </>
        }
        closeOnBackdrop={true}
      />
    )
  }
}
