import { BARS } from '../audio/analysis'
import type { Note } from '../audio/analysis'
import { Coach } from '../components/Guide'
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
  onDone: () => void
}

export function LyricsStep(p: Props) {
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  return (
    <section className="step">
      <StepHead icon="notebook" title="Write the lyrics">
        Lyrics come last because they have to fit the melody. The rule of thumb is one syllable for each note.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="notebook">Write one short line for each bar. The counter turns green when your line fits the notes.</Coach>
        <div className="prompts">
          <span className="mini-label">Need an idea? Write about</span>
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
                  className="input"
                  value={p.lyrics[b] ?? ''}
                  placeholder={target ? `About ${target} syllables` : 'No notes in this bar'}
                  onChange={(e) => p.onLyrics(p.lyrics.map((l, i) => (i === b ? e.target.value : l)))}
                />
                <span className={`syl${fit}`} title="Syllables compared with notes">
                  {have}/{target}
                </span>
              </label>
            )
          })}
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
            <Icon name="star" size={26} /> Finish my song
          </button>
        </div>
      </div>
    </section>
  )
}
