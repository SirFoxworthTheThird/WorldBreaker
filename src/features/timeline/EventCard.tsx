import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Pencil, Check, X, UserPlus, UserMinus } from 'lucide-react'
import type { WorldEvent } from '@/types'
import { deleteEvent, updateEvent } from '@/db/hooks/useTimeline'
import { useCharacters } from '@/db/hooks/useCharacters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PortraitImage } from '@/components/PortraitImage'

interface EventCardProps {
  event: WorldEvent
}

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [involvedIds, setInvolvedIds] = useState<string[]>(event.involvedCharacterIds)
  const characters = useCharacters(event.worldId)

  async function saveEdit() {
    await updateEvent(event.id, {
      title: title.trim(),
      description: description.trim(),
      involvedCharacterIds: involvedIds,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setTitle(event.title)
    setDescription(event.description)
    setInvolvedIds(event.involvedCharacterIds)
    setEditing(false)
  }

  function startEdit() {
    setTitle(event.title)
    setDescription(event.description)
    setInvolvedIds(event.involvedCharacterIds)
    setEditing(true)
    setExpanded(true)
  }

  async function addCharacter(characterId: string) {
    if (!involvedIds.includes(characterId)) {
      const newIds = [...involvedIds, characterId]
      setInvolvedIds(newIds)
      if (!editing) {
        await updateEvent(event.id, { involvedCharacterIds: newIds })
      }
    }
  }

  async function removeCharacter(characterId: string) {
    const newIds = involvedIds.filter((id) => id !== characterId)
    setInvolvedIds(newIds)
    if (!editing) {
      await updateEvent(event.id, { involvedCharacterIds: newIds })
    }
  }

  const involvedChars = characters.filter((c) => involvedIds.includes(c.id))
  const availableChars = characters.filter((c) => !involvedIds.includes(c.id))

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Header row */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button className="flex-1 text-left" onClick={() => !editing && setExpanded((v) => !v)}>
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-7 text-sm"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">{event.title}</span>
          )}
        </button>

        {editing ? (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-green-400" onClick={saveEdit} disabled={!title.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-opacity"
              onClick={startEdit}
              style={{ opacity: expanded ? 1 : undefined }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-400" onClick={() => deleteEvent(event.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[hsl(var(--border))] px-3 py-3 flex flex-col gap-3">

          {/* Description */}
          {editing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened..."
              rows={3}
              className="text-sm"
            />
          ) : (
            event.description && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{event.description}</p>
            )
          )}

          {/* Involved characters */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Involved Characters
            </span>

            {/* Current list */}
            {involvedChars.length > 0 ? (
              <div className="flex flex-col gap-1">
                {involvedChars.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-md bg-[hsl(var(--muted))] px-2 py-1.5">
                    <PortraitImage
                      imageId={c.portraitImageId}
                      className="h-5 w-5 rounded-full object-cover"
                      fallbackClassName="h-5 w-5 rounded-full"
                    />
                    <span className="flex-1 text-xs">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 hover:text-red-400"
                      onClick={() => removeCharacter(c.id)}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No characters assigned.</p>
            )}

            {/* Add character (always visible, not just in edit mode) */}
            {availableChars.length > 0 && (
              <Select onValueChange={addCharacter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="+ Add character..." />
                </SelectTrigger>
                <SelectContent>
                  {availableChars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Edit / save buttons when not in title-edit mode */}
          {!editing && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs self-start" onClick={startEdit}>
              <Pencil className="h-3 w-3" /> Edit Event
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={!title.trim()}>Save</Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
