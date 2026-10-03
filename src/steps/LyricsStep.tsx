import { BARS } from '../audio/analysis'
import type { Note } from '../audio/analysis'
import { Icon } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { LYRIC_PROMPTS } from '../data/templates'
import type { VibeId } from '../data/templates'
import { syllables } from '../lyrics'

type Props = {
  vibe: VibeId
  notes: Note[]
  lyrics: string[]
  onLyrics: (l: string[]) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
}

export function LyricsStep(p: Props) {
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  return (
    <section className="step">
      <StepHead n={4} icon="notebook" title="Write the lyrics">
        Lyrics usually come last because they need to fit the melody. Aim for one syllable per note. Each line below matches one bar,
        and the counter shows how well your words fit.
      </StepHead>
      <div className="card pad">
        <span className="card-tab tab-sun">
          <Icon name="notebook" /> Lyrics
        </span>
        <div className="card-head">
          <div className="prompts">
            <Icon name="bulb" size={24} />
            <span>Ideas</span>
            {LYRIC_PROMPTS[p.vibe].map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          {p.playing ? (
            <button className="btn ink" onClick={p.onStop}>
              <Icon name="stop" size={24} /> Stop
            </button>
          ) : (
            <button className="btn mint" onClick={p.onPlay}>
              <Icon name="play" size={24} /> Play while writing
            </button>
          )}
        </div>
        <div className="lyric-lines">
          {Array.from({ length: BARS }, (_, b) => {
            const target = p.notes.filter((n) => n.start >= b * 16 && n.start < b * 16 + 16).length
            const have = syllables(p.lyrics[b] ?? '')
            const fit = !p.lyrics[b] ? '' : Math.abs(have - target) <= 1 ? ' fit' : have > target ? ' long' : ' short'
            return (
              <label key={b} className={`lyric${bar === b ? ' now' : ''}`}>
                <span className="lyric-bar">Bar {b + 1}</span>
                <input
                  className="input"
                  value={p.lyrics[b] ?? ''}
                  placeholder={target ? `${target} notes, about ${target} syllables` : 'No notes in this bar'}
                  onChange={(e) => p.onLyrics(p.lyrics.map((l, i) => (i === b ? e.target.value : l)))}
                />
                <span className={`syl${fit}`} title="Syllables / notes">
                  {have}/{target}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </section>
  )
}
