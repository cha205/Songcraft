import { Coach } from '../components/Guide'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import type { LayerKey, Section } from '../data/sections'
import { EXTRAS } from '../data/genres'
import type { ExtraId } from '../data/genres'

type Props = {
  extras: ExtraId[]
  onExtras: (e: ExtraId[]) => void
  sections: Section[]
  onSections: (s: Section[]) => void
  current: number
  songPlaying: boolean
  playing: boolean
  onPlay: () => void
  onPlaySong: () => void
  onStop: () => void
  onDone: () => void
}

const ROWS: { key: LayerKey; name: string; icon: IconName }[] = [
  { key: 'drums', name: 'Drums', icon: 'drumkit' },
  { key: 'bass', name: 'Bass', icon: 'bassguitar' },
  { key: 'chords', name: 'Chords', icon: 'keys' },
  { key: 'melody', name: 'Melody', icon: 'mic' },
  { key: 'extras', name: 'Added instruments', icon: 'layers' },
]

export function ArrangeStep(p: Props) {
  const toggleExtra = (id: ExtraId) => p.onExtras(p.extras.includes(id) ? p.extras.filter((e) => e !== id) : [...p.extras, id])
  const toggleCell = (i: number, key: LayerKey) =>
    p.onSections(p.sections.map((s, j) => (j === i ? { ...s, layers: { ...s.layers, [key]: !s.layers[key] } } : s)))
  return (
    <section className="step">
      <StepHead icon="timeline" title="Arrange your song">
        A song is the same loop played several times. Producers keep it interesting by adding instruments and switching parts on and off.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="layers">Add one or two instruments, then press play. Experienced producers can switch each part on or off below.</Coach>
        <span className="mini-label">Add instruments</span>
        <div className="extra-grid">
          {EXTRAS.map((e) => {
            const on = p.extras.includes(e.id)
            return (
              <button key={e.id} className={`extra${on ? ' on' : ''}`} onClick={() => toggleExtra(e.id)}>
                <span className="extra-icon">
                  <Icon name={e.icon} size={48} />
                  <span className="extra-badge">
                    <Icon name={on ? 'check' : 'plus'} size={24} />
                  </span>
                </span>
                <b>{e.name}</b>
                <small>{e.why}</small>
              </button>
            )
          })}
        </div>
        <div className="big-actions">
          {p.playing ? (
            <button className="btn navy xl" onClick={p.onStop}>
              <Icon name="stop" size={30} /> Stop
            </button>
          ) : (
            <button className="btn green xl" onClick={p.onPlay}>
              <Icon name="play" size={30} /> Play the loop
            </button>
          )}
          {p.songPlaying ? null : (
            <button className="btn white xl" onClick={p.onPlaySong}>
              <Icon name="timeline" size={30} /> Play the whole song
            </button>
          )}
        </div>

        <span className="mini-label">Song structure</span>
        <div className="arrange-wrap">
          <table className="arrange">
            <thead>
              <tr>
                <th />
                {p.sections.map((s, i) => (
                  <th key={i} className={p.current === i ? 'now' : ''}>
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.key}>
                  <th>
                    <Icon name={r.icon} size={26} /> {r.name}
                  </th>
                  {p.sections.map((s, i) => (
                    <td key={i} className={p.current === i ? 'now' : ''}>
                      <button className={`cell-toggle${s.layers[r.key] ? ' on' : ''}`} onClick={() => toggleCell(i, r.key)} aria-label={`${r.name} in ${s.name}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">The chorus always uses your bigger chorus beat. Each column is four bars.</p>
        <div className="stage-foot end">
          <button className="btn green lg" onClick={p.onDone}>
            <Icon name="check" size={26} /> Use this arrangement
          </button>
        </div>
      </div>
    </section>
  )
}
