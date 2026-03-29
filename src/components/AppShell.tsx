import { Outlet, useParams } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { useAppStore } from '@/store'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { worldId } = useParams<{ worldId: string }>()
  const { setActiveWorldId, sidebarOpen } = useAppStore()

  useEffect(() => {
    if (worldId) setActiveWorldId(worldId)
  }, [worldId, setActiveWorldId])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main
          className={cn(
            'flex-1 overflow-auto transition-all duration-200',
            sidebarOpen ? 'ml-0' : 'ml-0'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
