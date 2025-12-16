"use client"

import { useEffect, useState } from 'react'

import {
  SoftwareCreateInput,
  SoftwarePackage,
  SoftwareUpdateInput,
  createSoftware,
  updateSoftware,
} from '@/lib/api'
import { TARGET_OS_OPTIONS, TargetOsType } from '@/lib/osTypes'

const installerOptions = [
  { label: 'MSI', value: 'msi' },
  { label: 'EXE', value: 'exe' },
  { label: 'Winget', value: 'winget' },
  { label: 'Chocolatey', value: 'choco' },
  { label: 'Script', value: 'script' },
  { label: 'Custom', value: 'custom' },
]

const sourceTypeOptions = [
  { label: 'URL', value: 'url' },
  { label: 'File share', value: 'file_share' },
  { label: 'Local path', value: 'local_path' },
]

type SoftwareModalMode = 'create' | 'edit'

interface SoftwareEditorModalProps {
  open: boolean
  mode: SoftwareModalMode
  initialSoftware?: SoftwarePackage | null
  onClose: () => void
  onSaved: (software: SoftwarePackage) => void
}

export function SoftwareEditorModal({ open, mode, initialSoftware, onClose, onSaved }: SoftwareEditorModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [version, setVersion] = useState('')
  const [installerType, setInstallerType] = useState<string>('msi')
  const [sourceType, setSourceType] = useState<string>('url')
  const [source, setSource] = useState('')
  const [installArgs, setInstallArgs] = useState('')
  const [uninstallArgs, setUninstallArgs] = useState('')
  const [targetOs, setTargetOs] = useState<TargetOsType | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialSoftware) {
      setName(initialSoftware.name)
      setSlug(initialSoftware.slug ?? '')
      setVersion(initialSoftware.version ?? '')
      setInstallerType(initialSoftware.installer_type)
      setSourceType(initialSoftware.source_type)
      setSource(initialSoftware.source ?? '')
      setInstallArgs(initialSoftware.install_args ?? '')
      setUninstallArgs(initialSoftware.uninstall_args ?? '')
      setTargetOs(initialSoftware.target_os_type ?? '')
    } else {
      setName('')
      setSlug('')
      setVersion('')
      setInstallerType('msi')
      setSourceType('url')
      setSource('')
      setInstallArgs('')
      setUninstallArgs('')
      setTargetOs('')
    }
    setError(null)
    setSubmitting(false)
  }, [initialSoftware, open])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!['winget', 'choco'].includes(installerType) && !source.trim()) {
      setError('Source is required for this installer type')
      return
    }

    setSubmitting(true)
    setError(null)
    const payload: SoftwareCreateInput | SoftwareUpdateInput = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      version: version.trim() || undefined,
      installer_type: installerType as SoftwareCreateInput['installer_type'],
      source_type: sourceType as SoftwareCreateInput['source_type'],
      source: source.trim() || undefined,
      install_args: installArgs.trim() || undefined,
      uninstall_args: uninstallArgs.trim() || undefined,
      target_os_type: targetOs || undefined,
    }

    try {
      if (mode === 'create') {
        const created = await createSoftware(payload as SoftwareCreateInput)
        onSaved(created)
      } else if (initialSoftware) {
        const updated = await updateSoftware(initialSoftware.id, payload as SoftwareUpdateInput)
        onSaved(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save software')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{mode === 'create' ? 'New Software' : 'Edit Software'}</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-zinc-200">
          {error && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-rose-200">{error}</div>}

          <div className="grid gap-3 md:grid-cols-2">
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
              <span className="text-xs uppercase tracking-wide text-zinc-400">Slug (optional)</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Version</span>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Installer Type</span>
              <select
                value={installerType}
                onChange={(e) => setInstallerType(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {installerOptions.map((option) => (
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
                <option value="">Any</option>
                {TARGET_OS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Source Type</span>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {sourceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Source</span>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="URL, package ID, or path"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">Required for MSI/EXE/script/custom installers; optional for Winget/Choco IDs.</p>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Install args</span>
              <input
                type="text"
                value={installArgs}
                onChange={(e) => setInstallArgs(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Uninstall args</span>
              <input
                type="text"
                value={uninstallArgs}
                onChange={(e) => setUninstallArgs(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

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
              {submitting ? 'Saving…' : mode === 'create' ? 'Create software' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

