import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export type ProducerMsg = {
  id: number
  from: 'you' | 'gemini'
  text: string
  changes?: string[]
  hint?: string
  undo?: 'ready' | 'done'
  error?: boolean
}

type Props = {
  open: boolean
  onOpen: (open: boolean) => void
  messages: ProducerMsg[]
  busy: 'thinking' | null
  onText: (text: string) => void
  onUndo: (id: number) => void
  suggestions: string[]
}

/** "Talk to Gemini": a producer you can speak to on every screen. It changes the song and explains why. */
export function Producer(p: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [p.messages, p.busy])


  const send = (t: string) => {
    if (!t.trim() || p.busy) return
    p.onText(t.trim())
    setText('')
  }

  if (!p.open) {
    return (
      <button className="producer-fab" onClick={() => p.onOpen(true)}>
        <span className="fab-icon">
          <Icon name="chat" size={34} />
        </span>
        <span>
          <b>Talk to Gemini</b>
          <small>Your producer</small>
        </span>
      </button>
    )
  }

  return (
    <aside className="producer card" aria-label="Talk to Gemini, your producer">
      <header className="producer-head">
        <span className="producer-avatar">
          <Icon name="headphones" size={34} />
        </span>
        <div>
          <b>Your producer</b>
          <small>Powered by Gemini</small>
        </div>
        <button className="producer-close" onClick={() => p.onOpen(false)}>
          Close
        </button>
      </header>

      <div className="producer-list" ref={listRef}>
        {p.messages.length === 0 && (
          <div className="producer-empty">
            <p>
              Tell me what to change, or ask me anything about music. I will change your song and tell you why.
            </p>
          </div>
        )}
        {p.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.from}${m.error ? ' error' : ''}`}>
            <p>{m.text}</p>
            {m.changes && m.changes.length > 0 && (
              <ul className={`changes${m.undo === 'done' ? ' undone' : ''}`}>
                {m.changes.map((c) => (
                  <li key={c}>
                    <Icon name="check" size={18} /> {c}
                  </li>
                ))}
              </ul>
            )}
            {m.hint && <small className="bubble-hint">{m.hint}</small>}
            {m.undo && (
              <button className="undo" onClick={() => p.onUndo(m.id)} disabled={m.undo === 'done' || !!p.busy}>
                {m.undo === 'done' ? 'Undone' : 'Undo'}
              </button>
            )}
          </div>
        ))}
        {p.busy === 'thinking' && (
          <div className="bubble gemini thinking" aria-live="polite">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>

      {!p.busy && (
        <div className="producer-chips">
          {p.suggestions.map((s) => (
            <button key={s} className="chip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="producer-input">
          <form
            className="producer-form"
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you want to change, or ask a question" maxLength={300} aria-label="Message to Gemini" disabled={!!p.busy} />
            <button className="btn violet send" disabled={!text.trim() || !!p.busy}>
              Send
            </button>
          </form>
      </div>
    </aside>
  )
}
