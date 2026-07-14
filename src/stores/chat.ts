import { create } from 'zustand'
import { sessions as sessionsApi, type Message } from '../api/client'
import { useAuthStore } from './auth'

interface Session {
  id: string
  created_at: string
  title: string
  last_message: string
  status: string
}

interface ChatState {
  messages: Message[]
  streaming: boolean
  currentSessionId: string | null
  sessions: Session[]
  abortController: AbortController | null
  loading: boolean

  setSessionId: (id: string) => void
  addMessage: (msg: Message) => void
  appendToLast: (content: string) => void
  setStreaming: (v: boolean) => void
  setAbortController: (ctrl: AbortController | null) => void
  loadSessions: (slug: string) => Promise<void>
  createSession: (slug: string, title?: string) => Promise<string | null>
  loadSession: (slug: string, id: string) => Promise<void>
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,
  currentSessionId: null,
  sessions: [],
  abortController: null,
  loading: false,

  setSessionId: (id) => set({ currentSessionId: id }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLast: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1]
        msgs[msgs.length - 1] = { ...last, content: last.content + content }
      }
      return { messages: msgs }
    }),

  setStreaming: (v) => set({ streaming: v }),

  setAbortController: (ctrl) => set({ abortController: ctrl }),

  loadSessions: async (slug: string) => {
    const token = useAuthStore.getState().token
    if (!token) return
    try {
      const list = await sessionsApi.list(token, slug)
      const mapped: Session[] = (list as Array<{ id: string; created_at: string; title?: string; last_message?: string; status?: string }>).map((s) => ({
        id: s.id,
        created_at: s.created_at,
        title: s.title || 'Chat',
        last_message: s.last_message || '',
        status: s.status || 'idle',
      }))
      set({ sessions: mapped })
    } catch {
      // Session list might not be available yet
    }
  },

  createSession: async (slug: string, title?: string) => {
    const token = useAuthStore.getState().token
    if (!token) return null
    try {
      const sess = await sessionsApi.create(token, slug)
      const newSession: Session = {
        id: sess.id,
        created_at: sess.created_at,
        title: title || 'New chat',
        last_message: '',
        status: 'idle',
      }
      set((s) => ({ sessions: [newSession, ...s.sessions], currentSessionId: sess.id, messages: [] }))
      return sess.id
    } catch {
      return null
    }
  },

  loadSession: async (slug: string, id: string) => {
    const token = useAuthStore.getState().token
    if (!token) return
    set({ loading: true })
    try {
      const sess = await sessionsApi.get(token, slug, id)
      set({ currentSessionId: id, messages: sess.messages || [], loading: false })
    } catch {
      set({ loading: false })
    }
  },

  reset: () => set({ messages: [], streaming: false, currentSessionId: null, sessions: [], abortController: null }),
}))