"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ScriptModal from '@/components/ScriptModal'
import { deleteScript, fetchScripts, Script } from '@/lib/api'
import { formatTargetOs, TargetOsType } from '@/lib/osTypes'

function TargetOsBadge({ value }: { value?: TargetOsType | null }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-200">
      {formatTargetOs(value)}
    </span>
  )
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [viewScript, setViewScript] = useState<Script | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingScript, setEditingScript] = useState<Script | null>(null)

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

  const upsertScript = (updated: Script) => {
    setScripts((prev) => {
      const exists = prev.some((s) => s.id === updated.id)
      if (exists) {
        return prev.map((s) => (s.id === updated.id ? updated : s))
      }
      return [updated, ...prev]
    })
  }

  const handleSaved = (saved: Script) => {
    upsertScript(saved)
    setModalOpen(false)
    setEditingScript(null)
  }

  const handleDeleteScript = async (script: Script) => {
    const confirmed = window.confirm(`Delete script "${script.name}"? This cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteScript(script.id)
      setScripts((prev) => prev.filter((s) => s.id !== script.id))
      setActionError(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete script')
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
          onClick={() => {
            setModalMode('create')
            setEditingScript(null)
            setModalOpen(true)
          }}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
        >
          New Script
        </button>
      </div>

      {(error || actionError) && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error || actionError}
        </div>
      )}

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
                <td className="px-4 py-3 text-sm font-medium text-zinc-100">
                  <Link href={`/scripts/${script.id}`} className="text-blue-200 hover:text-white">
                    {script.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{script.description ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{script.language}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  <TargetOsBadge value={script.target_os_type} />
                </td>
                <td className="px-4 py-3 text-sm text-blue-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-md px-3 py-1 text-sm font-semibold hover:bg-blue-500/10 hover:text-blue-200"
                      onClick={() => setViewScript(script)}
                    >
                      View
                    </button>
                    <button
                      className="rounded-md px-3 py-1 text-sm font-semibold text-amber-200 hover:bg-amber-500/10"
                      onClick={() => {
                        setModalMode('edit')
                        setEditingScript(script)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md px-3 py-1 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
                      onClick={() => handleDeleteScript(script)}
                    >
                      Delete
                    </button>
                  </div>
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

      <ScriptModal
        open={modalOpen}
        mode={modalMode}
        initialScript={editingScript}
        onClose={() => {
          setModalOpen(false)
          setEditingScript(null)
        }}
        onSaved={handleSaved}
      />

      {viewScript && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{viewScript.name}</h3>
                <p className="text-xs text-zinc-400">Language: {viewScript.language}</p>
                <p className="text-xs text-zinc-500">Target OS: {formatTargetOs(viewScript.target_os_type)}</p>
              </div>
              <button
                onClick={() => setViewScript(null)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-md border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-100">
              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">{viewScript.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
