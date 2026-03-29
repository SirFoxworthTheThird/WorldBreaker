import Dexie, { type EntityTable } from 'dexie'
import type {
  World,
  AppPreferences,
  MapLayer,
  LocationMarker,
  Character,
  Item,
  CharacterSnapshot,
  Relationship,
  Timeline,
  Chapter,
  WorldEvent,
  BlobEntry,
} from '@/types'

class WorldBreakerDB extends Dexie {
  worlds!: EntityTable<World, 'id'>
  preferences!: EntityTable<AppPreferences, 'id'>
  mapLayers!: EntityTable<MapLayer, 'id'>
  locationMarkers!: EntityTable<LocationMarker, 'id'>
  characters!: EntityTable<Character, 'id'>
  items!: EntityTable<Item, 'id'>
  characterSnapshots!: EntityTable<CharacterSnapshot, 'id'>
  relationships!: EntityTable<Relationship, 'id'>
  timelines!: EntityTable<Timeline, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  events!: EntityTable<WorldEvent, 'id'>
  blobs!: EntityTable<BlobEntry, 'id'>

  constructor() {
    super('WorldBreakerDB')

    this.version(1).stores({
      worlds: 'id, name, createdAt',
      preferences: 'id',
      mapLayers: 'id, worldId, parentMapId, createdAt',
      locationMarkers: 'id, worldId, mapLayerId, linkedMapLayerId',
      characters: 'id, worldId, name, createdAt',
      items: 'id, worldId, name',
      characterSnapshots: 'id, worldId, characterId, chapterId, [characterId+chapterId]',
      relationships: 'id, worldId, characterAId, characterBId',
      timelines: 'id, worldId, createdAt',
      chapters: 'id, worldId, timelineId, number',
      events: 'id, worldId, chapterId, timelineId, sortOrder',
      blobs: 'id, worldId, createdAt',
    })
  }
}

export const db = new WorldBreakerDB()
