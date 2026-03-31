import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { ItemSnapshot } from '@/types'
import { generateId } from '@/lib/id'

export function useItemSnapshot(itemId: string | null, chapterId: string | null) {
  return useLiveQuery(
    () =>
      itemId && chapterId
        ? db.itemSnapshots
            .where('[itemId+chapterId]')
            .equals([itemId, chapterId])
            .first()
        : undefined,
    [itemId, chapterId]
  )
}

export function useChapterItemSnapshots(chapterId: string | null) {
  return useLiveQuery(
    () =>
      chapterId
        ? db.itemSnapshots.where('chapterId').equals(chapterId).toArray()
        : [],
    [chapterId],
    []
  )
}

export async function upsertItemSnapshot(
  data: Omit<ItemSnapshot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ItemSnapshot> {
  const existing = await db.itemSnapshots
    .where('[itemId+chapterId]')
    .equals([data.itemId, data.chapterId])
    .first()
  const now = Date.now()
  if (existing) {
    const updated = { ...existing, ...data, updatedAt: now }
    await db.itemSnapshots.put(updated)
    return updated
  } else {
    const snap: ItemSnapshot = { id: generateId(), ...data, createdAt: now, updatedAt: now }
    await db.itemSnapshots.add(snap)
    return snap
  }
}
