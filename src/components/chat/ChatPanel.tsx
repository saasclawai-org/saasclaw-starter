import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import { streamChat } from '../../api/client'
import { MessageBubble } from './MessageBubble'

interface ChatPanelProps {
  slug: string
}

export function ChatPanel({ slug }: ChatPanelProps) {
  const { token } = useAuthStore()
  const {
    messages,
    streaming,
    currentSessionId,
    sessions,
    loading,
    setSessionId,
    addMessage,
    appendToLast,
    setStreaming,
    setAbortController,
    loadSessions,
    createSession,
    loadSession,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions on mount, create one if none exist
  useEffect(() => {
    if (!token) return
    ;(async () => {
      await loadSessions(slug)
      const state = useChatStore.getState()
      if (!state.currentSessionId) {
        if (state.sessions.length > 0) {
          setSessionId(state.sessions[0].id)
          await loadSession(slug, state.sessions[0].id)
        } else {
          await createSession(slug)
        }
      }
    })()
  }, [slug, token])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !token || !currentSessionId) return
    const message = input.trim()
    setInput('')

    // Add user message immediately
    addMessage({ role: 'user', content: message, created_at: new Date().toISOString() })
    addMessage({ role: 'assistant', content: '', created_at: new Date().toISOString() })
    setStreaming(true)

    const ctrl = streamChat(
      slug,
      currentSessionId,
      message,
      token,
      (chunk) => {
        if (chunk.type === 'content' && chunk.content) {
          appendToLast(chunk.content)
        } else if (chunk.type === 'tool_call') {
          addMessage({
            role: 'tool',
            content: '',
            tool_call: { name: (chunk as { name?: string }).name || 'unknown', result: '' },
            created_at: new Date().toISOString(),
          })
        } else if (chunk.type === 'tool_result') {
          useChatStore.setState((state) => {
            const msgs = [...state.messages]
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'tool') {
                msgs[i] = { ...msgs[i], content: (chunk as { content?: string }).content || '' }
                break
              }
            }
            return { messages: msgs }
          })
        }
      },
      () => {
        setStreaming(false)
        setAbortController(null)
        loadSessions(slug)
      },
      (err) => {
        addMessage({
          role: 'assistant',
          content: `Error: ${err.message}`,
          created_at: new Date().toISOString(),
        })
        setStreaming(false)
        setAbortController(null)
      },
    )

    setAbortController(ctrl)
  }, [input, token, currentSessionId, slug])

  const handleStop = useCallback(() => {
    useChatStore.getState().abortController?.abort()
    setStreaming(false)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewSession = async () => {
    await createSession(slug, 'New chat')
    setShowSessions(false)
  }

  const handleSwitchSession = async (id: string) => {
    await loadSession(slug, id)
    setShowSessions(false)
  }

  return (
    <div className="flex h-full">
      {/* Session sidebar (collapsible) */}
      {showSessions && (
        <div className="w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Chats</span>
            <button
              onClick={handleNewSession}
              className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              title="New chat"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto p-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSwitchSession(s.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  s.id === currentSessionId
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <div className="truncate font-medium">{s.title || 'Chat'}</div>
                {s.last_message && (
                  <div className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                    {s.last_message}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            title="Chat history"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">
            {currentSessionId ? 'Chat' : 'Loading...'}
          </span>
          {streaming && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-primary)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
              Thinking...
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-2)]">
                  <span className="text-3xl">🛠️</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  What are we building?
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Describe your project and I'll help you build it
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-12 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 200) + 'px'
                  }}
                  disabled={streaming}
                />
              </div>
              {streaming ? (
                <button
                  onClick={handleStop}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  title="Stop"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !currentSessionId}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-30"
                  title="Send"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}