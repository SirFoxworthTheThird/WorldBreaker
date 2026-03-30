import { describe, it, expect } from 'vitest'
import { generateId } from '@/lib/id'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 200 }, generateId))
    expect(ids.size).toBe(200)
  })

  it('contains only URL-safe characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateId()).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })
})
