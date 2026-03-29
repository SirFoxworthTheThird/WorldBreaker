import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Item } from '@/types'
import { generateId } from '@/lib/id'

export function useItems(worldId: string | null) {
  return useLiveQuery(
    () => (worldId ? db.items.where('worldId').equals(worldId).sortBy('name') : []),
    [worldId],
    []
  )
}

export function useItem(id: string | null) {
  return useLiveQuery(() => (id ? db.items.get(id) : undefined), [id])
}

export async function createItem(data: Pick<Item, 'worldId' | 'name' | 'description' | 'iconType' | 'tags'>): Promise<Item> {
  const item: Item = {
    id: generateId(),
    ...data,
  }
  await db.items.add(item)
  return item
}

export async function updateItem(id: string, data: Partial<Omit<Item, 'id'>>) {
  await db.items.update(id, data)
}

export async function deleteItem(id: string) {
  await db.items.delete(id)
}
