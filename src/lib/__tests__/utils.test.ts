import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz')
  })

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles object inputs', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('returns empty string for no valid inputs', () => {
    expect(cn(false, undefined, null)).toBe('')
  })

  it('handles mixed inputs', () => {
    expect(cn('base', { active: true }, ['extra'], false && 'gone')).toBe('base active extra')
  })
})
