import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function hasConfiguredValue(value: string | undefined) {
  if (!value) return false

  const normalized = value.trim()
  if (!normalized) return false

  return !['https://your-project.supabase.co', 'your-public-anon-key'].includes(normalized)
}

function hasValidUrl(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized || !hasConfiguredValue(normalized)) return false

  try {
    new URL(normalized)
    return true
  } catch {
    return false
  }
}

export const isSupabaseConfigured =
  hasValidUrl(supabaseUrl) && hasConfiguredValue(supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
