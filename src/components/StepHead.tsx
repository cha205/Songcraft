import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/** Big white step title with an icon badge. */
export function StepHead({ n, icon, title, children }: { n: number; icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="step-head">
      <div className="step-badge">
        <Icon name={icon} size={54} />
        <span>{n}</span>
      </div>
      <div>
        <h2 className="step-title">{title}</h2>
        <p className="step-lead">{children}</p>
      </div>
    </div>
  )
}
