// Supabase Edge Function: send-cancellation-email
// Call this when a creator cancels/deletes a session
// POST body: { session_id }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const { session_id } = await req.json()
  if (!session_id) return new Response('Missing session_id', { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, title, sport, date, time, location,
      session_participants(user:users(id, name, email))
    `)
    .eq('id', session_id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })

  let sent = 0
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
        subject: `❌ Session "${session.title}" wurde abgesagt`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#22C55E;">sportis</h2>
            <p>Hallo ${user.name},</p>
            <p>Leider wurde die folgende Session abgesagt:</p>
            <div style="background:#1E293B;border-radius:12px;padding:16px;margin:16px 0;">
              <h3 style="margin:0 0 8px;color:#fff;">${session.title}</h3>
              <p style="margin:4px 0;color:#94A3B8;">📅 ${session.date}</p>
              <p style="margin:4px 0;color:#94A3B8;">📍 ${session.location}</p>
            </div>
            <p>Schau dir andere Sessions an und finde eine Alternative!</p>
            <a href="https://sportis-delta.vercel.app/entdecken"
               style="display:inline-block;background:#22C55E;color:#000;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Sessions entdecken
            </a>
          </div>
        `,
      }),
    })
    sent++
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})
