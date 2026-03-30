import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { MapLayer, LocationMarker, Character } from '@/types'
import { updateLocationMarker } from '@/db/hooks/useLocationMarkers'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function makeLocationIcon(iconType: string, isLinked: boolean, highlighted = false) {
  const colors: Record<string, string> = {
    city: '#60a5fa',
    town: '#34d399',
    dungeon: '#f87171',
    landmark: '#fbbf24',
    building: '#a78bfa',
    region: '#fb923c',
    custom: '#94a3b8',
  }
  const color = colors[iconType] ?? '#94a3b8'
  const ring = isLinked ? `stroke="${color}" stroke-width="2"` : ''
  const glow = highlighted ? `filter="url(#glow)"` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
    ${highlighted ? `<defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` : ''}
    <circle cx="12" cy="10" r="7" fill="${color}" fill-opacity="0.9" ${ring} ${glow}/>
    <polygon points="12,20 8,14 16,14" fill="${color}" fill-opacity="0.9"/>
    ${isLinked ? '<circle cx="12" cy="10" r="3" fill="white" fill-opacity="0.9"/>' : ''}
    ${highlighted ? `<circle cx="12" cy="10" r="9" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.6"/>` : ''}
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 30],
    popupAnchor: [0, -30],
  })
}

function makeCharacterIcon(name: string, inSubMap = false, portraitUrl?: string | null, zoom = 0) {
  const size = Math.max(20, Math.min(128, Math.round(36 * Math.pow(2, zoom))))
  const border = inSubMap ? '2px dashed #94a3b8' : '2px solid #60a5fa'
  const bg = inSubMap ? '#0f172a' : '#1e293b'
  const fontSize = Math.round(size * 0.36)

  let content: string
  if (portraitUrl) {
    const safeUrl = escapeXml(portraitUrl)
    content = `<img src="${safeUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
  } else {
    const initials = escapeXml(name.slice(0, 2).toUpperCase())
    const textColor = inSubMap ? '#94a3b8' : '#e2e8f0'
    content = `<span style="color:${textColor};font-size:${fontSize}px;font-weight:bold;font-family:sans-serif;line-height:1;user-select:none;">${initials}</span>`
  }

  const html = `<div style="
    width:${size}px;
    height:${size}px;
    border-radius:50%;
    border:${border};
    background:${bg};
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
    box-sizing:border-box;
  ">${content}</div>`

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function ClickHandler({ onMapClickRef }: { onMapClickRef: React.RefObject<(latlng: L.LatLng) => void> }) {
  useMapEvents({ click: (e) => onMapClickRef.current?.(e.latlng) })
  return null
}

interface ContextMenuState {
  screenX: number
  screenY: number
  mapX: number
  mapY: number
}

function ContextMenuHandler({
  onContextMenu,
}: {
  onContextMenu: (state: ContextMenuState) => void
}) {
  useMapEvents({
    contextmenu: (e) => {
      L.DomEvent.preventDefault(e.originalEvent)
      onContextMenu({
        screenX: e.containerPoint.x,
        screenY: e.containerPoint.y,
        mapX: e.latlng.lng,
        mapY: e.latlng.lat,
      })
    },
  })
  return null
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) })
  useEffect(() => { onZoomChange(map.getZoom()) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMapEvents({})
  useEffect(() => {
    map.fitBounds(bounds, { padding: [0, 0], animate: false })
  }, [map, bounds]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}


export interface CharacterPin {
  character: Character
  x: number
  y: number
  inSubMap: boolean
  portraitUrl?: string | null
}

export interface MovementLine {
  characterId: string
  color: string
  points: [number, number][]  // [y, x] Leaflet lat/lng pairs
}

interface LeafletMapCanvasProps {
  layer: MapLayer
  imageUrl: string
  markers: LocationMarker[]
  charPins: CharacterPin[]
  movementLines: MovementLine[]
  isDraggingCharacter: boolean
  onMarkerClick: (markerId: string) => void
  onMapClick: (x: number, y: number) => void
  onDrillDown: (mapLayerId: string) => void
  onCharacterDrop: (characterId: string, markerId: string) => void
  onCharacterClick?: (characterId: string) => void
  mapRef?: React.RefObject<L.Map | null>
}

export function LeafletMapCanvas({
  layer,
  imageUrl,
  markers,
  charPins,
  movementLines,
  isDraggingCharacter,
  onMarkerClick,
  onMapClick,
  onDrillDown,
  onCharacterDrop,
  onCharacterClick,
  mapRef: externalMapRef,
}: LeafletMapCanvasProps) {
  const internalMapRef = useRef<L.Map | null>(null)
  const mapRef = externalMapRef ?? internalMapRef
  const [mapZoom, setMapZoom] = useState(0)
  const [addMode, setAddMode] = useState(false)
  const addModeRef = useRef(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const onMapClickRef = useRef<(latlng: L.LatLng) => void>(() => {})
  const onMarkerClickRef = useRef(onMarkerClick)
  const onCharacterDropRef = useRef(onCharacterDrop)
  const markersRef = useRef(markers)

  onMarkerClickRef.current = onMarkerClick
  onCharacterDropRef.current = onCharacterDrop
  markersRef.current = markers

  const w = layer.imageWidth
  const h = layer.imageHeight
  const bounds = useMemo<L.LatLngBoundsExpression>(() => [[0, 0], [h, w]], [h, w])

  onMapClickRef.current = (latlng: L.LatLng) => {
    if (!addModeRef.current) return
    onMapClick(latlng.lng, latlng.lat)
    addModeRef.current = false
    setAddMode(false)
  }

  useEffect(() => {
    const handler = () => { addModeRef.current = true; setAddMode(true) }
    window.addEventListener('wb:map:startAddMarker', handler)
    return () => window.removeEventListener('wb:map:startAddMarker', handler)
  }, [])

  function findNearestMarker(clientX: number, clientY: number, containerEl: HTMLElement): LocationMarker | null {
    const map = mapRef.current
    if (!map) return null
    const rect = containerEl.getBoundingClientRect()
    const dropPt = L.point(clientX - rect.left, clientY - rect.top)
    let nearest: LocationMarker | null = null
    let minDist = Infinity
    for (const m of markersRef.current) {
      const pt = map.latLngToContainerPoint([m.y, m.x])
      const dist = Math.hypot(dropPt.x - pt.x, dropPt.y - pt.y)
      if (dist < minDist) { minDist = dist; nearest = m }
    }
    return minDist < 60 ? nearest : null
  }

  return (
    <div
      className="relative h-full w-full"
      onDragOver={(e) => { if (isDraggingCharacter) e.preventDefault() }}
      onDrop={(e) => {
        e.preventDefault()
        const characterId = e.dataTransfer.getData('characterId')
        if (!characterId) return
        const nearest = findNearestMarker(e.clientX, e.clientY, e.currentTarget)
        if (nearest) onCharacterDropRef.current(characterId, nearest.id)
      }}
      onClick={() => setContextMenu(null)}
    >
      {addMode && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-start justify-center pt-4">
          <div className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white shadow-lg">
            Click on the map to place the location
          </div>
        </div>
      )}
      {isDraggingCharacter && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-start justify-center pt-4">
          <div className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white shadow-lg">
            Drop on a location marker to place the character there
          </div>
        </div>
      )}
      <MapContainer
        ref={mapRef}
        crs={L.CRS.Simple}
        center={[h / 2, w / 2]}
        zoom={0}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[[-h * 0.2, -w * 0.2], [h * 1.2, w * 1.2]]}
        minZoom={-3}
        maxZoom={4}
        zoomSnap={0.25}
      >
        <FitBounds bounds={bounds} />
        <ZoomTracker onZoomChange={setMapZoom} />
        <ImageOverlay url={imageUrl} bounds={bounds} />
        <ClickHandler onMapClickRef={onMapClickRef} />
        <ContextMenuHandler onContextMenu={setContextMenu} />

        {/* Movement lines */}
        {movementLines.map((line) => (
          line.points.length >= 2 && (
            <Polyline
              key={line.characterId}
              positions={line.points}
              pathOptions={{
                color: line.color,
                weight: 2.5,
                opacity: 0.75,
                dashArray: '6 4',
              }}
            />
          )
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.y, marker.x]}
            icon={makeLocationIcon(marker.iconType, !!marker.linkedMapLayerId, isDraggingCharacter)}
            draggable
            eventHandlers={{
              click: () => onMarkerClickRef.current(marker.id),
              dragend: (e) => {
                const { lat, lng } = (e.target as L.Marker).getLatLng()
                updateLocationMarker(marker.id, { x: lng, y: lat })
              },
            }}
          >
            <Popup>
              <div className="min-w-32">
                <p className="font-semibold">{marker.name}</p>
                <p className="text-xs opacity-70 capitalize mb-1">{marker.iconType}</p>
                {marker.description && <p className="text-xs mb-2">{marker.description}</p>}
                {marker.linkedMapLayerId && (
                  <button
                    onClick={() => onDrillDown(marker.linkedMapLayerId!)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Open sub-map →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {charPins.map(({ character, x, y, inSubMap, portraitUrl }, idx) => (
          <Marker
            key={`${character.id}-${idx}`}
            position={[y + 20 * idx, x + 20 * idx]}
            icon={makeCharacterIcon(character.name, inSubMap, portraitUrl, mapZoom)}
            eventHandlers={{ click: () => onCharacterClick?.(character.id) }}
          >
            <Popup>
              <div>
                <p className="font-semibold text-sm">{character.name}</p>
                {inSubMap && <p className="text-xs text-[#94a3b8] mt-0.5">In sub-map</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="absolute z-[2000] min-w-[140px] overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-lg"
          style={{ left: contextMenu.screenX, top: contextMenu.screenY }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[hsl(var(--accent))] transition-colors"
            onClick={() => {
              onMapClick(contextMenu.mapX, contextMenu.mapY)
              setContextMenu(null)
            }}
          >
            <span className="text-[hsl(var(--muted-foreground))]">＋</span>
            Add Location
          </button>
        </div>
      )}
    </div>
  )
}
