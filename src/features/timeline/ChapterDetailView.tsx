import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Users, Network } from 'lucide-react'
import { useChapter, useEvents } from '@/db/hooks/useTimeline'
import { useChapterSnapshots } from '@/db/hooks/useSnapshots'
import { useChapterRelationshipSnapshots } from '@/db/hooks/useRelationshipSnapshots'
import { useCharacters } from '@/db/hooks/useCharacters'
import { useRelationships } from '@/db/hooks/useRelationships'
import { Button } from '@/components/ui/button'
import { EventCard } from './EventCard'
import { SnapshotCard } from './SnapshotCard'
import { AddEventDialog } from './AddEventDialog'

export default function ChapterDetailView() {
  const { worldId, chapterId } = useParams<{ worldId: string; chapterId: string }>()
  const navigate = useNavigate()
  const chapter = useChapter(chapterId ?? null)
  const events = useEvents(chapterId ?? null)
  const snapshots = useChapterSnapshots(chapterId ?? null)
  const relSnapshots = useChapterRelationshipSnapshots(chapterId ?? null)
  const characters = useCharacters(worldId ?? null)
  const relationships = useRelationships(worldId ?? null)
  const [addEventOpen, setAddEventOpen] = useState(false)

  if (!chapter) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Chapter not found.
      </div>
    )
  }

  // Characters without a snapshot in this chapter
  const snapshotCharIds = new Set(snapshots.map((s) => s.characterId))
  const missingSnapshots = characters.filter((c) => !snapshotCharIds.has(c.id))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-base font-semibold">Ch. {chapter.number} — {chapter.title}</h2>
          {chapter.synopsis && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{chapter.synopsis}</p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Events */}
        <div className="flex flex-1 flex-col border-r border-[hsl(var(--border))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-2">
            <span className="text-sm font-medium">Events ({events.length})</span>
            <Button size="sm" onClick={() => setAddEventOpen(true)}>
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">No events yet.</p>
            ) : (
              events.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </div>
        </div>

        {/* Character snapshots */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-2">
            <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium">Character States</span>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
            {snapshots.length === 0 && missingSnapshots.length === 0 && (
              <p className="py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No characters in this world yet.
              </p>
            )}
            {snapshots.map((s) => <SnapshotCard key={s.id} snapshot={s} />)}
            {missingSnapshots.length > 0 && (
              <div className="mt-2">
                <p className="mb-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {missingSnapshots.length} character{missingSnapshots.length !== 1 ? 's' : ''} without state:
                </p>
                {missingSnapshots.map((c) => (
                  <div key={c.id} className="mb-1.5 flex items-center gap-2 rounded border border-dashed border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {c.name}
                    <span className="ml-auto italic">no snapshot</span>
                  </div>
                ))}
              </div>
            )}

            {/* Relationship snapshots */}
            {relationships.length > 0 && (
              <div className="mt-2 border-t border-[hsl(var(--border))] pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Relationship States</span>
                </div>
                {relSnapshots.length === 0 ? (
                  <p className="text-xs italic text-[hsl(var(--muted-foreground))]">No relationship states for this chapter.</p>
                ) : (
                  relSnapshots.map((rs) => {
                    const rel = relationships.find((r) => r.id === rs.relationshipId)
                    const charA = characters.find((c) => c.id === rel?.characterAId)
                    const charB = characters.find((c) => c.id === rel?.characterBId)
                    if (!rel || !charA || !charB) return null
                    return (
                      <div key={rs.id} className="mb-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-1 font-medium">
                          <span>{charA.name}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">↔</span>
                          <span>{charB.name}</span>
                          {!rs.isActive && (
                            <span className="ml-1 rounded bg-[hsl(var(--muted))] px-1 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">inactive</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[hsl(var(--muted-foreground))]">{rs.label} · {rs.sentiment} · {rs.strength}</p>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {chapterId && worldId && (
        <AddEventDialog
          open={addEventOpen}
          onOpenChange={setAddEventOpen}
          worldId={worldId}
          chapterId={chapterId}
          timelineId={chapter.timelineId}
          nextSortOrder={events.length}
        />
      )}
    </div>
  )
}
