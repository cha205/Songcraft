import { Icon } from './Icon'

/** Two faders: how loud the music is and how loud your voice is. 100% is normal. */
export function Mixer({ music, voice, onChange }: { music: number; voice: number; onChange: (music: number, voice: number) => void }) {
  return (
    <div className="mixer">
      <span className="mini-label">Mix</span>
      <label className="fader">
        <Icon name="speaker" size={26} />
        <span>Music</span>
        <input type="range" min={0} max={1.5} step={0.05} value={music} onChange={(e) => onChange(+e.target.value, voice)} aria-label="Music volume" />
        <b>{Math.round(music * 100)}%</b>
      </label>
      <label className="fader">
        <Icon name="starmic" size={26} />
        <span>Voice</span>
        <input type="range" min={0} max={1.5} step={0.05} value={voice} onChange={(e) => onChange(music, +e.target.value)} aria-label="Voice volume" />
        <b>{Math.round(voice * 100)}%</b>
      </label>
    </div>
  )
}
