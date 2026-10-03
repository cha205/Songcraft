import { BARS } from '../audio/analysis'
import type { Note } from '../audio/analysis'
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
      <h2>Step 4: the words</h2>
      <p className="lead">
        Lyrics come last because they have to fit the tune. The trick: <b>one syllable per note</b>. Each line below is one bar of
        your tune, and the counter tells you if the words fit.
      </p>
      <div className="panel">
        <div className="panel-head">
          <h3>Your lyrics</h3>
          {p.playing ? (
            <button className="btn primary" onClick={p.onStop}>Stop</button>
          ) : (
            <button className="btn primary" onClick={p.onPlay}>Play while I write</button>
          )}
        </div>
        <div className="prompts">
          <span>Stuck? Write about:</span>
          {LYRIC_PROMPTS[p.vibe].map((t) => (
            <span key={t} className="pill">{t}</span>
          ))}
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
                  value={p.lyrics[b] ?? ''}
                  placeholder={target ? `${target} notes, so about ${target} syllables` : 'No notes in this bar, leave it empty'}
                  onChange={(e) => p.onLyrics(p.lyrics.map((l, i) => (i === b ? e.target.value : l)))}
                />
                <span className={`syl${fit}`}>
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
