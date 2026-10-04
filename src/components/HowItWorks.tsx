import { Icon } from './Icon'
import type { IconName } from './Icon'

const ROWS: { icon: IconName; you: string; tech: string; how: string; gemini?: boolean }[] = [
  { icon: 'chat', you: 'Talk to your producer', tech: 'Gemini 3.6 Flash (audio)', how: 'Hears what you say on any screen, changes the song (tempo, drums, chords, instruments) and tells you the music reason. Every change can be undone.', gemini: true },
  { icon: 'wand', you: 'Describe your song', tech: 'Gemini 3.1 Pro', how: 'Turns one sentence into three song plans (genre, tempo, drums, chords, instruments) and explains every choice.', gemini: true },
  { icon: 'kick', you: 'Beatbox the drums', tech: 'Audio analysis in the browser', how: 'Finds each sound by its jump in loudness, then tells "boom", "pff" and "tss" apart by how deep or hissy it is.' },
  { icon: 'headphones', you: 'Ask Gemini to listen', tech: 'Gemini 3.1 Pro (audio)', how: 'Listens to your recording and gives feedback like a music teacher.', gemini: true },
  { icon: 'mic', you: 'Hum and sing', tech: 'Pitch detection (pitchy) + Web Audio', how: 'Measures your hum 90 times a second and snaps each note to the beat and key. Your sung lyrics are recorded in time with the beat, pitch-corrected onto your melody and mixed into the song.' },
  { icon: 'notebook', you: 'Write your lyrics', tech: 'Gemini 3.6 Flash', how: 'You write every word. Gemini checks each line fits your melody and suggests rhymes and ideas. It never writes lines for you.', gemini: true },
  { icon: 'flute', you: 'Hear real instruments', tech: 'Tone.js + recorded samples', how: 'Plays piano, flute, violin, cello, guitar and seven drum kits from real recordings.' },
  { icon: 'download', you: 'Download or share', tech: 'Web Audio + song links', how: 'Records the finished song in your browser as a WAV file, or packs the whole song into one link and QR code. Nothing is uploaded.' },
  { icon: 'vinyl', you: 'Your album cover', tech: 'Gemini 3 Pro Image', how: 'Only if you ask: paints a cover picture for your song from its title, mood and lyrics. It never makes any of the sound.', gemini: true },
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
        <p className="modal-lead">What you do, and the technology that makes it happen. AI never makes any of the sound: every beat, note and word comes from you.</p>
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
