import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/db/database'
import { appendWaypoint, clearMovement, removeLastWaypoint } from '@/db/hooks/useMovements'

const W  = 'world-1'
const C  = 'char-1'
const CH = 'ch-1'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

async function getWaypoints() {
  const m = await db.characterMovements
    .where('[characterId+chapterId]')
    .equals([C, CH])
    .first()
  return m?.waypoints ?? null
}

// ── appendWaypoint ────────────────────────────────────────────────────────────

describe('appendWaypoint', () => {
  it('creates a new movement record on first call', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    expect(await getWaypoints()).toEqual(['loc-1'])
  })

  it('appends subsequent waypoints to the existing movement', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await appendWaypoint(W, C, CH, 'loc-2')
    await appendWaypoint(W, C, CH, 'loc-3')
    expect(await getWaypoints()).toEqual(['loc-1', 'loc-2', 'loc-3'])
  })

  it('ignores a duplicate of the last waypoint', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await appendWaypoint(W, C, CH, 'loc-1')
    expect(await getWaypoints()).toEqual(['loc-1'])
  })

  it('allows the same marker if it is not the immediate last', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await appendWaypoint(W, C, CH, 'loc-2')
    await appendWaypoint(W, C, CH, 'loc-1')
    expect(await getWaypoints()).toEqual(['loc-1', 'loc-2', 'loc-1'])
  })

  it('keeps movements isolated by chapter', async () => {
    await appendWaypoint(W, C, 'ch-1', 'loc-A')
    await appendWaypoint(W, C, 'ch-2', 'loc-B')

    const ch1 = await db.characterMovements.where('[characterId+chapterId]').equals([C, 'ch-1']).first()
    const ch2 = await db.characterMovements.where('[characterId+chapterId]').equals([C, 'ch-2']).first()

    expect(ch1!.waypoints).toEqual(['loc-A'])
    expect(ch2!.waypoints).toEqual(['loc-B'])
  })

  it('stores worldId, characterId and chapterId correctly', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    const m = await db.characterMovements.where('[characterId+chapterId]').equals([C, CH]).first()
    expect(m!.worldId).toBe(W)
    expect(m!.characterId).toBe(C)
    expect(m!.chapterId).toBe(CH)
  })
})

// ── clearMovement ─────────────────────────────────────────────────────────────

describe('clearMovement', () => {
  it('removes the movement record', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await clearMovement(C, CH)
    expect(await getWaypoints()).toBeNull()
  })

  it('is a no-op when no movement exists', async () => {
    await expect(clearMovement(C, CH)).resolves.toBeUndefined()
  })

  it('only clears the targeted chapter movement', async () => {
    await appendWaypoint(W, C, 'ch-1', 'loc-A')
    await appendWaypoint(W, C, 'ch-2', 'loc-B')
    await clearMovement(C, 'ch-1')

    const ch1 = await db.characterMovements.where('[characterId+chapterId]').equals([C, 'ch-1']).first()
    const ch2 = await db.characterMovements.where('[characterId+chapterId]').equals([C, 'ch-2']).first()

    expect(ch1).toBeUndefined()
    expect(ch2!.waypoints).toEqual(['loc-B'])
  })
})

// ── removeLastWaypoint ────────────────────────────────────────────────────────

describe('removeLastWaypoint', () => {
  it('removes the last waypoint from a multi-waypoint movement', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await appendWaypoint(W, C, CH, 'loc-2')
    await appendWaypoint(W, C, CH, 'loc-3')
    await removeLastWaypoint(C, CH)
    expect(await getWaypoints()).toEqual(['loc-1', 'loc-2'])
  })

  it('deletes the movement record when only one waypoint remains', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await removeLastWaypoint(C, CH)
    expect(await getWaypoints()).toBeNull()
  })

  it('is a no-op when no movement exists', async () => {
    await expect(removeLastWaypoint(C, CH)).resolves.toBeUndefined()
    expect(await getWaypoints()).toBeNull()
  })

  it('can be called repeatedly to walk back the full path', async () => {
    await appendWaypoint(W, C, CH, 'loc-1')
    await appendWaypoint(W, C, CH, 'loc-2')
    await appendWaypoint(W, C, CH, 'loc-3')

    await removeLastWaypoint(C, CH)
    expect(await getWaypoints()).toEqual(['loc-1', 'loc-2'])

    await removeLastWaypoint(C, CH)
    expect(await getWaypoints()).toEqual(['loc-1'])

    await removeLastWaypoint(C, CH)
    expect(await getWaypoints()).toBeNull()
  })
})
