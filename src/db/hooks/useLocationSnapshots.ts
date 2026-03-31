import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { LocationSnapshot } from '@/types'
import { generateId } from '@/lib/id'

export function useLocationSnapshot(locationMarkerId: string | null, chapterId: string | null) {
  return useLiveQuery(
    () =>
      locationMarkerId && chapterId
        ? db.locationSnapshots
            .where('[locationMarkerId+chapterId]')
            .equals([locationMarkerId, chapterId])
            .first()
        : undefined,
    [locationMarkerId, chapterId]
  )
}

export function useChapterLocationSnapshots(chapterId: string | null) {
  return useLiveQuery(
    () =>
      chapterId
        ? db.locationSnapshots.where('chapterId').equals(chapterId).toArray()
        : [],
    [chapterId],
    []
  )
}

export function useMarkerSnapshots(locationMarkerId: string | null) {
  return useLiveQuery(
    () =>
      locationMarkerId
        ? db.locationSnapshots.where('locationMarkerId').equals(locationMarkerId).toArray()
        : [],
    [locationMarkerId],
    []
  )
}

export async function upsertLocationSnapshot(
  data: Omit<LocationSnapshot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LocationSnapshot> {
  const existing = await db.locationSnapshots
    .where('[locationMarkerId+chapterId]')
    .equals([data.locationMarkerId, data.chapterId])
    .first()
  const now = Date.now()
  if (existing) {
    const updated = { ...existing, ...data, updatedAt: now }
    await db.locationSnapshots.put(updated)
    return updated
  } else {
    const snap: LocationSnapshot = { id: generateId(), ...data, createdAt: now, updatedAt: now }
    await db.locationSnapshots.add(snap)
    return snap
  }
}
