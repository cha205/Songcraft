// "Beats from songs you know": simplified versions of famous songs' basic drum grooves, grouped by style and rebuilt
// with Songcraft's own drums so beginners can study and try them. No audio, melody or lyrics from the songs is used.
// To remove the whole section, set SHOW_FAMOUS_BEATS to false. To change the list, edit FAMOUS_BEATS.
import { STEPS } from '../audio/analysis'
import type { DrumGrid } from '../audio/analysis'
import type { GenreId, KitId } from './genres'

export const SHOW_FAMOUS_BEATS = true

export type FamousBeat = {
  id: string
  song: string
  artist: string
  genre: GenreId
  bpm: number
  kit: KitId
  /** One bar of 16 steps; it repeats for the whole loop. */
  bar: { kick: number[]; snare: number[]; hat: number[] }
  /** What to notice, in one sentence a 10-year-old understands. */
  lesson: string
}

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14]
const OFFBEAT = [2, 6, 10, 14]
const SIXTEENTHS = Array.from({ length: 16 }, (_, i) => i)
const QUARTERS = [0, 4, 8, 12]
const TRAP = [0, 2, 4, 6, 8, 10, 12, 13, 14, 15]
const DEMBOW = [3, 6, 11, 14]

export const FAMOUS_BEATS: FamousBeat[] = [
  // Pop
  { id: 'billie-jean', song: 'Billie Jean', artist: 'Michael Jackson', genre: 'pop', bpm: 117, kit: 'linn', bar: { kick: [0, 8], snare: [4, 12], hat: EIGHTHS }, lesson: 'The classic pop beat: kick on 1 and 3, snare on 2 and 4, even hi-hats. Simple, so the bass and voice can shine.' },
  { id: 'bad-guy', song: 'bad guy', artist: 'Billie Eilish', genre: 'pop', bpm: 135, kit: 'kit8', bar: { kick: QUARTERS, snare: [4, 12], hat: [] }, lesson: 'Only a deep kick on every beat and a snap on 2 and 4. A beat can be tiny and still hit hard.' },
  { id: 'levitating', song: 'Levitating', artist: 'Dua Lipa', genre: 'pop', bpm: 103, kit: 'linn', bar: { kick: QUARTERS, snare: [4, 12], hat: OFFBEAT }, lesson: 'A disco beat: kick on every beat and a hi-hat in between. It makes you want to move.' },
  // Hip-hop
  { id: 'old-town-road', song: 'Old Town Road', artist: 'Lil Nas X', genre: 'hiphop', bpm: 136, kit: 'kit8', bar: { kick: [0, 6, 10], snare: [8], hat: TRAP }, lesson: 'A trap beat at half speed: one big clap on beat 3 and fast hi-hat rolls. It feels slow and fast at the same time.' },
  { id: 'lose-yourself', song: 'Lose Yourself', artist: 'Eminem', genre: 'hiphop', bpm: 86, kit: 'stark', bar: { kick: [0, 7, 10], snare: [4, 12], hat: EIGHTHS }, lesson: 'Hard, steady drums with a kick that sneaks in between beats, so the rap has something to push against.' },
  { id: 'gods-plan', song: "God's Plan", artist: 'Drake', genre: 'hiphop', bpm: 77, kit: 'kit8', bar: { kick: [0, 10], snare: [8], hat: TRAP }, lesson: 'Slow and spacious with rolling hi-hats. Lots of empty space leaves room for the voice.' },
  // Lo-fi
  { id: 'death-bed', song: 'death bed (coffee for your head)', artist: 'Powfu', genre: 'lofi', bpm: 72, kit: 'kit3', bar: { kick: [0, 10], snare: [4, 12], hat: EIGHTHS }, lesson: 'A lazy kick, a soft snare on 2 and 4, and swung hi-hats. Turn swing up to hear the lo-fi bounce.' },
  { id: 'get-you-the-moon', song: 'Get You The Moon', artist: 'Kina', genre: 'lofi', bpm: 76, kit: 'cr78', bar: { kick: [0, 7, 10], snare: [4, 12], hat: QUARTERS }, lesson: 'Very few hi-hats keep it calm and sleepy, so the piano and voice feel close.' },
  { id: 'aruarian-dance', song: 'Aruarian Dance', artist: 'Nujabes', genre: 'lofi', bpm: 90, kit: 'break9', bar: { kick: [0, 6, 10], snare: [4, 12], hat: EIGHTHS }, lesson: 'A jazzy hip-hop groove with a bouncing kick. The sound lo-fi grew out of.' },
  // R&B
  { id: 'redbone', song: 'Redbone', artist: 'Childish Gambino', genre: 'rnb', bpm: 81, kit: 'r8', bar: { kick: [0, 8, 11], snare: [4, 12], hat: EIGHTHS }, lesson: 'Slow and funky: a late kick near the end of the bar gives it a lazy strut.' },
  { id: 'leave-the-door-open', song: 'Leave the Door Open', artist: 'Silk Sonic', genre: 'rnb', bpm: 74, kit: 'acoustic', bar: { kick: [0, 7, 8], snare: [4, 12], hat: SIXTEENTHS }, lesson: 'Soft, busy hi-hats over a slow beat: smooth, old-school soul.' },
  { id: 'kiss-me-more', song: 'Kiss Me More', artist: 'Doja Cat ft. SZA', genre: 'rnb', bpm: 111, kit: 'linn', bar: { kick: QUARTERS, snare: [4, 12], hat: OFFBEAT }, lesson: 'R&B with a disco beat underneath: steady kicks and an off-beat hi-hat.' },
  // Dance
  { id: 'levels', song: 'Levels', artist: 'Avicii', genre: 'dance', bpm: 126, kit: 'techno', bar: { kick: QUARTERS, snare: [4, 12], hat: OFFBEAT }, lesson: 'Four on the floor: a kick on every beat and a hi-hat between. Nearly every dance hit uses it.' },
  { id: 'dont-start-now', song: "Don't Start Now", artist: 'Dua Lipa', genre: 'dance', bpm: 124, kit: 'fm', bar: { kick: QUARTERS, snare: [4, 12], hat: OFFBEAT }, lesson: 'The same club beat with a disco feel. Change the drum sounds and the same pattern feels new.' },
  { id: 'titanium', song: 'Titanium', artist: 'David Guetta ft. Sia', genre: 'dance', bpm: 126, kit: 'techno', bar: { kick: QUARTERS, snare: [4, 12], hat: SIXTEENTHS }, lesson: 'Fast hi-hats on top of four on the floor make the big moment feel even bigger.' },
  // Rock
  { id: 'rock-you', song: 'We Will Rock You', artist: 'Queen', genre: 'rock', bpm: 81, kit: 'acoustic', bar: { kick: [0, 2, 8, 10], snare: [4, 12], hat: [] }, lesson: 'Two stomps, one clap, then silence. The gaps are what make it feel huge.' },
  { id: 'back-in-black', song: 'Back in Black', artist: 'AC/DC', genre: 'rock', bpm: 94, kit: 'acoustic', bar: { kick: [0, 8, 10], snare: [4, 12], hat: EIGHTHS }, lesson: 'A straight rock beat with an extra kick after beat 3. Steady and heavy.' },
  { id: 'bites-dust', song: 'Another One Bites the Dust', artist: 'Queen', genre: 'rock', bpm: 110, kit: 'acoustic', bar: { kick: QUARTERS, snare: [4, 12], hat: [] }, lesson: 'A kick on every beat and the snare on 2 and 4. A marching groove that makes people stomp along.' },
  // Acoustic
  { id: 'riptide', song: 'Riptide', artist: 'Vance Joy', genre: 'acoustic', bpm: 102, kit: 'acoustic', bar: { kick: [0, 8], snare: [4, 12], hat: QUARTERS }, lesson: 'Light drums that stay out of the way of the strumming. Simple and sunny.' },
  { id: 'ho-hey', song: 'Ho Hey', artist: 'The Lumineers', genre: 'acoustic', bpm: 80, kit: 'acoustic', bar: { kick: QUARTERS, snare: [4, 12], hat: [] }, lesson: 'A big stomp on every beat and claps on 2 and 4, like a crowd around a campfire.' },
  { id: 'photograph', song: 'Photograph', artist: 'Ed Sheeran', genre: 'acoustic', bpm: 108, kit: 'acoustic', bar: { kick: [0, 8], snare: [4, 12], hat: [] }, lesson: 'Just a soft kick and snare with lots of space, so the voice and guitar carry the song.' },
  // Latin
  { id: 'despacito', song: 'Despacito', artist: 'Luis Fonsi and Daddy Yankee', genre: 'latin', bpm: 89, kit: 'kit8', bar: { kick: QUARTERS, snare: DEMBOW, hat: EIGHTHS }, lesson: 'The dembow: a kick on every beat while the snare skips just before and after it. That stutter makes reggaeton danceable.' },
  { id: 'gasolina', song: 'Gasolina', artist: 'Daddy Yankee', genre: 'latin', bpm: 96, kit: 'kit8', bar: { kick: QUARTERS, snare: DEMBOW, hat: SIXTEENTHS }, lesson: 'The same dembow, faster and with busy hi-hats. Pure energy.' },
  { id: 'mi-gente', song: 'Mi Gente', artist: 'J Balvin and Willy William', genre: 'latin', bpm: 105, kit: 'fm', bar: { kick: QUARTERS, snare: DEMBOW, hat: OFFBEAT }, lesson: 'Dembow with electronic sounds: change the drum kit and reggaeton turns into a club track.' },
]

/** The famous beat as a full loop for the drum grid. */
export function famousGrid(b: FamousBeat): DrumGrid {
  const row = (steps: number[]) => Array.from({ length: STEPS }, (_, i) => steps.includes(i % 16))
  return { kick: row(b.bar.kick), snare: row(b.bar.snare), hat: row(b.bar.hat) }
}
