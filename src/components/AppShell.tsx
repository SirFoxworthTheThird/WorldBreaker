import { Outlet, useParams, useMatch } from 'react-router-dom'
import { TopBar } from './TopBar'
import { ChapterTimelineBar } from './ChapterTimelineBar'
import { useAppStore } from '@/store'
import { useEffect } from 'react'

export function AppShell() {
  const { worldId } = useParams<{ worldId: string }>()
  const { setActiveWorldId } = useAppStore()
  const isDashboard = !!useMatch('/worlds/:worldId')

  useEffect(() => {
    if (worldId) setActiveWorldId(worldId)
  }, [worldId, setActiveWorldId])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))]">
      <TopBar />
      {!isDashboard && <ChapterTimelineBar />}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
