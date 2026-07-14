import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProjectsStore } from '../stores/projects'
import { useAuthStore } from '../stores/auth'
import { ProjectCard } from '../components/projects/ProjectCard'
import { NewProject } from '../components/projects/NewProject'

export function Dashboard() {
  const { projects, loading, fetchAll } = useProjectsStore()
  const token = useAuthStore((s) => s.token)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showNew, setShowNew] = useState(searchParams.get('new') === 'true')

  useEffect(() => {
    if (token) fetchAll()
  }, [token])

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowNew(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Projects</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Build, deploy, and manage your apps
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-2)]">
            <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">No projects yet</h2>
          <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
            Create your first project and start building with AI
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}

      {showNew && <NewProject onClose={() => setShowNew(false)} />}
    </div>
  )
}