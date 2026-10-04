// Every icon in the app comes from two generated sheets in one style (tools/gen_assets.py), never emoji.
export type IconName =
  | 'kick' | 'snare' | 'hihat' | 'mic' | 'headphones' | 'keys'
  | 'note' | 'notes' | 'metronome' | 'vinyl' | 'cassette' | 'speaker'
  | 'play' | 'stop' | 'record' | 'notebook' | 'wave' | 'guitar'
  | 'sad' | 'chill' | 'happy' | 'hype' | 'star' | 'sparkle'
  | 'speaker2' | 'leaf' | 'sunnote' | 'note2' | 'play2' | 'sparkle2'
  | 'trophy' | 'heart' | 'bulb' | 'wand' | 'download' | 'clef'
  | 'boombox' | 'discoball' | 'rose' | 'campfire' | 'maracas' | 'starmic'
  | 'eguitar' | 'bassguitar' | 'violin' | 'cello' | 'flute' | 'trumpet'
  | 'sax' | 'synth' | 'drummachine' | 'subwoofer' | 'clap' | 'crash'
  | 'tambourine' | 'bongos' | 'harp' | 'xylophone' | 'turntable' | 'mixer'
  | 'knob' | 'drumkit' | 'loop' | 'timeline' | 'swing' | 'plus'
  | 'bright' | 'dark' | 'layers' | 'learn' | 'chat' | 'check'

export function Icon({ name, size = 28, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <img className={`icon ${className}`} src={`/assets/icons/${name}.webp`} width={size} height={size} alt="" draggable={false} />
}
