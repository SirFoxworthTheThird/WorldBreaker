import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store'

const INITIAL: Parameters<typeof useAppStore.setState>[0] = {
  activeWorldId: null,
  activeChapterId: null,
  activeMapLayerId: null,
  mapLayerHistory: [],
  sidebarOpen: true,
  selectedLocationMarkerId: null,
  selectedCharacterId: null,
  selectedRelationshipId: null,
  theme: 'default',
}

beforeEach(() => {
  useAppStore.setState(INITIAL)
})

// ── WorldSlice ────────────────────────────────────────────────────────────────

describe('WorldSlice', () => {
  it('sets the active world id', () => {
    useAppStore.getState().setActiveWorldId('world-1')
    expect(useAppStore.getState().activeWorldId).toBe('world-1')
  })

  it('clears the active chapter when the world changes', () => {
    useAppStore.setState({ activeChapterId: 'ch-1' })
    useAppStore.getState().setActiveWorldId('world-2')
    expect(useAppStore.getState().activeChapterId).toBeNull()
  })

  it('accepts null to clear the active world', () => {
    useAppStore.setState({ activeWorldId: 'world-1' })
    useAppStore.getState().setActiveWorldId(null)
    expect(useAppStore.getState().activeWorldId).toBeNull()
  })
})

// ── ChapterSlice ──────────────────────────────────────────────────────────────

describe('ChapterSlice', () => {
  it('sets the active chapter id', () => {
    useAppStore.getState().setActiveChapterId('ch-1')
    expect(useAppStore.getState().activeChapterId).toBe('ch-1')
  })

  it('accepts null to clear the active chapter', () => {
    useAppStore.setState({ activeChapterId: 'ch-1' })
    useAppStore.getState().setActiveChapterId(null)
    expect(useAppStore.getState().activeChapterId).toBeNull()
  })
})

// ── MapSlice ──────────────────────────────────────────────────────────────────

describe('MapSlice — setActiveMapLayerId', () => {
  it('sets the active layer and resets history to a single entry', () => {
    useAppStore.setState({ mapLayerHistory: ['old-1', 'old-2'] })
    useAppStore.getState().setActiveMapLayerId('layer-root')
    expect(useAppStore.getState().activeMapLayerId).toBe('layer-root')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['layer-root'])
  })
})

describe('MapSlice — pushMapLayer', () => {
  it('appends to history and updates the active layer', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().pushMapLayer('child-1')
    expect(useAppStore.getState().activeMapLayerId).toBe('child-1')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['root', 'child-1'])
  })

  it('supports multiple levels of depth', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().pushMapLayer('child-1')
    useAppStore.getState().pushMapLayer('child-2')
    expect(useAppStore.getState().activeMapLayerId).toBe('child-2')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['root', 'child-1', 'child-2'])
  })
})

describe('MapSlice — popMapLayer', () => {
  it('navigates back to the previous layer', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().pushMapLayer('child-1')
    useAppStore.getState().popMapLayer()
    expect(useAppStore.getState().activeMapLayerId).toBe('root')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['root'])
  })

  it('sets activeMapLayerId to null when popping the last entry', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().popMapLayer()
    expect(useAppStore.getState().activeMapLayerId).toBeNull()
    expect(useAppStore.getState().mapLayerHistory).toEqual([])
  })

  it('is a no-op (null) when history is already empty', () => {
    useAppStore.getState().popMapLayer()
    expect(useAppStore.getState().activeMapLayerId).toBeNull()
  })

  it('correctly unwinds multiple levels', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().pushMapLayer('child-1')
    useAppStore.getState().pushMapLayer('child-2')
    useAppStore.getState().popMapLayer()
    useAppStore.getState().popMapLayer()
    expect(useAppStore.getState().activeMapLayerId).toBe('root')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['root'])
  })
})

describe('MapSlice — resetMapHistory', () => {
  it('discards deep history and resets to the given root', () => {
    useAppStore.getState().setActiveMapLayerId('root')
    useAppStore.getState().pushMapLayer('child-1')
    useAppStore.getState().pushMapLayer('child-2')
    useAppStore.getState().resetMapHistory('new-root')
    expect(useAppStore.getState().activeMapLayerId).toBe('new-root')
    expect(useAppStore.getState().mapLayerHistory).toEqual(['new-root'])
  })
})

// ── UISlice ───────────────────────────────────────────────────────────────────

describe('UISlice', () => {
  it('toggles sidebar open/closed', () => {
    useAppStore.setState({ sidebarOpen: true })
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('sets sidebar explicitly', () => {
    useAppStore.getState().setSidebarOpen(false)
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().setSidebarOpen(true)
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('sets the active theme', () => {
    useAppStore.getState().setTheme('fantasy')
    expect(useAppStore.getState().theme).toBe('fantasy')
    useAppStore.getState().setTheme('cyberpunk')
    expect(useAppStore.getState().theme).toBe('cyberpunk')
  })

  it('sets the selected location marker', () => {
    useAppStore.getState().setSelectedLocationMarkerId('loc-1')
    expect(useAppStore.getState().selectedLocationMarkerId).toBe('loc-1')
    useAppStore.getState().setSelectedLocationMarkerId(null)
    expect(useAppStore.getState().selectedLocationMarkerId).toBeNull()
  })

  it('sets the selected character', () => {
    useAppStore.getState().setSelectedCharacterId('char-1')
    expect(useAppStore.getState().selectedCharacterId).toBe('char-1')
    useAppStore.getState().setSelectedCharacterId(null)
    expect(useAppStore.getState().selectedCharacterId).toBeNull()
  })

  it('sets the selected relationship', () => {
    useAppStore.getState().setSelectedRelationshipId('rel-1')
    expect(useAppStore.getState().selectedRelationshipId).toBe('rel-1')
    useAppStore.getState().setSelectedRelationshipId(null)
    expect(useAppStore.getState().selectedRelationshipId).toBeNull()
  })
})
