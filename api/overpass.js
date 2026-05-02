const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const query = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
      ? req.body
      : req.body?.query

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing Overpass query' })
    return
  }

  if (query.length > 12000) {
    res.status(413).json({ error: 'Overpass query too large' })
    return
  }

  let lastError = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'User-Agent': 'Sportis/1.0 (+https://sportis-mu.vercel.app)',
        },
        body: query,
      })

      const body = await upstream.text()
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800')
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8')

      if (!upstream.ok) {
        lastError = `Overpass ${upstream.status}: ${body.slice(0, 200)}`
        continue
      }

      res.status(200).send(body)
      return
    } catch (error) {
      lastError = error.message
    }
  }

  res.status(502).json({ error: 'Overpass request failed', detail: lastError })
}
