import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { MapLayer } from '@/types'
import { generateId } from '@/lib/id'

export function useMapLayers(worldId: string | null) {
  return useLiveQuery(
    () => (worldId ? db.mapLayers.where('worldId').equals(worldId).toArray() : []),
    [worldId],
    []
  )
}

export function useMapLayer(id: string | null) {
  return useLiveQuery(() => (id ? db.mapLayers.get(id) : undefined), [id])
}

export function useRootMapLayers(worldId: string | null) {
  return useLiveQuery(
    () =>
      worldId
        ? db.mapLayers
            .where('worldId')
            .equals(worldId)
            .filter((m) => m.parentMapId === null)
            .toArray()
        : [],
    [worldId],
    []
  )
}

export function useChildMapLayers(parentMapId: string | null) {
  return useLiveQuery(
    () =>
      parentMapId
        ? db.mapLayers.where('parentMapId').equals(parentMapId).toArray()
        : [],
    [parentMapId],
    []
  )
}

export async function createMapLayer(
  data: Pick<MapLayer, 'worldId' | 'parentMapId' | 'name' | 'description' | 'imageId' | 'imageWidth' | 'imageHeight'>
): Promise<MapLayer> {
  const now = Date.now()
  const layer: MapLayer = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await db.mapLayers.add(layer)
  return layer
}

export async function updateMapLayer(id: string, data: Partial<Omit<MapLayer, 'id' | 'createdAt'>>) {
  await db.mapLayers.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteMapLayer(id: string) {
  await db.mapLayers.delete(id)
  await db.locationMarkers.where('mapLayerId').equals(id).delete()
}
