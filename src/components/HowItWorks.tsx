import { Icon } from './Icon'
import type { IconName } from './Icon'

const ROWS: { icon: IconName; you: string; tech: string; how: string; gemini?: boolean }[] = [
  { icon: 'chat', you: 'Describe your song', tech: 'Gemini 3.1 Pro', how: 'Turns one sentence into three song plans (genre, tempo, drums, chords, instruments) and explains every choice.', gemini: true },
  { icon: 'kick', you: 'Beatbox the drums', tech: 'Audio analysis in the browser', how: 'Finds each sound by its jump in loudness, then tells "boom", "pff" and "tss" apart by how deep or hissy it is.' },
  { icon: 'headphones', you: 'Ask Gemini to listen', tech: 'Gemini 3.1 Pro (audio)', how: 'Listens to your recording and gives feedback like a music teacher.', gemini: true },
  { icon: 'mic', you: 'Hum the melody', tech: 'Pitch detection (pitchy)', how: 'Measures your pitch 90 times a second, then snaps each note to the beat and into the key.' },
  { icon: 'notebook', you: 'Write lyrics', tech: 'Gemini 3.1 Pro', how: 'Writes lines that fit the number of notes in each bar of your melody.', gemini: true },
  { icon: 'flute', you: 'Hear real instruments', tech: 'Tone.js + recorded samples', how: 'Plays piano, flute, violin, cello, guitar and seven drum kits from real recordings.' },
  { icon: 'download', you: 'Download your song', tech: 'Web Audio', how: 'Records the finished song inside your browser and saves it as a WAV file.' },
  { icon: 'sparkle', you: 'Every picture and icon', tech: 'Gemini 3 Pro Image', how: 'All illustrations and the 72 icons were generated on Google Cloud in one consistent style.', gemini: true },
]

/** A one-screen answer to "how does this work?", written for judges and curious users. */
export function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="How Songmaker works" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn white modal-x" onClick={onClose}>
          Close
        </button>
        <h2 className="modal-title">How Songmaker works</h2>
        <p className="modal-lead">What you do, and the technology that makes it happen.</p>
        <div className="how-rows">
          {ROWS.map((r) => (
            <div key={r.you} className={`how-row${r.gemini ? ' gem' : ''}`}>
              <span className="how-icon">
                <Icon name={r.icon} size={40} />
              </span>
              <div>
                <b>{r.you}</b>
                <span className="how-tech">{r.tech}</span>
                <p>{r.how}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="fine">Built at StormHacks 2026 with Vite, React and TypeScript, hosted on Vercel. Gemini runs on Google Cloud.</p>
      </div>
    </div>
  )
}
