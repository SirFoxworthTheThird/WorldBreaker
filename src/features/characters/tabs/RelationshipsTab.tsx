import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Character } from '@/types'
import { useCharacterRelationships, createRelationship, deleteRelationship } from '@/db/hooks/useRelationships'
import { useCharacters } from '@/db/hooks/useCharacters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { RelationshipStrength, RelationshipSentiment } from '@/types'
import { cn } from '@/lib/utils'

const SENTIMENT_COLORS: Record<RelationshipSentiment, string> = {
  positive: 'text-green-400',
  neutral: 'text-[hsl(var(--muted-foreground))]',
  negative: 'text-red-400',
  complex: 'text-yellow-400',
}

interface AddRelationshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: Character
  otherCharacters: Character[]
}

function AddRelationshipDialog({ open, onOpenChange, character, otherCharacters }: AddRelationshipDialogProps) {
  const [targetId, setTargetId] = useState('')
  const [label, setLabel] = useState('')
  const [strength, setStrength] = useState<RelationshipStrength>('moderate')
  const [sentiment, setSentiment] = useState<RelationshipSentiment>('neutral')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetId || !label.trim()) return
    setSaving(true)
    await createRelationship({
      worldId: character.worldId,
      characterAId: character.id,
      characterBId: targetId,
      label: label.trim(),
      strength,
      sentiment,
      description,
      isBidirectional: true,
    })
    setSaving(false)
    setTargetId('')
    setLabel('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Relationship</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>With Character</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Select character..." /></SelectTrigger>
              <SelectContent>
                {otherCharacters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Relationship Label</Label>
            <Input placeholder="e.g. mentor, rival, sibling" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Strength</Label>
              <Select value={strength} onValueChange={(v) => setStrength(v as RelationshipStrength)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['weak', 'moderate', 'strong', 'bond'] as RelationshipStrength[]).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sentiment</Label>
              <Select value={sentiment} onValueChange={(v) => setSentiment(v as RelationshipSentiment)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['positive', 'neutral', 'negative', 'complex'] as RelationshipSentiment[]).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!targetId || !label.trim() || saving}>
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RelationshipsTabProps {
  character: Character
}

export function RelationshipsTab({ character }: RelationshipsTabProps) {
  const relationships = useCharacterRelationships(character.id)
  const allChars = useCharacters(character.worldId)
  const [dialogOpen, setDialogOpen] = useState(false)

  const otherChars = allChars.filter((c) => c.id !== character.id)

  function getOtherChar(rel: typeof relationships[0]) {
    const otherId = rel.characterAId === character.id ? rel.characterBId : rel.characterAId
    return allChars.find((c) => c.id === otherId)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={otherChars.length === 0}>
          <Plus className="h-3.5 w-3.5" /> Add Relationship
        </Button>
      </div>

      {relationships.length === 0 ? (
        <p className="py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">No relationships yet.</p>
      ) : (
        relationships.map((rel) => {
          const other = getOtherChar(rel)
          return (
            <div key={rel.id} className="flex items-start justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{other?.name ?? 'Unknown'}</span>
                  <span className={cn('text-xs capitalize font-medium', SENTIMENT_COLORS[rel.sentiment])}>
                    {rel.label}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize mt-0.5">
                  {rel.strength} · {rel.sentiment}
                </p>
                {rel.description && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{rel.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-red-400"
                onClick={() => deleteRelationship(rel.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )
        })
      )}

      <AddRelationshipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={character}
        otherCharacters={otherChars}
      />
    </div>
  )
}
