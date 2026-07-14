import { Link, useNavigate } from 'react-router-dom'
import { useProjectsStore } from '../../stores/projects'
import { useAuthStore } from '../../stores/auth'

export function Sidebar() {
  const projects = useProjectsStore((s) => s.projects)
  const email = useAuthStore((s) => s.email)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span className="text-lg font-semibold text-[var(--color-text)]">SaaSClaw</span>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Projects
          </span>
          <Link
            to="/?new=true"
            className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
        <nav className="space-y-0.5">
          {projects.map((p) => (
            <Link
              key={p.slug}
              to={`/${p.slug}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                {p.framework}
              </span>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
              No projects yet
            </p>
          )}
        </nav>
      </div>

      {/* User */}
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-dim)] text-xs font-medium text-white">
            {email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 truncate text-sm text-[var(--color-text-secondary)]">
            {email}
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-error)]"
            title="Logout"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}