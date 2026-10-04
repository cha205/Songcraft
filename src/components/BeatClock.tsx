import type { DrumGrid } from '../audio/analysis'

type Props = { grid: DrumGrid; step: number; bpm: number; size?: number }

const RINGS: { drum: keyof DrumGrid; r: number; color: string; label: string }[] = [
  { drum: 'hat', r: 132, color: 'var(--hat)', label: 'Hi-hat' },
  { drum: 'snare', r: 100, color: 'var(--snare)', label: 'Snare' },
  { drum: 'kick', r: 68, color: 'var(--kick)', label: 'Kick' },
]

/**
 * One bar of the beat drawn as a clock: 16 steps around the circle, one ring per drum, beats 1 to 4 at the
 * quarter marks. A hand sweeps round while it plays and each drum pops as it hits.
 */
export function BeatClock({ grid, step, bpm, size = 340 }: Props) {
  const s = step >= 0 ? step % 16 : -1
  const pos = (i: number, r: number) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    return [170 + r * Math.cos(a), 170 + r * Math.sin(a)]
  }
  const [hx, hy] = pos(s >= 0 ? s : 0, 150)
  return (
    <svg className="beat-clock" viewBox="0 0 340 340" width={size} height={size} role="img" aria-label="Beat clock">
      <circle cx={170} cy={170} r={160} className="bc-face" />
      {RINGS.map((ring) => (
        <circle key={ring.drum} cx={170} cy={170} r={ring.r} className="bc-ring" />
      ))}
      {[0, 4, 8, 12].map((i, n) => {
        const [x, y] = pos(i, 156)
        return (
          <text key={i} x={x} y={y} className="bc-beat" textAnchor="middle" dominantBaseline="central">
            {n + 1}
          </text>
        )
      })}
      {s >= 0 && <line x1={170} y1={170} x2={hx} y2={hy} className="bc-hand" />}
      {RINGS.map((ring) =>
        Array.from({ length: 16 }, (_, i) => {
          const on = grid[ring.drum][i]
          const [x, y] = pos(i, ring.r)
          const hit = on && i === s
          return (
            <circle
              key={`${ring.drum}${i}`}
              cx={x}
              cy={y}
              r={on ? (hit ? 15 : 11) : i % 4 === 0 ? 5 : 3.5}
              fill={on ? ring.color : 'var(--clock-dot)'}
              className={hit ? 'bc-hit' : on ? 'bc-on' : ''}
            />
          )
        }),
      )}
      <circle cx={170} cy={170} r={40} className="bc-center" />
      <text x={170} y={164} className="bc-bpm" textAnchor="middle">
        {bpm}
      </text>
      <text x={170} y={186} className="bc-bpm-label" textAnchor="middle">
        BPM
      </text>
    </svg>
  )
}
