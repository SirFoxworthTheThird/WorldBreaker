import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { RelationshipSnapshot } from '@/types'
import { generateId } from '@/lib/id'
import { useWorldChapters } from './useTimeline'

export function useRelationshipSnapshot(relationshipId: string | null, chapterId: string | null) {
  return useLiveQuery(
    () =>
      relationshipId && chapterId
        ? db.relationshipSnapshots
            .where('[relationshipId+chapterId]')
            .equals([relationshipId, chapterId])
            .first()
        : undefined,
    [relationshipId, chapterId]
  )
}

export function useChapterRelationshipSnapshots(chapterId: string | null) {
  return useLiveQuery(
    () =>
      chapterId
        ? db.relationshipSnapshots.where('chapterId').equals(chapterId).toArray()
        : [],
    [chapterId],
    []
  )
}

export function useWorldRelationshipSnapshots(worldId: string | null) {
  return useLiveQuery(
    () =>
      worldId
        ? db.relationshipSnapshots.where('worldId').equals(worldId).toArray()
        : [],
    [worldId],
    []
  )
}

type ChapterStub = { id: string; number: number }

/** Pure selection logic — exported for testing. */
export function selectBestSnapshots(
  all: RelationshipSnapshot[],
  activeChapterId: string | null,
  allChapters: ChapterStub[]
): RelationshipSnapshot[] {
  if (!all.length) return all

  if (!activeChapterId) {
    // No chapter active — most recently updated snapshot per relationship
    const byRel = new Map<string, RelationshipSnapshot>()
    for (const snap of all) {
      const current = byRel.get(snap.relationshipId)
      if (!current || snap.updatedAt > current.updatedAt) {
        byRel.set(snap.relationshipId, snap)
      }
    }
    return Array.from(byRel.values())
  }

  const activeChapter = allChapters.find((c) => c.id === activeChapterId)
  if (!activeChapter) {
    // Chapters not loaded yet — exact match only
    return all.filter((s) => s.chapterId === activeChapterId)
  }

  const chapterNumberById = new Map(allChapters.map((c) => [c.id, c.number]))

  // For each relationship, pick the snapshot from the highest chapter number
  // that is still ≤ the active chapter (the most recent known state).
  const byRel = new Map<string, RelationshipSnapshot>()
  for (const snap of all) {
    const snapChapterNum = chapterNumberById.get(snap.chapterId)
    if (snapChapterNum === undefined || snapChapterNum > activeChapter.number) continue

    const current = byRel.get(snap.relationshipId)
    if (!current) {
      byRel.set(snap.relationshipId, snap)
      continue
    }

    const currentChapterNum = chapterNumberById.get(current.chapterId) ?? -Infinity
    // Exact match for current chapter always wins; otherwise pick highest chapter number
    if (snap.chapterId === activeChapterId) {
      byRel.set(snap.relationshipId, snap)
    } else if (current.chapterId !== activeChapterId && snapChapterNum > currentChapterNum) {
      byRel.set(snap.relationshipId, snap)
    }
  }

  return Array.from(byRel.values())
}

/** Returns the best snapshot per relationship for the active chapter.
 *  When a chapter is active: uses that chapter's snapshot if it exists, otherwise
 *  inherits the most recent snapshot from any earlier chapter (by chapter number).
 *  When no chapter is active: returns the most recently updated snapshot per relationship.
 *  Memoized to keep array reference stable and avoid infinite effect loops. */
export function useBestRelationshipSnapshots(
  worldId: string | null,
  activeChapterId: string | null
): RelationshipSnapshot[] {
  const all = useWorldRelationshipSnapshots(worldId)
  const allChapters = useWorldChapters(worldId)
  return useMemo(() => selectBestSnapshots(all, activeChapterId, allChapters), [all, activeChapterId, allChapters])
}

export async function upsertRelationshipSnapshot(
  data: Omit<RelationshipSnapshot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RelationshipSnapshot> {
  const existing = await db.relationshipSnapshots
    .where('[relationshipId+chapterId]')
    .equals([data.relationshipId, data.chapterId])
    .first()

  const now = Date.now()
  if (existing) {
    const updated = { ...existing, ...data, updatedAt: now }
    await db.relationshipSnapshots.put(updated)
    return updated
  } else {
    const snapshot: RelationshipSnapshot = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    await db.relationshipSnapshots.add(snapshot)
    return snapshot
  }
}

export async function deleteRelationshipSnapshot(id: string) {
  await db.relationshipSnapshots.delete(id)
}

export async function deleteRelationshipSnapshotsForRelationship(relationshipId: string) {
  await db.relationshipSnapshots.where('relationshipId').equals(relationshipId).delete()
}
