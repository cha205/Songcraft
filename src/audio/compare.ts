// Compare the user's beatboxed grid with a template, the way a teacher would.
import { DRUMS } from './analysis'
import type { Drum, DrumGrid } from './analysis'

export type CellMark = 'hit' | 'near' | 'missed' | 'extra' | null
export type RowResult = { hit: number; near: number; missed: number; extra: number; total: number }
export type BeatCompare = { score: number; rows: Record<Drum, RowResult>; marks: Record<Drum, CellMark[]> }

export const SAY: Record<Drum, string> = { kick: 'BOOM', snare: 'PFF', hat: 'TSS' }

export function compareBeats(target: DrumGrid, mine: DrumGrid): BeatCompare {
  const rows = {} as Record<Drum, RowResult>
  const marks = {} as Record<Drum, CellMark[]>
  let credit = 0
  let denom = 0
  for (const d of DRUMS) {
    const t = target[d]
    const m = mine[d]
    const used = new Array(m.length).fill(false)
    const mk: CellMark[] = new Array(t.length).fill(null)
    const r: RowResult = { hit: 0, near: 0, missed: 0, extra: 0, total: 0 }
    for (let s = 0; s < t.length; s++) {
      if (!t[s]) continue
      r.total++
      if (m[s]) {
        r.hit++
        used[s] = true
        mk[s] = 'hit'
      } else if (s > 0 && m[s - 1] && !used[s - 1] && !t[s - 1]) {
        r.near++
        used[s - 1] = true
        mk[s] = 'near'
      } else if (s < t.length - 1 && m[s + 1] && !used[s + 1] && !t[s + 1]) {
        r.near++
        used[s + 1] = true
        mk[s] = 'near'
      } else {
        r.missed++
        mk[s] = 'missed'
      }
    }
    for (let s = 0; s < m.length; s++) {
      if (m[s] && !used[s]) {
        r.extra++
        if (!mk[s]) mk[s] = 'extra'
      }
    }
    credit += r.hit + 0.5 * r.near
    denom += r.total + r.extra
    rows[d] = r
    marks[d] = mk
  }
  return { score: denom ? Math.round((100 * credit) / denom) : 0, rows, marks }
}

/** Plain-language tips, most useful first. */
export function beatTips(c: BeatCompare): string[] {
  const tips: string[] = []
  for (const d of DRUMS) {
    const r = c.rows[d]
    if (r.total === 0 && r.extra > 0) tips.push(`This beat has no ${SAY[d]} at all. Try leaving it out.`)
    else if (r.total > 0 && r.hit + r.near === 0) tips.push(`No ${SAY[d]} was heard. Try a louder, sharper ${SAY[d]}.`)
    else if (r.missed > r.total / 2) tips.push(`You missed most of the ${SAY[d]}s. Look at where they sit and count along.`)
    else if (r.near > r.hit) tips.push(`Your ${SAY[d]}s are close but slightly off the beat. Lock in with the count.`)
    else if (r.extra > r.total / 2 && r.total > 0) tips.push(`A few extra ${SAY[d]}s crept in. Less is more.`)
  }
  if (c.score >= 85) tips.unshift('That is basically the real beat. Nice.')
  else if (c.score >= 60) tips.unshift('Close! The groove is there.')
  return tips.slice(0, 3)
}

const COUNT = ['', 'e', '&', 'a']
/** Steps in one bar written as counts: [0, 6, 8] -> "1, 2&, 3". */
export function countWords(steps: number[]): string {
  if (!steps.length) return 'none'
  return steps.map((s) => `${Math.floor(s / 4) + 1}${COUNT[s % 4]}`).join(', ')
}
