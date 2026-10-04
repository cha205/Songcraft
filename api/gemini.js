// Vercel serverless function: POST /api/gemini { task: 'blueprint' | 'lyrics', payload }.
// Uses a Gemini API key from the server environment (GEMINI_API_KEY), so the key never reaches the browser.
import { MODELS, buildRequest, readResult } from './_gemini-core.js'

export async function POST(request) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return Response.json({ error: 'Gemini is not set up on this server yet.' }, { status: 503 })
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 })
  }
  const { task, payload } = body || {}
  if (task !== 'blueprint' && task !== 'lyrics') return Response.json({ error: 'Unknown task.' }, { status: 400 })

  let last = ''
  // Best model first; fall back when a model is busy or unavailable.
  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildRequest(task, payload)),
    })
    if (r.ok) {
      try {
        return Response.json(readResult(task, await r.json(), model))
      } catch {
        last = 'Gemini returned an unreadable answer.'
        continue
      }
    }
    last = `${model}: ${r.status}`
    if (![404, 429, 500, 503].includes(r.status)) break
  }
  return Response.json({ error: `Gemini is unavailable right now (${last}).` }, { status: 502 })
}
