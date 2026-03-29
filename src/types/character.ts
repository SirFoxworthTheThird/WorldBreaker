export interface Character {
  id: string
  worldId: string
  name: string
  aliases: string[]
  description: string
  portraitImageId: string | null
  tags: string[]
  isAlive: boolean
  createdAt: number
  updatedAt: number
}

export interface Item {
  id: string
  worldId: string
  name: string
  description: string
  iconType: string
  tags: string[]
}

export interface CharacterSnapshot {
  id: string
  worldId: string
  characterId: string
  chapterId: string
  isAlive: boolean
  currentLocationMarkerId: string | null
  currentMapLayerId: string | null
  inventoryItemIds: string[]
  inventoryNotes: string
  statusNotes: string
  createdAt: number
  updatedAt: number
}
