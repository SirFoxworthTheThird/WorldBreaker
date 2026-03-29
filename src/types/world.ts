export interface World {
  id: string
  name: string
  description: string
  coverImageId: string | null
  createdAt: number
  updatedAt: number
}

export interface AppPreferences {
  id: 1
  activeWorldId: string | null
  theme: 'dark' | 'light'
  sidebarWidth: number
  defaultTimelineId: string | null
}
