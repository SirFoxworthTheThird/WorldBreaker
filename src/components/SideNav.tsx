import { NavLink, useParams } from 'react-router-dom'
import { Map, Users, Network, BookOpen, LayoutDashboard } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'maps', label: 'Maps', icon: Map, end: false },
  { to: 'characters', label: 'Characters', icon: Users, end: false },
  { to: 'relationships', label: 'Relationships', icon: Network, end: false },
  { to: 'timeline', label: 'Timeline', icon: BookOpen, end: false },
]

export function SideNav() {
  const { worldId } = useParams<{ worldId: string }>()
  const { sidebarOpen } = useAppStore()

  if (!sidebarOpen) return null

  return (
    <nav className="flex w-48 shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={`/worlds/${worldId}/${to}`}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
