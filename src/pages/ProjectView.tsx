import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectsStore } from '../stores/projects'
import { useUIStore } from '../stores/ui'
import { ChatPanel } from '../components/chat/ChatPanel'
import { FileBrowser } from '../components/files/FileBrowser'
import { DeployPanel } from '../components/deploy/DeployPanel'
import { EnvEditor } from '../components/env/EnvEditor'

const TABS = [
  { key: 'chat' as const, label: 'Chat', icon: '💬' },
  { key: 'files' as const, label: 'Files', icon: '📁' },
  { key: 'deploy' as const, label: 'Deploy', icon: '🚀' },
  { key: 'env' as const, label: 'Env Vars', icon: '🔐' },
]

export function ProjectView() {
  const { slug } = useParams<{ slug: string }>()
  const { current, fetchOne, loading } = useProjectsStore()
  const { activeTab, setActiveTab } = useUIStore()

  useEffect(() => {
    if (slug) fetchOne(slug)
  }, [slug])

  if (loading && !current) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
        Project not found
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{current.name}</h2>
          <span className="rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
            {current.framework}
          </span>
          {current.preview_domain && (
            <a
              href={`https://${current.preview_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs text-green-400 transition hover:bg-green-500/20"
            >
              ● Live
            </a>
          )}
        </div>
        <div className="mt-2 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatPanel slug={current.slug} />}
        {activeTab === 'files' && <FileBrowser slug={current.slug} />}
        {activeTab === 'deploy' && <DeployPanel slug={current.slug} />}
        {activeTab === 'env' && <EnvEditor slug={current.slug} />}
      </div>
    </div>
  )
}