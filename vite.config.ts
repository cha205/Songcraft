import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { MODELS, buildRequest, readResult } from './api/_gemini-core.js'

// Local development only: answers /api/gemini through Vertex AI using this computer's gcloud login,
// so Gemini works without an API key while developing. The deployed site uses api/gemini.js instead.
const PROJECT = process.env.GCP_PROJECT ?? 'project-24479dcb-0f3a-477f-afc'
let token = ''
let tokenAt = 0

function geminiDev(): Plugin {
  return {
    name: 'gemini-dev',
    configureServer(server) {
      server.middlewares.use('/api/gemini', (req, res) => {
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try {
            const { task, payload } = JSON.parse(raw || '{}')
            if (!token || Date.now() - tokenAt > 40 * 60 * 1000) {
              token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim()
              tokenAt = Date.now()
            }
            let last = ''
            for (const model of MODELS) {
              const r = await fetch(`https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${model}:generateContent`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(buildRequest(task, payload)),
              })
              if (r.ok) return send(200, readResult(task, await r.json(), model))
              last = `${model}: ${r.status} ${(await r.text()).slice(0, 200)}`
              if (![404, 429, 500, 503].includes(r.status)) break
            }
            send(502, { error: `Gemini is unavailable right now (${last}).` })
          } catch (e) {
            send(500, { error: (e as Error).message })
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geminiDev()],
})
