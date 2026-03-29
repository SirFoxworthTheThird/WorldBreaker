import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { X, Trash2, Network, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCharacters } from '@/db/hooks/useCharacters'
import { useRelationships, deleteRelationship } from '@/db/hooks/useRelationships'
import { PortraitImage } from '@/components/PortraitImage'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import type { RelationshipSentiment } from '@/types'

// ─── Custom Node ────────────────────────────────────────────────────────────

function CharacterNode({ data }: { data: { name: string; portraitImageId: string | null } }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-lg min-w-20">
      <Handle type="target" position={Position.Left} style={{ background: 'hsl(212,72%,59%)' }} />
      <PortraitImage
        imageId={data.portraitImageId}
        alt={data.name}
        className="h-10 w-10 rounded-full object-cover"
        fallbackClassName="h-10 w-10 rounded-full"
      />
      <span className="text-xs font-medium text-[hsl(var(--foreground))] max-w-24 text-center leading-tight">
        {data.name}
      </span>
      <Handle type="source" position={Position.Right} style={{ background: 'hsl(212,72%,59%)' }} />
    </div>
  )
}

// ─── Custom Edge ────────────────────────────────────────────────────────────

const SENTIMENT_COLORS: Record<RelationshipSentiment, string> = {
  positive: '#4ade80',
  neutral: '#94a3b8',
  negative: '#f87171',
  complex: '#fbbf24',
}

function RelationshipEdge({
  id, sourceX, sourceY, targetX, targetY, data, markerEnd,
}: {
  id: string
  sourceX: number; sourceY: number; targetX: number; targetY: number
  data: { label: string; sentiment: RelationshipSentiment; onSelect: (id: string) => void }
  markerEnd?: string
}) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const color = SENTIMENT_COLORS[data.sentiment]

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <button
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="pointer-events-all absolute rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-1.5 py-0.5 text-xs hover:bg-[hsl(var(--accent))] nodrag nopan"
          onClick={() => data.onSelect(id)}
        >
          {data.label}
        </button>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes: NodeTypes = { character: CharacterNode }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdge }

// ─── Main View ──────────────────────────────────────────────────────────────

export default function RelationshipGraphView() {
  const { worldId } = useParams<{ worldId: string }>()
  const navigate = useNavigate()
  const characters = useCharacters(worldId ?? null)
  const relationships = useRelationships(worldId ?? null)
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Sync nodes whenever characters change (fixes async Dexie load)
  useEffect(() => {
    setNodes(
      characters.map((c, i) => ({
        id: c.id,
        type: 'character',
        position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 160 },
        data: { name: c.name, portraitImageId: c.portraitImageId },
      }))
    )
  }, [characters, setNodes])

  // Sync edges whenever relationships change
  useEffect(() => {
    setEdges(
      relationships.map((r) => ({
        id: r.id,
        source: r.characterAId,
        target: r.characterBId,
        type: 'relationship',
        data: { label: r.label, sentiment: r.sentiment, onSelect: setSelectedRelId },
      }))
    )
  }, [relationships, setEdges])

  const selectedRel = relationships.find((r) => r.id === selectedRelId)
  const charA = characters.find((c) => c.id === selectedRel?.characterAId)
  const charB = characters.find((c) => c.id === selectedRel?.characterBId)

  if (characters.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No characters yet"
        description="Add characters first, then come back here to define their relationships."
        action={
          <Button onClick={() => navigate(`/worlds/${worldId}/characters`)}>
            <Plus className="h-4 w-4" /> Go to Characters
          </Button>
        }
        className="h-full"
      />
    )
  }

  return (
    <div className="relative flex" style={{ height: 'calc(100vh - 3rem)' }}>
      <div className="flex-1" style={{ background: 'hsl(222,47%,9%)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          style={{ background: 'hsl(222,47%,9%)' }}
        >
          <Background color="#334155" gap={20} />
          <Controls style={{ background: 'hsl(222,47%,14%)', borderColor: 'hsl(217,33%,22%)' }} />
          <MiniMap
            nodeColor="hsl(222,47%,20%)"
            maskColor="rgba(0,0,0,0.4)"
            style={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(217,33%,22%)' }}
          />
        </ReactFlow>
      </div>

      {selectedRel && (
        <div className="flex w-64 shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <span className="text-sm font-semibold">Relationship</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedRelId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            <div className="text-center">
              <p className="font-semibold">{charA?.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] my-1">↕ {selectedRel.label}</p>
              <p className="font-semibold">{charB?.name}</p>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <p><span className="font-medium text-[hsl(var(--foreground))]">Strength:</span> {selectedRel.strength}</p>
              <p><span className="font-medium text-[hsl(var(--foreground))]">Sentiment:</span> {selectedRel.sentiment}</p>
            </div>
            {selectedRel.description && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedRel.description}</p>
            )}
          </div>
          <div className="border-t border-[hsl(var(--border))] p-3">
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1.5"
              onClick={async () => {
                await deleteRelationship(selectedRel.id)
                setSelectedRelId(null)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
