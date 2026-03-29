import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorldSlice {
  activeWorldId: string | null
  setActiveWorldId: (id: string | null) => void
}

interface ChapterSlice {
  activeChapterId: string | null
  setActiveChapterId: (id: string | null) => void
}

interface MapSlice {
  activeMapLayerId: string | null
  mapLayerHistory: string[]
  setActiveMapLayerId: (id: string) => void
  pushMapLayer: (id: string) => void
  popMapLayer: () => void
  resetMapHistory: (rootId: string) => void
}

interface UISlice {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  selectedLocationMarkerId: string | null
  setSelectedLocationMarkerId: (id: string | null) => void
  selectedCharacterId: string | null
  setSelectedCharacterId: (id: string | null) => void
  selectedRelationshipId: string | null
  setSelectedRelationshipId: (id: string | null) => void
}

type AppStore = WorldSlice & ChapterSlice & MapSlice & UISlice

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // World
      activeWorldId: null,
      setActiveWorldId: (id) => set({ activeWorldId: id, activeChapterId: null }),

      // Chapter (the global time cursor)
      activeChapterId: null,
      setActiveChapterId: (id) => set({ activeChapterId: id }),

      // Map
      activeMapLayerId: null,
      mapLayerHistory: [],
      setActiveMapLayerId: (id) => set({ activeMapLayerId: id, mapLayerHistory: [id] }),
      pushMapLayer: (id) =>
        set((state) => ({
          activeMapLayerId: id,
          mapLayerHistory: [...state.mapLayerHistory, id],
        })),
      popMapLayer: () =>
        set((state) => {
          const history = state.mapLayerHistory.slice(0, -1)
          return {
            mapLayerHistory: history,
            activeMapLayerId: history[history.length - 1] ?? null,
          }
        }),
      resetMapHistory: (rootId) =>
        set({ activeMapLayerId: rootId, mapLayerHistory: [rootId] }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      selectedLocationMarkerId: null,
      setSelectedLocationMarkerId: (id) => set({ selectedLocationMarkerId: id }),
      selectedCharacterId: null,
      setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
      selectedRelationshipId: null,
      setSelectedRelationshipId: (id) => set({ selectedRelationshipId: id }),
    }),
    {
      name: 'worldbreaker-ui',
      partialize: (state) => ({
        activeWorldId: state.activeWorldId,
        activeChapterId: state.activeChapterId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Convenience selectors
export const useActiveWorldId = () => useAppStore((s) => s.activeWorldId)
export const useActiveChapterId = () => useAppStore((s) => s.activeChapterId)
export const useActiveMapLayerId = () => useAppStore((s) => s.activeMapLayerId)
export const useMapLayerHistory = () => useAppStore((s) => s.mapLayerHistory)
