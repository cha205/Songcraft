import { BARS } from '../audio/analysis'
import type { Note } from '../audio/analysis'
import { Coach, GeminiCoach } from '../components/Guide'
import { Mixer } from '../components/Mixer'
import { Icon } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { LYRIC_PROMPTS } from '../data/genres'
import type { Feeling } from '../data/genres'
import { syllables } from '../lyrics'
import type { LyricHelp } from '../ai'

type Props = {
  part: 'verse' | 'chorus'
  doneLabel: string
  feeling: Feeling
  notes: Note[]
  lyrics: string[]
  onLyrics: (l: string[]) => void
  topic: string
  onTopic: (t: string) => void
  onHelp: () => void
  aiBusy: boolean
  aiError: string
  help: LyricHelp | null
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  onDone: () => void
  busy: boolean
  hasVocal: boolean
  onSing: () => void
  onRemoveVocal: () => void
  onCoachVocal: () => Promise<{ good: string; tip: string; model: string }>
  singInfo: string
  tune: 'off' | 'natural' | 'robot'
  onTune: (t: 'off' | 'natural' | 'robot') => void
  mix: { music: number; voice: number }
  onMix: (music: number, voice: number) => void
}

const TUNES = [
  { id: 'off', name: 'Off', why: 'Your voice as you sang it, cleaned up with studio effects.' },
  { id: 'natural', name: 'Natural', why: 'Gently pulls each note onto your melody.' },
  { id: 'robot', name: 'Robot', why: 'Snaps every note into place for that electronic sound.' },
] as const

export function LyricsStep(p: Props) {
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  return (
    <section className="step">
      <StepHead icon="notebook" title={p.part === 'chorus' ? 'Write the chorus lyrics' : 'Write the verse lyrics'}>
        Lyrics come last because they have to fit the melody. The rule of thumb is one syllable for each note. Every word is yours.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="notebook">
          {p.part === 'chorus'
            ? 'Chorus lyrics repeat one short, catchy phrase. Write one line per bar. Stuck? Gemini gives you rhymes and ideas, never the words.'
            : 'Verse lyrics tell the story. Write one short line per bar; the counter turns green when it fits. Stuck? Gemini gives you rhymes and ideas, never the words.'}
        </Coach>
        <div className="ai-lyrics">
          <input className="input" value={p.topic} maxLength={80} placeholder="What is your song about?" onChange={(e) => p.onTopic(e.target.value)} aria-label="Song topic" />
          <button className="btn violet lg" onClick={p.onHelp} disabled={p.aiBusy}>
            <Icon name="bulb" size={26} /> {p.aiBusy ? 'Reading your lines' : 'Ask Gemini for help'}
          </button>
        </div>
        <div className="prompts">
          <span className="mini-label">Ideas</span>
          {LYRIC_PROMPTS[p.feeling].map((t) => (
            <button key={t} className="example" onClick={() => p.onTopic(t)}>
              {t}
            </button>
          ))}
        </div>
        {p.aiBusy && (
          <div className="ai-wait">
            <span className="ai-dots">
              <i />
              <i />
              <i />
            </span>
            Gemini is reading your lines and checking them against your melody.
          </div>
        )}
        {p.aiError && <p className="notice">{p.aiError}</p>}
        {p.help?.tip && !p.aiBusy && (
          <p className="note">
            <Icon name="bulb" size={22} /> {p.help.tip}
          </p>
        )}
        <div className="lyric-lines">
          {Array.from({ length: BARS }, (_, b) => {
            const target = p.notes.filter((n) => n.start >= b * 16 && n.start < b * 16 + 16).length
            const have = syllables(p.lyrics[b] ?? '')
            const fit = !p.lyrics[b] ? '' : Math.abs(have - target) <= 1 ? ' fit' : have > target ? ' long' : ' short'
            const h = p.help?.lines[b]
            return (
              <div key={b} className="lyric-wrap">
                <label className={`lyric${bar === b ? ' now' : ''}`}>
                  <span className="lyric-bar">Bar {b + 1}</span>
                  <input
                    className="input"
                    value={p.lyrics[b] ?? ''}
                    placeholder={target ? `About ${target} syllables` : 'No notes in this bar'}
                    onChange={(e) => p.onLyrics(p.lyrics.map((l, i) => (i === b ? e.target.value : l)))}
                  />
                  <span className={`syl${fit}`} title="Syllables compared with notes">
                    {have}/{target}
                  </span>
                </label>
                {h && (h.feedback || h.rhymes.length > 0 || h.ideas.length > 0) && (
                  <div className="lyric-help">
                    {h.feedback && <p>{h.feedback}</p>}
                    {h.rhymes.length > 0 && (
                      <span className="word-row">
                        <b>Rhymes</b>
                        {h.rhymes.map((w) => (
                          <i key={w}>{w}</i>
                        ))}
                      </span>
                    )}
                    {h.ideas.length > 0 && (
                      <span className="word-row">
                        <b>Ideas</b>
                        {h.ideas.map((w) => (
                          <i key={w}>{w}</i>
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className={`sing-box${p.hasVocal ? ' done' : ''}`}>
          <span className="sing-icon">
            <Icon name="starmic" size={56} />
          </span>
          <div className="sing-text">
            <b>{p.hasVocal ? `Your voice is in the ${p.part}` : 'Now sing it yourself'}</b>
            <p>
              {p.hasVocal
                ? 'It plays with the music from now on, and in the finished song.'
                : 'Put on headphones and sing your lines over the beat. The melody plays quietly to guide you, and your lines show up on screen. Your real voice goes into the song.'}
            </p>
            {p.singInfo && <p className="fine">{p.singInfo}</p>}
          </div>
          <div className="sing-actions">
            <button className={`btn ${p.hasVocal ? 'white' : 'red'} lg`} onClick={p.onSing} disabled={p.busy}>
              <Icon name="mic" size={26} /> {p.hasVocal ? 'Sing it again' : 'Sing my lyrics'}
            </button>
            {p.hasVocal && (
              <button className="btn white" onClick={p.onRemoveVocal} disabled={p.busy}>
                Remove my voice
              </button>
            )}
          </div>
          {p.hasVocal && (
            <div className="tune-modes">
              <span className="mini-label">Pitch correction</span>
              <div className="tune-switch" role="radiogroup" aria-label="Pitch correction">
                {TUNES.map((t) => (
                  <button key={t.id} role="radio" aria-checked={p.tune === t.id} className={p.tune === t.id ? 'on' : ''} onClick={() => p.onTune(t.id)}>
                    {t.name}
                  </button>
                ))}
              </div>
              <small>{TUNES.find((t) => t.id === p.tune)?.why}</small>
            </div>
          )}
          {p.hasVocal && <Mixer music={p.mix.music} voice={p.mix.voice} onChange={p.onMix} />}
          {p.hasVocal && <GeminiCoach key={p.singInfo} onCoach={p.onCoachVocal} />}
        </div>

        <div className="stage-foot">
          {p.playing ? (
            <button className="btn navy lg" onClick={p.onStop}>
              <Icon name="stop" size={26} /> Stop
            </button>
          ) : (
            <button className="btn white lg" onClick={p.onPlay}>
              <Icon name="play" size={26} /> Play while I write
            </button>
          )}
          <button className="btn green lg" onClick={p.onDone}>
            <Icon name="check" size={26} /> {p.doneLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
