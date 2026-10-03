import { Icon } from './Icon'
import type { IconName } from './Icon'

type Part = { name: string; icon: IconName; state: 'done' | 'current' | 'next' }

type Props = {
  parts: Part[]
  nextLabel: string | null
  onBack: () => void
  onNext: () => void
  disabled: boolean
}

/** Bottom bar: the parts of the song so far, plus Back and Next. Always in the same place. */
export function Dock({ parts, nextLabel, onBack, onNext, disabled }: Props) {
  return (
    <div className="dock">
      <div className="dock-in">
        <div className="dock-song">
          <span className="dock-label">Your song</span>
          <div className="dock-parts">
            {parts.map((p) => (
              <span key={p.name} className={`dock-part ${p.state}`} title={p.name}>
                <Icon name={p.icon} size={26} />
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="dock-nav">
          <button className="btn white lg" onClick={onBack} disabled={disabled}>
            Back
          </button>
          {nextLabel && (
            <button className="btn white lg" onClick={onNext} disabled={disabled}>
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
