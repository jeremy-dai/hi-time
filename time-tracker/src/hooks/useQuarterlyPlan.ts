import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { PlanJSON } from '../api'
import { getPlan, savePlan, listPlans } from '../api'
import type { SyncStatus } from './useSyncState'

const STORAGE_KEY = 'quarterly-plan-data'
const DEFAULT_PLAN_ID = 'default'
const SYNC_DEBOUNCE_MS = 5000 // 5 seconds

// Computed state derived from PlanJSON
export interface ComputedPlanState {
  currentWeekIndex: number
  currentWeek: PlanWeek | null
  currentCycle: PlanCycle | null
  totalWeeks: number
  completedWeeks: number
  overallProgress: number // 0-100
}

// Flattened week structure for UI consumption
export interface PlanWeek {
  weekNumber: number
  cycleId: string
  cycleName: string
  name: string
  theme?: string
  description?: string
  startDate: Date
  endDate: Date
  status: 'not_started' | 'current' | 'in_progress' | 'completed'
  
  // V2 Fields
  goals: string[]
  reflectionQuestions: string[]

  // Legacy/Compatibility
  focusAreas: string[]
  productQuestions: string[]
  validationCriteria: string[]

  dailyPlan: Array<{
    day: string
    techWork?: string
    productAction?: string
    techHours?: number
    productMinutes?: number
  }>
  todos: Array<{
    id: string
    title: string
    name?: string
    description?: string
    typeId?: string
    templateId?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
    estimate?: number
    estimatedHours?: number
    status?: 'not_started' | 'in_progress' | 'blocked' | 'done'
    dependencies?: string[]
  }>
  deliverables: Array<{
    id: string
    title: string
    name?: string
    description?: string
    typeId?: string
    templateId?: string
    type?: string
    format?: string
    status?: 'not_started' | 'in_progress' | 'done'
    resumeValue?: number
  }>
}

// Flattened cycle structure for UI consumption
export interface PlanCycle {
  id: string
  name: string
  theme?: string
  description?: string
  coreCompetencies: string[]
  status: 'not_started' | 'in_progress' | 'completed'
  resumeStory?: string
  startWeek: number
  endWeek: number
  weeks: PlanWeek[]
}

// Tracker with computed current value
export interface PlanTracker {
  id: string
  name: string
  unit?: string
  baseline: string | number
  target: string | number
  current: string | number
  // V2
  color?: string
}

// V4: Work type stats (completion-based KPI)
export interface WorkTypeStats {
  name: string
  description?: string
  total: number
  completed: number
  completionRate: number // 0-100
}

export interface UseQuarterlyPlanReturn {
  // Raw data
  planData: PlanJSON | null
  planId: string

  // Computed state
  planName: string
  planDescription: string
  startDate: Date | null
  cycles: PlanCycle[]
  allWeeks: PlanWeek[]
  trackers: PlanTracker[]
  weeklyHabit: PlanJSON['weekly_habit'] | null
  workTypeStats: WorkTypeStats[] // V4: Completion-based KPIs per work type

  // Current state
  currentWeekIndex: number
  currentWeek: PlanWeek | null
  currentCycle: PlanCycle | null

  // Sync state
  isLoading: boolean
  syncStatus: SyncStatus
  lastSynced: Date | null
  hasUnsavedChanges: boolean

  // Actions
  setPlanData: (data: PlanJSON) => void
  updateWeekStatus: (weekNumber: number, status: PlanWeek['status']) => void
  updateTodoStatus: (weekNumber: number, todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => void
  updateDeliverableStatus: (weekNumber: number, deliverableId: string, status: 'not_started' | 'in_progress' | 'done') => void
  updateTrackerValue: (trackerId: string, value: string | number) => void
  addWeeklyHabitLog: (weekNumber: number, answers: Record<string, string>) => void
  importPlan: (json: PlanJSON) => void
  exportPlan: () => PlanJSON | null
  clearPlan: () => void
  syncNow: () => Promise<void>
  updateWeekDetails: (weekNumber: number, details: { name?: string; theme?: string }) => void
  updateCycleDetails: (cycleId: string, details: { name?: string; theme?: string; status?: PlanCycle['status'] }) => void
  updateTodoDetails: (weekNumber: number, todoId: string, details: { title?: string; priority?: 'low' | 'medium' | 'high'; estimate?: number }) => void
  updateDeliverableDetails: (weekNumber: number, deliverableId: string, details: { title?: string }) => void
  addTodo: (weekNumber: number, todo: { title: string; typeId?: string; priority?: 'low' | 'medium' | 'high'; estimate?: number }) => void
  deleteTodo: (weekNumber: number, todoId: string) => void
  addDeliverable: (weekNumber: number, deliverable: { title: string; typeId?: string }) => void
  deleteDeliverable: (weekNumber: number, deliverableId: string) => void
  updateWeekComprehensive: (weekNumber: number, updates: { name?: string; theme?: string; status?: PlanWeek['status']; todos?: PlanWeek['todos']; deliverables?: PlanWeek['deliverables'] }) => void
  addWeek: (cycleId: string, weekData?: Partial<PlanWeek>) => void
  deleteWeek: (weekNumber: number) => void

  // V4 Actions
  updateItemStatus: (cycleId: string, itemIndex: number, status: 'pending' | 'completed') => void
}

// Helper to compute week dates from plan anchor
function getWeekDates(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const planStart = new Date(startDate)
  const weekStart = new Date(planStart)
  weekStart.setDate(planStart.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { start: weekStart, end: weekEnd }
}

// Helper to determine current week index based on today's date
function getCurrentWeekIndex(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

// Transform PlanJSON to UI-friendly structures
function transformPlanData(planData: PlanJSON): {
  cycles: PlanCycle[]
  allWeeks: PlanWeek[]
  trackers: PlanTracker[]
} {
  // V2 uses anchor_date at root, V1 uses anchor.start_date
  const startDateStr = planData.plan.anchor_date || planData.plan.anchor?.start_date
  if (!startDateStr) {
    console.error('No start date found in plan data', {
      planId: planData.plan?.id,
      planName: planData.plan?.name,
      hasAnchorDate: !!planData.plan.anchor_date,
      hasAnchor: !!planData.plan.anchor,
      anchorStartDate: planData.plan.anchor?.start_date,
      planKeys: Object.keys(planData.plan || {}),
    })
    return { cycles: [], allWeeks: [], trackers: [] }
  }

  const allWeeks: PlanWeek[] = []
  const cycles: PlanCycle[] = []

  let globalWeekIndex = 0 // Changed to 0-based index

  for (const cycle of planData.cycles) {
    const cycleWeeks: PlanWeek[] = []
    let minWeek = Infinity
    let maxWeek = -Infinity

    for (const week of cycle.weeks || []) {
      // V3: week_number is ALWAYS calculated from position (ignores any week_number in JSON)
      // This allows weeks to be reordered/inserted/deleted with automatic renumbering
      const weekNumber = globalWeekIndex + 1
      globalWeekIndex++

      const dates = getWeekDates(startDateStr, weekNumber)
      minWeek = Math.min(minWeek, weekNumber)
      maxWeek = Math.max(maxWeek, weekNumber)

      const planWeek: PlanWeek = {
        weekNumber: weekNumber,
        cycleId: cycle.id,
        cycleName: cycle.name,
        name: week.name || week.theme || `Week ${weekNumber}`,
        theme: week.theme,
        description: week.description,
        startDate: dates.start,
        endDate: dates.end,
        status: week.status || 'not_started',

        // Map V2/V1 fields
        goals: week.goals || (week as any).focus_areas || [],
        focusAreas: (week as any).focus_areas || week.goals || [], // Back-compat

        reflectionQuestions: week.reflection_questions || (week as any).product_questions || [],
        productQuestions: (week as any).product_questions || week.reflection_questions || [], // Back-compat

        validationCriteria: (week as any).validation_criteria || [], // Back-compat

        dailyPlan: ((week as any).daily_plan || []).map((d: any) => ({
          day: d.day,
          techWork: d.tech_work,
          productAction: d.product_action,
          techHours: d.tech_hours,
          productMinutes: d.product_minutes,
        })),
        // V5: todos have `text`, `type`, status: 'pending'|'in_progress'|'completed'|'blocked'
        // V3: todos have `title`, `type_id`, status: 'not_started'|'in_progress'|'blocked'|'done'
        todos: (week.todos || []).map((t: any) => {
          // Check if V5 format (has `text` field)
          const isV5 = 'text' in t

          // Map V5 status to V3 legacy status
          let todoStatus = t.status || 'not_started'
          if (isV5) {
            if (t.status === 'pending') todoStatus = 'not_started'
            else if (t.status === 'completed') todoStatus = 'done'
            else if (t.status === 'blocked') todoStatus = 'blocked'
            else todoStatus = t.status // in_progress maps directly
          }

          return {
            id: t.id,
            title: isV5 ? t.text : (t.title || t.name || ''),
            name: isV5 ? t.text : (t.name || t.title || ''),
            description: t.description,
            typeId: isV5 ? t.type : t.type_id,
            templateId: t.template_id,
            category: t.category,
            priority: t.priority,
            estimate: t.estimate,
            estimatedHours: t.estimated_hours,
            status: todoStatus,
            dependencies: t.dependencies,
          }
        }),
        deliverables: ((week as any).deliverables || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.name || '',
          name: d.name || d.title || '',
          description: d.description,
          typeId: d.type_id,
          templateId: d.template_id,
          type: d.type,
          format: d.format,
          status: d.status,
          resumeValue: d.resume_value,
        })),
      }

      cycleWeeks.push(planWeek)
      allWeeks.push(planWeek)
    }

    cycles.push({
      id: cycle.id,
      name: cycle.name,
      theme: cycle.theme,
      description: cycle.description,
      coreCompetencies: cycle.core_competencies || [],
      status: cycle.status || 'not_started',
      resumeStory: cycle.resume_story,
      startWeek: minWeek === Infinity ? 1 : minWeek,
      endWeek: maxWeek === -Infinity ? 1 : maxWeek,
      weeks: cycleWeeks,
    })
  }

  // Sort allWeeks by week number
  allWeeks.sort((a, b) => a.weekNumber - b.weekNumber)

  // Transform trackers
  // V2: Derived from work_types
  let trackers: PlanTracker[] = []

  if (planData.work_types) {
    trackers = planData.work_types.map(wt => {
      // Calculate total and completed todos for this work type
      let total = 0
      let completed = 0

      // Count todos by matching work type name
      for (const week of allWeeks) {
        for (const todo of week.todos) {
          // Match by work type name (typeId in transformed data is the work type name)
          if (todo.typeId === wt.name) {
            total++
            if (todo.status === 'done') {
              completed++
            }
          }
        }
      }

      return {
        id: wt.name, // Use name as ID since work_types don't have id field
        name: wt.name,
        unit: undefined,
        baseline: 0,
        target: total, // Total number of todos for this work type
        current: completed, // Number of completed todos
        color: (wt as any).color
      }
    })
  } else {
    // Legacy trackers
    trackers = (planData.trackers || []).map(t => ({
      id: t.id,
      name: t.name,
      unit: t.unit,
      baseline: t.baseline,
      target: t.target,
      current: t.current ?? t.baseline,
    }))
  }

  return { cycles, allWeeks, trackers }
}

// Load from localStorage
function loadFromStorage(): { planId: string; planData: PlanJSON } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.planData && parsed.planId) {
        return parsed
      }
      // Legacy format: just planData
      if (parsed.plan) {
        return { planId: parsed.plan.id || DEFAULT_PLAN_ID, planData: parsed }
      }
    }
  } catch (e) {
    console.error('Failed to load quarterly plan from storage:', e)
  }
  return null
}

// Save to localStorage
function saveToStorage(planId: string, planData: PlanJSON): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planId, planData }))
  } catch (e) {
    console.error('Failed to save quarterly plan to storage:', e)
  }
}

export function useQuarterlyPlan(): UseQuarterlyPlanReturn {
  const [planId, setPlanId] = useState<string>(DEFAULT_PLAN_ID)
  const [planData, setPlanDataState] = useState<PlanJSON | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  // Load from database on mount, fallback to localStorage
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadPlan = async () => {
      setIsLoading(true)

      // Try loading from localStorage first for instant UI
      const localData = loadFromStorage()
      if (localData && !cancelled) {
        setPlanId(localData.planId)
        setPlanDataState(localData.planData)
      }

      // Then try loading from database
      try {
        // First, list available plans
        const plans = await listPlans()
        if (cancelled) return

        if (plans.length > 0) {
          // Load the most recently updated plan
          const mostRecent = plans[0]
          const dbPlan = await getPlan(mostRecent.planId)

          if (!cancelled && dbPlan && dbPlan.planData) {
            // Validate that the plan has a start date
            const hasStartDate = dbPlan.planData.plan?.anchor_date || dbPlan.planData.plan?.anchor?.start_date

            if (hasStartDate) {
              setPlanId(dbPlan.planId)
              setPlanDataState(dbPlan.planData)
              saveToStorage(dbPlan.planId, dbPlan.planData)
              setSyncStatus('synced')
              setLastSynced(new Date())
            } else {
              console.warn('Plan from database is missing start date, keeping local data')
              if (localData) {
                // Local data is more recent and valid, sync it to DB
                setSyncStatus('pending')
              }
            }
          }
        } else if (localData) {
          // No plans in DB but we have local data, mark as pending
          setSyncStatus('pending')
        }
      } catch (err) {
        console.error('Failed to load plan from database:', err)
        if (localData) {
          setSyncStatus('pending')
        }
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    loadPlan()

    return () => {
      cancelled = true
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Sync to database with debouncing
  const syncToDatabase = useCallback(async (id: string, data: PlanJSON) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await savePlan(id, data)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync plan to database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [])

  // Normalize plan data by removing week_number (always calculated from position)
  const normalizePlanData = useCallback((data: PlanJSON): PlanJSON => {
    const normalized = { ...data }

    // Remove week_number from all weeks - it's always calculated from position
    for (const cycle of normalized.cycles) {
      if (cycle.weeks) {
        for (const week of cycle.weeks || []) {
          delete week.week_number
        }
      }
    }

    return normalized
  }, [])

  // Set plan data and trigger debounced sync
  const setPlanData = useCallback((data: PlanJSON) => {
    const normalizedData = normalizePlanData(data)
    const id = normalizedData.plan.id || planId
    setPlanId(id)
    setPlanDataState(normalizedData)
    saveToStorage(id, normalizedData)

    // Debounce database sync
    setSyncStatus('pending')
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToDatabase(id, normalizedData)
    }, SYNC_DEBOUNCE_MS)
  }, [planId, syncToDatabase, normalizePlanData])

  // Computed values
  const transformed = useMemo(() => {
    if (!planData) return { cycles: [], allWeeks: [], trackers: [] }
    return transformPlanData(planData)
  }, [planData])

  const currentWeekIndex = useMemo(() => {
    if (!planData) return 1
    const startDate = planData.plan.anchor_date || planData.plan.anchor?.start_date
    if (!startDate) return 1
    return getCurrentWeekIndex(startDate)
  }, [planData])

  const currentWeek = useMemo(() => {
    return transformed.allWeeks.find(w => w.weekNumber === currentWeekIndex) || null
  }, [transformed.allWeeks, currentWeekIndex])

  const currentCycle = useMemo(() => {
    if (!currentWeek) return null
    return transformed.cycles.find(c => c.id === currentWeek.cycleId) || null
  }, [transformed.cycles, currentWeek])

  // Update week status
  const updateWeekStatus = useCallback((weekNumber: number, status: PlanWeek['status']) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week) {
        week.status = status
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update week details
  const updateWeekDetails = useCallback((weekNumber: number, details: { name?: string; theme?: string }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week) {
        if (details.name !== undefined) week.name = details.name
        if (details.theme !== undefined) week.theme = details.theme
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update todo status
  const updateTodoStatus = useCallback((weekNumber: number, todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.todos) {
        const todo = week.todos.find(t => t.id === todoId)
        if (todo) {
          todo.status = status
          break
        }
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update deliverable status
  const updateDeliverableStatus = useCallback((weekNumber: number, deliverableId: string, status: 'not_started' | 'in_progress' | 'done') => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.deliverables) {
        const deliverable = week.deliverables.find(d => d.id === deliverableId)
        if (deliverable) {
          deliverable.status = status
          break
        }
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update tracker value
  const updateTrackerValue = useCallback((trackerId: string, value: string | number) => {
    if (!planData || !planData.trackers) return

    const newPlanData = { ...planData }
    const tracker = newPlanData.trackers?.find(t => t.id === trackerId)
    if (tracker) {
      tracker.current = value
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Add weekly habit log
  const addWeeklyHabitLog = useCallback((weekNumber: number, answers: Record<string, string>) => {
    if (!planData || !planData.weekly_habit) return

    const newPlanData = { ...planData }
    if (!newPlanData.weekly_habit!.logs) {
      newPlanData.weekly_habit!.logs = []
    }

    newPlanData.weekly_habit!.logs.push({
      week: weekNumber,
      date: new Date().toISOString().split('T')[0],
      answers,
    })

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Import plan from JSON
  const importPlan = useCallback((json: PlanJSON) => {
    console.log('Importing plan:', {
      planId: json.plan?.id,
      planName: json.plan?.name,
      hasAnchorDate: !!json.plan?.anchor_date,
      anchorDate: json.plan?.anchor_date,
      hasAnchor: !!json.plan?.anchor,
      anchorStartDate: json.plan?.anchor?.start_date,
    })

    const id = json.plan.id || DEFAULT_PLAN_ID
    setPlanId(id)
    setPlanDataState(json)
    saveToStorage(id, json)

    // Sync immediately on import - this will overwrite any old database data
    setSyncStatus('syncing')
    syncToDatabase(id, json)
  }, [syncToDatabase])

  // Export plan to JSON
  const exportPlan = useCallback((): PlanJSON | null => {
    return planData
  }, [planData])

  // Clear plan
  const clearPlan = useCallback(() => {
    setPlanDataState(null)
    localStorage.removeItem(STORAGE_KEY)
    setSyncStatus('idle')
  }, [])

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!planData || syncStatus === 'syncing') return

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    await syncToDatabase(planId, planData)
  }, [planId, planData, syncStatus, syncToDatabase])

  // Update cycle details
  const updateCycleDetails = useCallback((cycleId: string, details: { name?: string; theme?: string; status?: PlanCycle['status'] }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    const cycle = newPlanData.cycles.find(c => c.id === cycleId)
    if (cycle) {
      if (details.name !== undefined) cycle.name = details.name
      if (details.theme !== undefined) cycle.theme = details.theme
      if (details.status !== undefined) cycle.status = details.status
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update todo details
  const updateTodoDetails = useCallback((weekNumber: number, todoId: string, details: { title?: string; priority?: 'low' | 'medium' | 'high'; estimate?: number }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.todos) {
        const todo = week.todos.find(t => t.id === todoId)
        if (todo) {
          if (details.title !== undefined) {
            todo.title = details.title
            todo.name = details.title
          }
          if (details.priority !== undefined) todo.priority = details.priority
          if (details.estimate !== undefined) todo.estimate = details.estimate
          break
        }
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Update deliverable details
  const updateDeliverableDetails = useCallback((weekNumber: number, deliverableId: string, details: { title?: string }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.deliverables) {
        const deliverable = week.deliverables.find(d => d.id === deliverableId)
        if (deliverable) {
          if (details.title !== undefined) {
            deliverable.title = details.title
            deliverable.name = details.title
          }
          break
        }
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Add todo
  const addTodo = useCallback((weekNumber: number, todo: { title: string; typeId?: string; priority?: 'low' | 'medium' | 'high'; estimate?: number }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week) {
        if (!week.todos) week.todos = []
        const newTodo = {
          id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: todo.title,
          name: todo.title,
          type_id: todo.typeId,
          priority: todo.priority || 'medium',
          estimate: todo.estimate || 0,
          status: 'not_started' as const
        }
        week.todos.push(newTodo)
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Delete todo
  const deleteTodo = useCallback((weekNumber: number, todoId: string) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.todos) {
        week.todos = week.todos.filter(t => t.id !== todoId)
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Add deliverable
  const addDeliverable = useCallback((weekNumber: number, deliverable: { title: string; typeId?: string }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week) {
        if (!week.deliverables) week.deliverables = []
        const newDeliverable = {
          id: `deliverable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: deliverable.title,
          name: deliverable.title,
          type_id: deliverable.typeId,
          status: 'not_started' as const
        }
        week.deliverables.push(newDeliverable)
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Delete deliverable
  const deleteDeliverable = useCallback((weekNumber: number, deliverableId: string) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week && week.deliverables) {
        week.deliverables = week.deliverables.filter(d => d.id !== deliverableId)
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Comprehensive week update (all at once)
  const updateWeekComprehensive = useCallback((weekNumber: number, updates: {
    name?: string
    theme?: string
    status?: PlanWeek['status']
    todos?: PlanWeek['todos']
    deliverables?: PlanWeek['deliverables']
  }) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const week = cycle.weeks?.find(w => w.week_number === weekNumber)
      if (week) {
        if (updates.name !== undefined) week.name = updates.name
        if (updates.theme !== undefined) week.theme = updates.theme
        if (updates.status !== undefined) week.status = updates.status
        if (updates.todos !== undefined) {
          // Map back to the raw format
          week.todos = updates.todos.map(t => ({
            id: t.id,
            title: t.title || t.name || '',
            name: t.name || t.title,
            type_id: t.typeId,
            priority: t.priority,
            estimate: t.estimate,
            status: t.status
          }))
        }
        if (updates.deliverables !== undefined) {
          // Map back to the raw format
          week.deliverables = updates.deliverables.map(d => ({
            id: d.id,
            title: d.title || d.name || '',
            name: d.name || d.title,
            type_id: d.typeId,
            status: d.status
          }))
        }
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Add week to a cycle at a specific position
  const addWeek = useCallback((cycleId: string, weekData?: Partial<PlanWeek>, insertAfterWeekNumber?: number) => {
    if (!planData) return

    const newPlanData = { ...planData }
    const cycle = newPlanData.cycles.find(c => c.id === cycleId)
    if (cycle) {
      // Create new week WITHOUT week_number (calculated from position)
      const newWeek = {
        name: weekData?.name || 'New Week',
        theme: weekData?.theme,
        status: weekData?.status || 'not_started',
        goals: weekData?.goals || [],
        todos: weekData?.todos?.map(t => ({
          id: t.id,
          title: t.title || t.name || '',
          name: t.name || t.title || '',
          type_id: t.typeId,
          priority: t.priority,
          estimate: t.estimate,
          status: t.status
        })) || [],
        deliverables: weekData?.deliverables?.map(d => ({
          id: d.id,
          title: d.title || d.name || '',
          name: d.name || d.title || '',
          type_id: d.typeId,
          status: d.status
        })) || []
      }

      // Insert at specific position if provided
      if (insertAfterWeekNumber !== undefined) {
        // Find the position in the cycle's weeks array
        let insertIndex = -1
        let currentWeekNum = 0

        // Calculate which position in THIS cycle corresponds to the global week number
        for (const c of newPlanData.cycles) {
          if (!c.weeks) continue
          for (let i = 0; i < c.weeks.length; i++) {
            currentWeekNum++
            if (c.id === cycleId && currentWeekNum === insertAfterWeekNumber) {
              insertIndex = i
              break
            }
          }
          if (insertIndex !== -1) break
        }

        if (insertIndex !== -1) {
          // Insert after the found position
          if (!cycle.weeks) cycle.weeks = []
          cycle.weeks.splice(insertIndex + 1, 0, newWeek)
        } else {
          // If position not found in this cycle, append to end
          if (!cycle.weeks) cycle.weeks = []
          cycle.weeks.push(newWeek)
        }
      } else {
        // No position specified, append to end of cycle
        if (!cycle.weeks) cycle.weeks = []
        cycle.weeks.push(newWeek)
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // Delete week
  const deleteWeek = useCallback((weekNumber: number) => {
    if (!planData) return

    const newPlanData = { ...planData }
    for (const cycle of newPlanData.cycles) {
      const weekIndex = cycle.weeks?.findIndex(w => w.week_number === weekNumber) ?? -1
      if (weekIndex !== -1 && cycle.weeks) {
        cycle.weeks.splice(weekIndex, 1)
        break
      }
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // V4: Update item status (cycleId, itemIndex within that cycle)
  const updateItemStatus = useCallback((cycleId: string, itemIndex: number, status: 'pending' | 'completed') => {
    if (!planData || !planData.cycles) return

    const newPlanData = { ...planData }
    const cycle = newPlanData.cycles.find(c => c.id === cycleId)
    if (cycle && cycle.items && cycle.items[itemIndex]) {
      cycle.items[itemIndex].status = status
    }

    setPlanData(newPlanData)
  }, [planData, setPlanData])

  // V5: Compute work type stats across all todos in all weeks
  const workTypeStats = useMemo((): WorkTypeStats[] => {
    if (!planData || !planData.work_types || !planData.cycles) {
      return []
    }

    // Collect all todos from all weeks in all cycles
    const allTodos = planData.cycles.flatMap(cycle =>
      (cycle.weeks || []).flatMap(week => week.todos || [])
    )

    return planData.work_types.map(workType => {
      const todosOfType = allTodos.filter(todo => todo.type === workType.name)
      const completedTodos = todosOfType.filter(todo => todo.status === 'completed')

      return {
        name: workType.name,
        description: workType.description,
        total: todosOfType.length,
        completed: completedTodos.length,
        completionRate: todosOfType.length > 0
          ? Math.round((completedTodos.length / todosOfType.length) * 100)
          : 0
      }
    })
  }, [planData])

  const hasUnsavedChanges = syncStatus === 'pending'

  return {
    planData,
    planId,
    planName: planData?.plan?.name || '',
    planDescription: planData?.plan?.description || '',
    startDate: planData?.plan ? new Date(planData.plan.anchor_date || planData.plan.anchor?.start_date || '') : null,
    cycles: transformed.cycles,
    allWeeks: transformed.allWeeks,
    trackers: transformed.trackers,
    weeklyHabit: planData?.weekly_habit || null,
    workTypeStats,
    currentWeekIndex,
    currentWeek,
    currentCycle,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    setPlanData,
    updateWeekStatus,
    updateWeekDetails,
    updateTodoStatus,
    updateDeliverableStatus,
    updateTrackerValue,
    addWeeklyHabitLog,
    importPlan,
    exportPlan,
    clearPlan,
    syncNow,
    updateCycleDetails,
    updateTodoDetails,
    updateDeliverableDetails,
    addTodo,
    deleteTodo,
    addDeliverable,
    deleteDeliverable,
    updateWeekComprehensive,
    addWeek,
    deleteWeek,
    updateItemStatus,
  }
}
