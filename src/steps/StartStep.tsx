import { useState } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import type { Blueprint } from '../ai'
import { LENGTHS } from '../data/sections'
import type { SongLength } from '../data/sections'
import { FEELING_INFO, GENRES, genreById } from '../data/genres'
import type { Feeling, GenreId } from '../data/genres'

type Props = {
  genre: GenreId | null
  feeling: Feeling
  length: SongLength
  onGenre: (g: GenreId) => void
  onFeeling: (f: Feeling) => void
  onLength: (l: SongLength) => void
  onStart: () => void
  onDescribe: (text: string) => Promise<void>
  aiBusy: boolean
  aiError: string
  plans: Blueprint[] | null
  planModel: string
  planPick: number
  onPickPlan: (i: number) => void
}

const VOICE: { from: IconName; to: IconName; you: string; we: string; color: string }[] = [
  { from: 'drumkit', to: 'learn', you: 'You build a beat', we: 'Learn what each drum does, then make it yours', color: 'orange' },
  { from: 'mic', to: 'flute', you: 'You hum a tune', we: 'It plays on piano, flute or guitar', color: 'pink' },
  { from: 'starmic', to: 'vinyl', you: 'You sing your lyrics', we: 'Your voice goes on the song, auto-tuned', color: 'green' },
  { from: 'chat', to: 'headphones', you: 'You say "make it sadder"', we: 'Gemini changes the song and tells you why', color: 'violet' },
]

const JOURNEY: { icon: IconName; name: string; text: string }[] = [
  { icon: 'sparkle', name: 'Style', text: 'Pick a genre and a feeling' },
  { icon: 'drumkit', name: 'Drums', text: 'Build a beat, drum by drum' },
  { icon: 'keys', name: 'Chords', text: 'Choose the harmony and bass' },
  { icon: 'mic', name: 'Melody', text: 'Hum your own tune' },
  { icon: 'notebook', name: 'Lyrics', text: 'Write words, with Gemini' },
  { icon: 'timeline', name: 'Arrange', text: 'Join verse and chorus into a song' },
  { icon: 'vinyl', name: 'Song', text: 'Play it and download it' },
]

const EXAMPLES = ['a sad rap song about missing home', 'a happy summer song for a road trip', 'a calm lo-fi beat for studying', 'an epic dance track for a big game']

const scrollToStyle = () => document.getElementById('style')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function StartStep(p: Props) {
  const [text, setText] = useState('')
  const g = p.genre ? genreById(p.genre) : null
  return (
    <section className="landing">
      <div className="intro card">
        <div className="intro-copy">
          <h1 className="intro-title">Make a real song with your voice</h1>
          <p className="intro-text">
            You don't need instruments or any experience. Songcraft teaches you how songs are built, one layer at a time, and turns your
            humming and beatboxing into real instruments.
          </p>
          <button className="btn yellow xl" onClick={scrollToStyle}>
            Start my song
          </button>
        </div>
        <div className="intro-art" style={{ backgroundImage: 'url(/assets/scenes/hero.webp)' }} />
      </div>

      <h2 className="band-title">Your voice is the instrument</h2>
      <div className="voice">
        {VOICE.map((v) => (
          <div key={v.you} className={`voice-card c-${v.color}`}>
            <div className="voice-flow">
              <span className="voice-tile">
                <Icon name={v.from} size={52} />
              </span>
              <span className="flow-arrow" aria-hidden />
              <span className="voice-tile out">
                <Icon name={v.to} size={52} />
              </span>
            </div>
            <b>{v.you}</b>
            <span>{v.we}</span>
          </div>
        ))}
      </div>

      <h2 className="band-title">How you'll make it</h2>
      <div className="card journey">
        {JOURNEY.map((j, i) => (
          <div key={j.name} className="journey-stop">
            <span className="journey-node">
              <Icon name={j.icon} size={44} />
              <span className="journey-num">{i + 1}</span>
            </span>
            <b>{j.name}</b>
            <span>{j.text}</span>
          </div>
        ))}
      </div>

      <h2 id="style" className="band-title">What do you want to make?</h2>
      <div className="card describe">
        <div className="describe-head">
          <span className="describe-icon">
            <Icon name="chat" size={44} />
          </span>
          <div>
            <b>Describe your song</b>
            <span>Gemini picks the genre, tempo, drums, chords and instruments, and explains why.</span>
          </div>
        </div>
        <form
          className="describe-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim() && !p.aiBusy) p.onDescribe(text.trim())
          }}
        >
          <input className="input" value={text} maxLength={200} placeholder="For example: a sad rap song about missing home" onChange={(e) => setText(e.target.value)} aria-label="Describe your song" />
          <button className="btn violet lg" type="submit" disabled={!text.trim() || p.aiBusy}>
            <Icon name="wand" size={26} /> {p.aiBusy ? 'Planning' : 'Plan my song'}
          </button>
        </form>
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="example" onClick={() => setText(ex)} disabled={p.aiBusy}>
              {ex}
            </button>
          ))}
        </div>
        {p.aiBusy && (
          <div className="ai-wait">
            <span className="ai-dots">
              <i />
              <i />
              <i />
            </span>
            Gemini is writing three different plans for your song. This takes about 20 seconds.
          </div>
        )}
        {p.aiError && <p className="notice">{p.aiError}</p>}
        {p.plans && !p.aiBusy && (
          <>
            <p className="plans-head">Pick the plan you like. You can change anything later.</p>
            <div className="plans">
              {p.plans.map((pl, i) => {
                const pg = genreById(pl.genre)
                return (
                  <button key={i} className={`plan-card${p.planPick === i ? ' on' : ''}`} onClick={() => p.onPickPlan(i)}>
                    <div className="plan-art" style={{ backgroundImage: `url(/assets/scenes/genre_${pl.genre}.webp)` }}>
                      <span className="plan-num">Plan {i + 1}</span>
                    </div>
                    <div className="plan-body">
                      <span className="plan-tags">
                        <Icon name={pg.icon} size={26} /> {FEELING_INFO[pl.feeling].name} {pg.name} · {pl.bpm} BPM
                      </span>
                      <b>{pl.summary}</b>
                      <small>Working title: {pl.title}</small>
                    </div>
                  </button>
                )
              })}
            </div>
            {p.planPick >= 0 && p.plans[p.planPick] && (
              <div className="plan">
                <div className="plan-title">
                  <Icon name="sparkle" size={30} />
                  <span>
                    <small>Why Gemini chose this</small>
                    <b>Plan {p.planPick + 1}</b>
                  </span>
                </div>
                <ul className="plan-reasons">
                  {p.plans[p.planPick].reasons.map((r) => (
                    <li key={r.part}>
                      <span className="pill">{r.part}</span> {r.why}
                    </li>
                  ))}
                </ul>
                <div className="plan-foot">
                  <span className="fine">Planned by {p.planModel}. Choose the length below, or start now.</span>
                  <button className="btn yellow lg" onClick={p.onStart}>
                    Start with plan {p.planPick + 1}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="or">Or pick it yourself</p>
      <div className="genres">
        {GENRES.map((x, i) => (
          <button key={x.id} className={`genre-card${p.genre === x.id ? ' on' : ''}`} style={{ animationDelay: `${i * 50}ms` }} onClick={() => p.onGenre(x.id)}>
            <div className="genre-art" style={{ backgroundImage: `url(/assets/scenes/genre_${x.id}.webp)` }}>
              {p.genre === x.id && (
                <span className="genre-check">
                  <Icon name="check" size={34} />
                </span>
              )}
            </div>
            <div className="genre-body">
              <span className="genre-icon">
                <Icon name={x.icon} size={40} />
              </span>
              <b>{x.name}</b>
              <span>{x.tagline}</span>
            </div>
          </button>
        ))}
      </div>

      <div className={`card feel-card${g ? '' : ' muted'}`}>
        <div className="feel-copy">
          <b>How should it feel?</b>
          <span>The same style can sound happy or sad. The feeling picks the chords and changes the beat.</span>
        </div>
        <div className="feel-switch">
          {(['bright', 'dark'] as Feeling[]).map((f) => (
            <button key={f} className={`feel f-${f}${p.feeling === f ? ' on' : ''}`} onClick={() => p.onFeeling(f)}>
              <Icon name={FEELING_INFO[f].icon} size={46} />
              <span>
                <b>{FEELING_INFO[f].name}</b>
                <small>{FEELING_INFO[f].text}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="feel-copy">
          <b>How long?</b>
          <span>Make one short part, or a verse and a chorus joined into a full song.</span>
        </div>
        <div className="length-switch">
          {LENGTHS.map((l) => (
            <button key={l.id} className={`length${p.length === l.id ? ' on' : ''}`} onClick={() => p.onLength(l.id)}>
              <Icon name={l.id === 'full' ? 'timeline' : l.id === 'chorus' ? 'star' : 'loop'} size={40} />
              <span>
                <b>{l.name}</b>
                <small>{l.detail}</small>
              </span>
            </button>
          ))}
        </div>
        <button className="btn yellow xl start-btn" disabled={!g} onClick={p.onStart}>
          {g ? `Make a ${FEELING_INFO[p.feeling].name.toLowerCase()} ${g.name} song` : 'Pick a style above'}
        </button>
      </div>
    </section>
  )
}
