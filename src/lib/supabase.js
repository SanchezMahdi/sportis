import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const configuredSiteUrl = import.meta.env.VITE_SITE_URL

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase-Umgebungsvariablen fehlen. Bitte .env.example zu .env kopieren und ausfüllen.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export function getAuthRedirectUrl(path = '/') {
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const origin = (configuredSiteUrl || fallbackOrigin).replace(/\/$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function isMissingSupabaseSchema(error) {
  if (!error) return false
  const message = error.message || ''
  return (
    error.code === '42P01' ||
    error.code === 'PGRST200' ||
    error.code === 'PGRST205' ||
    error.status === 404 ||
    message.includes('Could not find the table') ||
    message.includes('Could not find a relationship') ||
    message.includes('schema cache')
  )
}

export function isNoSupabaseRow(error) {
  return error?.code === 'PGRST116'
}
