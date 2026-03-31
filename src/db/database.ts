import Dexie, { type EntityTable } from 'dexie'
import type {
  World,
  AppPreferences,
  MapLayer,
  LocationMarker,
  Character,
  Item,
  CharacterSnapshot,
  CharacterMovement,
  ItemPlacement,
  LocationSnapshot,
  ItemSnapshot,
  Relationship,
  RelationshipSnapshot,
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
  characterMovements!: EntityTable<CharacterMovement, 'id'>
  itemPlacements!: EntityTable<ItemPlacement, 'id'>
  relationships!: EntityTable<Relationship, 'id'>
  relationshipSnapshots!: EntityTable<RelationshipSnapshot, 'id'>
  timelines!: EntityTable<Timeline, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  events!: EntityTable<WorldEvent, 'id'>
  blobs!: EntityTable<BlobEntry, 'id'>
  locationSnapshots!: EntityTable<LocationSnapshot, 'id'>
  itemSnapshots!: EntityTable<ItemSnapshot, 'id'>

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

    this.version(2).stores({
      characterMovements: 'id, worldId, characterId, chapterId, [characterId+chapterId]',
    })

    this.version(3).stores({
      itemPlacements: 'id, worldId, itemId, chapterId, locationMarkerId, [itemId+chapterId]',
    })

    this.version(4).stores({
      relationshipSnapshots: 'id, worldId, relationshipId, chapterId, [relationshipId+chapterId]',
    })

    this.version(5).stores({
      relationships: 'id, worldId, characterAId, characterBId, startChapterId',
    }).upgrade((tx) => {
      return tx.table('relationships').toCollection().modify((r) => {
        if (r.startChapterId === undefined) r.startChapterId = null
      })
    })

    this.version(6).stores({}).upgrade((tx) => {
      return tx.table('mapLayers').toCollection().modify((l) => {
        if (l.scalePixelsPerUnit === undefined) l.scalePixelsPerUnit = null
        if (l.scaleUnit === undefined) l.scaleUnit = null
      })
    })

    this.version(7).stores({
      locationSnapshots: 'id, worldId, locationMarkerId, chapterId, [locationMarkerId+chapterId]',
      itemSnapshots: 'id, worldId, itemId, chapterId, [itemId+chapterId]',
    })
  }
}

export const db = new WorldBreakerDB()
