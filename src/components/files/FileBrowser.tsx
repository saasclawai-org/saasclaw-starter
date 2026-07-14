import { useState, useEffect } from 'react'
import { files, type FileEntry } from '../../api/client'
import { useAuthStore } from '../../stores/auth'

interface FileBrowserProps {
  slug: string
}

export function FileBrowser({ slug }: FileBrowserProps) {
  const { token } = useAuthStore()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    files.list(token, slug)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, token])

  const openFile = async (path: string) => {
    if (!token) return
    try {
      const result = await files.read(token, slug, path)
      setSelectedFile({ path: result.path, content: result.content })
    } catch {}
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-64 border-r border-[var(--color-border)] overflow-y-auto">
        <div className="p-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Files
          </h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-0.5">
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => entry.type === 'file' && openFile(entry.path)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-[var(--color-surface-2)] ${
                    selectedFile?.path === entry.path
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="text-xs">{entry.type === 'dir' ? '📁' : '📄'}</span>
                  <span className="truncate">{entry.name}</span>
                </button>
              ))}
              {entries.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                  No files yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File content */}
      <div className="flex-1 overflow-auto">
        {selectedFile ? (
          <div className="h-full">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
              <span className="font-mono text-sm text-[var(--color-text-secondary)]">
                {selectedFile.path}
              </span>
            </div>
            <pre className="p-4 text-sm leading-relaxed text-[var(--color-text)] font-[var(--font-mono)]">
              {selectedFile.content}
            </pre>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
            Select a file to view
          </div>
        )}
      </div>
    </div>
  )
}