import { useState, useEffect } from 'react'
import { getSettings, saveSettings, type UserSettings } from '../api'
import { CATEGORY_SHORT_NAMES } from '../constants/colors'
import { CATEGORY_KEYS } from '../types/time'
import Card from './shared/Card'
import { cn } from '../utils/classNames'

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({ subcategories: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const data = await getSettings()
    setSettings(data)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const success = await saveSettings(settings)
    if (success) {
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('Failed to save settings.')
    }
    setSaving(false)
  }

  function addSubcategory(category: string, value: string) {
    if (!value.trim()) return
    const current = settings.subcategories[category] || []
    if (current.includes(value.trim())) return

    setSettings({
      ...settings,
      subcategories: {
        ...settings.subcategories,
        [category]: [...current, value.trim()].sort()
      }
    })
  }

  function removeSubcategory(category: string, value: string) {
    const current = settings.subcategories[category] || []
    setSettings({
      ...settings,
      subcategories: {
        ...settings.subcategories,
        [category]: current.filter(item => item !== value)
      }
    })
  }

  if (loading) return <div className="p-8">Loading settings...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <div className="flex items-center gap-4">
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subcategories Management</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Define subcategories for each category. These will appear in the context menu when editing time blocks.
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
                    {CATEGORY_SHORT_NAMES[category as keyof typeof CATEGORY_SHORT_NAMES]}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {(settings.subcategories[category] || []).map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
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
