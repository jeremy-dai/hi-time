import type { TimeBlock } from './types/time'
import { ApiError } from './utils/errorHandler'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

interface AuthHeaders {
  'X-User-Id': string
  'X-Auth-Email': string
  'X-Auth-Token': string
}

interface ApiResponse<T> {
  [key: string]: T
}

function authHeaders(): AuthHeaders {
  const userId = import.meta.env.VITE_TEST_USER_ID || 'local-user'
  const email = import.meta.env.VITE_TEST_USER_EMAIL || ''
  const token = import.meta.env.VITE_TEST_USER_TOKEN || ''
  return {
    'X-User-Id': userId,
    'X-Auth-Email': email,
    'X-Auth-Token': token,
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
    const res = await fetch(`${API_BASE}/weeks`, {
      headers: { ...authHeaders() },
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
    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      headers: { ...authHeaders() },
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
    const res = await fetch(`${API_BASE}/weeks/${weekKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
    const res = await fetch(`${API_BASE}/weeks/${weekKey}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
    const res = await fetch(`${API_BASE}/weeks/${weekKey}/export`, {
      headers: { ...authHeaders() },
    })
    const data = await handleResponse<ApiResponse<string>>(res, `/weeks/${weekKey}/export`)
    return data.csv_text || ''
  } catch (error) {
    console.error(`Failed to export CSV for week ${weekKey}:`, error)
    throw error // Re-throw to let caller handle CSV export errors
  }
}

