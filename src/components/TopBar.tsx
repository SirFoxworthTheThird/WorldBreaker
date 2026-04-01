import { BookOpen, Map, Users, Network, LayoutDashboard, Package, Search, ScrollText } from 'lucide-react'
import faviconUrl from '/favicon.png'
import { useActiveWorldId, useAppStore } from '@/store'
import { useWorld } from '@/db/hooks/useWorlds'
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

export function TopBar() {
  const worldId = useActiveWorldId()
  const world = useWorld(worldId)
  const navigate = useNavigate()
  const { setSearchOpen, setBriefOpen } = useAppStore()

  return (
    <header className="relative flex h-12 shrink-0 items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4">
      {/* Left: brand + world name */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={faviconUrl} alt="PlotWeave" className="h-7 w-7 rounded object-cover" />
          <span className="text-sm font-bold tracking-wide text-[hsl(var(--foreground))]">
            PlotWeave
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

      {/* Right: search + brief + theme */}
      <div className="ml-auto flex items-center gap-1">
        {world && (
          <>
            <button
              onClick={() => setSearchOpen(true)}
              title="Search (Ctrl+K)"
              className="flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block rounded border border-[hsl(var(--border))] px-1 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <button
              onClick={() => setBriefOpen(true)}
              title="Writer's Brief"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <ScrollText className="h-4 w-4" />
            </button>
          </>
        )}
        <ThemePicker />
      </div>
    </header>
  )
}
