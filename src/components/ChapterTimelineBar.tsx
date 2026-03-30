import { useActiveChapterId, useActiveWorldId, useAppStore } from '@/store'
import { useTimelines, useChapters } from '@/db/hooks/useTimeline'
import { cn } from '@/lib/utils'

export function ChapterTimelineBar() {
  const worldId = useActiveWorldId()
  const activeChapterId = useActiveChapterId()
  const { setActiveChapterId } = useAppStore()

  const timelines = useTimelines(worldId)
  const firstTimelineId = timelines[0]?.id ?? null
  const chapters = useChapters(firstTimelineId)

  if (!timelines.length || !chapters.length) return null

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 overflow-x-auto scrollbar-none">
      <button
        onClick={() => setActiveChapterId(null)}
        className={cn(
          'shrink-0 rounded px-2.5 py-1 text-xs transition-colors',
          !activeChapterId
            ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
            : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
        )}
      >
        All time
      </button>

      <div className="h-4 w-px shrink-0 bg-[hsl(var(--border))] mx-1" />

      {chapters.map((ch) => (
        <button
          key={ch.id}
          onClick={() => setActiveChapterId(ch.id)}
          className={cn(
            'shrink-0 rounded px-2.5 py-1 text-xs transition-colors whitespace-nowrap',
            activeChapterId === ch.id
              ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          <span className="opacity-50">Ch. {ch.number}</span>{' '}
          {ch.title}
        </button>
      ))}
    </div>
  )
}
