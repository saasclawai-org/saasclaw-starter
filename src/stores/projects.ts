import { create } from 'zustand'
import { projects as projectsApi, type Project } from '../api/client'
import { useAuthStore } from './auth'

interface ProjectsState {
  projects: Project[]
  current: Project | null
  loading: boolean
  error: string | null

  fetchAll: () => Promise<void>
  fetchOne: (slug: string) => Promise<void>
  create: (data: { name: string; framework: string; description?: string }) => Promise<Project>
  delete: (slug: string) => Promise<void>
  clearCurrent: () => void
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  current: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    const token = useAuthStore.getState().token
    if (!token) return
    set({ loading: true, error: null })
    try {
      const list = await projectsApi.list(token)
      set({ projects: list, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchOne: async (slug: string) => {
    const token = useAuthStore.getState().token
    if (!token) return
    set({ loading: true, error: null })
    try {
      const project = await projectsApi.get(token, slug)
      set({ current: project, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const token = useAuthStore.getState().token!
    const project = await projectsApi.create(token, data)
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  delete: async (slug) => {
    const token = useAuthStore.getState().token!
    await projectsApi.delete(token, slug)
    set((s) => ({
      projects: s.projects.filter((p) => p.slug !== slug),
      current: s.current?.slug === slug ? null : s.current,
    }))
  },

  clearCurrent: () => set({ current: null }),
}))