import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Globe, Download, Loader2 } from 'lucide-react'
import type { World } from '@/types'
import { Button } from '@/components/ui/button'
import { deleteWorld } from '@/db/hooks/useWorlds'
import { exportWorld } from '@/lib/exportImport'

interface WorldCardProps {
  world: World
}

export function WorldCard({ world }: WorldCardProps) {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${world.name}" and all its data? This cannot be undone.`)) {
      await deleteWorld(world.id)
    }
  }

  async function handleExport(e: React.MouseEvent) {
    e.stopPropagation()
    setExporting(true)
    try {
      await exportWorld(world.id)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      onClick={() => navigate(`/worlds/${world.id}`)}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-colors hover:border-[hsl(var(--ring))] hover:bg-[hsl(var(--accent))]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[hsl(var(--muted))] p-2">
            <Globe className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--foreground))]">{world.name}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {new Date(world.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-blue-400"
            onClick={handleExport}
            disabled={exporting}
            title="Export world"
          >
            {exporting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-red-400"
            onClick={handleDelete}
            title="Delete world"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {world.description && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
          {world.description}
        </p>
      )}
    </div>
  )
}
