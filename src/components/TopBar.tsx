import { Menu, BookOpen } from 'lucide-react'
import { useAppStore, useActiveWorldId, useActiveChapterId } from '@/store'
import { useWorld } from '@/db/hooks/useWorlds'
import { useTimelines, useChapters } from '@/db/hooks/useTimeline'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ThemePicker } from './ThemePicker'
import { useNavigate } from 'react-router-dom'

function ChapterSelector() {
  const worldId = useActiveWorldId()
  const activeChapterId = useActiveChapterId()
  const { setActiveChapterId } = useAppStore()

  const timelines = useTimelines(worldId)
  const firstTimelineId = timelines[0]?.id ?? null
  const chapters = useChapters(firstTimelineId)

  if (!timelines.length) return null

  return (
    <div className="flex items-center gap-2">
      <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <Select
        value={activeChapterId ?? ''}
        onValueChange={(v) => setActiveChapterId(v || null)}
      >
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="No chapter selected" />
        </SelectTrigger>
        <SelectContent>
          {chapters.map((ch) => (
            <SelectItem key={ch.id} value={ch.id}>
              Ch. {ch.number} — {ch.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function TopBar() {
  const worldId = useActiveWorldId()
  const world = useWorld(worldId)
  const { toggleSidebar } = useAppStore()
  const navigate = useNavigate()

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className="text-sm font-bold tracking-wide text-[hsl(var(--foreground))]">
          WorldBreaker
        </span>
      </button>

      {world && (
        <>
          <span className="text-[hsl(var(--muted-foreground))]">/</span>
          <span className="text-sm text-[hsl(var(--foreground))]">{world.name}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemePicker />
        <ChapterSelector />
      </div>
    </header>
  )
}
