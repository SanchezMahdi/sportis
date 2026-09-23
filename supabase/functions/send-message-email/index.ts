// Supabase Edge Function: send-message-email
// Called after a chat message is sent in a session.
// Sends email to participants who are NOT the sender.
// Throttle: only one email per (session, recipient) every 30 minutes.
// Deploy: supabase functions deploy send-message-email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') ?? 'mahdi.mohamm21@gmail.com'
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://sportis-mu.vercel.app').replace(/\/$/, '')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const THROTTLE_MINUTES = 30
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

function textForSubject(value: unknown, max = 120) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, max)
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'sportis', email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  })
  if (res.ok) return true
  console.error(`Brevo error ${res.status} for ${to}:`, await res.text())
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const token = getBearerToken(req)
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401)

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) return jsonResponse({ error: 'Unauthorized' }, 401)

  let body: { message_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!isUuid(body.message_id)) return jsonResponse({ error: 'Invalid message_id' }, 400)

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('id, session_id, user_id, text, content')
    .eq('id', body.message_id)
    .single()

  if (messageError || !message) return jsonResponse({ error: 'Message not found' }, 404)
  if (message.user_id !== authData.user.id) return jsonResponse({ error: 'Forbidden' }, 403)

  const { data: membership } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('session_id', message.session_id)
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (!membership) return jsonResponse({ error: 'Forbidden' }, 403)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, title')
    .eq('id', message.session_id)
    .single()

  if (sessionError || !session) return jsonResponse({ error: 'Session not found' }, 404)

  const { data: sender } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', authData.user.id)
    .maybeSingle()

  const { data: participants, error } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('session_id', session.id)
    .neq('user_id', authData.user.id)

  if (error) {
    console.error('Failed to fetch participants:', error)
    return jsonResponse({ error: 'DB error' }, 500)
  }

  const participantIds = (participants ?? []).map((participant) => participant.user_id)
  if (participantIds.length === 0) return jsonResponse({ sent: 0 })

  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', participantIds)
    .not('email', 'is', null)

  const throttleSince = new Date(Date.now() - THROTTLE_MINUTES * 60 * 1000).toISOString()
  const { data: recentEmails } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('session_id', session.id)
    .eq('type', 'message_email')
    .gte('created_at', throttleSince)

  const recentlyEmailed = new Set((recentEmails ?? []).map((row) => row.user_id))
  const senderName = sender?.name || sender?.email?.split('@')[0] || 'Jemand'
  const rawMessage = message.content || message.text || ''
  const preview = rawMessage.length > 120 ? rawMessage.slice(0, 120) + '…' : rawMessage
  const sessionUrl = `${SITE_URL}/session/${session.id}`

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0F172A;border-radius:16px;padding:0;overflow:hidden;">
      <div style="background:#22C55E;padding:24px 32px;">
        <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;">⚡ sportis</h1>
      </div>
      <div style="padding:32px;">
        <p style="color:#94A3B8;margin:0 0 8px;font-size:14px;">Neue Nachricht von <strong style="color:#fff;">${escapeHtml(senderName)}</strong></p>
        <h2 style="color:#fff;margin:0 0 20px;font-size:18px;font-weight:700;">${escapeHtml(session.title)}</h2>
        <div style="background:#1E293B;border-left:3px solid #22C55E;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#E2E8F0;margin:0;font-size:15px;line-height:1.6;">${escapeHtml(preview)}</p>
        </div>
        <a href="${escapeHtml(sessionUrl)}"
           style="display:inline-block;background:#22C55E;color:#000;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">
          Zur Session &amp; antworten →
        </a>
        <p style="color:#475569;font-size:12px;margin-top:28px;line-height:1.6;">
          Du erhältst diese E-Mail maximal alle ${THROTTLE_MINUTES} Minuten pro Session.<br>
          <a href="${escapeHtml(`${SITE_URL}/profil`)}" style="color:#22C55E;">E-Mail-Einstellungen verwalten</a>
        </p>
      </div>
    </div>
  `

  let sent = 0
  const toEmail = (users ?? []).filter((user) => user.email && !recentlyEmailed.has(user.id))

  for (let i = 0; i < toEmail.length; i++) {
    const user = toEmail[i]
    const ok = await sendEmail(
      user.email,
      `💬 Neue Nachricht in "${textForSubject(session.title)}"`,
      emailHtml
    )
    if (ok) {
      sent++
      await supabase.from('notifications').insert({
        user_id: user.id,
        session_id: session.id,
        message: `${senderName} hat in "${session.title}" eine Nachricht geschickt.`,
        type: 'message_email',
        read: true,
      })
    }
    if ((i + 1) % 4 === 0 && i + 1 < toEmail.length) await sleep(1100)
  }

  return jsonResponse({ sent })
})
