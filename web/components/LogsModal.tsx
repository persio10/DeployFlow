'use client'

import { Action } from '@/lib/api'

interface LogsModalProps {
  action: Action | null
  onClose: () => void
}

export function LogsModal({ action, onClose }: LogsModalProps) {
  if (!action) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Action #{action.id}</p>
            <h3 className="text-xl font-semibold text-zinc-50">{action.type}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-zinc-200 md:grid-cols-2">
          <div className="space-y-1 rounded-md bg-zinc-900/50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Created</p>
            <p>{action.created_at ? new Date(action.created_at).toLocaleString() : '—'}</p>
          </div>
          <div className="space-y-1 rounded-md bg-zinc-900/50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Completed</p>
            <p>{action.completed_at ? new Date(action.completed_at).toLocaleString() : '—'}</p>
          </div>
          <div className="space-y-1 rounded-md bg-zinc-900/50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
            <p className="font-semibold">{action.status}</p>
          </div>
          <div className="space-y-1 rounded-md bg-zinc-900/50 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Payload</p>
            <p className="break-words text-zinc-100">{action.payload ?? '—'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/80">
          <div className="border-b border-zinc-800 px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">Logs</div>
          <pre className="max-h-80 overflow-auto bg-zinc-950 px-3 py-3 text-sm text-zinc-100 whitespace-pre-wrap">
            {action.logs ?? '(no logs)'}
          </pre>
        </div>
      </div>
    </div>
  )
}
