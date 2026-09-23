// Supabase Edge Function: send-cancellation-email
// Call this before a creator cancels/deletes a session.
// POST body: { session_id }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://sportis-mu.vercel.app').replace(/\/$/, '')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]!))
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

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, creator_id, title, sport, date, time, location,
      session_participants(user:users(id, name, email))
    `)
    .eq('id', body.session_id)
    .single()

  if (!session) return jsonResponse({ error: 'Session not found' }, 404)
  if (session.creator_id !== authData.user.id) return jsonResponse({ error: 'Forbidden' }, 403)

  let sent = 0
  for (const participant of session.session_participants || []) {
    const user = participant.user
    if (!user?.email) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'sportis <noreply@sportis.app>',
        to: [user.email],
        subject: `Session "${String(session.title ?? '').replace(/[\r\n]+/g, ' ').slice(0, 120)}" wurde abgesagt`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#22C55E;">sportis</h2>
            <p>Hallo ${escapeHtml(user.name)},</p>
            <p>Leider wurde die folgende Session abgesagt:</p>
            <div style="background:#1E293B;border-radius:12px;padding:16px;margin:16px 0;">
              <h3 style="margin:0 0 8px;color:#fff;">${escapeHtml(session.title)}</h3>
              <p style="margin:4px 0;color:#94A3B8;">📅 ${escapeHtml(session.date)}</p>
              <p style="margin:4px 0;color:#94A3B8;">📍 ${escapeHtml(session.location)}</p>
            </div>
            <p>Schau dir andere Sessions an und finde eine Alternative!</p>
            <a href="${escapeHtml(`${SITE_URL}/entdecken`)}"
               style="display:inline-block;background:#22C55E;color:#000;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Sessions entdecken
            </a>
          </div>
        `,
      }),
    })
    if (res.ok) sent++
    else console.error(`Resend cancellation error ${res.status}:`, await res.text())
  }

  return jsonResponse({ sent })
})
