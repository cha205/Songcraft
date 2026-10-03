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
