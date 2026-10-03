import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/** Step title block: an icon tile, a "Step 2 of 5" eyebrow, the title and one short paragraph. */
export function StepHead({ n, icon, title, children }: { n: number; icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="step-head">
      <div className="step-badge">
        <Icon name={icon} size={52} />
      </div>
      <div className="step-copy">
        <span className="eyebrow">Step {n + 1} of 6</span>
        <h1 className="step-title">{title}</h1>
        <p className="step-lead">{children}</p>
      </div>
    </div>
  )
}
