import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Users } from 'lucide-react'
import { useChapter, useEvents } from '@/db/hooks/useTimeline'
import { useChapterSnapshots } from '@/db/hooks/useSnapshots'
import { useCharacters } from '@/db/hooks/useCharacters'
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
  const characters = useCharacters(worldId ?? null)
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
        <div className="flex w-80 shrink-0 flex-col">
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
