import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get current authentication token from Supabase session
 * Falls back to VITE_AUTH_TOKEN for backward compatibility
 */
export async function getAuthToken(): Promise<string | null> {
  // Get from Supabase session (primary method)
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    return session.access_token
  }

  // Fallback to .env token (for backward compatibility only)
  const envToken = import.meta.env.VITE_AUTH_TOKEN
  if (envToken) {
    console.warn('Using VITE_AUTH_TOKEN from .env - consider logging in through the UI instead')
    return envToken
  }

  return null
}

/**
 * Get current user ID from authenticated session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}
