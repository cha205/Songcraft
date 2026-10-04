// Shared Gemini prompts and response schemas, used by the Vercel function (api/gemini.js) and the local dev server
// (vite.config.ts). Gemini must answer with values the app understands, so every choice is an enum.

export const MODELS = ['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-2.5-flash']
// How long to wait for the best model before accepting the faster model's answer.
const PREFER_MS = { blueprint: 20000, lyrics: 15000, coach: 25000 }

const GENRES = ['pop', 'hiphop', 'lofi', 'rnb', 'dance', 'rock', 'acoustic', 'latin']
const KICKS = ['heartbeat', 'four', 'laidback', 'bounce', 'rolling', 'sparse']
const SNARES = ['backbeat', 'halftime', 'ghost', 'dembow']
const HATS = ['quarter', 'eighth', 'offbeat', 'sixteenth', 'trap']
const KITS = ['acoustic', 'kit8', 'cr78', 'linn', 'techno', 'breakbeat', 'r8']
const LEADS = ['piano', 'flute', 'guitar', 'violin', 'synth', 'bells']
const CHORD_INSTS = ['piano', 'guitar', 'strings', 'pad']
const BASSES = ['roots', 'eighths', 'sub']
const EXTRAS = ['strings', 'guitar', 'arp', 'flute', 'pad']
const CHORDS = ['C', 'Dm', 'Em', 'F', 'G', 'Am']

const str = (e) => (e ? { type: 'STRING', enum: e } : { type: 'STRING' })

const PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: str(),
    genre: str(GENRES),
    feeling: str(['bright', 'dark']),
    bpm: { type: 'INTEGER' },
    kick: str(KICKS),
    snare: str(SNARES),
    hat: str(HATS),
    kit: str(KITS),
    chords: { type: 'ARRAY', items: str(CHORDS) },
    chordInst: str(CHORD_INSTS),
    bass: str(BASSES),
    lead: str(LEADS),
    extras: { type: 'ARRAY', items: str(EXTRAS) },
    title: str(),
    topic: str(),
    reasons: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { part: str(['Style', 'Tempo', 'Drums', 'Chords', 'Instruments']), why: str() }, required: ['part', 'why'] },
    },
  },
  required: ['summary', 'genre', 'feeling', 'bpm', 'kick', 'snare', 'hat', 'kit', 'chords', 'chordInst', 'bass', 'lead', 'extras', 'title', 'topic', 'reasons'],
}

const BLUEPRINT_SCHEMA = { type: 'OBJECT', properties: { plans: { type: 'ARRAY', items: PLAN_SCHEMA } }, required: ['plans'] }

const COACH_SCHEMA = { type: 'OBJECT', properties: { good: str(), tip: str() }, required: ['good', 'tip'] }

const LYRICS_SCHEMA = {
  type: 'OBJECT',
  properties: { lines: { type: 'ARRAY', items: str() }, tip: str() },
  required: ['lines', 'tip'],
}

function blueprintPrompt({ text }) {
  return `You are a friendly music producer helping a complete beginner, possibly a child, plan an original song.
Turn their description into exactly three different song plans, using only the allowed values in the schema.
Plan 1 follows the description closely. Plan 2 is a bolder take with more energy. Plan 3 is a softer or surprising take.
The three plans must differ in genre or feeling, so the beginner has a real choice.

Guidance:
- genre: hiphop covers rap and trap; lofi is calm study music; rnb is smooth and soulful; dance is club and electronic; acoustic covers ballads and folk; latin covers reggaeton.
- feeling: bright = happy, hopeful, fun (major chords). dark = sad, serious, intense (minor chords).
- bpm between 60 and 160. Trap is around 140 with a halftime snare and trap hi-hats. Ballads are 60 to 80. Dance is 120 to 128.
- kick/snare/hat pick one lesson pattern each: heartbeat (beats 1 and 3), four (every beat), laidback, bounce, rolling (trap), sparse; backbeat (2 and 4), halftime (beat 3, heavy), ghost (funky), dembow (reggaeton); quarter, eighth, offbeat (house), sixteenth, trap (rolls).
- chords: exactly four chords. Bright songs usually start on C, F or G. Dark songs usually start on Am, Dm or Em.
- extras: zero to three extra instruments that suit the style.
- summary: one short sentence describing how this version sounds, in everyday words.
- title: a new, original working title (never the name of an existing song). topic: 3 to 8 words describing what the lyrics are about.
- reasons: one entry for each of Style, Tempo, Drums, Chords and Instruments. Each "why" is one short sentence a 10-year-old understands, explaining how that choice creates the feeling they asked for.
Never mention or imitate real songs or artists.

Description: """${String(text).slice(0, 400)}"""`
}

function lyricsPrompt({ genre, feeling, topic, syllables, title, part }) {
  const role = part === 'chorus' ? 'This is the CHORUS: make it the catchiest part and repeat one short phrase (ideally the title).' : 'This is the VERSE: tell the story with concrete details.'
  return `Write 4 original song lyric lines for a beginner's song, one line per bar. ${role}
Style: ${genre}. Feeling: ${feeling}. Title: ${title || 'untitled'}. Topic: ${topic || 'free choice'}.
Line 1 should have about ${syllables[0]} syllables, line 2 about ${syllables[1]}, line 3 about ${syllables[2]}, line 4 about ${syllables[3]} (one syllable per note, plus or minus one).
Use simple, vivid, singable words that a child could sing. Lines 2 and 4 should rhyme. No profanity. Do not quote or imitate any existing song.
tip: one short sentence teaching the beginner something about writing lyrics, based on what you wrote.`
}

function coachPrompt({ kind, bpm, genre, feeling, target }) {
  const what = kind === 'beat'
    ? `a beginner beatboxing a drum beat with their mouth ("boom" = kick, "pff" = snare, "tss" = hi-hat) at ${bpm} BPM. The beat they were trying to perform: ${target}.`
    : `a beginner humming or singing a melody over a ${feeling} ${genre} backing track at ${bpm} BPM.`
  return `You are a warm, encouraging music teacher. Listen to this recording of ${what}
Reply with:
- good: one sentence about something specific they did well (timing, energy, clarity, pitch, rhythm).
- tip: one sentence with one specific, practical thing to try on the next take.
Use simple words a 10-year-old understands. Be honest but kind. If the recording is silent or unclear, say so gently in tip.`
}

export function buildRequest(task, payload) {
  if (task === 'coach') {
    return {
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'audio/wav', data: String(payload.audio || '') } }, { text: coachPrompt(payload) }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json', responseSchema: COACH_SCHEMA },
    }
  }
  const isBlueprint = task === 'blueprint'
  return {
    contents: [{ role: 'user', parts: [{ text: isBlueprint ? blueprintPrompt(payload) : lyricsPrompt(payload) }] }],
    generationConfig: {
      temperature: 0.9,
      responseMimeType: 'application/json',
      responseSchema: isBlueprint ? BLUEPRINT_SCHEMA : LYRICS_SCHEMA,
    },
  }
}

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback)

/** Parse Gemini's JSON and clamp every value to something the app supports. */
function normalizePlan(r) {
  const chords = (Array.isArray(r.chords) ? r.chords : []).filter((c) => CHORDS.includes(c)).slice(0, 4)
  while (chords.length < 4) chords.push(chords[chords.length - 1] || 'C')
  return {
    summary: String(r.summary || '').slice(0, 160),
    genre: pick(r.genre, GENRES, 'pop'),
    feeling: pick(r.feeling, ['bright', 'dark'], 'bright'),
    bpm: Math.max(60, Math.min(160, Math.round(Number(r.bpm) || 100))),
    kick: pick(r.kick, KICKS, 'heartbeat'),
    snare: pick(r.snare, SNARES, 'backbeat'),
    hat: pick(r.hat, HATS, 'eighth'),
    kit: pick(r.kit, KITS, 'acoustic'),
    chords,
    chordInst: pick(r.chordInst, CHORD_INSTS, 'piano'),
    bass: pick(r.bass, BASSES, 'roots'),
    lead: pick(r.lead, LEADS, 'piano'),
    extras: (Array.isArray(r.extras) ? r.extras : []).filter((e) => EXTRAS.includes(e)).slice(0, 3),
    title: String(r.title || '').slice(0, 40),
    topic: String(r.topic || '').slice(0, 80),
    reasons: (Array.isArray(r.reasons) ? r.reasons : []).slice(0, 6).map((x) => ({ part: String(x.part || ''), why: String(x.why || '') })),
  }
}

/** Parse Gemini's JSON and clamp every value to something the app supports. */
export function readResult(task, response, model) {
  const text = response?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}'
  const r = JSON.parse(text)
  if (task === 'coach') return { good: String(r.good || ''), tip: String(r.tip || ''), model }
  if (task === 'lyrics') {
    const lines = Array.isArray(r.lines) ? r.lines.slice(0, 4).map(String) : []
    while (lines.length < 4) lines.push('')
    return { lines, tip: String(r.tip || ''), model }
  }
  const plans = (Array.isArray(r.plans) ? r.plans : []).slice(0, 3).map(normalizePlan)
  if (!plans.length) throw new Error('no plans')
  return { plans, model }
}

/**
 * Run a task on the best model, with the fast model racing alongside so a live demo never waits too long.
 * `run(model)` performs one HTTP call and resolves to { ok, status, json }.
 */
export async function callBest(task, payload, run) {
  const attempt = async (model) => {
    const r = await run(model, buildRequest(task, payload))
    if (!r.ok) throw new Error(`${model}: ${r.status}`)
    return readResult(task, r.json, model)
  }
  const best = attempt(MODELS[0])
  const fast = attempt(MODELS[1])
  best.catch(() => {})
  fast.catch(() => {})
  const early = await Promise.race([best, new Promise((res) => setTimeout(() => res(null), PREFER_MS[task] ?? 20000))]).catch(() => null)
  if (early) return early
  try {
    return await Promise.any([best, fast])
  } catch {
    return attempt(MODELS[2])
  }
}
