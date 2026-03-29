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
  createdAt: number
  updatedAt: number
}
