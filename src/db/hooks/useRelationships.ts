import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Relationship, RelationshipStrength, RelationshipSentiment } from '@/types'
import { generateId } from '@/lib/id'

export function useRelationships(worldId: string | null) {
  return useLiveQuery(
    () => (worldId ? db.relationships.where('worldId').equals(worldId).toArray() : []),
    [worldId],
    []
  )
}

export function useCharacterRelationships(characterId: string | null) {
  return useLiveQuery(
    () =>
      characterId
        ? db.relationships
            .filter((r) => r.characterAId === characterId || r.characterBId === characterId)
            .toArray()
        : [],
    [characterId],
    []
  )
}

export async function createRelationship(data: {
  worldId: string
  characterAId: string
  characterBId: string
  label: string
  strength: RelationshipStrength
  sentiment: RelationshipSentiment
  description: string
  isBidirectional: boolean
}): Promise<Relationship> {
  const now = Date.now()
  const rel: Relationship = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await db.relationships.add(rel)
  return rel
}

export async function updateRelationship(id: string, data: Partial<Omit<Relationship, 'id' | 'createdAt'>>) {
  await db.relationships.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteRelationship(id: string) {
  await db.relationships.delete(id)
}
