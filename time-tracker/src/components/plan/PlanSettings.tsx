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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Current Plan</h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-2xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">Active</span>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="col-span-2 md:col-span-1">
              <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Plan Name</label>
              <p className="text-gray-900 font-bold text-xl tracking-tight">{planName || 'Unnamed Plan'}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Start Date</label>
              <p className="text-gray-900 font-semibold text-base font-mono">
                {startDate ? startDate.toISOString().split('T')[0] : 'Not set'}
              </p>
            </div>
            
            {/* Metadata Grid */}
            <div className="col-span-2 grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div>
                <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Cycles</label>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{cycles.length}</p>
              </div>
              <div>
                <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Weeks</label>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{totalWeeks}</p>
              </div>
              <div>
                <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Trackers</label>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{trackers.length}</p>
              </div>
            </div>
            
            {planDescription && (
              <div className="col-span-2 pt-2">
                <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{planDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Management (Export & Import) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Plan Management</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Download size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Export Plan</h3>
                <p className="text-xs text-gray-500">Backup your plan data</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed h-8">
              Download your current plan as a JSON file including all cycles, tasks, and trackers.
            </p>
            <button
              onClick={handleExport}
              disabled={!planData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all disabled:opacity-50 shadow-sm"
            >
              Export JSON
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 md:border-l md:border-gray-100 md:pl-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Upload size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Import Plan</h3>
                <p className="text-xs text-gray-500">Restore or load a new plan</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed h-8">
              Upload a JSON file to replace your current plan. <span className="text-red-500 font-medium">This is destructive.</span>
            </p>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white font-semibold text-sm rounded-lg hover:bg-zinc-800 transition-all shadow-sm"
              >
                Upload JSON File
              </button>
              
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Or paste JSON content here..."
                  className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-gray-50"
                />
                {jsonInput && (
                   <button
                    onClick={handleImportFromText}
                    className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-emerald-700"
                   >
                     Load
                   </button>
                )}
              </div>
              
              {importError && (
                <div className="p-2 bg-red-50 border border-red-100 rounded text-red-600 text-xs">
                  {importError}
                </div>
              )}
            </div>
          </div>
        </div>
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
    "id": "2026-q1",
    "name": "Q1 2026 Plan",
    "description": "Focus on product and content growth",
    "anchor_date": "2026-01-01",
    "timezone": "Asia/Shanghai"
  },
  "work_types": [
    {
      "name": "小红书",
      "description": "Social media content creation"
    },
    {
      "name": "Client Work",
      "description": "Consulting projects"
    }
  ],
  "cycles": [
    {
      "id": "cycle-1",
      "name": "Foundation",
      "theme": "Build and ship",
      "status": "in_progress",
      "weeks": [
        {
          "theme": "Setup Week",
          "goals": [
            "Complete infrastructure setup",
            "Ship first prototype"
          ],
          "todos": [
            {
              "id": "todo-1",
              "text": "Set up database schema",
              "type": "Client Work",
              "status": "completed",
              "priority": "high"
            },
            {
              "id": "todo-2",
              "text": "Write weekly reflection",
              "status": "pending",
              "priority": "medium",
              "template_id": "weekly_log"
            }
          ],
          "reflection_questions": [
            "What blocked me this week?",
            "What will I focus on next week?"
          ]
        }
      ]
    }
  ],
  "templates": {
    "weekly_log": "## Highlights\\n- \\n\\n## Lowlights\\n- "
  }
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
