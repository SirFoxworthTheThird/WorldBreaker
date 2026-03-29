import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Trash2, BookOpen, Plus, ExternalLink } from 'lucide-react'
import type { Chapter } from '@/types'
import { deleteChapter } from '@/db/hooks/useTimeline'
import { useEvents } from '@/db/hooks/useTimeline'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { EventCard } from './EventCard'
import { AddEventDialog } from './AddEventDialog'
import { cn } from '@/lib/utils'

interface ChapterRowProps {
  chapter: Chapter
}

export function ChapterRow({ chapter }: ChapterRowProps) {
  const { worldId } = useParams<{ worldId: string }>()
  const navigate = useNavigate()
  const { activeChapterId, setActiveChapterId } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const events = useEvents(expanded ? chapter.id : null)

  const isActive = chapter.id === activeChapterId

  async function handleDelete() {
    if (confirm(`Delete chapter "${chapter.title}"?`)) {
      await deleteChapter(chapter.id)
    }
  }

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      isActive ? 'border-[hsl(var(--ring))] bg-[hsl(var(--card))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
    )}>
      {/* Chapter header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2 flex-1 text-left">
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />}
          <BookOpen className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
            Ch. {chapter.number} — {chapter.title}
          </span>
        </button>

        <Button
          size="sm"
          variant={isActive ? 'secondary' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setActiveChapterId(isActive ? null : chapter.id)}
        >
          {isActive ? 'Active' : 'Set Active'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigate(`/worlds/${worldId}/timeline/${chapter.id}`)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-red-400"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded events */}
      {expanded && (
        <div className="border-t border-[hsl(var(--border))] px-4 py-3 flex flex-col gap-2">
          {chapter.synopsis && (
            <p className="text-xs italic text-[hsl(var(--muted-foreground))] mb-1">{chapter.synopsis}</p>
          )}
          {events.map((e) => <EventCard key={e.id} event={e} />)}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setAddEventOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Event
          </Button>
        </div>
      )}

      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        worldId={chapter.worldId}
        chapterId={chapter.id}
        timelineId={chapter.timelineId}
        nextSortOrder={events.length}
      />
    </div>
  )
}
