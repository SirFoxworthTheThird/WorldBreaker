import { useBlobUrl } from '@/db/hooks/useBlobs'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface PortraitImageProps {
  imageId: string | null | undefined
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function PortraitImage({ imageId, alt, className, fallbackClassName }: PortraitImageProps) {
  const url = useBlobUrl(imageId ?? null)

  if (!url) {
    return (
      <div className={cn('flex items-center justify-center bg-[hsl(var(--muted))]', fallbackClassName ?? className)}>
        <User className="h-1/2 w-1/2 text-[hsl(var(--muted-foreground))]" />
      </div>
    )
  }

  return <img src={url} alt={alt ?? ''} className={cn('object-cover', className)} />
}
