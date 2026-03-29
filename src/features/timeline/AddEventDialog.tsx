import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEvent } from '@/db/hooks/useTimeline'

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worldId: string
  chapterId: string
  timelineId: string
  nextSortOrder: number
}

export function AddEventDialog({ open, onOpenChange, worldId, chapterId, timelineId, nextSortOrder }: AddEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await createEvent({
      worldId,
      chapterId,
      timelineId,
      title: title.trim(),
      description: description.trim(),
      locationMarkerId: null,
      involvedCharacterIds: [],
      involvedItemIds: [],
      tags: [],
      sortOrder: nextSortOrder,
    })
    setSaving(false)
    setTitle('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea placeholder="What happened..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? 'Saving...' : 'Add Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
