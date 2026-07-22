import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectsStore } from '../../stores/projects'
import { useAuthStore } from '../../stores/auth'

interface NewProjectProps {
  onClose: () => void
}

const FRAMEWORKS = [
  { id: 'vite_react', name: 'React + Vite', icon: '⚛️', desc: 'Modern React with Vite bundler' },
  { id: 'react', name: 'React', icon: '⚛️', desc: 'Classic React' },
  { id: 'nextjs', name: 'Next.js', icon: '▲', desc: 'Static export with Next.js' },
  { id: 'html', name: 'HTML/CSS/JS', icon: '🌐', desc: 'Plain static site' },
  { id: 'django', name: 'Django', icon: '🐍', desc: 'Python web framework' },
  { id: 'react-django', name: 'React + Django', icon: '🐍', desc: 'React frontend with Django API' },
  { id: 'flask', name: 'Flask', icon: '🫙', desc: 'Lightweight Python web framework' },
  { id: 'fastapi', name: 'FastAPI', icon: '⚡', desc: 'Modern Python API framework' },
  { id: 'supabase', name: 'React + Supabase', icon: '⚡', desc: 'React with Supabase backend' },
  { id: 'firebase', name: 'React + Firebase', icon: '🔥', desc: 'React with Firebase backend' },
  { id: 'htmx', name: 'HTMX', icon: '🔗', desc: 'HTMX with server-side rendering' },
  { id: 'vue', name: 'Vue', icon: '💚', desc: 'Vue.js with Vite' },
  { id: 'svelte', name: 'Svelte', icon: '🧡', desc: 'Svelte with Vite' },
  { id: 'hugo', name: 'Hugo', icon: ' struct', desc: 'Static site generator' },
  { id: 'dotnet', name: '.NET', icon: '🔷', desc: 'ASP.NET Core with C#' },
  { id: 'react-dotnet', name: 'React + .NET', icon: '🔷', desc: 'React frontend with .NET API' },
  { id: 'spring-boot', name: 'Spring Boot', icon: '☕', desc: 'Java with Spring Boot 3.x' },
]

export function NewProject({ onClose }: NewProjectProps) {
  const [name, setName] = useState('')
  const [framework, setFramework] = useState('vite_react')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const create = useProjectsStore((s) => s.create)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!token || !name.trim()) return
    setCreating(true)
    setError('')
    try {
      const project = await create({
        name: name.trim(),
        framework,
        description: description.trim() || undefined,
      })
      onClose()
      navigate(`/${project.slug}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">New Project</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-app"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
              Framework
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setFramework(fw.id)}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left transition ${
                    framework === fw.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <span className="text-lg">{fw.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)]">{fw.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{fw.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
              Description <span className="text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we building?"
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-2)]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}