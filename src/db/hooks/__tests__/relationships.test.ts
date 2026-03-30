import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/db/database'
import { createRelationship, updateRelationship, deleteRelationship } from '@/db/hooks/useRelationships'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

function makeRel(overrides = {}) {
  return {
    worldId: 'world-1',
    characterAId: 'char-a',
    characterBId: 'char-b',
    label: 'Allies',
    strength: 'strong' as const,
    sentiment: 'positive' as const,
    description: 'Old friends',
    isBidirectional: true,
    ...overrides,
  }
}

// ── createRelationship ────────────────────────────────────────────────────────

describe('createRelationship', () => {
  it('persists the relationship with id and timestamps', async () => {
    const rel = await createRelationship(makeRel())
    expect(rel.id).toBeTruthy()
    expect(rel.label).toBe('Allies')
    expect(rel.strength).toBe('strong')
    expect(rel.sentiment).toBe('positive')
    expect(rel.isBidirectional).toBe(true)
    expect(rel.createdAt).toBeGreaterThan(0)
    expect(rel.updatedAt).toBe(rel.createdAt)

    const stored = await db.relationships.get(rel.id)
    expect(stored).toBeDefined()
    expect(stored!.characterAId).toBe('char-a')
    expect(stored!.characterBId).toBe('char-b')
  })

  it('supports all strength and sentiment combinations', async () => {
    const rel = await createRelationship(makeRel({ strength: 'weak', sentiment: 'complex' }))
    expect(rel.strength).toBe('weak')
    expect(rel.sentiment).toBe('complex')
  })

  it('generates unique ids', async () => {
    const a = await createRelationship(makeRel())
    const b = await createRelationship(makeRel({ characterAId: 'char-c', characterBId: 'char-d' }))
    expect(a.id).not.toBe(b.id)
  })
})

// ── updateRelationship ────────────────────────────────────────────────────────

describe('updateRelationship', () => {
  it('updates specified fields and bumps updatedAt', async () => {
    const rel = await createRelationship(makeRel())
    await new Promise((r) => setTimeout(r, 5))

    await updateRelationship(rel.id, { label: 'Rivals', sentiment: 'negative', strength: 'moderate' })

    const stored = await db.relationships.get(rel.id)
    expect(stored!.label).toBe('Rivals')
    expect(stored!.sentiment).toBe('negative')
    expect(stored!.strength).toBe('moderate')
    expect(stored!.updatedAt).toBeGreaterThan(rel.updatedAt)
  })

  it('can flip isBidirectional', async () => {
    const rel = await createRelationship(makeRel({ isBidirectional: true }))
    await updateRelationship(rel.id, { isBidirectional: false })
    const stored = await db.relationships.get(rel.id)
    expect(stored!.isBidirectional).toBe(false)
  })
})

// ── deleteRelationship ────────────────────────────────────────────────────────

describe('deleteRelationship', () => {
  it('removes the relationship', async () => {
    const rel = await createRelationship(makeRel())
    await deleteRelationship(rel.id)
    expect(await db.relationships.get(rel.id)).toBeUndefined()
  })

  it('is a no-op for a non-existent id', async () => {
    await expect(deleteRelationship('ghost')).resolves.toBeUndefined()
  })

  it('only removes the targeted relationship', async () => {
    const a = await createRelationship(makeRel())
    const b = await createRelationship(makeRel({ characterAId: 'c', characterBId: 'd' }))
    await deleteRelationship(a.id)
    expect(await db.relationships.get(b.id)).toBeDefined()
  })
})
