import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { type Message } from '../../api/client'
import { cn } from '../../utils/cn'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'

  // Skip empty tool messages (will be filled by streaming)
  if (isTool && !message.content && !message.tool_call?.name) {
    return null
  }

  return (
    <div className={cn('animate-fade-in', isUser ? 'flex justify-end' : '')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[var(--color-primary)] text-white'
            : isTool
              ? 'border border-[var(--color-border)] bg-[var(--color-surface-2)]'
              : 'bg-[var(--color-surface)]',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : isTool ? (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-xs font-mono text-[var(--color-primary)]">
                🔧 {message.tool_call?.name || 'tool'}
              </span>
            </div>
            {message.content && (
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-[var(--color-bg)] p-2 text-xs text-[var(--color-text-secondary)]">
                {message.content.length > 500
                  ? message.content.slice(0, 500) + '...'
                  : message.content}
              </pre>
            )}
          </div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none text-[var(--color-text)]">
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text-muted)]">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}