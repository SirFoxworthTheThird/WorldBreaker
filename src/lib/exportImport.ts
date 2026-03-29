import { db } from '@/db/database'
import type {
  World, MapLayer, LocationMarker, Character, Item,
  CharacterSnapshot, Relationship, Timeline, Chapter, WorldEvent,
} from '@/types'

const EXPORT_VERSION = 1

interface BlobExport {
  id: string
  worldId: string
  mimeType: string
  dataBase64: string
  createdAt: number
}

export interface WorldExportFile {
  version: typeof EXPORT_VERSION
  exportedAt: number
  world: World
  mapLayers: MapLayer[]
  locationMarkers: LocationMarker[]
  characters: Character[]
  items: Item[]
  characterSnapshots: CharacterSnapshot[]
  relationships: Relationship[]
  timelines: Timeline[]
  chapters: Chapter[]
  events: WorldEvent[]
  blobs: BlobExport[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64)
  const array = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i)
  }
  return new Blob([array], { type: mimeType })
}

export async function exportWorld(worldId: string): Promise<void> {
  const [
    world,
    mapLayers,
    locationMarkers,
    characters,
    items,
    characterSnapshots,
    relationships,
    timelines,
    chapters,
    events,
    rawBlobs,
  ] = await Promise.all([
    db.worlds.get(worldId),
    db.mapLayers.where('worldId').equals(worldId).toArray(),
    db.locationMarkers.where('worldId').equals(worldId).toArray(),
    db.characters.where('worldId').equals(worldId).toArray(),
    db.items.where('worldId').equals(worldId).toArray(),
    db.characterSnapshots.where('worldId').equals(worldId).toArray(),
    db.relationships.where('worldId').equals(worldId).toArray(),
    db.timelines.where('worldId').equals(worldId).toArray(),
    db.chapters.where('worldId').equals(worldId).toArray(),
    db.events.where('worldId').equals(worldId).toArray(),
    db.blobs.where('worldId').equals(worldId).toArray(),
  ])

  if (!world) throw new Error('World not found')

  const blobs: BlobExport[] = await Promise.all(
    rawBlobs.map(async (b) => ({
      id: b.id,
      worldId: b.worldId,
      mimeType: b.mimeType,
      dataBase64: await blobToBase64(b.data),
      createdAt: b.createdAt,
    }))
  )

  const exportData: WorldExportFile = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    world,
    mapLayers,
    locationMarkers,
    characters,
    items,
    characterSnapshots,
    relationships,
    timelines,
    chapters,
    events,
    blobs,
  }

  const json = JSON.stringify(exportData)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${world.name.replace(/[^a-z0-9]/gi, '_')}.wbk`
  a.click()
  URL.revokeObjectURL(url)
}

function validateImport(data: unknown): asserts data is WorldExportFile {
  if (typeof data !== 'object' || data === null) throw new Error('Invalid file: not an object')
  const d = data as Record<string, unknown>
  if (typeof d.version !== 'number') throw new Error('Invalid file: missing version')
  if (d.version !== EXPORT_VERSION) throw new Error(`Unsupported export version: ${d.version}`)
  if (typeof d.world !== 'object' || d.world === null) throw new Error('Invalid file: missing world')
  const world = d.world as Record<string, unknown>
  if (typeof world.id !== 'string' || typeof world.name !== 'string') throw new Error('Invalid file: world missing id or name')
  const arrayFields = ['mapLayers', 'locationMarkers', 'characters', 'items', 'characterSnapshots', 'relationships', 'timelines', 'chapters', 'events', 'blobs'] as const
  for (const field of arrayFields) {
    if (!Array.isArray(d[field])) throw new Error(`Invalid file: ${field} is not an array`)
  }
}

export async function importWorld(file: File): Promise<string> {
  const text = await file.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid file: could not parse JSON')
  }
  validateImport(data)

  await db.transaction('rw', [
    db.worlds, db.mapLayers, db.locationMarkers, db.characters,
    db.items, db.characterSnapshots, db.relationships, db.timelines,
    db.chapters, db.events, db.blobs,
  ], async () => {
    await db.worlds.put(data.world)
    await db.mapLayers.bulkPut(data.mapLayers)
    await db.locationMarkers.bulkPut(data.locationMarkers)
    await db.characters.bulkPut(data.characters)
    await db.items.bulkPut(data.items)
    await db.characterSnapshots.bulkPut(data.characterSnapshots)
    await db.relationships.bulkPut(data.relationships)
    await db.timelines.bulkPut(data.timelines)
    await db.chapters.bulkPut(data.chapters)
    await db.events.bulkPut(data.events)

    for (const b of data.blobs) {
      await db.blobs.put({
        id: b.id,
        worldId: b.worldId,
        mimeType: b.mimeType,
        data: base64ToBlob(b.dataBase64, b.mimeType),
        createdAt: b.createdAt,
      })
    }
  })

  return data.world.id
}
