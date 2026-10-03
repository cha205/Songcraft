// Rough English syllable counter: good enough to say "this line fits the tune" or "too long".
function wordSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  const groups = w.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups ? groups.length : 1)
}

export const syllables = (line: string) => line.split(/\s+/).reduce((s, w) => s + wordSyllables(w), 0)
