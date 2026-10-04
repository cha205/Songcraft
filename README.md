# Songmaker

Make a real song with your voice, and learn how songs are built while you do it. Describe your song to Gemini or pick a genre and a feeling, build a beat one drum at a time, choose chords and bass, hum a melody, add instruments, write lyrics with Gemini, and download the finished song. For people who have never made music, with full controls for people who have.

## Run locally
```
npm install
npm run dev
```

## Built with
- Vite, React, TypeScript, oxlint, Vitest
- Tone.js (instruments, timing, playback)
- pitchy (pitch detection, McLeod method)
- Google Gemini through Vertex AI / the Gemini API: `gemini-3.1-pro-preview` (fallbacks `gemini-3.6-flash`, `gemini-2.5-flash`) for song planning, lyrics and listening feedback; `gemini-3.6-flash` for the talk-to-your-producer feature (audio in, song changes out); `gemini-3-pro-image` (fallback `gemini-2.5-flash-image`) for each song's album cover
- Web Speech API (the producer reads its replies aloud)
- qrcode by Ryan Day (MIT) for song share codes
- Salamander Grand Piano samples by Alexander Holm (CC BY 3.0), via the Tone.js sample CDN
- tonejs-instruments samples by Nicholaus Brosowsky (flute, violin, cello, acoustic guitar; CC BY 3.0)
- Tone.js drum samples (acoustic, 808, CR78, LINN, Techno, breakbeat and R8 kits)
- Baloo 2 and Nunito fonts (Google Fonts)
- Art and icons generated with Google Vertex AI (`gemini-3-pro-image`), processed with Python (NumPy, Pillow, SciPy), scripts in `tools/`
- Vercel (hosting and the Gemini serverless function)
- Claude Code (AI coding assistant)

How each feature works: `docs/TECHNOLOGY.md`. Learning design: `docs/LEARNING_DESIGN.md`.


## Setup for Gemini
- Local development: nothing to do if `gcloud auth login` works; the dev server calls Vertex AI with your gcloud credentials.
- Deployed site: no key. Vercel signs a short-lived OIDC token, Google Workload Identity Federation swaps it for a token of the `songmaker-vercel` service account (role: Vertex AI User only). Pool and provider are both named `vercel` in the Google Cloud project; only the Vercel project `songmaker` is allowed. `GEMINI_API_KEY` (AI Studio) is an optional fallback.
