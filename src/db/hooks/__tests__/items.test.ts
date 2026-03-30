import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/db/database'
import { createItem, updateItem, deleteItem } from '@/db/hooks/useItems'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

// ── createItem ────────────────────────────────────────────────────────────────

describe('createItem', () => {
  it('persists the item with correct defaults', async () => {
    const item = await createItem({
      worldId: 'world-1', name: 'Excalibur',
      description: 'A legendary sword', iconType: 'weapon', tags: [],
    })
    expect(item.id).toBeTruthy()
    expect(item.name).toBe('Excalibur')
    expect(item.description).toBe('A legendary sword')
    expect(item.iconType).toBe('weapon')
    expect(item.imageId).toBeNull()
    expect(item.worldId).toBe('world-1')

    const stored = await db.items.get(item.id)
    expect(stored).toBeDefined()
    expect(stored!.name).toBe('Excalibur')
  })

  it('generates unique ids per item', async () => {
    const a = await createItem({ worldId: 'w', name: 'A', description: '', iconType: '', tags: [] })
    const b = await createItem({ worldId: 'w', name: 'B', description: '', iconType: '', tags: [] })
    expect(a.id).not.toBe(b.id)
  })

  it('stores tags correctly', async () => {
    const item = await createItem({ worldId: 'w', name: 'Ring', description: '', iconType: 'artifact', tags: ['cursed', 'magic'] })
    const stored = await db.items.get(item.id)
    expect(stored!.tags).toEqual(['cursed', 'magic'])
  })
})

// ── updateItem ────────────────────────────────────────────────────────────────

describe('updateItem', () => {
  it('updates the specified fields', async () => {
    const item = await createItem({ worldId: 'w', name: 'Old Name', description: '', iconType: '', tags: [] })
    await updateItem(item.id, { name: 'New Name', description: 'Updated', iconType: 'key item' })

    const stored = await db.items.get(item.id)
    expect(stored!.name).toBe('New Name')
    expect(stored!.description).toBe('Updated')
    expect(stored!.iconType).toBe('key item')
  })

  it('can update imageId', async () => {
    const item = await createItem({ worldId: 'w', name: 'Shield', description: '', iconType: '', tags: [] })
    await updateItem(item.id, { imageId: 'blob-123' })
    const stored = await db.items.get(item.id)
    expect(stored!.imageId).toBe('blob-123')
  })
})

// ── deleteItem ────────────────────────────────────────────────────────────────

describe('deleteItem', () => {
  it('removes the item from the database', async () => {
    const item = await createItem({ worldId: 'w', name: 'Trash', description: '', iconType: '', tags: [] })
    await deleteItem(item.id)
    expect(await db.items.get(item.id)).toBeUndefined()
  })

  it('is a no-op for a non-existent id', async () => {
    await expect(deleteItem('ghost-id')).resolves.toBeUndefined()
  })

  it('only removes the targeted item', async () => {
    const a = await createItem({ worldId: 'w', name: 'A', description: '', iconType: '', tags: [] })
    const b = await createItem({ worldId: 'w', name: 'B', description: '', iconType: '', tags: [] })
    await deleteItem(a.id)
    expect(await db.items.get(b.id)).toBeDefined()
  })
})
