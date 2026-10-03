import { SECTIONS } from '../data/sections'
import type { Template, Vibe } from '../data/templates'

type Props = {
  vibe: Vibe
  template: Template
  chords: string[]
  lyrics: string[]
  section: number
  step: number
  songPlaying: boolean
  onPlaySong: () => void
  onStop: () => void
  wavUrl: string | null
  usedMine: { beat: boolean; tune: boolean }
  onRestart: () => void
}

export function SongStep(p: Props) {
  const bar = p.step >= 0 ? Math.floor(p.step / 16) : -1
  const sec = p.section >= 0 ? SECTIONS[p.section] : null
  const line = sec?.layers.melody && bar >= 0 ? p.lyrics[bar] : ''
  return (
    <section className="step">
      <h2>Step 5: your song</h2>
      <p className="lead">
        Here is the producer secret: a whole song is usually one loop with parts added and taken away. We turned your 4 bars into a
        full song.
      </p>
      <div className="panel">
        <div className="panel-head">
          <h3>
            Your {p.vibe.name.toLowerCase()} song, {p.template.bpm} BPM
          </h3>
          <div className="actions">
            {p.songPlaying ? (
              <button className="btn primary" onClick={p.onStop}>Stop</button>
            ) : (
              <button className="btn primary" onClick={p.onPlaySong}>{p.wavUrl ? 'Play again' : 'Play my song'}</button>
            )}
            {p.wavUrl && (
              <a className="btn rec" href={p.wavUrl} download="my-song.wav">Download WAV</a>
            )}
          </div>
        </div>
        <div className="sections">
          {SECTIONS.map((s, i) => (
            <div key={i} className={`section${p.section === i ? ' now' : ''}`}>
              <b>{s.name}</b>
              <div className="layer-tags">
                {s.layers.drums && <span>drums</span>}
                {s.layers.bass && <span>bass</span>}
                {s.layers.chords && <span>chords</span>}
                {s.layers.melody && <span>tune</span>}
                {s.layers.double && <span>bells</span>}
              </div>
              <small>{s.why}</small>
            </div>
          ))}
        </div>
        <div className={`karaoke${line ? ' on' : ''}`}>{line || (p.songPlaying ? '...' : 'Your lyrics show up here while the song plays.')}</div>
        {p.wavUrl && <audio controls src={p.wavUrl} className="player" />}
      </div>

      <div className="panel recap">
        <h3>What you made</h3>
        <ul>
          <li>
            Beat: {p.usedMine.beat ? 'your own beatbox' : 'the template'}, learned from {p.template.ref ? `${p.template.ref.title} by ${p.template.ref.artist}` : p.template.name}
          </li>
          <li>Chords: {p.chords.join(' - ')}</li>
          <li>Tune: {p.usedMine.tune ? 'hummed by you' : 'the example tune'}</li>
          <li>Lyrics: {p.lyrics.filter(Boolean).length ? `${p.lyrics.filter(Boolean).length} lines` : 'none yet'}</li>
        </ul>
        <button className="btn" onClick={p.onRestart}>Make another song</button>
      </div>
    </section>
  )
}
