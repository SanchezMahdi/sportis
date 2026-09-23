// Supabase Edge Function: send-session-reminder
// Trigger: cron every hour — finds sessions starting in ~24h and sends reminder emails.
// Requires Authorization: Bearer <CRON_SECRET>.
// Deploy: supabase functions deploy send-session-reminder

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://sportis-mu.vercel.app').replace(/\/$/, '')

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getBearerToken(req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
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
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  if (!CRON_SECRET || getBearerToken(req) !== CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const now = new Date()
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, title, sport, date, time, location, address,
      session_participants(
        user:users(id, name, email)
      )
    `)
    .gte('date', from.split('T')[0])
    .lte('date', to.split('T')[0])
    .eq('reminder_sent', false)

  if (!sessions?.length) return jsonResponse({ sent: 0 })

  let sent = 0

  for (const session of sessions) {
    const sessionDate = new Date(`${session.date}T${session.time || '12:00:00'}`)
    if (sessionDate < new Date(from) || sessionDate > new Date(to)) continue

    const dateStr = sessionDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const timeStr = session.time?.slice(0, 5) || ''

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
          subject: `Erinnerung: "${String(session.title ?? '').replace(/[\r\n]+/g, ' ').slice(0, 120)}" startet morgen`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#22C55E;">sportis</h2>
              <p>Hallo ${escapeHtml(user.name)},</p>
              <p>Deine Session startet morgen!</p>
              <div style="background:#1E293B;border-radius:12px;padding:16px;margin:16px 0;">
                <h3 style="margin:0 0 8px;color:#fff;">${escapeHtml(session.title)}</h3>
                <p style="margin:4px 0;color:#94A3B8;">📅 ${escapeHtml(dateStr)}</p>
                ${timeStr ? `<p style="margin:4px 0;color:#94A3B8;">🕐 ${escapeHtml(timeStr)} Uhr</p>` : ''}
                <p style="margin:4px 0;color:#94A3B8;">📍 ${escapeHtml(session.location)}</p>
              </div>
              <a href="${escapeHtml(`${SITE_URL}/session/${session.id}`)}"
                 style="display:inline-block;background:#22C55E;color:#000;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;">
                Session ansehen
              </a>
              <p style="color:#64748B;font-size:12px;margin-top:24px;">
                Du erhältst diese E-Mail weil du an der Session teilnimmst.
              </p>
            </div>
          `,
        }),
      })
      if (res.ok) sent++
      else console.error(`Resend reminder error ${res.status}:`, await res.text())
    }

    await supabase.from('sessions').update({ reminder_sent: true }).eq('id', session.id)
  }

  return jsonResponse({ sent })
})
