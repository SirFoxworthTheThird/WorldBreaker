import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { CharacterSnapshot } from '@/types'
import { generateId } from '@/lib/id'

export function useSnapshot(characterId: string | null, chapterId: string | null) {
  return useLiveQuery(
    () =>
      characterId && chapterId
        ? db.characterSnapshots
            .where('[characterId+chapterId]')
            .equals([characterId, chapterId])
            .first()
        : undefined,
    [characterId, chapterId]
  )
}

export function useCharacterSnapshots(characterId: string | null) {
  return useLiveQuery(
    () =>
      characterId
        ? db.characterSnapshots.where('characterId').equals(characterId).toArray()
        : [],
    [characterId],
    []
  )
}

export function useChapterSnapshots(chapterId: string | null) {
  return useLiveQuery(
    () =>
      chapterId
        ? db.characterSnapshots.where('chapterId').equals(chapterId).toArray()
        : [],
    [chapterId],
    []
  )
}

export function useWorldSnapshots(worldId: string | null) {
  return useLiveQuery(
    () =>
      worldId
        ? db.characterSnapshots.where('worldId').equals(worldId).toArray()
        : [],
    [worldId],
    []
  )
}

/** Returns the best snapshot per character: active chapter's if available, else most recent. */
export function useBestSnapshots(worldId: string | null, activeChapterId: string | null): CharacterSnapshot[] {
  const all = useWorldSnapshots(worldId)
  if (!all.length) return []

  // Group by characterId
  const byChar = new Map<string, CharacterSnapshot[]>()
  for (const snap of all) {
    const list = byChar.get(snap.characterId) ?? []
    list.push(snap)
    byChar.set(snap.characterId, list)
  }

  const result: CharacterSnapshot[] = []
  for (const snaps of byChar.values()) {
    // Prefer the active chapter's snapshot
    const chapterSnap = activeChapterId
      ? snaps.find((s) => s.chapterId === activeChapterId)
      : undefined
    if (chapterSnap) {
      result.push(chapterSnap)
    } else {
      // Fall back to most recently updated
      const latest = snaps.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
      result.push(latest)
    }
  }
  return result
}

export async function upsertSnapshot(
  data: Omit<CharacterSnapshot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CharacterSnapshot> {
  const existing = await db.characterSnapshots
    .where('[characterId+chapterId]')
    .equals([data.characterId, data.chapterId])
    .first()

  const now = Date.now()
  if (existing) {
    const updated = { ...existing, ...data, updatedAt: now }
    await db.characterSnapshots.put(updated)
    return updated
  } else {
    const snapshot: CharacterSnapshot = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    await db.characterSnapshots.add(snapshot)
    return snapshot
  }
}

export async function deleteSnapshot(id: string) {
  await db.characterSnapshots.delete(id)
}
