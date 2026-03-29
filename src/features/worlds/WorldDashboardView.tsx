import { useNavigate, useParams } from 'react-router-dom'
import { Map, Users, Network, BookOpen } from 'lucide-react'
import { useWorld } from '@/db/hooks/useWorlds'
import { useCharacters } from '@/db/hooks/useCharacters'
import { useRootMapLayers } from '@/db/hooks/useMapLayers'
import { useTimelines } from '@/db/hooks/useTimeline'
import { useRelationships } from '@/db/hooks/useRelationships'

export default function WorldDashboardView() {
  const { worldId } = useParams<{ worldId: string }>()
  const navigate = useNavigate()
  const world = useWorld(worldId ?? null)
  const characters = useCharacters(worldId ?? null)
  const maps = useRootMapLayers(worldId ?? null)
  const timelines = useTimelines(worldId ?? null)
  const relationships = useRelationships(worldId ?? null)

  const tiles = [
    {
      label: 'Maps',
      icon: Map,
      count: maps.length,
      to: 'maps',
      description: 'Locations and sub-maps',
    },
    {
      label: 'Characters',
      icon: Users,
      count: characters.length,
      to: 'characters',
      description: 'Track your cast',
    },
    {
      label: 'Relationships',
      icon: Network,
      count: relationships.length,
      to: 'relationships',
      description: 'Character connections',
    },
    {
      label: 'Timeline',
      icon: BookOpen,
      count: timelines.length,
      to: 'timeline',
      description: 'Chapters and events',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {world?.name ?? 'Loading...'}
        </h2>
        {world?.description && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{world.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map(({ label, icon: Icon, count, to, description }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition-colors hover:border-[hsl(var(--ring))] hover:bg-[hsl(var(--accent))]"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="text-2xl font-bold text-[hsl(var(--foreground))]">{count}</span>
            </div>
            <div>
              <p className="font-medium text-[hsl(var(--foreground))]">{label}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
