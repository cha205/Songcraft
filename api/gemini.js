// Vercel serverless function: POST /api/gemini { task: 'blueprint' | 'lyrics' | 'coach', payload }.
// Talks to Gemini on Vertex AI (Google Cloud) without any stored key: Vercel signs a short-lived OIDC token for this
// project, Google's Security Token Service swaps it for a Google token (Workload Identity Federation), and that token
// acts as a service account that may only call Vertex AI. GEMINI_API_KEY (Google AI Studio) still works as a fallback.
import { callBest } from './_gemini-core.js'

// Identifiers, not secrets. Override with environment variables if the Google Cloud setup changes.
const env = process.env
const GCP = {
  project: env.GCP_PROJECT_ID ?? 'project-24479dcb-0f3a-477f-afc',
  number: env.GCP_PROJECT_NUMBER ?? '971704349017',
  pool: env.GCP_WORKLOAD_IDENTITY_POOL_ID ?? 'vercel',
  provider: env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID ?? 'vercel',
  account: env.GCP_SERVICE_ACCOUNT_EMAIL ?? 'songmaker-vercel@project-24479dcb-0f3a-477f-afc.iam.gserviceaccount.com',
}
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
let cached = { token: '', until: 0 }

async function googleToken(oidc) {
  if (cached.token && Date.now() < cached.until) return cached.token
  const sts = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience: `//iam.googleapis.com/projects/${GCP.number}/locations/global/workloadIdentityPools/${GCP.pool}/providers/${GCP.provider}`,
      scope: SCOPE,
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      subject_token: oidc,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    }),
  })
  if (!sts.ok) throw new Error(`token exchange ${sts.status}`)
  const federated = (await sts.json()).access_token
  const sa = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP.account}:generateAccessToken`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${federated}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: [SCOPE] }),
  })
  if (!sa.ok) throw new Error(`service account ${sa.status}`)
  const { accessToken, expireTime } = await sa.json()
  cached = { token: accessToken, until: Date.parse(expireTime) - 5 * 60 * 1000 }
  return accessToken
}

async function send(url, headers, req) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(req) })
  return { ok: r.ok, status: r.status, json: r.ok ? await r.json() : null }
}

export async function POST(request) {
  const oidc = request.headers.get('x-vercel-oidc-token') || env.VERCEL_OIDC_TOKEN
  const key = env.GEMINI_API_KEY
  if (!oidc && !key) return Response.json({ error: 'Gemini is not set up on this server yet.' }, { status: 503 })
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 })
  }
  const { task, payload } = body || {}
  if (task !== 'blueprint' && task !== 'lyrics' && task !== 'coach') return Response.json({ error: 'Unknown task.' }, { status: 400 })
  try {
    const result = oidc
      ? await callBest(task, payload, async (model, req) => {
          const token = await googleToken(oidc)
          return send(`https://aiplatform.googleapis.com/v1/projects/${GCP.project}/locations/global/publishers/google/models/${model}:generateContent`, { Authorization: `Bearer ${token}` }, req)
        })
      : await callBest(task, payload, (model, req) => send(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { 'x-goog-api-key': key }, req))
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: `Gemini is unavailable right now (${e.message}).` }, { status: 502 })
  }
}
