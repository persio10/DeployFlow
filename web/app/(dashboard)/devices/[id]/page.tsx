'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createDeviceAction, fetchDevice, fetchDeviceActions, fetchScripts, Action, Device, Script } from '@/lib/api'

function StatusBadge({ status }: { status: string }) {
  const color = status.toLowerCase() === 'online' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-300 bg-amber-300/10'
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {status || 'unknown'}
    </span>
  )
}

function ActionBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const color =
    normalized === 'succeeded'
      ? 'bg-emerald-400/10 text-emerald-300'
      : normalized === 'running'
      ? 'bg-blue-400/10 text-blue-300'
      : normalized === 'pending'
      ? 'bg-amber-300/10 text-amber-200'
      : 'bg-rose-400/10 text-rose-300'

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{status}</span>
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function DeviceDetailPage() {
  const params = useParams()
  const paramId = params?.id
  const deviceId = useMemo(() => {
    const value = Array.isArray(paramId) ? paramId[0] : paramId
    return Number(value)
  }, [paramId])
  const [device, setDevice] = useState<Device | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [scripts, setScripts] = useState<Script[]>([])
  const [scriptModalOpen, setScriptModalOpen] = useState(false)
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null)
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(deviceId)) return

    const load = async () => {
      try {
        const [deviceResp, actionsResp] = await Promise.all([
          fetchDevice(deviceId),
          fetchDeviceActions(deviceId),
        ])
        setDevice(deviceResp)
        setActions(actionsResp)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load device'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [deviceId])

  const openScriptModal = async () => {
    setScriptModalOpen(true)
    try {
      const data = await fetchScripts()
      setScripts(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load scripts')
    }
  }

  const submitScriptAction = async () => {
    if (!selectedScriptId) {
      setActionError('Select a script to run')
      return
    }
    setSubmittingAction(true)
    setActionError(null)
    try {
      await createDeviceAction(deviceId, {
        type: 'powershell_inline',
        script_id: selectedScriptId,
      })
      const updated = await fetchDeviceActions(deviceId)
      setActions(updated)
      setScriptModalOpen(false)
      setSelectedScriptId(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create action')
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-300">Loading device…</div>
  }

  if (error || !device) {
    return <div className="text-sm text-rose-400">{error ?? 'Device not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{device.hostname}</h1>
          <p className="text-sm text-zinc-400">Device ID: {device.id}</p>
        </div>
        <StatusBadge status={device.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Hostname</dt>
              <dd>{device.hostname}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Status</dt>
              <dd>
                <StatusBadge status={device.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">OS Version</dt>
              <dd>{device.os_version ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Last Check-In</dt>
              <dd>{formatDate(device.last_check_in)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Actions</h2>
            <button
              onClick={openScriptModal}
              className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
            >
              Run Script
            </button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            {actions.length === 0 && <p className="text-zinc-400">No actions yet for this device.</p>}
            <ul className="divide-y divide-zinc-800">
              {actions.map((action) => (
                <li key={action.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{action.type}</span>
                        <ActionBadge status={action.status} />
                      </div>
                      <p className="text-xs text-zinc-400">Created: {formatDate(action.created_at)}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-400">
                      {action.completed_at && <p>Completed: {formatDate(action.completed_at)}</p>}
                      {action.logs && <p className="mt-1 max-w-sm truncate text-zinc-300">{action.logs}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {scriptModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Run Script</h3>
              <button onClick={() => setScriptModalOpen(false)} className="text-sm text-zinc-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {actionError && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{actionError}</div>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Select script</label>
                <select
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  value={selectedScriptId ?? ''}
                  onChange={(e) => setSelectedScriptId(Number(e.target.value))}
                >
                  <option value="" disabled>
                    {scripts.length === 0 ? 'No scripts available' : 'Choose a script'}
                  </option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.name} ({script.language})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={submitScriptAction}
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:opacity-50"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Submitting…' : 'Run Script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
