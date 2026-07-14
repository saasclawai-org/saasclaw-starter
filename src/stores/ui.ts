import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  activeTab: 'chat' | 'files' | 'deploy' | 'env' | 'settings'

  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setActiveTab: (tab: UIState['activeTab']) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTab: 'chat',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))