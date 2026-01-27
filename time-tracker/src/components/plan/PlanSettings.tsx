import { useState, useRef } from 'react'
import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import type { PlanJSON } from '../../api'
import { Upload, Download, Trash2, AlertTriangle, RefreshCw, Calendar, Target, TrendingUp, ChevronDown, ChevronUp, FileJson } from 'lucide-react'
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
  const [showJsonFormat, setShowJsonFormat] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plan Settings</h1>
          <p className="text-sm text-gray-600">Import, export, and manage your quarterly plan.</p>
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
        <div className="glass-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Current Plan</h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-2xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">Active</span>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
              <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Plan Name</label>
              <p className="text-gray-900 font-bold text-xl tracking-tight">{planName || 'Unnamed Plan'}</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
              <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Start Date</label>
              <p className="text-gray-900 font-semibold text-base font-mono">
                {startDate ? startDate.toISOString().split('T')[0] : 'Not set'}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-emerald-600" />
                <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Cycles</label>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{cycles.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Weeks</label>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{totalWeeks}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Trackers</label>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{trackers.length}</p>
            </div>
          </div>

          {planDescription && (
            <div>
              <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
              <p className="text-sm text-gray-600 leading-relaxed bg-white/50 p-4 rounded-xl border border-white/40">{planDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* Plan Management (Export & Import) */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-6">Plan Management</h2>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Download size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Export Plan</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Download your current plan as a JSON file including all cycles, tasks, and trackers.
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={!planData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-white hover:border-emerald-300 hover:text-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={16} />
              Export JSON
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 md:border-l md:border-white/40 md:pl-8">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Upload size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Import Plan</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload a JSON file to replace your current plan. <span className="text-red-600 font-semibold">This is destructive.</span>
                </p>
              </div>
            </div>

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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-800 transition-all shadow-sm"
              >
                <Upload size={16} />
                Upload JSON File
              </button>

              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Or paste JSON content here..."
                  className="w-full h-24 px-3 py-2.5 text-xs border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white/70 backdrop-blur-sm placeholder:text-gray-400"
                />
                {jsonInput && (
                   <button
                    onClick={handleImportFromText}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
                   >
                     Load
                   </button>
                )}
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Format Reference - Collapsible */}
      <div className="glass-card rounded-xl overflow-hidden">
        <button
          onClick={() => setShowJsonFormat(!showJsonFormat)}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-white/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-xl">
              <FileJson size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">JSON Format Reference</h2>
              <p className="text-xs text-gray-500">
                See <code className="bg-gray-200 px-1.5 py-0.5 rounded text-2xs font-mono">docs/PLAN_FORMAT.md</code> for full specification
              </p>
            </div>
          </div>
          {showJsonFormat ? (
            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
          )}
        </button>

        {showJsonFormat && (
          <div className="px-4 md:px-6 pb-6 border-t border-white/40">
            <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto mt-4 font-mono leading-relaxed">
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
        )}
      </div>

      {/* Manual Sync */}
      {planData && (
        <div className="glass-card rounded-xl p-4 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <RefreshCw size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Manual Sync</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your plan is automatically synced to the database every 5 seconds after changes. You can also manually trigger a sync.
              </p>
            </div>
          </div>
          <button
            onClick={syncNow}
            disabled={syncStatus === 'syncing'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-semibold text-sm w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border-2 border-red-200 p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-red-700 tracking-tight">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          {/* Clear All */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-red-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Clear Plan</h3>
              <p className="text-sm text-gray-600">Remove all plan data from local storage. This cannot be undone.</p>
            </div>
            {showConfirmClear ? (
              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearPlan()
                    setShowConfirmClear(false)
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm font-semibold text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Confirm Delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm font-semibold text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Clear Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
