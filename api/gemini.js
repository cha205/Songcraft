// Vercel serverless function: POST /api/gemini { task: 'blueprint' | 'lyrics' | 'coach', payload }.
// Uses a Gemini API key from the server environment (GEMINI_API_KEY), so the key never reaches the browser.
import { callBest } from './_gemini-core.js'

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
  if (task !== 'blueprint' && task !== 'lyrics' && task !== 'coach') return Response.json({ error: 'Unknown task.' }, { status: 400 })
  try {
    const result = await callBest(task, payload, async (model, req) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(req),
      })
      return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : null }
    })
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: `Gemini is unavailable right now (${e.message}).` }, { status: 502 })
  }
}
