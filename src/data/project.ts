// Autosave: the song in progress is kept in this browser, so a refresh or a trip to the home page never loses it.
// Recorded vocals are not saved (they are too big for browser storage).
import type { DrumGrid, Note } from '../audio/analysis'
import type { Lesson } from '../steps/DrumsStep'
import { GENRES } from './genres'
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './genres'
import type { PartId, Section, SongLength } from './sections'

export type SavedPart = { lesson: Lesson; custom: DrumGrid | null; chords: string[]; myNotes: Note[] | null; tuneChoice: 'example' | 'mine'; lyrics: string[] }
export type Project = {
  v: 1
  savedAt: number
  stepIdx: number
  genreId: GenreId
  feeling: Feeling
  length: SongLength
  bpm: number
  swing: number
  kit: KitId
  parts: Record<PartId, SavedPart>
  editing: PartId
  chorusStarted: boolean
  fill: boolean
  chordInst: ChordInstId[]
  bass: BassId
  lead: LeadId
  extras: ExtraId[]
  customSections: Section[] | null
  topic: string
  songTitle: string
}

const KEY = 'songcraft:project'

export function loadProject(): Project | null {
  try {
    if (location.hash.startsWith('#song=')) return null
    const p = JSON.parse(localStorage.getItem(KEY) || 'null') as Project | null
    if (!p || p.v !== 1 || !GENRES.some((g) => g.id === p.genreId) || !p.parts?.verse || !p.parts?.chorus) return null
    if (!Array.isArray(p.chordInst)) p.chordInst = [p.chordInst as unknown as ChordInstId]
    return p
  } catch {
    return null
  }
}

export function saveProject(p: Omit<Project, 'v' | 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, v: 1, savedAt: Date.now() }))
  } catch {
    // Storage is full or blocked (private window). The song still works, it just is not kept.
  }
}

export function clearProject() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
