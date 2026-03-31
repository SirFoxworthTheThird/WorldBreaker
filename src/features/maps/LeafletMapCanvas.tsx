import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, Polyline, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { MapLayer, LocationMarker, Character } from '@/types'
import { updateLocationMarker } from '@/db/hooks/useLocationMarkers'

// CSS-variable shortcuts used inside DivIcon HTML strings.
// These resolve against the document root, so they automatically follow the active theme.
const V = {
  bg:     'hsl(var(--leaflet-card))',
  border: 'hsl(var(--ring))',          // accent ring — changes per theme
  frame:  'hsl(var(--leaflet-border))',// subtle structural border
  fg:     'hsl(var(--leaflet-fg))',    // primary text
  muted:  'hsl(var(--leaflet-muted))', // secondary / subtext
  font:   'var(--font-body)',          // theme font (sans / serif / mono)
} as const

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Location marker: pill badge  [◇ | Name · type] ───────────────────────────
function makeLocationIcon(iconType: string, isLinked: boolean, name: string, highlighted = false) {
  const typeColors: Record<string, string> = {
    city: '#60a5fa', town: '#34d399', dungeon: '#f87171',
    landmark: '#fbbf24', building: '#a78bfa', region: '#fb923c', custom: '#94a3b8',
  }
  const color   = typeColors[iconType] ?? '#94a3b8'
  const pillH   = 32
  const iconW   = 28          // diamond section width
  const side    = 10          // diamond square side before rotation
  const labelW  = Math.max(88, name.length * 8 + 16)

  const innerBg = isLinked
    ? `radial-gradient(circle at center,#fff 20%,${color} 55%)`
    : color

  const glowFilter = highlighted
    ? `drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 6px ${color})`
    : 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))'

  const diamond  = `<div style="width:${side}px;height:${side}px;background:${innerBg};border:1.5px solid ${V.frame};transform:rotate(45deg);flex-shrink:0;"></div>`
  const iconArea = `<div style="width:${iconW}px;height:${pillH}px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${diamond}</div>`
  const divider  = `<div style="width:1px;height:${Math.round(pillH * 0.65)}px;align-self:center;background:${V.frame};opacity:0.6;flex-shrink:0;"></div>`
  const label    = `<div style="display:flex;flex-direction:column;justify-content:center;padding:0 8px;min-width:${labelW}px;height:${pillH}px;overflow:hidden;">
    <div style="color:${V.fg};font-size:11px;font-family:${V.font};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</div>
    <div style="color:${V.muted};font-size:9px;font-family:${V.font};line-height:1.3;text-transform:capitalize;white-space:nowrap;">${escapeHtml(iconType)}</div>
  </div>`

  const pill = `<div style="display:inline-flex;align-items:stretch;border:1px solid ${V.border};border-radius:4px;background:${V.bg};overflow:hidden;">${iconArea}${divider}${label}</div>`
  const html = `<div style="display:inline-block;filter:${glowFilter};">${pill}</div>`

  const totalW = iconW + 1 + labelW + 2
  const totalH = pillH + 2

  return L.divIcon({
    html, className: '',
    iconSize:    [totalW, totalH],
    iconAnchor:  [1 + Math.round(iconW / 2), Math.round(totalH / 2)],
    popupAnchor: [totalW / 2 - Math.round(iconW / 2), -Math.round(totalH / 2)],
  })
}

// ── Character marker: pill badge  [○portrait | Name · sub] ───────────────────
export interface CharacterPin {
  character: Character
  x: number
  y: number
  inSubMap: boolean
  portraitUrl?: string | null
}

function makeCharacterGroupIcon(pins: CharacterPin[], zoom: number): L.DivIcon {
  const size  = Math.max(20, Math.min(80, Math.round(36 * Math.pow(2, zoom))))
  const first = pins[0]
  const n     = pins.length
  const extra = n - 1

  const fontSize = Math.round(size * 0.36)
  const opacity  = first.inSubMap ? '0.65' : '1'

  const avatarContent = first.portraitUrl
    ? `<img src="${escapeHtml(first.portraitUrl)}" style="width:100%;height:100%;object-fit:cover;display:block;">`
    : `<span style="color:${V.border};font-size:${fontSize}px;font-weight:bold;font-family:${V.font};line-height:1;user-select:none;">${escapeHtml(first.character.name.slice(0, 2).toUpperCase())}</span>`

  const avatarInner = `<div style="width:${size}px;height:${size}px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${V.bg};opacity:${opacity};flex-shrink:0;">${avatarContent}</div>`

  // "+N" overflow badge
  const bs    = Math.round(size * 0.38)
  const badge = extra > 0
    ? `<div style="position:absolute;right:-${Math.round(bs * 0.2)}px;bottom:-${Math.round(bs * 0.2)}px;width:${bs}px;height:${bs}px;border-radius:50%;background:${V.border};border:1px solid ${V.fg};display:flex;align-items:center;justify-content:center;font-size:${Math.max(7, Math.round(bs * 0.55))}px;font-weight:bold;font-family:${V.font};color:${V.bg};z-index:10;">+${extra}</div>`
    : ''

  const avatarWrap = `<div style="position:relative;flex-shrink:0;width:${size}px;height:${size}px;">${avatarInner}${badge}</div>`

  const divider = `<div style="width:1px;height:${Math.round(size * 0.65)}px;align-self:center;background:${V.frame};opacity:0.6;flex-shrink:0;"></div>`

  const labelText = n === 1 ? escapeHtml(first.character.name) : `${n} characters`
  const subText   = n === 1 && first.inSubMap ? 'In sub-map' : ''
  const fsPrimary = Math.max(10, Math.round(size * 0.3))
  const fsSub     = Math.max(8,  Math.round(size * 0.24))
  const labelW    = 110

  const labelBox = `<div style="display:flex;flex-direction:column;justify-content:center;padding:0 8px;min-width:${labelW}px;height:${size}px;overflow:hidden;">
    <div style="color:${V.fg};font-size:${fsPrimary}px;font-family:${V.font};line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${labelText}</div>
    ${subText ? `<div style="color:${V.muted};font-size:${fsSub}px;font-family:${V.font};line-height:1.3;white-space:nowrap;">${subText}</div>` : ''}
  </div>`

  // Left border-radius matches avatar circle curvature so the pill "is" the avatar on the left
  const r    = Math.round(size / 2) + 1
  const pill = `<div style="display:inline-flex;align-items:stretch;border:1px solid ${V.border};border-radius:${r}px 4px 4px ${r}px;background:${V.bg};overflow:hidden;">${avatarWrap}${divider}${labelBox}</div>`
  const html = `<div style="display:inline-block;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.9));">${pill}</div>`

  const totalW = size + 1 + labelW + 2
  const totalH = size + 2

  return L.divIcon({
    html, className: '',
    iconSize:    [totalW, totalH],
    iconAnchor:  [1 + Math.round(size / 2), Math.round(totalH / 2)],
    popupAnchor: [totalW / 2 - Math.round(size / 2), -Math.round(totalH / 2)],
  })
}

// ── Inner map-event components ────────────────────────────────────────────────
function ClickHandler({ onMapClickRef }: { onMapClickRef: React.RefObject<(latlng: L.LatLng) => void> }) {
  useMapEvents({ click: (e) => onMapClickRef.current?.(e.latlng) })
  return null
}

interface ContextMenuState { screenX: number; screenY: number; mapX: number; mapY: number }

function ContextMenuHandler({ onContextMenu }: { onContextMenu: (s: ContextMenuState) => void }) {
  useMapEvents({
    contextmenu: (e) => {
      L.DomEvent.preventDefault(e.originalEvent)
      onContextMenu({ screenX: e.containerPoint.x, screenY: e.containerPoint.y, mapX: e.latlng.lng, mapY: e.latlng.lat })
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

// ── Public types ──────────────────────────────────────────────────────────────
export interface MovementLine {
  characterId: string
  color: string
  points: [number, number][]
  distanceLabel?: string
}

export interface ScaleCalibrationPoint { x: number; y: number }

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
  scaleMode?: boolean
  onScalePoints?: (p1: ScaleCalibrationPoint, p2: ScaleCalibrationPoint) => void
  showSubMapLinks?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LeafletMapCanvas({
  layer, imageUrl, markers, charPins, movementLines,
  isDraggingCharacter, onMarkerClick, onMapClick, onDrillDown,
  onCharacterDrop, onCharacterClick, mapRef: externalMapRef,
  scaleMode, onScalePoints, showSubMapLinks = true,
}: LeafletMapCanvasProps) {
  const internalMapRef = useRef<L.Map | null>(null)
  const mapRef         = externalMapRef ?? internalMapRef
  const [mapZoom, setMapZoom]         = useState(0)
  const [addMode, setAddMode]         = useState(false)
  const addModeRef                    = useRef(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [scalePoint1, setScalePoint1] = useState<ScaleCalibrationPoint | null>(null)
  const onMapClickRef      = useRef<(latlng: L.LatLng) => void>(() => {})
  const onMarkerClickRef   = useRef(onMarkerClick)
  const onCharacterDropRef = useRef(onCharacterDrop)
  const markersRef         = useRef(markers)

  onMarkerClickRef.current   = onMarkerClick
  onCharacterDropRef.current = onCharacterDrop
  markersRef.current         = markers

  const w      = layer.imageWidth
  const h      = layer.imageHeight
  const bounds = useMemo<L.LatLngBoundsExpression>(() => [[0, 0], [h, w]], [h, w])

  // Group charPins by map position so co-located characters share one marker
  const pinGroups = useMemo<CharacterPin[][]>(() => {
    const groups = new Map<string, CharacterPin[]>()
    for (const pin of charPins) {
      const key = `${Math.round(pin.x)},${Math.round(pin.y)}`
      const g   = groups.get(key) ?? []
      g.push(pin)
      groups.set(key, g)
    }
    return Array.from(groups.values())
  }, [charPins])

  onMapClickRef.current = (latlng: L.LatLng) => {
    if (scaleMode) {
      const pt = { x: latlng.lng, y: latlng.lat }
      if (!scalePoint1) {
        setScalePoint1(pt)
      } else {
        onScalePoints?.(scalePoint1, pt)
        setScalePoint1(null)
      }
      return
    }
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

  useEffect(() => {
    if (!scaleMode) setScalePoint1(null)
  }, [scaleMode])

  function findNearestMarker(clientX: number, clientY: number, el: HTMLElement): LocationMarker | null {
    const map = mapRef.current
    if (!map) return null
    const rect   = el.getBoundingClientRect()
    const dropPt = L.point(clientX - rect.left, clientY - rect.top)
    let nearest: LocationMarker | null = null
    let minDist = Infinity
    for (const m of markersRef.current) {
      const pt   = map.latLngToContainerPoint([m.y, m.x])
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
      {scaleMode && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-start justify-center pt-4">
          <div className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white shadow-lg">
            {scalePoint1 ? 'Now click the second point' : 'Click the first point on the map'}
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
        minZoom={-3} maxZoom={4} zoomSnap={0.25}
      >
        <FitBounds bounds={bounds} />
        <ZoomTracker onZoomChange={setMapZoom} />
        <ImageOverlay url={imageUrl} bounds={bounds} />
        <ClickHandler onMapClickRef={onMapClickRef} />
        <ContextMenuHandler onContextMenu={setContextMenu} />

        {/* Movement lines */}
        {movementLines.map((line) =>
          line.points.length >= 2 && (
            <Polyline
              key={line.characterId}
              positions={line.points}
              pathOptions={{ color: line.color, weight: 2.5, opacity: 0.75, dashArray: '6 4' }}
            >
              {line.distanceLabel && (
                <Tooltip permanent direction="center" className="movement-distance-tooltip">
                  {line.distanceLabel}
                </Tooltip>
              )}
            </Polyline>
          )
        )}

        {/* Scale calibration markers */}
        {scalePoint1 && (
          <CircleMarker
            center={[scalePoint1.y, scalePoint1.x]}
            radius={6}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }}
          />
        )}

        {/* Location markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.y, marker.x]}
            icon={makeLocationIcon(marker.iconType, !!marker.linkedMapLayerId && showSubMapLinks, marker.name, isDraggingCharacter)}
            zIndexOffset={isDraggingCharacter ? 2000 : -100}
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
                  <button onClick={() => onDrillDown(marker.linkedMapLayerId!)} className="text-xs text-blue-400 hover:underline">
                    Open sub-map →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Character markers */}
        {pinGroups.map((group) => {
          const first = group[0]
          const key   = `grp-${Math.round(first.x)}-${Math.round(first.y)}`

          if (group.length === 1) {
            return (
              <Marker
                key={first.character.id}
                position={[first.y, first.x]}
                icon={makeCharacterGroupIcon(group, mapZoom)}
                zIndexOffset={1000}
                eventHandlers={{ click: () => onCharacterClick?.(first.character.id) }}
              />
            )
          }

          return (
            <Marker
              key={key}
              position={[first.y, first.x]}
              icon={makeCharacterGroupIcon(group, mapZoom)}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ minWidth: 110 }}>
                  <p style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: 'hsl(var(--ring))', fontFamily: 'var(--font-body)' }}>
                    At this location:
                  </p>
                  {group.map((pin) => (
                    <button
                      key={pin.character.id}
                      onClick={() => onCharacterClick?.(pin.character.id)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '2px 4px', fontSize: 12, cursor: 'pointer', borderRadius: 3, background: 'none', border: 'none', fontFamily: 'var(--font-body)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {pin.character.name}
                      {pin.inSubMap && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>(sub-map)</span>}
                    </button>
                  ))}
                </div>
              </Popup>
            </Marker>
          )
        })}
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
            onClick={() => { onMapClick(contextMenu.mapX, contextMenu.mapY); setContextMenu(null) }}
          >
            <span className="text-[hsl(var(--muted-foreground))]">＋</span>
            Add Location
          </button>
        </div>
      )}
    </div>
  )
}
