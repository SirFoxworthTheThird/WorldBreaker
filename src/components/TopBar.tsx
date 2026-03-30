import { BookOpen, Map, Users, Network, LayoutDashboard, Package } from 'lucide-react'
import { useAppStore, useActiveWorldId, useActiveChapterId } from '@/store'
import { useWorld } from '@/db/hooks/useWorlds'
import { useTimelines, useChapters } from '@/db/hooks/useTimeline'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ThemePicker } from './ThemePicker'
import { useNavigate, NavLink, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'maps', label: 'Maps', icon: Map, end: false },
  { to: 'characters', label: 'Characters', icon: Users, end: false },
  { to: 'items', label: 'Items', icon: Package, end: false },
  { to: 'relationships', label: 'Relationships', icon: Network, end: false },
  { to: 'timeline', label: 'Timeline', icon: BookOpen, end: false },
]

function NavIcons() {
  const { worldId } = useParams<{ worldId: string }>()
  if (!worldId) return null

  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={`/worlds/${worldId}/${to}`}
          end={end}
          title={label}
          className={({ isActive }) =>
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              isActive
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
            )
          }
        >
          <Icon className="h-4 w-4" />
        </NavLink>
      ))}
    </nav>
  )
}

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
  const navigate = useNavigate()

  return (
    <header className="relative flex h-12 shrink-0 items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4">
      {/* Left: brand + world name */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Center: nav icons — absolutely centered */}
      {world && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <NavIcons />
        </div>
      )}

      {/* Right: theme + chapter */}
      <div className="ml-auto flex items-center gap-2">
        <ThemePicker />
        <ChapterSelector />
      </div>
    </header>
  )
}
