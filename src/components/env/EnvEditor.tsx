import { useState, useEffect } from 'react'
import { env as envApi, type EnvVar } from '../../api/client'
import { useAuthStore } from '../../stores/auth'

interface EnvEditorProps {
  slug: string
}

export function EnvEditor({ slug }: EnvEditorProps) {
  const { token } = useAuthStore()
  const [vars, setVars] = useState<EnvVar[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [newSecret, setNewSecret] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchVars = async () => {
    if (!token) return
    try {
      const list = await envApi.list(token, slug)
      setVars(list)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVars()
  }, [slug, token])

  const handleAdd = async () => {
    if (!token || !newKey.trim()) return
    setSaving(true)
    try {
      await envApi.set(token, slug, newKey.trim(), newVal, newSecret)
      setNewKey('')
      setNewVal('')
      await fetchVars()
    } catch (err) {
      alert(`Failed to add: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!token) return
    try {
      await envApi.delete(token, slug, key)
      await fetchVars()
    } catch (err) {
      alert(`Failed to delete: ${(err as Error).message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Environment Variables</h3>

      {/* Add new */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="KEY"
            className="w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] font-mono placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="text"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="value"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)]"
          />
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={newSecret}
              onChange={(e) => setNewSecret(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Secret
          </label>
          <button
            onClick={handleAdd}
            disabled={saving || !newKey.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? '...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Existing vars */}
      {vars.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No environment variables set</p>
      ) : (
        <div className="space-y-2">
          {vars.map((v) => (
            <div
              key={v.key}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <span className="font-mono text-sm text-[var(--color-text)]">{v.key}</span>
              {v.is_secret ? (
                <span className="text-xs text-[var(--color-text-muted)]">••••••••</span>
              ) : (
                <span className="font-mono text-sm text-[var(--color-text-secondary)] truncate flex-1">
                  {v.value}
                </span>
              )}
              {v.is_secret && (
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-400">
                  secret
                </span>
              )}
              <button
                onClick={() => handleDelete(v.key)}
                className="ml-auto rounded p-1 text-[var(--color-text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                title="Delete"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}