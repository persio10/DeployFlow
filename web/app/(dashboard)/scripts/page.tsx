'use client'

import { useEffect, useState } from 'react'
import { fetchScripts, Script } from '@/lib/api'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Scripts</h1>
        <p className="text-sm text-zinc-400">Reusable automation snippets from the script library.</p>
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
                <td className="px-4 py-3 text-sm text-zinc-300">{script.target_os_type ?? 'Any'}</td>
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
                  No scripts yet. Add one via the backend API.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedScript && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedScript.name}</h3>
                <p className="text-xs text-zinc-400">Language: {selectedScript.language}</p>
                <p className="text-xs text-zinc-500">Target OS: {selectedScript.target_os_type ?? 'Any'}</p>
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
