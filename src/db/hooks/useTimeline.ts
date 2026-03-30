import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Timeline, Chapter, WorldEvent } from '@/types'
import { generateId } from '@/lib/id'

// ─── Timelines ─────────────────────────────────────────────────────────────

export function useTimelines(worldId: string | null) {
  return useLiveQuery(
    () => (worldId ? db.timelines.where('worldId').equals(worldId).toArray() : []),
    [worldId],
    []
  )
}

export function useTimeline(id: string | null) {
  return useLiveQuery(() => (id ? db.timelines.get(id) : undefined), [id])
}

export async function createTimeline(data: Pick<Timeline, 'worldId' | 'name' | 'description' | 'color'>): Promise<Timeline> {
  const timeline: Timeline = {
    id: generateId(),
    ...data,
    createdAt: Date.now(),
  }
  await db.timelines.add(timeline)
  return timeline
}

export async function updateTimeline(id: string, data: Partial<Omit<Timeline, 'id' | 'createdAt'>>) {
  await db.timelines.update(id, data)
}

export async function deleteTimeline(id: string) {
  await db.transaction('rw', [db.timelines, db.chapters, db.events], async () => {
    await db.timelines.delete(id)
    await db.chapters.where('timelineId').equals(id).delete()
    await db.events.where('timelineId').equals(id).delete()
  })
}

// ─── Chapters ──────────────────────────────────────────────────────────────

export function useChapters(timelineId: string | null) {
  return useLiveQuery(
    () =>
      timelineId
        ? db.chapters.where('timelineId').equals(timelineId).sortBy('number')
        : [],
    [timelineId],
    []
  )
}

export function useWorldChapters(worldId: string | null) {
  return useLiveQuery(
    () => (worldId ? db.chapters.where('worldId').equals(worldId).toArray() : []),
    [worldId],
    []
  )
}

export function useChapter(id: string | null) {
  return useLiveQuery(() => (id ? db.chapters.get(id) : undefined), [id])
}

export async function createChapter(data: Pick<Chapter, 'worldId' | 'timelineId' | 'number' | 'title' | 'synopsis'>): Promise<Chapter> {
  const now = Date.now()
  const chapter: Chapter = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await db.chapters.add(chapter)
  return chapter
}

export async function updateChapter(id: string, data: Partial<Omit<Chapter, 'id' | 'createdAt'>>) {
  await db.chapters.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteChapter(id: string) {
  await db.transaction('rw', [db.chapters, db.events, db.characterSnapshots], async () => {
    await db.chapters.delete(id)
    await db.events.where('chapterId').equals(id).delete()
    await db.characterSnapshots.where('chapterId').equals(id).delete()
  })
}

// ─── Events ────────────────────────────────────────────────────────────────

export function useEvents(chapterId: string | null) {
  return useLiveQuery(
    () =>
      chapterId
        ? db.events.where('chapterId').equals(chapterId).sortBy('sortOrder')
        : [],
    [chapterId],
    []
  )
}

export async function createEvent(data: Omit<WorldEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorldEvent> {
  const now = Date.now()
  const event: WorldEvent = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await db.events.add(event)
  return event
}

export async function updateEvent(id: string, data: Partial<Omit<WorldEvent, 'id' | 'createdAt'>>) {
  await db.events.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteEvent(id: string) {
  await db.events.delete(id)
}
