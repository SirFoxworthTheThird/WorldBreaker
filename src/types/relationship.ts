export type RelationshipStrength = 'weak' | 'moderate' | 'strong' | 'bond'
export type RelationshipSentiment = 'positive' | 'neutral' | 'negative' | 'complex'

export interface Relationship {
  id: string
  worldId: string
  characterAId: string
  characterBId: string
  label: string
  strength: RelationshipStrength
  sentiment: RelationshipSentiment
  description: string
  isBidirectional: boolean
  /** Chapter this relationship first appears in. Null = exists from the beginning. */
  startChapterId: string | null
  createdAt: number
  updatedAt: number
}

export interface RelationshipSnapshot {
  id: string
  worldId: string
  relationshipId: string
  chapterId: string
  label: string
  strength: RelationshipStrength
  sentiment: RelationshipSentiment
  description: string
  /** false = relationship has ended or not yet formed in this chapter */
  isActive: boolean
  createdAt: number
  updatedAt: number
}
