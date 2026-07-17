import { Link } from 'react-router-dom'
import { type Project } from '../../api/client'
import { formatDate } from '../../utils/format'

interface ProjectCardProps {
  project: Project
}

const FRAMEWORK_ICONS: Record<string, string> = {
  html: '🌐',
  vite_react: '⚛️',
  astro: '🚀',
  next_static: '▲',
  django: '🐍',
  supabase: '⚡',
  firebase: '🔥',
  flask: '🫙',
  dotnet: '🔷',
  'react-dotnet': '🔷',
  'spring-boot': '☕',
  'react-django': '🐍',
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/${project.slug}`}
      className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{FRAMEWORK_ICONS[project.framework] || '📦'}</span>
          <div>
            <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
              {project.name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">{project.slug}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            project.status === 'active'
              ? 'bg-green-500/10 text-green-400'
              : project.status === 'draft'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
          }`}
        >
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
          {project.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[var(--color-text-muted)]">
        <span>{project.framework.replace('_', ' ')}</span>
        <span>•</span>
        <span>{formatDate(project.created_at)}</span>
        {project.preview_domain && (
          <>
            <span>•</span>
            <span className="text-green-400">● Live</span>
          </>
        )}
      </div>
    </Link>
  )
}