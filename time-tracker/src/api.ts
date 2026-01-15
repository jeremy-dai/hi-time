import type { TimeBlock, AnnualReview, QuarterlyGoal, GoalMilestone, QuarterGoals } from './types/time'
import { TIME_SLOTS } from './constants/timesheet'
import { ApiError } from './utils/errorHandler'
import { getAuthToken } from './lib/supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

interface AuthHeaders extends Record<string, string> {
  Authorization: string
}

interface ApiResponse<T> {
  [key: string]: T
}

async function authHeaders(): Promise<AuthHeaders> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('No authentication token available')
  }

  return {
    Authorization: `Bearer ${token}`
  }
}

async function handleResponse<T>(res: Response, endpoint: string): Promise<T> {
  if (!res.ok) {
    const errorMessage = `API request failed: ${res.status} ${res.statusText}`
    throw new ApiError(errorMessage, res.status, endpoint)
  }
  return await res.json() as T
}

const MAX_SLOTS = TIME_SLOTS.length
const MAX_DAYS = 7

function sanitizeWeekData(weekData: TimeBlock[][] | null | undefined): TimeBlock[][] {
  const makeEmptyDay = () => [] as TimeBlock[]
  if (!Array.isArray(weekData)) {
    return Array.from({ length: MAX_DAYS }, () => makeEmptyDay())
  }

  const days = weekData.slice(0, MAX_DAYS)
  while (days.length < MAX_DAYS) {
    days.push(makeEmptyDay())
  }

  return days.map(day => Array.isArray(day) ? day.slice(0, MAX_SLOTS) : makeEmptyDay())
}

// Helper to transform Mon-Sun (DB) to Sun-Sat (UI) with trimming
function transformWeekDataFromDb(weekData: TimeBlock[][]): TimeBlock[][] {
  const sanitized = sanitizeWeekData(weekData)
  // DB: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  // UI: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  const sun = sanitized[6]
  const rest = sanitized.slice(0, 6)
  return [sun, ...rest]
}

// Helper to transform Sun-Sat (UI) to Mon-Sun (DB) with trimming
function transformWeekDataToDb(weekData: TimeBlock[][]): TimeBlock[][] {
  const sanitized = sanitizeWeekData(weekData)
  // UI: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  // DB: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const sun = sanitized[0]
  const rest = sanitized.slice(1)
  return [...rest, sun]
}

export interface WeekMetadata {
  weekData: TimeBlock[][]
  startingHour: number
  theme: string | null
  updatedAt?: number | null  // Timestamp in milliseconds
}

interface WeekResponse {
  weekData: TimeBlock[][] | null
  startingHour?: number
  theme?: string | null
  updatedAt?: number | null
}

export async function getWeek(weekKey: string): Promise<WeekMetadata | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      headers,
    })
    const response = await handleResponse<WeekResponse>(res, `/weeks/${weekKey}`)

    // Handle response
    if (response.weekData !== undefined && response.weekData !== null) {
      return {
        weekData: transformWeekDataFromDb(response.weekData),
        startingHour: response.startingHour ?? 8,
        theme: response.theme ?? null,
        updatedAt: response.updatedAt ?? null
      }
    }

    return null
  } catch (error) {
    console.error(`Failed to get week ${weekKey}:`, error)
    return null
  }
}

/**
 * Fetch multiple weeks in parallel (batch operation)
 * Returns a record mapping week keys to their data
 * Weeks that fail to load will have null values
 */
export async function getWeeksBatch(weekKeys: string[]): Promise<Record<string, WeekMetadata | null>> {
  try {
    if (weekKeys.length === 0) return {}

    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ weekKeys }),
    })
    
    const data = await handleResponse<ApiResponse<Record<string, WeekMetadata | null>>>(res, '/weeks/batch')
    const result = data.weeks || {}
    
    // Transform data format (Mon-Sun <-> Sun-Sat)
    Object.keys(result).forEach(key => {
      const metadata = result[key]
      if (metadata && metadata.weekData) {
        metadata.weekData = transformWeekDataFromDb(metadata.weekData)
      }
    })

    return result
  } catch (error) {
    console.error('Failed to batch fetch weeks:', error)
    // Return empty result on error
    return {}
  }
}

export async function putWeek(
  weekKey: string,
  weekData: TimeBlock[][],
  metadata?: { startingHour?: number; theme?: string | null }
): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const dbWeekData = transformWeekDataToDb(weekData)
    const body: { weekData: TimeBlock[][]; startingHour?: number; theme?: string | null } = { weekData: dbWeekData }

    // Always send complete metadata to avoid backend having to fetch existing data
    // This prevents race conditions and improves performance
    if (metadata) {
      body.startingHour = metadata.startingHour ?? 8
      body.theme = metadata.theme ?? null
    } else {
      // If no metadata provided, use defaults
      body.startingHour = 8
      body.theme = null
    }

    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/weeks/${weekKey}`)
    return true
  } catch (error) {
    console.error(`Failed to save week ${weekKey}:`, error)
    return false
  }
}

export async function exportCSV(weekKey: string): Promise<string> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/${weekKey}/export`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<string>>(res, `/weeks/${weekKey}/export`)
    return data.csv_text || ''
  } catch (error) {
    console.error(`Failed to export CSV for week ${weekKey}:`, error)
    throw error // Re-throw to let caller handle CSV export errors
  }
}

export async function exportBulkCSV(startWeek: string, endWeek: string): Promise<string> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/export/bulk?start=${startWeek}&end=${endWeek}`, {
      headers,
    })
    // For bulk export, we might receive the raw CSV text directly or as JSON
    // Assuming backend returns JSON with csv_text like single export for consistency,
    // OR we could adjust backend to stream the file. 
    // Let's assume standard JSON response pattern first.
    const data = await handleResponse<ApiResponse<string>>(res, `/export/bulk`)
    return data.csv_text || ''
  } catch (error) {
    console.error(`Failed to export bulk CSV:`, error)
    throw error
  }
}

export interface SubcategoryDef {
  index: number
  name: string
}

export interface UserSettings {
  subcategories: Record<string, SubcategoryDef[]>
  timeDividers?: string[] // e.g., ['09:00', '12:00', '18:00']
  timezone?: string // IANA timezone identifier, e.g., 'Asia/Shanghai'
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/settings`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<UserSettings>>(res, '/settings')
    const settings = data.settings || {}
    return {
      subcategories: settings.subcategories || {},
      timeDividers: settings.timeDividers || ['09:00', '12:00', '18:00'], // Default dividers
      timezone: settings.timezone || 'Asia/Shanghai' // Default to Beijing time
    }
  } catch (error) {
    console.error('Failed to get settings:', error)
    return {
      subcategories: {},
      timeDividers: ['09:00', '12:00', '18:00'],
      timezone: 'Asia/Shanghai' // Default to Beijing time
    }
  }
}

export async function saveSettings(settings: UserSettings): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ settings }),
    })
    await handleResponse<ApiResponse<unknown>>(res, '/settings')
    return true
  } catch (error) {
    console.error('Failed to save settings:', error)
    return false
  }
}

export interface YearMemories {
  year: number
  memories: Record<string, DailyMemory>
}

export interface DailyMemory {
  date: string
  memory: string
  tags?: string[]
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  createdAt: number
  updatedAt: number
}

export async function getYearMemories(year: number): Promise<YearMemories | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/memories/${year}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<YearMemories>>(res, `/memories/${year}`)
    return data.memories || null
  } catch (error) {
    console.error(`Failed to get memories for year ${year}:`, error)
    return null
  }
}

export async function saveYearMemories(yearMemories: YearMemories): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/memories/${yearMemories.year}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ memories: yearMemories.memories }),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/memories/${yearMemories.year}`)
    return true
  } catch (error) {
    console.error(`Failed to save memories for year ${yearMemories.year}:`, error)
    return false
  }
}

// Week Reviews API
export interface YearWeekReviews {
  year: number
  reviews: Record<number, WeekReview>
}

export interface WeekReview {
  year: number
  weekNumber: number
  review: string
  createdAt: number
  updatedAt: number
}

export async function getYearWeekReviews(year: number): Promise<YearWeekReviews | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/reviews/${year}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<YearWeekReviews>>(res, `/reviews/${year}`)
    return data.reviews || null
  } catch (error) {
    console.error(`Failed to get week reviews for year ${year}:`, error)
    return null
  }
}

export async function saveWeekReview(review: WeekReview): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/reviews/${review.year}/${review.weekNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ review: review.review }),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/reviews/${review.year}/${review.weekNumber}`)
    return true
  } catch (error) {
    console.error(`Failed to save week review for ${review.year} week ${review.weekNumber}:`, error)
    return false
  }
}

export async function deleteWeekReview(year: number, weekNumber: number): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/reviews/${year}/${weekNumber}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/reviews/${year}/${weekNumber}`)
    return true
  } catch (error) {
    console.error(`Failed to delete week review for ${year} week ${weekNumber}:`, error)
    return false
  }
}

// Annual Review API (using week_number = 0 convention)
export async function getAnnualReview(year: number): Promise<AnnualReview | null> {
  try {
    const yearData = await getYearWeekReviews(year)
    if (!yearData || !yearData.reviews[0]) {
      return null
    }
    const weekReview = yearData.reviews[0]
    return {
      year: weekReview.year,
      review: weekReview.review,
      createdAt: weekReview.createdAt,
      updatedAt: weekReview.updatedAt,
    }
  } catch (error) {
    console.error(`Failed to get annual review for year ${year}:`, error)
    return null
  }
}

export async function saveAnnualReview(year: number, review: string): Promise<boolean> {
  // First, try to get the existing annual review to preserve createdAt
  const existing = await getAnnualReview(year)

  const annualReview: WeekReview = {
    year,
    weekNumber: 0,
    review,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  }
  return saveWeekReview(annualReview)
}

export async function deleteAnnualReview(year: number): Promise<boolean> {
  return deleteWeekReview(year, 0)
}

// Daily Shipping API
export interface YearDailyShipping {
  year: number
  entries: Record<string, DailyShipping>
}

export interface DailyShipping {
  year: number
  month: number
  day: number
  shipped: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

export async function getYearDailyShipping(year: number): Promise<YearDailyShipping | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/shipping/${year}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<YearDailyShipping>>(res, `/shipping/${year}`)
    return data.shipping || null
  } catch (error) {
    console.error(`Failed to get daily shipping for year ${year}:`, error)
    return null
  }
}

export async function saveDailyShipping(entry: DailyShipping): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/shipping/${entry.year}/${entry.month}/${entry.day}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ shipped: entry.shipped, completed: entry.completed }),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/shipping/${entry.year}/${entry.month}/${entry.day}`)
    return true
  } catch (error) {
    console.error(`Failed to save daily shipping for ${entry.year}-${entry.month}-${entry.day}:`, error)
    return false
  }
}

export async function deleteDailyShipping(year: number, month: number, day: number): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/shipping/${year}/${month}/${day}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/shipping/${year}/${month}/${day}`)
    return true
  } catch (error) {
    console.error(`Failed to delete daily shipping for ${year}-${month}-${day}:`, error)
    return false
  }
}

// Quarterly Goals API
export async function getQuarterGoals(year: number, quarter: number): Promise<QuarterGoals | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/goals/${year}/${quarter}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<QuarterGoals>>(res, `/goals/${year}/${quarter}`)
    return data.goals || null
  } catch (error) {
    console.error(`Failed to get quarterly goals for ${year} Q${quarter}:`, error)
    return null
  }
}

export async function createQuarterlyGoal(
  year: number,
  quarter: number,
  title: string,
  description?: string
): Promise<QuarterlyGoal | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/goals/${year}/${quarter}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ title, description }),
    })
    const data = await handleResponse<ApiResponse<QuarterlyGoal>>(res, `/goals/${year}/${quarter}`)
    return data.goal || null
  } catch (error) {
    console.error(`Failed to create quarterly goal for ${year} Q${quarter}:`, error)
    return null
  }
}

export async function updateQuarterlyGoal(
  goalId: string,
  updates: {
    title?: string
    description?: string
    completed?: boolean
    displayOrder?: number
  }
): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(updates),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/goals/${goalId}`)
    return true
  } catch (error) {
    console.error(`Failed to update quarterly goal ${goalId}:`, error)
    return false
  }
}

export async function deleteQuarterlyGoal(goalId: string): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/goals/${goalId}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/goals/${goalId}`)
    return true
  } catch (error) {
    console.error(`Failed to delete quarterly goal ${goalId}:`, error)
    return false
  }
}

export async function createGoalMilestone(goalId: string, title: string): Promise<GoalMilestone | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ title }),
    })
    const data = await handleResponse<ApiResponse<GoalMilestone>>(res, `/goals/${goalId}/milestones`)
    return data.milestone || null
  } catch (error) {
    console.error(`Failed to create milestone for goal ${goalId}:`, error)
    return null
  }
}

export async function updateGoalMilestone(
  milestoneId: string,
  updates: {
    title?: string
    completed?: boolean
    displayOrder?: number
  }
): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(updates),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/milestones/${milestoneId}`)
    return true
  } catch (error) {
    console.error(`Failed to update milestone ${milestoneId}:`, error)
    return false
  }
}

export async function deleteGoalMilestone(milestoneId: string): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/milestones/${milestoneId}`)
    return true
  } catch (error) {
    console.error(`Failed to delete milestone ${milestoneId}:`, error)
    return false
  }
}

// Data Snapshots API (History/Version Control)
export interface DataSnapshot<T = unknown> {
  id: string
  timestamp: number
  description: string
  data: T
  metadata: Record<string, unknown>
  type: 'manual' | 'auto' | 'restore'
}

export async function getSnapshots<T = unknown>(
  entityType: string,
  entityKey: string
): Promise<DataSnapshot<T>[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/snapshots/${entityType}/${entityKey}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<DataSnapshot<T>[]>>(res, `/snapshots/${entityType}/${entityKey}`)
    return data.snapshots || []
  } catch (error) {
    console.error(`Failed to get snapshots for ${entityType}/${entityKey}:`, error)
    return []
  }
}

export async function createSnapshot<T = unknown>(
  entityType: string,
  entityKey: string,
  snapshotData: T,
  metadata?: Record<string, unknown>,
  description?: string,
  snapshotType?: 'manual' | 'auto' | 'restore'
): Promise<DataSnapshot<T> | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/snapshots/${entityType}/${entityKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        data: snapshotData,
        metadata,
        description,
        snapshotType,
      }),
    })
    const data = await handleResponse<ApiResponse<DataSnapshot<T>>>(res, `/snapshots/${entityType}/${entityKey}`)
    return data.snapshot || null
  } catch (error) {
    console.error(`Failed to create snapshot for ${entityType}/${entityKey}:`, error)
    return null
  }
}

export async function deleteSnapshot(snapshotId: string): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/snapshots/${snapshotId}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/snapshots/${snapshotId}`)
    return true
  } catch (error) {
    console.error(`Failed to delete snapshot ${snapshotId}:`, error)
    return false
  }
}

export async function deleteAllSnapshots(entityType: string, entityKey: string): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/snapshots/${entityType}/${entityKey}/all`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/snapshots/${entityType}/${entityKey}/all`)
    return true
  } catch (error) {
    console.error(`Failed to delete all snapshots for ${entityType}/${entityKey}:`, error)
    return false
  }
}

// Quarterly Plans API (Pattern 2: Debounced Sync - DB is source of truth)
export interface PlanListItem {
  planId: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface QuarterlyPlanData {
  planId: string
  planData: PlanJSON
  createdAt: number
  updatedAt: number
}

// Plan JSON structure following PLAN_FORMAT_V2.md
export interface PlanJSON {
  plan: {
    id: string
    name: string
    description?: string
    created_at?: string
    updated_at?: string
    anchor_date?: string // V2 uses anchor_date at root of plan
    timezone?: string
    anchor?: { // V1 compatibility
      start_date: string
      week_starts_on?: 'monday' | 'sunday'
      timezone?: string
    }
  }
  work_types?: Array<{
    id: string
    name: string
    color: string
    kpi_target?: {
      unit: string
      weekly_value: number
    }
  }>
  templates?: Record<string, string>
  weekly_habit?: {
    name: string
    timing: string
    questions: string[]
    logs: Array<{ week: number; date: string; answers: Record<string, string> }>
  }
  cycles: Array<{
    id: string
    name: string
    theme?: string
    description?: string
    core_competencies?: string[]
    status?: 'not_started' | 'in_progress' | 'completed'
    resume_story?: string
    weeks: Array<{
      // V2: Derived week_number, start_date, end_date
      week_number?: number // Optional/Legacy
      name?: string // Optional
      theme?: string
      description?: string
      start_date?: string // Legacy
      end_date?: string // Legacy
      status?: 'not_started' | 'current' | 'in_progress' | 'completed'
      
      // V2 Fields
      goals?: string[]
      reflection_questions?: string[]
      acceptance_criteria?: string[]
      
      // Legacy Fields (kept for compatibility or mapped)
      focus_areas?: string[]
      product_questions?: string[]
      validation_criteria?: string[]
      
      daily_plan?: Array<{
        day: string
        tech_work?: string
        product_action?: string
        tech_hours?: number
        product_minutes?: number
      }>
      
      todos?: Array<{
        id: string
        title: string // V2
        name?: string // Legacy
        description?: string
        type_id?: string // V2
        category?: string // Legacy
        priority?: 'low' | 'medium' | 'high'
        estimate?: number // V2
        estimated_hours?: number // Legacy
        status?: 'not_started' | 'in_progress' | 'blocked' | 'done'
        dependencies?: string[]
      }>
      
      deliverables?: Array<{
        id: string
        title: string // V2
        name?: string // Legacy
        description?: string
        type_id?: string // V2
        template_id?: string // V2
        type?: string // Legacy
        format?: string
        status?: 'not_started' | 'in_progress' | 'done'
        resume_value?: number // Legacy
      }>
    }>
  }>
  trackers?: Array<{ // Legacy compatibility
    id: string
    name: string
    unit?: string
    baseline: string | number
    target: string | number
    current?: string | number
    source?: {
      type: 'manual' | 'count' | 'exists'
      entity?: string
      where?: Record<string, unknown>
    }
  }>
}

export async function listPlans(): Promise<PlanListItem[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/plans`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<PlanListItem[]>>(res, '/plans')
    return data.plans || []
  } catch (error) {
    console.error('Failed to list plans:', error)
    return []
  }
}

export async function getPlan(planId: string): Promise<QuarterlyPlanData | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/plans/${encodeURIComponent(planId)}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<QuarterlyPlanData>>(res, `/plans/${planId}`)
    return data.plan || null
  } catch (error) {
    console.error(`Failed to get plan ${planId}:`, error)
    return null
  }
}

export async function savePlan(planId: string, planData: PlanJSON): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/plans/${encodeURIComponent(planId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ planData }),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/plans/${planId}`)
    return true
  } catch (error) {
    console.error(`Failed to save plan ${planId}:`, error)
    return false
  }
}

export async function deletePlan(planId: string): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/plans/${encodeURIComponent(planId)}`, {
      method: 'DELETE',
      headers,
    })
    await handleResponse<ApiResponse<unknown>>(res, `/plans/${planId}`)
    return true
  } catch (error) {
    console.error(`Failed to delete plan ${planId}:`, error)
    return false
  }
}
