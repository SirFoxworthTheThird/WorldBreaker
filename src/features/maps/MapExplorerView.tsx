import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Upload, Users, Map as MapIcon } from 'lucide-react'
import { useAppStore, useActiveMapLayerId, useActiveChapterId } from '@/store'
import { useRootMapLayers, useMapLayer } from '@/db/hooks/useMapLayers'
import { useLocationMarkers, useAllLocationMarkers } from '@/db/hooks/useLocationMarkers'
import { useCharacters } from '@/db/hooks/useCharacters'
import { useBestSnapshots, useWorldSnapshots, upsertSnapshot } from '@/db/hooks/useSnapshots'
import { useMapLayers } from '@/db/hooks/useMapLayers'
import type { CharacterPin } from './LeafletMapCanvas'
import { useBlobUrl } from '@/db/hooks/useBlobs'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { PortraitImage } from '@/components/PortraitImage'
import { LeafletMapCanvas } from './LeafletMapCanvas'
import { MapTreeNav } from './MapTreeNav'
import { LocationDetailPanel } from './LocationDetailPanel'
import { UploadMapDialog } from './UploadMapDialog'
import { AddLocationDialog } from './AddLocationDialog'
import type { Character, CharacterSnapshot, LocationMarker, MapLayer } from '@/types'

/** Walk up the layer hierarchy from a snapshot's layer to find the marker on `currentLayerId`
 *  that is the entry point (directly or via ancestors) to where the character actually is.
 *  Returns null if the character is not reachable from this layer. */
function resolveCharacterPin(
  snap: CharacterSnapshot,
  currentLayerId: string,
  allLayers: MapLayer[],
  allMarkers: LocationMarker[],
): CharacterPin | null {
  const char = snap.characterId // resolved by caller
  if (!snap.currentLocationMarkerId || !snap.currentMapLayerId) return null

  // Character is directly on this layer
  if (snap.currentMapLayerId === currentLayerId) {
    const m = allMarkers.find((x) => x.id === snap.currentLocationMarkerId)
    if (!m) return null
    return { character: null as unknown as Character, x: m.x, y: m.y, inSubMap: false }
  }

  // Walk up from the character's layer until we hit currentLayerId
  let childLayerId = snap.currentMapLayerId
  for (let depth = 0; depth < 20; depth++) {
    const childLayer = allLayers.find((l) => l.id === childLayerId)
    if (!childLayer?.parentMapId) return null
    const parentLayerId = childLayer.parentMapId
    // Find the marker on parent that links to this child layer
    const linkMarker = allMarkers.find(
      (m) => m.mapLayerId === parentLayerId && m.linkedMapLayerId === childLayerId
    )
    if (!linkMarker) return null
    if (parentLayerId === currentLayerId) {
      return { character: null as unknown as Character, x: linkMarker.x, y: linkMarker.y, inSubMap: true }
    }
    childLayerId = parentLayerId
  }
  return null
}

function CharactersPanel({
  characters,
  snapshots,
  allMarkers,
  activeChapterId,
  onDragStart,
  onDragEnd,
}: {
  characters: Character[]
  snapshots: CharacterSnapshot[]
  allMarkers: LocationMarker[]
  activeChapterId: string | null
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div className="flex w-44 shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="border-b border-[hsl(var(--border))] px-3 py-2">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          Characters
        </p>
        {!activeChapterId && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Select a chapter to place characters
          </p>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2 flex flex-col gap-1">
        {characters.map((c) => {
          const snap = snapshots.find((s) => s.characterId === c.id)
          const locationName = snap?.currentLocationMarkerId
            ? allMarkers.find((m) => m.id === snap.currentLocationMarkerId)?.name
            : null
          return (
            <div
              key={c.id}
              draggable={!!activeChapterId}
              onDragStart={(e) => {
                e.dataTransfer.setData('characterId', c.id)
                e.dataTransfer.effectAllowed = 'move'
                onDragStart()
              }}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1.5 select-none ${
                activeChapterId ? 'cursor-grab active:cursor-grabbing' : 'opacity-50'
              }`}
            >
              <PortraitImage
                imageId={c.portraitImageId}
                className="h-6 w-6 rounded-full object-cover shrink-0"
                fallbackClassName="h-6 w-6 rounded-full shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{c.name}</p>
                {locationName && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{locationName}</p>
                )}
              </div>
            </div>
          )
        })}
        {characters.length === 0 && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] italic p-1">No characters yet.</p>
        )}
      </div>
    </div>
  )
}

function MapView({ worldId, layerId }: { worldId: string; layerId: string }) {
  const layer = useMapLayer(layerId)
  const imageUrl = useBlobUrl(layer?.imageId ?? null)
  const markers = useLocationMarkers(layerId)
  const allLayers = useMapLayers(worldId)
  const allMarkers = useAllLocationMarkers(worldId)
  const characters = useCharacters(worldId)
  const activeChapterId = useActiveChapterId()
  const snapshots = useBestSnapshots(worldId, activeChapterId)
  const allSnapshots = useWorldSnapshots(worldId)

  // Resolve character pins: on this layer directly, or via sub-map ancestry
  const charPins: CharacterPin[] = []
  for (const snap of snapshots) {
    const char = characters.find((c) => c.id === snap.characterId)
    if (!char) continue
    const pin = resolveCharacterPin(snap, layerId, allLayers, allMarkers)
    if (pin) charPins.push({ ...pin, character: char })
  }
  const [showPanel, setShowPanel] = useState(false)
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false)
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null)
  const [addLocationOpen, setAddLocationOpen] = useState(false)
  const { setSelectedLocationMarkerId, selectedLocationMarkerId, pushMapLayer } = useAppStore()

  if (!layer || !imageUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--ring))]" />
      </div>
    )
  }

  async function handleCharacterDrop(characterId: string, markerId: string) {
    if (!activeChapterId) return
    const targetMarker = markers.find((m) => m.id === markerId)
    if (!targetMarker) return
    const existing = allSnapshots.find(
      (s) => s.characterId === characterId && s.chapterId === activeChapterId
    )
    await upsertSnapshot({
      worldId,
      characterId,
      chapterId: activeChapterId,
      isAlive: existing?.isAlive ?? true,
      currentLocationMarkerId: markerId,
      currentMapLayerId: targetMarker.mapLayerId,
      inventoryItemIds: existing?.inventoryItemIds ?? [],
      inventoryNotes: existing?.inventoryNotes ?? '',
      statusNotes: existing?.statusNotes ?? '',
    })
  }

  return (
    <div className="flex h-full">
      {/* Map tree navigation */}
      <MapTreeNav worldId={worldId} />

      {/* Characters drag panel */}
      {showPanel && (
        <CharactersPanel
          characters={characters}
          snapshots={snapshots}
          allMarkers={allMarkers}
          activeChapterId={activeChapterId}
          onDragStart={() => setIsDraggingCharacter(true)}
          onDragEnd={() => setIsDraggingCharacter(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2">
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant={showPanel ? 'secondary' : 'outline'}
              className="gap-1.5 text-xs"
              onClick={() => setShowPanel((v) => !v)}
            >
              <Users className="h-3.5 w-3.5" />
              Characters
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => window.dispatchEvent(new CustomEvent('wb:map:startAddMarker'))}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden">
          <LeafletMapCanvas
            layer={layer}
            imageUrl={imageUrl}
            markers={markers}
            charPins={charPins}
            isDraggingCharacter={isDraggingCharacter}
            onMarkerClick={setSelectedLocationMarkerId}
            onMapClick={(x, y) => { setPendingPos({ x, y }); setAddLocationOpen(true) }}
            onDrillDown={pushMapLayer}
            onCharacterDrop={handleCharacterDrop}
          />
        </div>
      </div>

      {/* Location detail panel */}
      {selectedLocationMarkerId && (
        <LocationDetailPanel
          markerId={selectedLocationMarkerId}
          worldId={worldId}
          onClose={() => setSelectedLocationMarkerId(null)}
          onDrillDown={pushMapLayer}
        />
      )}

      {pendingPos && (
        <AddLocationDialog
          open={addLocationOpen}
          onOpenChange={(o) => { setAddLocationOpen(o); if (!o) setPendingPos(null) }}
          worldId={worldId}
          mapLayerId={layerId}
          position={pendingPos}
        />
      )}
    </div>
  )
}

export default function MapExplorerView() {
  const { worldId } = useParams<{ worldId: string }>()
  const activeLayerId = useActiveMapLayerId()
  const rootLayers = useRootMapLayers(worldId ?? null)
  const { setActiveMapLayerId } = useAppStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  if (!worldId) return null

  if (!activeLayerId && rootLayers.length > 0) {
    setActiveMapLayerId(rootLayers[0].id)
  }

  if (rootLayers.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-2">
          <span className="text-sm font-medium">Maps</span>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload Map
          </Button>
        </div>
        <EmptyState
          icon={MapIcon}
          title="No maps yet"
          description="Upload a map image to start placing locations and tracking characters."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload Map
            </Button>
          }
        />
        <UploadMapDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          worldId={worldId}
          onCreated={setActiveMapLayerId}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {activeLayerId ? <MapView worldId={worldId} layerId={activeLayerId} /> : null}
      </div>

      <UploadMapDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        worldId={worldId}
        onCreated={setActiveMapLayerId}
      />
    </div>
  )
}
