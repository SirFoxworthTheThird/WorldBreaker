import { ChevronRight } from 'lucide-react'
import { useMapLayers } from '@/db/hooks/useMapLayers'
import { useAppStore, useMapLayerHistory } from '@/store'

interface MapBreadcrumbProps {
  worldId: string
}

export function MapBreadcrumb({ worldId }: MapBreadcrumbProps) {
  const history = useMapLayerHistory()
  const allLayers = useMapLayers(worldId)
  const { resetMapHistory } = useAppStore()

  if (history.length <= 1) return null

  const layerById = Object.fromEntries(allLayers.map((l) => [l.id, l]))

  return (
    <nav className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
      {history.map((id, idx) => {
        const layer = layerById[id]
        const isLast = idx === history.length - 1
        return (
          <span key={id} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3 w-3" />}
            <button
              className={isLast ? 'text-[hsl(var(--foreground))]' : 'hover:text-[hsl(var(--foreground))] transition-colors'}
              onClick={() => !isLast && resetMapHistory(id)}
              disabled={isLast}
            >
              {layer?.name ?? id}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
