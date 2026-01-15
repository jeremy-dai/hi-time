import { useState, useRef } from 'react'
import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import type { PlanJSON } from '../../api'
import { Upload, Download, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { SyncStatusIndicator } from '../SyncStatusIndicator'

interface PlanSettingsProps {
  data: UseQuarterlyPlanReturn
}

export function PlanSettings({ data }: PlanSettingsProps) {
  const {
    planData,
    planName,
    planDescription,
    startDate,
    cycles,
    trackers,
    importPlan,
    exportPlan,
    clearPlan,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    syncNow
  } = data

  const [jsonInput, setJsonInput] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const config = exportPlan()
    if (config) {
      const json = JSON.stringify(config, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-${planName.replace(/\s+/g, '-').toLowerCase() || 'export'}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportFromText = () => {
    setImportError(null)
    try {
      const config = JSON.parse(jsonInput) as PlanJSON
      // Validate the new format
      const hasAnchor = config.plan && (config.plan.anchor || config.plan.anchor_date)
      if (!config.plan || !hasAnchor || !config.cycles) {
        throw new Error('Invalid plan format: missing plan, plan.anchor/anchor_date, or cycles')
      }
      if (!config.plan.name && !config.plan.id) {
        throw new Error('Invalid plan format: missing plan.name or plan.id')
      }
      // Check for start date in either location
      const hasStartDate = config.plan.anchor_date || config.plan.anchor?.start_date
      if (!hasStartDate) {
        throw new Error('Invalid plan format: missing start date (plan.anchor_date or plan.anchor.start_date)')
      }
      importPlan(config)
      setJsonInput('')
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const config = JSON.parse(content) as PlanJSON
        // Validate the new format
        const hasAnchor = config.plan && (config.plan.anchor || config.plan.anchor_date)
        if (!config.plan || !hasAnchor || !config.cycles) {
          throw new Error('Invalid plan format: missing plan, plan.anchor/anchor_date, or cycles')
        }
        
        // Check for start date in either location
        const hasStartDate = config.plan.anchor_date || config.plan.anchor?.start_date
        if (!hasStartDate) {
          throw new Error('Invalid plan format: missing start date (plan.anchor_date or plan.anchor.start_date)')
        }

        importPlan(config)
        setImportError(null)
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Failed to parse file')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const totalWeeks = cycles.reduce((sum, c) => sum + c.weeks.length, 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Settings</h1>
          <p className="text-gray-600">Import, export, and manage your quarterly plan.</p>
        </div>
        <SyncStatusIndicator
          status={syncStatus}
          lastSynced={lastSynced}
          hasUnsavedChanges={hasUnsavedChanges}
          onSyncNow={syncNow}
          compact={false}
        />
      </div>

      {/* Current Plan Info */}
      {planData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Name</label>
              <p className="text-gray-900 font-medium">{planName || 'Unnamed Plan'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Start Date</label>
              <p className="text-gray-900 font-medium">
                {startDate ? startDate.toISOString().split('T')[0] : 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Cycles</label>
              <p className="text-gray-900 font-medium">{cycles.length}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Total Weeks</label>
              <p className="text-gray-900 font-medium">{totalWeeks}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Trackers</label>
              <p className="text-gray-900 font-medium">{trackers.length}</p>
            </div>
            {planDescription && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Description</label>
                <p className="text-gray-900">{planDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Plan</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download your current plan as a JSON file. This includes all cycles, weeks, todos, deliverables, and trackers.
        </p>
        <button
          onClick={handleExport}
          disabled={!planData}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Plan</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload a JSON file or paste JSON directly to import a new plan. This will replace your current plan.
        </p>

        {/* File Upload */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload JSON File
          </button>
        </div>

        {/* JSON Text Area */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Or paste JSON:</label>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"plan": {"id": "my-plan", "name": "My Plan", "anchor": {"start_date": "2026-01-01"}}, "cycles": [...], "trackers": [...]}'
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Import Error */}
        {importError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {importError}
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImportFromText}
          disabled={!jsonInput.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          Import from JSON
        </button>
      </div>

      {/* Data Format Reference */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">JSON Format (PLAN_FORMAT.md)</h2>
        <p className="text-sm text-gray-600 mb-4">
          See <code className="bg-gray-200 px-1 rounded">docs/PLAN_FORMAT.md</code> for the full specification.
        </p>
        <pre className="text-xs bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto">
{`{
  "plan": {
    "id": "plan-id",
    "name": "Plan Name",
    "description": "Optional description",
    "anchor_date": "2026-01-01",
    "timezone": "Asia/Shanghai"
  },
  "work_types": [
    {
      "id": "tech",
      "name": "Engineering",
      "color": "blue",
      "kpi_target": { "unit": "hours", "weekly_value": 20 }
    }
  ],
  "cycles": [
    {
      "id": "cycle-1",
      "name": "Cycle 1 Name",
      "theme": "Theme description",
      "status": "not_started",
      "weeks": [
        {
          "week_number": 1,
          "name": "Week 1 Name",
          "theme": "Week theme",
          "status": "not_started",
          "goals": ["Goal 1", "Goal 2"],
          "todos": [
            {
              "id": "w1-t1",
              "title": "Task name",
              "type_id": "tech",
              "priority": "high",
              "estimate": 4,
              "status": "not_started"
            }
          ],
          "deliverables": [
            {
              "id": "w1-d1",
              "title": "Deliverable name",
              "type_id": "tech",
              "status": "not_started"
            }
          ]
        }
      ]
    }
  ]
}`}
        </pre>
      </div>

      {/* Manual Sync */}
      {planData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Sync</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your plan is automatically synced to the database every 5 seconds after changes.
            You can also manually trigger a sync.
          </p>
          <button
            onClick={syncNow}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </h2>

        <div className="space-y-4">
          {/* Clear All */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Clear Plan</h3>
              <p className="text-sm text-gray-600">Remove all plan data from local storage. This cannot be undone.</p>
            </div>
            {showConfirmClear ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearPlan()
                    setShowConfirmClear(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
