import { describe, expect, it } from 'vitest'
import { syllables } from './lyrics'

describe('syllables', () => {
  it('counts common words about right', () => {
    expect(syllables('I miss you')).toBe(3)
    expect(syllables('walking home alone tonight')).toBe(7)
    expect(syllables('')).toBe(0)
  })
})
