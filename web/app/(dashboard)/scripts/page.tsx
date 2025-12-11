"use client"

import { useEffect, useState } from 'react'
import { createScript, fetchScripts, Script, TargetOsType } from '@/lib/api'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLanguage, setFormLanguage] = useState('powershell')
  const [formTargetOs, setFormTargetOs] = useState<TargetOsType | ''>('')
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchScripts()
        setScripts(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load scripts'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormLanguage('powershell')
    setFormTargetOs('')
    setFormContent('')
    setFormError(null)
  }

  const handleCreateScript = async () => {
    if (!formName.trim() || !formContent.trim()) {
      setFormError('Name and content are required')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      await createScript({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        language: formLanguage,
        target_os_type: formTargetOs || undefined,
        content: formContent,
      })
      const data = await fetchScripts()
      setScripts(data)
      resetForm()
      setCreateOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create script')
    } finally {
      setSubmitting(false)
    }
  }

  const targetOsOptions: { label: string; value: TargetOsType | '' }[] = [
    { label: 'Any OS', value: '' },
    { label: 'Windows', value: 'windows' },
    { label: 'Linux', value: 'linux' },
    { label: 'macOS', value: 'macos' },
    { label: 'Proxmox', value: 'proxmox' },
    { label: 'Other', value: 'other' },
  ]

  const formatTargetOs = (value?: TargetOsType | null) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scripts</h1>
          <p className="text-sm text-zinc-400">Reusable automation snippets from the script library.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
        >
          New Script
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          {loading && 'Loading scripts…'}
          {error && !loading && <span className="text-rose-400">{error}</span>}
          {!loading && !error && `${scripts.length} script${scripts.length === 1 ? '' : 's'}`}
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Language</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Target OS</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {scripts.map((script) => (
              <tr key={script.id} className="hover:bg-zinc-800/40">
                <td className="px-4 py-3 text-sm font-medium text-zinc-100">{script.name}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{script.description ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{script.language}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{formatTargetOs(script.target_os_type)}</td>
                <td className="px-4 py-3 text-sm text-blue-300">
                  <button
                    className="rounded-md px-3 py-1 text-sm font-semibold hover:bg-blue-500/10 hover:text-blue-200"
                    onClick={() => setSelectedScript(script)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !error && scripts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-400">
                  No scripts yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Script</h3>
              <button onClick={() => setCreateOpen(false)} className="text-sm text-zinc-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-zinc-200">
              {formError && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-rose-200">{formError}</div>}

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-400">Name</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-400">Description</span>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-wide text-zinc-400">Language</span>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="powershell">powershell</option>
                    <option value="bash">bash</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-wide text-zinc-400">Target OS</span>
                  <select
                    value={formTargetOs}
                    onChange={(e) => setFormTargetOs(e.target.value as TargetOsType | '')}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {targetOsOptions.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-400">Content</span>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="min-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    resetForm()
                    setCreateOpen(false)
                  }}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateScript}
                  disabled={submitting}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Create script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedScript && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedScript.name}</h3>
                <p className="text-xs text-zinc-400">Language: {selectedScript.language}</p>
                <p className="text-xs text-zinc-500">Target OS: {formatTargetOs(selectedScript.target_os_type)}</p>
              </div>
              <button
                onClick={() => setSelectedScript(null)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-md border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-100">
              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">{selectedScript.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
