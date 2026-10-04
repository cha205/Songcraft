import type { PartId, SongLength } from '../data/sections'
import { Icon } from './Icon'

type Props = { style: string; length: SongLength; editing: PartId; onPick: (p: PartId) => void; chorusReady: boolean }

const TEXT: Record<PartId, string> = {
  verse: 'The verse tells the story. It is calmer, so the chorus can feel bigger.',
  chorus: 'The chorus is the catchy part people remember. It is usually higher, busier and repeated.',
}

/** Shows which core loop you are building. With a full song you build the verse first, then the chorus. */
export function PartBar({ style, length, editing, onPick, chorusReady }: Props) {
  if (length !== 'full') {
    return (
      <div className="part-bar single">
        <Icon name="loop" size={34} />
        <p>
          <b>You are making {length === 'verse' ? 'a verse' : 'a chorus'}.</b> {TEXT[length]}
        </p>
        <span className="part-style">{style}</span>
      </div>
    )
  }
  return (
    <div className="part-bar">
      <div className="part-pills" role="tablist" aria-label="Song part">
        {(['verse', 'chorus'] as PartId[]).map((p, i) => (
          <button key={p} role="tab" aria-selected={editing === p} className={`part-pill${editing === p ? ' on' : ''}`} disabled={p === 'chorus' && !chorusReady} onClick={() => onPick(p)}>
            <span className="part-num">{i + 1}</span>
            {p === 'verse' ? 'Verse' : 'Chorus'}
          </button>
        ))}
      </div>
      <p>{TEXT[editing]}</p>
      <span className="part-style">{style}</span>
    </div>
  )
}
