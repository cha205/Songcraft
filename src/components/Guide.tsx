import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/** One-line instruction that tells the user exactly what to do on this screen. */
export function Coach({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="coach" role="status">
      <span className="coach-icon">
        <Icon name={icon} size={34} />
      </span>
      <p>{children}</p>
    </div>
  )
}

/** "1 Listen  2 Record  3 Review" progress pills inside a step. */
export function StageTabs<T extends string>({ stages, current, onPick, enabled }: { stages: { id: T; label: string }[]; current: T; onPick: (s: T) => void; enabled: (s: T) => boolean }) {
  const idx = stages.findIndex((s) => s.id === current)
  return (
    <div className="stage-tabs">
      {stages.map((s, i) => (
        <button key={s.id} className={`stage-tab${i === idx ? ' on' : ''}${i < idx ? ' done' : ''}`} disabled={!enabled(s.id)} onClick={() => onPick(s.id)}>
          <span className="stage-num">{i + 1}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}

/** The big round record button, the one obvious thing to press on a recording screen. */
export function MicButton({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`mic-button${busy ? ' busy' : ''}`} onClick={onClick} disabled={busy} aria-label={label}>
      <span className="mic-ring r1" />
      <span className="mic-ring r2" />
      <span className="mic-core">
        <Icon name="mic" size={74} />
      </span>
      <span className="mic-label">{busy ? 'Recording' : label}</span>
    </button>
  )
}

type Coaching = { good: string; tip: string; model: string }

/** "Ask Gemini to listen": sends the last recording to Gemini and shows teacher-style feedback. */
export function GeminiCoach({ onCoach }: { onCoach: () => Promise<Coaching> }) {
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<Coaching | null>(null)
  const [err, setErr] = useState('')
  const ask = async () => {
    setBusy(true)
    setErr('')
    try {
      setRes(await onCoach())
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="gemini-coach">
      {!res && (
        <button className="btn violet" onClick={ask} disabled={busy}>
          <Icon name="headphones" size={26} /> {busy ? 'Gemini is listening' : 'Ask Gemini to listen'}
        </button>
      )}
      {busy && <span className="fine">Gemini is listening to your recording. About 10 seconds.</span>}
      {err && <p className="notice">{err}</p>}
      {res && (
        <div className="coach-result">
          <span className="coach-badge">
            <Icon name="headphones" size={30} /> Gemini listened
          </span>
          <p>
            <b>What went well:</b> {res.good}
          </p>
          <p>
            <b>Try this next:</b> {res.tip}
          </p>
        </div>
      )}
    </div>
  )
}
