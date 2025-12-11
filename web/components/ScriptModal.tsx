"use client"

import { useEffect, useState } from 'react'
import {
  Script,
  ScriptCreateInput,
  ScriptLanguage,
  ScriptUpdateInput,
  TargetOsType,
  createScript,
  updateScript,
} from '@/lib/api'

const targetOsOptions: { label: string; value: TargetOsType | '' }[] = [
  { label: 'Any OS', value: '' },
  { label: 'Windows', value: 'windows' },
  { label: 'Linux', value: 'linux' },
  { label: 'macOS', value: 'macos' },
  { label: 'Proxmox', value: 'proxmox' },
  { label: 'Other', value: 'other' },
]

const languageOptions: { label: string; value: ScriptLanguage }[] = [
  { label: 'powershell', value: 'powershell' },
  { label: 'bash', value: 'bash' },
]

type ScriptModalMode = 'create' | 'edit'

interface ScriptModalProps {
  open: boolean
  mode: ScriptModalMode
  initialScript?: Script | null
  onClose: () => void
  onSaved: (script: Script) => void
}

export default function ScriptModal({ open, mode, initialScript, onClose, onSaved }: ScriptModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState<ScriptLanguage>('powershell')
  const [targetOs, setTargetOs] = useState<TargetOsType | ''>('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialScript) {
      setName(initialScript.name)
      setDescription(initialScript.description ?? '')
      setLanguage(initialScript.language)
      setTargetOs(initialScript.target_os_type ?? '')
      setContent(initialScript.content)
    } else {
      setName('')
      setDescription('')
      setLanguage('powershell')
      setTargetOs('')
      setContent('')
    }
    setError(null)
  }, [open, initialScript])

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      setError('Name and content are required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload: ScriptCreateInput | ScriptUpdateInput = {
        name: name.trim(),
        description: description.trim() || null,
        language,
        target_os_type: targetOs || null,
        content,
      }

      if (mode === 'create') {
        const created = await createScript(payload as ScriptCreateInput)
        onSaved(created)
      } else if (initialScript) {
        const updated = await updateScript(initialScript.id, payload as ScriptUpdateInput)
        onSaved(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save script')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{mode === 'create' ? 'New Script' : 'Edit Script'}</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-zinc-200">
          {error && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-rose-200">{error}</div>}

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ScriptLanguage)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Target OS</span>
              <select
                value={targetOs}
                onChange={(e) => setTargetOs(e.target.value as TargetOsType | '')}
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create script' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
