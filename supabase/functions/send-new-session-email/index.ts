// Supabase Edge Function: send-new-session-email
// Called after a new session is created.
// Sends email to users whose sport preferences match the session sport.
// Deploy: supabase functions deploy send-new-session-email

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

const SPORT_LABELS: Record<string, string> = {
  football: 'Fußball',
  volleyball: 'Volleyball',
  basketball: 'Basketball',
  tennis: 'Tennis',
  table_tennis: 'Tischtennis',
}


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

function sportMatchesPreference(sessionSport: string, preferences: string[] | null) {
  const sports = Array.isArray(preferences) ? preferences : []
  if (sports.length === 0) return true
  const label = SPORT_LABELS[sessionSport] ?? sessionSport
  return sports.some((sport) => sport === sessionSport || sport === label)
}

function formatDate(date: string | null) {
  if (!date) return ''
  const d = new Date(`${date}T12:00:00`)
  const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' })
  const day = d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  return `${weekday}, ${day}`
}

function isWeekend(date: string | null): boolean {
  if (!date) return false
  const day = new Date(`${date}T12:00:00`).getDay()
  return day === 0 || day === 6
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

  let body: { session_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!isUuid(body.session_id)) return jsonResponse({ error: 'Invalid session_id' }, 400)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, creator_id, title, sport, date, time, location')
    .eq('id', body.session_id)
    .single()

  if (sessionError || !session) return jsonResponse({ error: 'Session not found' }, 404)
  if (session.creator_id !== authData.user.id) return jsonResponse({ error: 'Forbidden' }, 403)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, sports')
    .neq('id', session.creator_id)
    .not('email', 'is', null)
    .limit(200)

  if (error) {
    console.error('Failed to fetch users:', error)
    return jsonResponse({ error: 'DB error' }, 500)
  }

  const targets = (users ?? []).filter((user) => sportMatchesPreference(session.sport, user.sports))

  const { data: alreadySent } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('session_id', session.id)
    .eq('type', 'session_email')

  const alreadySentIds = new Set((alreadySent ?? []).map((row) => row.user_id))
  const toNotify = targets.filter((user) => !alreadySentIds.has(user.id))

  const sportLabel = SPORT_LABELS[session.sport] ?? session.sport
  const dateStr = formatDate(session.date)
  const timeStr = session.time ? String(session.time).slice(0, 5) : ''
  const weekend = isWeekend(session.date)
  const sessionUrl = `${SITE_URL}/session/${session.id}`

  // Headline: "Mitspieler für Fußball in Hamburg gesucht" – extract city hint from location
  const locationShort = escapeHtml(session.location)
  const sportEscaped = escapeHtml(sportLabel)

  const emailHtml = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

        <!-- Header -->
        <tr>
          <td style="background:#0F172A;padding:28px 36px 24px;">
            <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:2px;color:#22C55E;text-transform:uppercase;">sportis</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
              Mitspieler${weekend ? ' am Wochenende' : ''} gesucht
            </h1>
            <p style="margin:0;font-size:15px;color:#94A3B8;line-height:1.5;">
              ${sportEscaped} in ${locationShort}
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#22C55E;height:3px;"></td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px;">

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;width:36%;vertical-align:top;">
                  <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Sportart</p>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1E293B;">${sportEscaped}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                  <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Datum</p>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1E293B;">${escapeHtml(dateStr)}${timeStr ? ' · ' + escapeHtml(timeStr) + ' Uhr' : ''}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Ort</p>
                </td>
                <td style="padding:10px 0;vertical-align:top;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1E293B;">${locationShort}</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <a href="${escapeHtml(sessionUrl)}"
               style="display:block;text-align:center;background:#0F172A;color:#ffffff;font-weight:700;font-size:15px;padding:15px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
              Jetzt ansehen und mitmachen
            </a>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;text-align:center;">
              Du erhältst diese E-Mail, weil du bei sportis registriert bist.<br>
              <a href="${escapeHtml(`${SITE_URL}/profil`)}" style="color:#22C55E;text-decoration:none;">E-Mail-Einstellungen verwalten</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  let sent = 0
  for (let i = 0; i < toNotify.length; i++) {
    const user = toNotify[i]
    if (!user.email) continue
    const ok = await sendEmail(
      user.email,
      `${textForSubject(sportLabel, 40)} in ${textForSubject(session.location, 30)}${weekend ? ' – Wochenend-Session' : ' – Neue Session'}`,
      emailHtml
    )
    if (ok) {
      sent++
      await supabase.from('notifications').insert({
        user_id: user.id,
        session_id: session.id,
        message: `Neue ${sportLabel} Session: "${session.title}"`,
        type: 'session_email',
        read: true,
      })
    }
    if ((i + 1) % 4 === 0 && i + 1 < toNotify.length) await sleep(1100)
  }

  return jsonResponse({ sent })
})
