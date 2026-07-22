import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/auth'
import { account as accountApi, PROVIDER_LABELS, type UserProfile, type ProviderKeyInfo } from '../api/client'

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97757',
  zai: '#6366F1',
  moonshot: '#7C3AED',
  'ollama-cloud': '#22D3EE',
  groq: '#F55036',
}

const PROVIDER_LIST = ['zai', 'openai', 'anthropic', 'moonshot', 'ollama-cloud', 'groq']

export function Account() {
  const { token, logout } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddKey, setShowAddKey] = useState(false)
  const [editingKey, setEditingKey] = useState<ProviderKeyInfo | null>(null)

  useEffect(() => {
    if (!token) return
    accountApi.profile(token).then((p) => {
      setProfile(p)
      setLoading(false)
    }).catch((e) => {
      setError(e.message)
      setLoading(false)
    })
  }, [token])

  const handleDeleteKey = async (id: number) => {
    if (!token) return
    try {
      await accountApi.deleteProviderKey(token, id)
      setProfile(prev => prev ? {
        ...prev,
        provider_keys: prev.provider_keys.filter(k => k.id !== id),
      } : null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return <div className="p-6 text-[var(--color-text-muted)]">{error || 'Unable to load profile'}</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">Account</h1>

      {/* Profile card */}
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-xl font-bold text-white">
            {(profile.email || profile.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--color-text)]">
              {profile.email || profile.username}
            </div>
            {(profile.first_name || profile.last_name) && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                {profile.first_name} {profile.last_name}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{profile.stats.projects}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{profile.stats.deploys}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Deploys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{profile.stats.api_keys}</div>
            <div className="text-xs text-[var(--color-text-muted)]">API Keys</div>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      {profile.social_accounts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Connected Accounts
          </h2>
          <div className="space-y-2">
            {profile.social_accounts.map((sa, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: sa.provider === 'github' ? '#24292E' : sa.provider === 'google' ? '#4285F4' : 'var(--color-primary)' }}
                >
                  {sa.provider[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium capitalize text-[var(--color-text)]">{sa.provider}</div>
                  {sa.email && <div className="text-xs text-[var(--color-text-muted)]">{sa.email}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider keys */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            LLM Provider Keys
          </h2>
          <button
            onClick={() => setShowAddKey(true)}
            className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Key
          </button>
        </div>

        {profile.provider_keys.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            No provider keys configured. Add one to use non-platform models.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.provider_keys.map((pk) => (
              <ProviderKeyRow
                key={pk.id}
                keyInfo={pk}
                onDelete={() => handleDeleteKey(pk.id)}
                onEdit={() => setEditingKey(pk)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 py-2.5 text-sm font-medium text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20"
      >
        Log Out
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {showAddKey && (
        <AddKeyDialog
          onClose={() => setShowAddKey(false)}
          onAdd={async (provider, apiKey, model) => {
            if (!token) return
            try {
              const newKey = await accountApi.addProviderKey(token, { provider, api_key: apiKey, default_model: model })
              setProfile(prev => prev ? {
                ...prev,
                provider_keys: [...prev.provider_keys, newKey],
              } : null)
            } catch (e) {
              setError((e as Error).message)
            }
            setShowAddKey(false)
          }}
        />
      )}

      {editingKey && (
        <EditKeyDialog
          keyInfo={editingKey}
          onClose={() => setEditingKey(null)}
          onSave={async (apiKey, model) => {
            if (!token) return
            try {
              const updated = await accountApi.updateProviderKey(token, editingKey.id, {
                provider: editingKey.provider,
                api_key: apiKey,
                default_model: model,
              })
              setProfile(prev => prev ? {
                ...prev,
                provider_keys: prev.provider_keys.map(k => k.id === updated.id ? updated : k),
              } : null)
            } catch (e) {
              setError((e as Error).message)
            }
            setEditingKey(null)
          }}
        />
      )}
    </div>
  )
}

function ProviderKeyRow({ keyInfo, onDelete, onEdit }: {
  keyInfo: ProviderKeyInfo
  onDelete: () => void
  onEdit: () => void
}) {
  const color = PROVIDER_COLORS[keyInfo.provider] ?? 'var(--color-primary)'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: color }}
      >
        {keyInfo.provider.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {PROVIDER_LABELS[keyInfo.provider] ?? keyInfo.provider}
          </span>
          {keyInfo.is_platform && (
            <span className="rounded bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--color-primary)]">
              Platform
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {keyInfo.api_key_masked}
          {keyInfo.default_model && <span className="ml-2">· model: {keyInfo.default_model}</span>}
        </div>
      </div>
      {!keyInfo.is_platform && (
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary)]"
          title="Edit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-error)]"
        title="Delete"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

function AddKeyDialog({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (provider: string, apiKey: string, model: string) => void
}) {
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">Add Provider Key</h2>
        <div className="space-y-4">
          {/* Provider selector grid */}
          <div className="grid grid-cols-3 gap-2">
            {PROVIDER_LIST.map(p => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`rounded-lg border p-2 text-center text-xs font-medium transition ${
                  provider === p
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {PROVIDER_LABELS[p] ?? p}
              </button>
            ))}
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="API KEY"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="DEFAULT MODEL (optional)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]">
              Cancel
            </button>
            <button
              onClick={() => apiKey.trim() && onAdd(provider, apiKey.trim(), model.trim())}
              disabled={!apiKey.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditKeyDialog({ keyInfo, onClose, onSave }: {
  keyInfo: ProviderKeyInfo
  onClose: () => void
  onSave: (apiKey: string, model: string) => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(keyInfo.default_model)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">
          Edit {PROVIDER_LABELS[keyInfo.provider] ?? keyInfo.provider} Key
        </h2>
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-muted)]">Current: {keyInfo.api_key_masked}</div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="NEW API KEY (leave blank to keep)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="DEFAULT MODEL (optional)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]">
              Cancel
            </button>
            <button
              onClick={() => onSave(apiKey.trim() || keyInfo.api_key_masked, model.trim())}
              className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
