import { useState, useEffect } from 'react'
import { deploy, type Deployment } from '../../api/client'
import { useAuthStore } from '../../stores/auth'
import { formatDate } from '../../utils/format'

interface DeployPanelProps {
  slug: string
}

export function DeployPanel({ slug }: DeployPanelProps) {
  const { token } = useAuthStore()
  const [currentDeploy, setCurrentDeploy] = useState<Deployment | null>(null)
  const [history, setHistory] = useState<Deployment[]>([])
  const [deploying, setDeploying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deployResult, setDeployResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    if (!token) return
    try {
      const [status, hist] = await Promise.all([
        deploy.status(token, slug).catch(() => null),
        deploy.history(token, slug),
      ])
      if (status) setCurrentDeploy(status)
      setHistory(hist)
    } catch {
      // Ignore — panel still renders
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [slug, token])

  const handleDeploy = async () => {
    if (!token || deploying) return
    setDeploying(true)
    setError(null)
    setDeployResult(null)
    try {
      const result = await deploy.trigger(token, slug)
      setDeployResult(result.result || null)
      setCurrentDeploy(result)
      await fetchStatus()
    } catch (err) {
      setError((err as Error).message || 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'deployed':
      case 'active':
        return 'text-green-400'
      case 'failed':
      case 'error':
        return 'text-red-400'
      case 'building':
      case 'deploying':
      case 'pending':
        return 'text-yellow-400'
      default:
        return 'text-[var(--color-text-muted)]'
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
      {/* Deploy button */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Deploy</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Build and deploy your project
            </p>
          </div>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {deploying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deploying...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.42a6 6 0 01-5.74 4.35 6 6 0 01-6-5.74 6 6 0 014.35-5.74M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deploy
              </>
            )}
          </button>
        </div>

        {/* Deploy URL */}
        {currentDeploy?.url && (
          <a
            href={currentDeploy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-[var(--color-primary)] hover:underline"
          >
            {currentDeploy.url} ↗
          </a>
        )}

        {/* Current status */}
        {currentDeploy?.status && !deployResult && (
          <div className="mt-3">
            <span className={`text-sm font-medium ${statusColor(currentDeploy.status)}`}>
              {currentDeploy.status}
            </span>
          </div>
        )}
      </div>

      {/* Deploy result */}
      {deployResult && (
        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h4 className="mb-2 text-sm font-medium text-[var(--color-text)]">Deploy Output</h4>
          <pre className="max-h-60 overflow-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text-secondary)]">
            {deployResult}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Deploy history */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Deploy History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No deploys yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${statusColor(d.status)}`}>
                      {d.status}
                    </span>
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                      {d.environment}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {d.created_at ? formatDate(d.created_at) : ''}
                  </span>
                </div>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-[var(--color-primary)] hover:underline"
                  >
                    {d.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}