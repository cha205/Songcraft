import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/** Big white title on the coloured background, next to the step's icon tile. */
export function StepHead({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="step-head">
      <div className="step-badge">
        <Icon name={icon} size={58} />
      </div>
      <div>
        <h1 className="step-title">{title}</h1>
        {children && <p className="step-lead">{children}</p>}
      </div>
    </div>
  )
}
