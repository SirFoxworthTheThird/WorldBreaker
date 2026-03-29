import { useState, useRef } from 'react'
import { Plus, Scroll, Upload } from 'lucide-react'
import { useWorlds } from '@/db/hooks/useWorlds'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { WorldCard } from './WorldCard'
import { CreateWorldDialog } from './CreateWorldDialog'
import { useNavigate } from 'react-router-dom'
import { importWorld } from '@/lib/exportImport'

export default function WorldSelectorView() {
  const worlds = useWorlds()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError(null)
    try {
      const worldId = await importWorld(file)
      navigate(`/worlds/${worldId}`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">WorldBreaker</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Story Tracker</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => importRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import World'}
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".wbk,application/json"
              className="hidden"
              onChange={handleImport}
            />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New World
            </Button>
          </div>
        </div>
        {importError && (
          <p className="mt-2 text-xs text-red-400">{importError}</p>
        )}
      </header>

      <main className="flex-1 p-6">
        {worlds.length === 0 ? (
          <EmptyState
            icon={Scroll}
            title="No worlds yet"
            description="Create your first world or story to start tracking characters, locations, and events."
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => importRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Import World
                </Button>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create World
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {worlds.map((world) => (
              <WorldCard key={world.id} world={world} />
            ))}
            <button
              onClick={() => setDialogOpen(true)}
              className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--ring))] hover:text-[hsl(var(--foreground))]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">New World</span>
            </button>
          </div>
        )}
      </main>

      <CreateWorldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(id) => navigate(`/worlds/${id}`)}
      />
    </div>
  )
}
