import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import { sessions, streamChat, type Message } from '../../api/client'
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
    setSessionId,
    setMessages,
    addMessage,
    appendToLast,
    setStreaming,
    setAbortController,
  } = useChatStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load or create session when slug changes
  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const sess = await sessions.create(token, slug)
        setSessionId(sess.id)
        setMessages(sess.messages || [])
      } catch {
        // Session creation might fail if API not ready
      }
    })()
  }, [slug, token])

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
        } else if (chunk.type === 'tool_call' && chunk.tool_call) {
          // Replace last assistant message with tool call info
          useChatStore.setState((state) => ({
            messages: state.messages.map((m, i, arr) =>
              i === arr.length - 1
                ? { ...m, tool_call: chunk.tool_call as Message['tool_call'] }
                : m
            ),
          }))
        }
      },
      () => {
        setStreaming(false)
        setAbortController(null)
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

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
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
                disabled={!input.trim()}
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
  )
}