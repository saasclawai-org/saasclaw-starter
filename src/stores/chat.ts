import { create } from 'zustand'
import { type Message } from '../api/client'

interface ChatState {
  messages: Message[]
  streaming: boolean
  currentSessionId: string | null
  abortController: AbortController | null

  setSessionId: (id: string) => void
  setMessages: (msgs: Message[]) => void
  addMessage: (msg: Message) => void
  appendToLast: (content: string) => void
  setStreaming: (v: boolean) => void
  setAbortController: (ctrl: AbortController | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,
  currentSessionId: null,
  abortController: null,

  setSessionId: (id) => set({ currentSessionId: id }),

  setMessages: (msgs) => set({ messages: msgs }),

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

  reset: () => set({ messages: [], streaming: false, currentSessionId: null, abortController: null }),
}))