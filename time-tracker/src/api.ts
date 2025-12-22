import type { TimeBlock } from './types/time'
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

export async function listWeeks(): Promise<string[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<string[]>>(res, '/weeks')
    return data.weeks || []
  } catch (error) {
    console.error('Failed to list weeks:', error)
    return []
  }
}

export async function getWeek(weekKey: string): Promise<TimeBlock[][] | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      headers,
    })
    const data = await handleResponse<ApiResponse<TimeBlock[][]>>(res, `/weeks/${weekKey}`)
    return data.weekData || null
  } catch (error) {
    console.error(`Failed to get week ${weekKey}:`, error)
    return null
  }
}

export async function putWeek(weekKey: string, weekData: TimeBlock[][]): Promise<boolean> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ weekData }),
    })
    await handleResponse<ApiResponse<unknown>>(res, `/weeks/${weekKey}`)
    return true
  } catch (error) {
    console.error(`Failed to save week ${weekKey}:`, error)
    return false
  }
}

/**
 * Import CSV via backend parsing
 *
 * NOTE: Currently not used - frontend uses client-side parseTimeCSV() from utils/csvParser.ts
 * See csvParser.ts for details on duplication and TODO to consolidate.
 */
export async function importCSV(weekKey: string, csvText: string): Promise<TimeBlock[][] | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/weeks/${weekKey}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ csv_text: csvText }),
    })
    const data = await handleResponse<ApiResponse<TimeBlock[][]>>(res, `/weeks/${weekKey}/import`)
    return data.weekData || null
  } catch (error) {
    console.error(`Failed to import CSV for week ${weekKey}:`, error)
    throw error // Re-throw to let caller handle CSV import errors
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

export interface UserSettings {
  subcategories: Record<string, string[]>
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
      subcategories: settings.subcategories || {}
    }
  } catch (error) {
    console.error('Failed to get settings:', error)
    return { subcategories: {} }
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

