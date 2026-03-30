import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Trash2, Check, X } from 'lucide-react'
import { useItem, updateItem, deleteItem } from '@/db/hooks/useItems'
import { storeBlob } from '@/db/hooks/useBlobs'
import { PortraitImage } from '@/components/PortraitImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Package } from 'lucide-react'

export default function ItemDetailView() {
  const { worldId, itemId } = useParams<{ worldId: string; itemId: string }>()
  const navigate = useNavigate()
  const item = useItem(itemId ?? null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconType, setIconType] = useState('')

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Item not found.
      </div>
    )
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !worldId) return
    const blob = await storeBlob(worldId, file)
    await updateItem(item!.id, { imageId: blob.id })
  }

  async function handleDelete() {
    if (confirm(`Delete "${item!.name}"?`)) {
      await deleteItem(item!.id)
      navigate(`/worlds/${worldId}/items`)
    }
  }

  async function save() {
    await updateItem(item!.id, {
      name: name.trim(),
      description: description.trim(),
      iconType: iconType.trim(),
    })
    setEditing(false)
  }

  function startEditing() {
    setName(item!.name)
    setDescription(item!.description)
    setIconType(item!.iconType)
    setEditing(true)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Image */}
        <div className="relative">
          <PortraitImage
            imageId={item.imageId}
            alt={item.name}
            className="h-12 w-12 rounded-md object-cover"
            fallbackClassName="h-12 w-12 rounded-md"
            fallbackIcon={Package}
          />
          <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-[hsl(var(--accent))] p-1 hover:bg-[hsl(var(--secondary))]">
            <Upload className="h-3 w-3 text-[hsl(var(--foreground))]" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <div>
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{item.name}</h2>
          {item.iconType && (
            <p className="text-xs capitalize text-[hsl(var(--muted-foreground))]">{item.iconType}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 hover:text-red-400"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {!editing ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">{item.name}</h3>
                {item.iconType && (
                  <p className="text-xs capitalize text-[hsl(var(--muted-foreground))]">{item.iconType}</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={startEditing}>
                Edit
              </Button>
            </div>
            {item.description ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{item.description}</p>
            ) : (
              <p className="text-sm italic text-[hsl(var(--muted-foreground))]">No description.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type / Category</Label>
              <Input
                value={iconType}
                onChange={(e) => setIconType(e.target.value)}
                placeholder="e.g. weapon, artifact, key item"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={!name.trim()}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
