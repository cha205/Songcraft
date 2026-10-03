// Every icon in the app comes from one generated sheet (tools/gen_assets.py), so they all share one style.
export type IconName =
  | 'kick' | 'snare' | 'hihat' | 'mic' | 'headphones' | 'keys'
  | 'note' | 'notes' | 'metronome' | 'vinyl' | 'cassette' | 'speaker'
  | 'play' | 'stop' | 'record' | 'notebook' | 'wave' | 'guitar'
  | 'sad' | 'chill' | 'happy' | 'hype' | 'star' | 'sparkle'
  | 'trophy' | 'heart' | 'bulb' | 'wand' | 'download' | 'clef'

export function Icon({ name, size = 28, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <img className={`icon ${className}`} src={`/assets/icons/${name}.webp`} width={size} height={size} alt="" draggable={false} />
}
