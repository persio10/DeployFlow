"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import ScriptModal from '@/components/ScriptModal'
import { deleteScript, fetchScript, Script } from '@/lib/api'
import { formatTargetOs } from '@/lib/osTypes'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3 text-sm text-zinc-200">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-100">{value}</span>
    </div>
  )
}

export default function ScriptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paramId = params?.id
  const scriptId = useMemo(() => {
    const value = Array.isArray(paramId) ? paramId[0] : paramId
    return Number(value)
  }, [paramId])

  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(scriptId)) return

    const load = async () => {
      try {
        const data = await fetchScript(scriptId)
        setScript(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load script'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [scriptId])

  const handleDelete = async () => {
    if (!script) return
    const confirmed = window.confirm(`Delete script "${script.name}"? This cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteScript(script.id)
      router.push('/scripts')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete script')
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-300">Loading script…</div>
  }

  if (error || !script) {
    return <div className="text-sm text-rose-400">{error ?? 'Script not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Script</p>
          <h1 className="text-2xl font-semibold text-white">{script.name}</h1>
          <p className="text-sm text-zinc-400">Script ID: {script.id}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">{script.language}</span>
            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-blue-100">
              Target OS: {formatTargetOs(script.target_os_type)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{actionError}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold text-white">Details</h2>
          <div className="mt-3 grid gap-3">
            <InfoRow label="Description" value={script.description ?? '—'} />
            <InfoRow label="Created" value={script.created_at ? new Date(script.created_at).toLocaleString() : '—'} />
            <InfoRow label="Updated" value={script.updated_at ? new Date(script.updated_at).toLocaleString() : '—'} />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold text-white">Content</h2>
          <div className="mt-3 rounded-md border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-100">
            <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">{script.content}</pre>
          </div>
        </div>
      </div>

      <ScriptModal
        open={modalOpen}
        mode="edit"
        initialScript={script}
        onClose={() => setModalOpen(false)}
        onSaved={(saved) => {
          setScript(saved)
          setModalOpen(false)
        }}
      />
    </div>
  )
}
