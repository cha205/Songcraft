import { DRUMS } from '../audio/analysis'
import { FAMOUS_BEATS } from '../data/famousBeats'
import type { FamousBeat } from '../data/famousBeats'
import type { GenreId } from '../data/genres'
import { Icon } from './Icon'

type Props = {
  genre: GenreId
  tried: string | null
  onTry: (b: FamousBeat) => void
  onTempo: (b: FamousBeat) => void
  onBack: () => void
  bpm: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
}

/** Study famous songs' basic grooves, then try one in your own song and change it. */
export function FamousBeats(p: Props) {
  const tried = FAMOUS_BEATS.find((b) => b.id === p.tried)
  return (
    <div className="famous">
      <div className="famous-head">
        <div>
          <span className="mini-label">Beats from songs you know</span>
          <p>Simplified versions of famous drum grooves, played on Songmaker's drums. Try one, hear what makes it work, then change it into your own.</p>
        </div>
        {tried && (
          <button className="btn white" onClick={p.onBack}>
            Back to my beat
          </button>
        )}
      </div>
      <div className="famous-list">
        {FAMOUS_BEATS.map((b) => (
          <div key={b.id} className={`famous-card${p.tried === b.id ? ' on' : ''}`}>
            <div className="famous-title">
              <b>{b.song}</b>
              <small>
                {b.artist} · {b.bpm} BPM
              </small>
              {b.fits.includes(p.genre) && <span className="fit">Fits your style</span>}
            </div>
            <div className="mini-grid" aria-hidden>
              {DRUMS.map((d) => (
                <div key={d} className={`mini-row r-${d}`}>
                  {Array.from({ length: 16 }, (_, i) => (
                    <i key={i} className={`${b.bar[d].includes(i) ? 'on' : ''}${i % 4 === 0 ? ' beat' : ''}`} />
                  ))}
                </div>
              ))}
            </div>
            <p>{b.lesson}</p>
            <div className="famous-actions">
              {p.tried === b.id && p.playing ? (
                <button className="btn navy" onClick={p.onStop}>
                  <Icon name="stop" size={22} /> Stop
                </button>
              ) : (
                <button className="btn violet" onClick={() => (p.tried === b.id ? p.onPlay() : p.onTry(b))}>
                  <Icon name="play" size={22} /> {p.tried === b.id ? 'Play it again' : 'Try this beat'}
                </button>
              )}
              {p.tried === b.id && p.bpm !== b.bpm && (
                <button className="link-btn" onClick={() => p.onTempo(b)}>
                  Use its tempo and kit ({b.bpm} BPM)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="fine">Only the basic rhythm is rebuilt here. No audio, melody or lyrics from these songs is used.</p>
    </div>
  )
}
