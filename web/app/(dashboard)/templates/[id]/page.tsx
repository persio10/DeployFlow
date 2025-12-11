'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DeploymentProfileWithTasks, fetchTemplate, instantiateTemplate } from '@/lib/api'
import { formatTargetOs } from '@/lib/osTypes'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function TargetBadge({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200">
      {formatTargetOs(value)}
    </span>
  )
}

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paramId = params?.id
  const templateId = useMemo(() => {
    const value = Array.isArray(paramId) ? paramId[0] : paramId
    return Number(value)
  }, [paramId])

  const [template, setTemplate] = useState<DeploymentProfileWithTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [instantiateModalOpen, setInstantiateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [instantiating, setInstantiating] = useState(false)
  const [instantiateError, setInstantiateError] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(templateId)) return

    const load = async () => {
      try {
        const data = await fetchTemplate(templateId)
        setTemplate(data)
        setNewName(`${data.name} (copy)`)
        setNewDescription(data.description ?? '')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load template'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [templateId])

  const handleInstantiate = async () => {
    if (!template) return
    setInstantiating(true)
    setInstantiateError(null)
    try {
      const created = await instantiateTemplate(template.id, {
        name: newName || `${template.name} (copy)`,
        description: newDescription,
      })
      router.push(`/profiles/${created.id}`)
    } catch (err) {
      setInstantiateError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setInstantiating(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-300">Loading template…</div>
  }

  if (error || !template) {
    return <div className="text-sm text-rose-400">{error ?? 'Template not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Deployment Template</p>
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          <p className="text-sm text-zinc-400">Template ID: {template.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TargetBadge value={template.target_os_type} />
          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
            Template
          </span>
          <button
            onClick={() => setInstantiateModalOpen(true)}
            className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
          >
            Use this template
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-3 grid gap-3 text-sm text-zinc-300">
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Description</dt>
              <dd>{template.description ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Created</dt>
              <dd>{formatDate(template.created_at)}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Updated</dt>
              <dd>{formatDate(template.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="mt-3 overflow-hidden rounded-md border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/70">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Order</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Action Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Script ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Continue on Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {template.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.order_index}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-zinc-100">{task.name}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.action_type}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.script_id ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.continue_on_error ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {template.tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-400">
                      No tasks configured for this template yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {instantiateModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Use this template</h3>
              <button onClick={() => setInstantiateModalOpen(false)} className="text-sm text-zinc-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {instantiateError && (
                <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{instantiateError}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Profile name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[100px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setInstantiateModalOpen(false)}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstantiate}
                  disabled={instantiating}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {instantiating ? 'Creating…' : 'Create profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
