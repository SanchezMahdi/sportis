// Supabase Edge Function: send-push-notification
// Called after a new session is created to send Web Push to subscribed users.
// Deploy: supabase functions deploy send-push-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@sportis.app'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SPORT_LABELS: Record<string, string> = {
  football: 'Fußball ⚽',
  volleyball: 'Volleyball 🏐',
  basketball: 'Basketball 🏀',
  tennis: 'Tennis 🎾',
  table_tennis: 'Tischtennis 🏓',
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function getBearerToken(req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function formatDate(date: string | null) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const token = getBearerToken(req)
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401)

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) return jsonResponse({ error: 'Unauthorized' }, 401)

  let body: { session_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!isUuid(body.session_id)) return jsonResponse({ error: 'Invalid session_id' }, 400)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, creator_id, title, sport, date, location')
    .eq('id', body.session_id)
    .single()

  if (sessionError || !session) return jsonResponse({ error: 'Session not found' }, 404)
  if (session.creator_id !== authData.user.id) return jsonResponse({ error: 'Forbidden' }, 403)

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .neq('user_id', session.creator_id)
    .limit(1000)

  if (error) {
    console.error('Failed to fetch subscriptions:', error)
    return jsonResponse({ error: 'DB error' }, 500)
  }

  const sportLabel = SPORT_LABELS[session.sport] ?? session.sport ?? 'Sport'
  const payload = JSON.stringify({
    title: `Neue ${sportLabel} Session!`,
    body: `"${session.title}" – ${formatDate(session.date)} in ${session.location}`,
    url: `/session/${session.id}`,
    icon: '/favicon.ico',
  })

  let sent = 0
  const staleEndpoints: string[] = []

  await Promise.allSettled(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86400 }
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) staleEndpoints.push(sub.endpoint)
        else console.warn('Push error:', status, sub.endpoint.slice(0, 40))
      }
    })
  )

  if (staleEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
  }

  return jsonResponse({ sent, removed: staleEndpoints.length })
})
