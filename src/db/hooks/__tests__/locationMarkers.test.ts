import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/db/database'
import { createLocationMarker, updateLocationMarker, deleteLocationMarker } from '@/db/hooks/useLocationMarkers'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

function makeMarkerData(overrides = {}) {
  return {
    worldId: 'world-1',
    mapLayerId: 'layer-1',
    name: 'Ironforge',
    description: 'A dwarven city',
    x: 100,
    y: 200,
    iconType: 'city' as const,
    ...overrides,
  }
}

// ── createLocationMarker ──────────────────────────────────────────────────────

describe('createLocationMarker', () => {
  it('persists the marker with id and timestamps', async () => {
    const marker = await createLocationMarker(makeMarkerData())
    expect(marker.id).toBeTruthy()
    expect(marker.name).toBe('Ironforge')
    expect(marker.x).toBe(100)
    expect(marker.y).toBe(200)
    expect(marker.iconType).toBe('city')
    expect(marker.linkedMapLayerId).toBeNull()
    expect(marker.tags).toEqual([])
    expect(marker.createdAt).toBeGreaterThan(0)
    expect(marker.updatedAt).toBe(marker.createdAt)

    const stored = await db.locationMarkers.get(marker.id)
    expect(stored).toBeDefined()
    expect(stored!.worldId).toBe('world-1')
  })

  it('stores a linkedMapLayerId when provided', async () => {
    const marker = await createLocationMarker(makeMarkerData({ linkedMapLayerId: 'sublayer-1' }))
    expect(marker.linkedMapLayerId).toBe('sublayer-1')
  })

  it('defaults linkedMapLayerId to null when not provided', async () => {
    const marker = await createLocationMarker(makeMarkerData())
    expect(marker.linkedMapLayerId).toBeNull()
  })

  it('stores tags when provided', async () => {
    const marker = await createLocationMarker(makeMarkerData({ tags: ['capital', 'safe'] }))
    expect(marker.tags).toEqual(['capital', 'safe'])
  })

  it('generates unique ids', async () => {
    const a = await createLocationMarker(makeMarkerData())
    const b = await createLocationMarker(makeMarkerData({ name: 'Stonehaven' }))
    expect(a.id).not.toBe(b.id)
  })
})

// ── updateLocationMarker ──────────────────────────────────────────────────────

describe('updateLocationMarker', () => {
  it('updates the specified fields and bumps updatedAt', async () => {
    const marker = await createLocationMarker(makeMarkerData())
    await new Promise((r) => setTimeout(r, 5))

    await updateLocationMarker(marker.id, { name: 'Deepforge', x: 150, y: 250 })

    const stored = await db.locationMarkers.get(marker.id)
    expect(stored!.name).toBe('Deepforge')
    expect(stored!.x).toBe(150)
    expect(stored!.y).toBe(250)
    expect(stored!.updatedAt).toBeGreaterThan(marker.updatedAt)
  })

  it('can link a sub-map layer', async () => {
    const marker = await createLocationMarker(makeMarkerData())
    await updateLocationMarker(marker.id, { linkedMapLayerId: 'sub-1' })
    const stored = await db.locationMarkers.get(marker.id)
    expect(stored!.linkedMapLayerId).toBe('sub-1')
  })
})

// ── deleteLocationMarker ──────────────────────────────────────────────────────

describe('deleteLocationMarker', () => {
  it('removes the marker from the database', async () => {
    const marker = await createLocationMarker(makeMarkerData())
    await deleteLocationMarker(marker.id)
    expect(await db.locationMarkers.get(marker.id)).toBeUndefined()
  })

  it('is a no-op for a non-existent id', async () => {
    await expect(deleteLocationMarker('ghost')).resolves.toBeUndefined()
  })

  it('only deletes the targeted marker', async () => {
    const a = await createLocationMarker(makeMarkerData({ name: 'A' }))
    const b = await createLocationMarker(makeMarkerData({ name: 'B' }))
    await deleteLocationMarker(a.id)
    expect(await db.locationMarkers.get(b.id)).toBeDefined()
  })
})
