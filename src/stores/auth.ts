import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth as authApi } from '../api/client'

interface AuthState {
  token: string | null
  refreshToken: string | null
  email: string | null
  error: string | null
  loading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      email: null,
      error: null,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const res = await authApi.login(email, password)
          set({ token: res.access, refreshToken: res.refresh, email, loading: false })
        } catch (err) {
          set({ error: (err as Error).message, loading: false })
          throw err
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ loading: true, error: null })
        try {
          const res = await authApi.register(email, password, name)
          set({ token: res.access, refreshToken: res.refresh, email, loading: false })
        } catch (err) {
          set({ error: (err as Error).message, loading: false })
          throw err
        }
      },

      logout: () => {
        set({ token: null, refreshToken: null, email: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'saasclaw-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        email: state.email,
      }),
    },
  ),
)