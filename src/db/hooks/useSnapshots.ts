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

/** Returns snapshots for the active chapter only. When no chapter is selected, returns the most recent snapshot per character. */
export function useBestSnapshots(worldId: string | null, activeChapterId: string | null): CharacterSnapshot[] {
  const all = useWorldSnapshots(worldId)
  if (!all.length) return []

  if (activeChapterId) {
    // Only return snapshots that explicitly belong to this chapter.
    // A snapshot from a different chapter must never bleed into this one.
    return all.filter((s) => s.chapterId === activeChapterId)
  }

  // No chapter selected: show the most recently updated snapshot per character.
  const byChar = new Map<string, CharacterSnapshot>()
  for (const snap of all) {
    const current = byChar.get(snap.characterId)
    if (!current || snap.updatedAt > current.updatedAt) {
      byChar.set(snap.characterId, snap)
    }
  }
  return Array.from(byChar.values())
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
