import type { TimeBlock } from './types/time'
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
}

interface WeekResponse {
  weekData: TimeBlock[][] | null
  startingHour?: number
  theme?: string | null
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
        theme: response.theme ?? null
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
