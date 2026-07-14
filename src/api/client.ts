const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

interface FetchOptions extends RequestInit {
  token?: string
}

class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    const message = typeof data === 'object' && data !== null && 'detail' in (data as Record<string, unknown>)
      ? String((data as Record<string, unknown>).detail)
      : `API error ${status}`
    super(message)
    this.status = status
    this.data = data
  }
}

async function request<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  })

  if (!res.ok) {
    let data: unknown
    try {
      data = await res.text()
      try {
        data = JSON.parse(data as string)
      } catch {
        // not JSON, keep as text
      }
    } catch {
      data = null
    }
    throw new ApiError(res.status, data)
  }

  if (res.status === 204) return undefined as T

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/event-stream')) {
    return res as unknown as T
  }

  return res.json()
}

/** SSE stream handler for chat messages */
export function streamChat(
  slug: string,
  sessionId: string,
  message: string,
  token: string,
  onChunk: (chunk: { type: string; content?: string; tool_call?: unknown }) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): AbortController {
  const ctrl = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${slug}/sessions/${sessionId}/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Stream error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6)
            if (raw === '[DONE]') {
              onDone()
              return
            }
            try {
              const chunk = JSON.parse(raw)
              onChunk(chunk)
            } catch {
              // non-JSON chunk, skip
            }
          }
        }
      }
      onDone()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError(err as Error)
      }
    }
  })()

  return ctrl
}

// ---- Auth ----

export const auth = {
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name?: string) =>
    request<{ access: string; refresh: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  refresh: (refresh: string) =>
    request<{ access: string }>('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }),
}

// ---- Projects ----

export interface Project {
  id: number
  slug: string
  name: string
  description: string
  framework: string
  status: string
  preview_domain: string
  production_domain: string
  onboarding_step: string
  created_at: string
  updated_at: string
  todos: TodoItem[]
}

export interface TodoItem {
  text: string
  done: boolean
}

export const projects = {
  list: (token: string) =>
    request<Project[]>('/projects/', { token }),

  get: (token: string, slug: string) =>
    request<Project>(`/projects/${slug}/`, { token }),

  create: (token: string, data: { name: string; framework: string; description?: string }) =>
    request<Project>('/projects/', {
      token,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (token: string, slug: string, data: Partial<Pick<Project, 'name' | 'description' | 'todos'>>) =>
    request<Project>(`/projects/${slug}/`, {
      token,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (token: string, slug: string) =>
    request<void>(`/projects/${slug}/`, {
      token,
      method: 'DELETE',
    }),
}

// ---- Sessions ----

export interface Session {
  id: string
  project_slug: string
  created_at: string
  messages: Message[]
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_call?: {
    name: string
    result?: string
  }
  created_at: string
}

export const sessions = {
  list: (token: string, slug: string) =>
    request<Session[]>(`/projects/${slug}/sessions/`, { token }),

  create: (token: string, slug: string) =>
    request<Session>(`/projects/${slug}/sessions/`, {
      token,
      method: 'POST',
      body: JSON.stringify({}),
    }),

  get: (token: string, slug: string, id: string) =>
    request<Session>(`/projects/${slug}/sessions/${id}/`, { token }),

  send: (token: string, slug: string, id: string, message: string) =>
    // Returns SSE stream, use streamChat() instead
    fetch(`${API_BASE}/projects/${slug}/sessions/${id}/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }),

  end: (token: string, slug: string, id: string) =>
    request<void>(`/projects/${slug}/sessions/${id}/end/`, {
      token,
      method: 'POST',
    }),
}

// ---- Files ----

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  modified?: string
}

export const files = {
  list: (token: string, slug: string, path = '.') =>
    request<FileEntry[]>(`/projects/${slug}/files/?path=${encodeURIComponent(path)}`, { token }),

  read: (token: string, slug: string, path: string) =>
    request<{ path: string; content: string; language?: string }>(
      `/projects/${slug}/files/${encodeURIComponent(path)}`,
      { token },
    ),

  write: (token: string, slug: string, path: string, content: string) =>
    request<void>(`/projects/${slug}/files/${encodeURIComponent(path)}`, {
      token,
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
}

// ---- Deploy ----

export interface Deployment {
  id: number
  environment: string
  status: string
  url: string
  web_root?: string
  result?: string
  created_at: string
  finished_at?: string
  logs?: string
}

export const deploy = {
  trigger: (token: string, slug: string, environment = 'preview') =>
    request<Deployment>(`/projects/${slug}/deploy/`, {
      token,
      method: 'POST',
      body: JSON.stringify({ environment }),
    }),

  status: (token: string, slug: string) =>
    request<Deployment>(`/projects/${slug}/deploy/status/`, { token }),

  history: (token: string, slug: string) =>
    request<Deployment[]>(`/projects/${slug}/deploy/history/`, { token }),

  rollback: (token: string, slug: string, deployId: number) =>
    request<Deployment>(`/projects/${slug}/deploy/rollback/`, {
      token,
      method: 'POST',
      body: JSON.stringify({ deploy_id: deployId }),
    }),
}

// ---- Environment Variables ----

export interface EnvVar {
  key: string
  value: string
  is_secret: boolean
}

export const env = {
  list: (token: string, slug: string) =>
    request<EnvVar[]>(`/projects/${slug}/env/`, { token }),

  set: (token: string, slug: string, key: string, value: string, is_secret = true) =>
    request<EnvVar>(`/projects/${slug}/env/`, {
      token,
      method: 'POST',
      body: JSON.stringify({ key, value, is_secret }),
    }),

  delete: (token: string, slug: string, key: string) =>
    request<void>(`/projects/${slug}/env/${encodeURIComponent(key)}/`, {
      token,
      method: 'DELETE',
    }),
}

// ---- Git ----

export interface GitStatus {
  modified: string[]
  added: string[]
  deleted: string[]
  untracked: string[]
}

export const git = {
  status: (token: string, slug: string) =>
    request<GitStatus>(`/projects/${slug}/git/status/`, { token }),

  diff: (token: string, slug: string, cached = false) =>
    request<string>(`/projects/${slug}/git/diff/?cached=${cached}`, { token }),

  commit: (token: string, slug: string, message: string) =>
    request<{ hash: string }>(`/projects/${slug}/git/commit/`, {
      token,
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  log: (token: string, slug: string, limit = 10) =>
    request<Array<{ hash: string; message: string; author: string; date: string }>>(
      `/projects/${slug}/git/log/?limit=${limit}`,
      { token },
    ),
}

// ---- Infrastructure ----

export const infra = {
  status: (token: string, slug: string, section = 'all') =>
    request<string>(`/projects/${slug}/status/?section=${section}`, { token }),

  logs: (token: string, slug: string, source: string, lines = 50) =>
    request<string>(`/projects/${slug}/logs/${source}/?lines=${lines}`, { token }),
}