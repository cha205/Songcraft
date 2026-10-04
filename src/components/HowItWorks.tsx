import { Icon } from './Icon'
import type { IconName } from './Icon'

const ROWS: { icon: IconName; you: string; tech: string; how: string; gemini?: boolean }[] = [
  { icon: 'chat', you: 'Ask your producer', tech: 'Gemini 3.6 Flash', how: 'Type a request on any screen and Gemini changes the song (tempo, drums, chords, instruments) and tells you the music reason. Every change can be undone.', gemini: true },
  { icon: 'wand', you: 'Describe your song', tech: 'Gemini 3.1 Pro', how: 'Turns one sentence into three song plans (genre, tempo, drums, chords, instruments) and explains every choice.', gemini: true },
  { icon: 'keys', you: 'Build with suggestions', tech: 'Music theory written for this app', how: 'Ranks the next chord and the next melody note for your style and feeling, best first, and says why. Tempo zones and "Fits Rock" tags show what each style usually uses.' },
  { icon: 'headphones', you: 'Ask Gemini to listen', tech: 'Gemini 3.1 Pro (audio)', how: 'Listens to your recording and gives feedback like a music teacher.', gemini: true },
  { icon: 'mic', you: 'Hum and sing', tech: 'Pitch detection (pitchy) + Web Audio', how: 'Measures your hum 90 times a second and snaps each note to the beat and key. Your sung lyrics are recorded in time with the beat, pitch-corrected onto your melody and mixed into the song.' },
  { icon: 'notebook', you: 'Write your lyrics', tech: 'Gemini 3.6 Flash', how: 'You write every word. Gemini checks each line fits your melody and suggests rhymes and ideas. It never writes lines for you.', gemini: true },
  { icon: 'flute', you: 'Hear real instruments', tech: 'Tone.js + recorded samples', how: 'Plays your notes on recordings of real piano, guitars, sax, trumpet, strings, harp, organ, bass and 14 drum kits.' },
  { icon: 'download', you: 'Download or share', tech: 'Web Audio + song links', how: 'Records the finished song in your browser as a WAV file, or packs the whole song into one link and QR code. Nothing is uploaded.' },
  { icon: 'star', you: 'Final check', tech: 'Gemini 3.6 Flash', how: 'Looks over the whole song like a producer, gives it stars and suggests up to three fixes you can apply with one tap. It also suggests small melody edits.', gemini: true },
  { icon: 'sparkle', you: 'Pictures', tech: 'Gemini 3 Pro Image', how: 'Made every illustration and icon in one style, and paints a cover for your song only if you ask.', gemini: true },
]

/** A one-screen answer to "how does this work?", written for judges and curious users. */
export function HowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="How Songcraft works" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn white modal-x" onClick={onClose}>
          Close
        </button>
        <h2 className="modal-title">How Songcraft works</h2>
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
