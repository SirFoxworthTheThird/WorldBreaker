import { useEffect, useRef, useState } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { MapLayer, LocationMarker, Character } from '@/types'

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

function makeCharacterIcon(name: string, inSubMap = false) {
  const initials = escapeXml(name.slice(0, 2).toUpperCase())
  const stroke = inSubMap ? 'stroke="#94a3b8" stroke-dasharray="4,2"' : 'stroke="#60a5fa"'
  const fill = inSubMap ? '#0f172a' : '#1e293b'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
    <circle cx="18" cy="18" r="17" fill="${fill}" ${stroke} stroke-width="2"/>
    <text x="18" y="23" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="${inSubMap ? '#94a3b8' : '#e2e8f0'}">${initials}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

function ClickHandler({ onMapClickRef }: { onMapClickRef: React.RefObject<(latlng: L.LatLng) => void> }) {
  useMapEvents({ click: (e) => onMapClickRef.current?.(e.latlng) })
  return null
}

export interface CharacterPin {
  character: Character
  x: number
  y: number
  inSubMap: boolean
}

interface LeafletMapCanvasProps {
  layer: MapLayer
  imageUrl: string
  markers: LocationMarker[]
  charPins: CharacterPin[]
  isDraggingCharacter: boolean
  onMarkerClick: (markerId: string) => void
  onMapClick: (x: number, y: number) => void
  onDrillDown: (mapLayerId: string) => void
  onCharacterDrop: (characterId: string, markerId: string) => void
}

export function LeafletMapCanvas({
  layer,
  imageUrl,
  markers,
  charPins,
  isDraggingCharacter,
  onMarkerClick,
  onMapClick,
  onDrillDown,
  onCharacterDrop,
}: LeafletMapCanvasProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [addMode, setAddMode] = useState(false)
  const addModeRef = useRef(false)
  const onMapClickRef = useRef<(latlng: L.LatLng) => void>(() => {})
  const onMarkerClickRef = useRef(onMarkerClick)
  const onCharacterDropRef = useRef(onCharacterDrop)
  const markersRef = useRef(markers)

  onMarkerClickRef.current = onMarkerClick
  onCharacterDropRef.current = onCharacterDrop
  markersRef.current = markers

  const w = layer.imageWidth
  const h = layer.imageHeight
  const bounds: L.LatLngBoundsExpression = [[0, 0], [h, w]]

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
        bounds={bounds}
        style={{ height: '100%', width: '100%' }}
        maxBounds={[[-h * 0.2, -w * 0.2], [h * 1.2, w * 1.2]]}
        minZoom={-3}
        maxZoom={4}
        zoomSnap={0.5}
      >
        <ImageOverlay url={imageUrl} bounds={bounds} />
        <ClickHandler onMapClickRef={onMapClickRef} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.y, marker.x]}
            icon={makeLocationIcon(marker.iconType, !!marker.linkedMapLayerId, isDraggingCharacter)}
            eventHandlers={{ click: () => onMarkerClickRef.current(marker.id) }}
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

        {charPins.map(({ character, x, y, inSubMap }, idx) => (
          <Marker
            key={`${character.id}-${idx}`}
            position={[y + 20 * idx, x + 20 * idx]}
            icon={makeCharacterIcon(character.name, inSubMap)}
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
    </div>
  )
}
