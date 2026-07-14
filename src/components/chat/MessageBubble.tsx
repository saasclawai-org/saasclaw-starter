import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type Message } from '../../api/client'
import { cn } from '../../utils/cn'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool' || !!message.tool_call

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
        ) : isTool && message.tool_call ? (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-[var(--color-primary-dim)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-primary)]">
                {message.tool_call.name}
              </span>
            </div>
            {message.tool_call.result && (
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-[var(--color-bg)] p-2 text-xs text-[var(--color-text-secondary)]">
                {message.tool_call.result.length > 500
                  ? message.tool_call.result.slice(0, 500) + '...'
                  : message.tool_call.result}
              </pre>
            )}
          </div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none text-[var(--color-text)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || '...'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}