import { useState } from 'react'
import { DRUMS } from '../audio/analysis'
import { FAMOUS_BEATS } from '../data/famousBeats'
import type { FamousBeat } from '../data/famousBeats'
import { genreById } from '../data/genres'
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
  const [all, setAll] = useState(false)
  const tried = FAMOUS_BEATS.find((b) => b.id === p.tried)
  const name = genreById(p.genre).name
  const list = all ? FAMOUS_BEATS : FAMOUS_BEATS.filter((b) => b.genre === p.genre)
  return (
    <div className="famous">
      <div className="famous-head">
        <div>
          <span className="mini-label">{all ? 'Beats from songs you know' : `${name} beats from songs you know`}</span>
          <p>Simplified versions of famous drum grooves, played on Songcraft's drums. Try one, hear what makes it work, then change it into your own.</p>
        </div>
        {tried && (
          <button className="btn white" onClick={p.onBack}>
            Back to my beat
          </button>
        )}
      </div>
      <div className="famous-list">
        {list.map((b) => (
          <div key={b.id} className={`famous-card${p.tried === b.id ? ' on' : ''}`}>
            <div className="famous-title">
              <b>{b.song}</b>
              <small>
                {b.artist} · {b.bpm} BPM
              </small>
              {all && <span className="fit">{genreById(b.genre).name}</span>}
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
      <div className="famous-foot">
        <button className="link-btn" onClick={() => setAll(!all)}>
          {all ? `Only show ${name} songs` : 'Show songs from every style'}
        </button>
        <p className="fine">Only the basic rhythm is rebuilt here, simplified. No audio, melody or lyrics from these songs is used.</p>
      </div>
    </div>
  )
}
