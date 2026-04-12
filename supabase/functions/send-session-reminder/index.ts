// Supabase Edge Function: send-session-reminder
// Trigger: cron every hour — finds sessions starting in ~24h and sends reminder emails
// Deploy: supabase functions deploy send-session-reminder

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Find sessions starting in 23–25h that haven't been reminded yet
  const now = new Date()
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  // Build datetime from date + time columns
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

  if (!sessions?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  let sent = 0

  for (const session of sessions) {
    const sessionDate = new Date(`${session.date}T${session.time || '12:00:00'}`)
    if (sessionDate < new Date(from) || sessionDate > new Date(to)) continue

    const dateStr = sessionDate.toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    const timeStr = session.time?.slice(0, 5) || ''

    for (const p of session.session_participants || []) {
      const user = p.user
      if (!user?.email) continue

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'sportis <noreply@sportis.app>',
          to: [user.email],
          subject: `⏰ Erinnerung: "${session.title}" startet morgen!`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#22C55E;">sportis</h2>
              <p>Hallo ${user.name},</p>
              <p>Deine Session startet morgen!</p>
              <div style="background:#1E293B;border-radius:12px;padding:16px;margin:16px 0;">
                <h3 style="margin:0 0 8px;color:#fff;">${session.title}</h3>
                <p style="margin:4px 0;color:#94A3B8;">📅 ${dateStr}</p>
                ${timeStr ? `<p style="margin:4px 0;color:#94A3B8;">🕐 ${timeStr} Uhr</p>` : ''}
                <p style="margin:4px 0;color:#94A3B8;">📍 ${session.location}</p>
              </div>
              <a href="https://sportis-delta.vercel.app/session/${session.id}"
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
      sent++
    }

    // Mark as reminded
    await supabase.from('sessions').update({ reminder_sent: true }).eq('id', session.id)
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})
