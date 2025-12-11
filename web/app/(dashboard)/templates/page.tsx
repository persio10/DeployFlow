"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeploymentProfile, fetchTemplates } from '@/lib/api'
import { ProfileEditorModal } from '@/components/ProfileEditorModal'

function formatTargetOs(value?: string | null) {
  if (!value) return 'Any OS'
  switch (value) {
    case 'windows':
      return 'Windows'
    case 'linux':
      return 'Linux'
    case 'macos':
      return 'macOS'
    case 'proxmox':
      return 'Proxmox'
    default:
      return 'Other'
  }
}

function TargetBadge({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200">
      {formatTargetOs(value)}
    </span>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DeploymentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTemplates()
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-zinc-400">Reusable blueprints for cloning deployment profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
            {loading && 'Loading templates…'}
            {!loading && error && <span className="text-rose-400">{error}</span>}
            {!loading && !error && `${templates.length} template${templates.length === 1 ? '' : 's'}`}
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
          >
            New Template
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/templates/${template.id}`} className="text-lg font-semibold text-blue-200 hover:text-white">
                  {template.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-400">{template.description ?? 'No description'}</p>
              </div>
              <TargetBadge value={template.target_os_type} />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>ID: {template.id}</span>
              <span>{template.created_at ? new Date(template.created_at).toLocaleString() : '—'}</span>
            </div>
          </div>
        ))}

        {!loading && !error && templates.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
            No templates yet. Use “New Template” to add one, then instantiate it into a profile when ready.
          </div>
        )}
      </div>

      <ProfileEditorModal
        open={createOpen}
        mode="template"
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => router.push(`/templates/${id}`)}
      />
    </div>
  )
}
