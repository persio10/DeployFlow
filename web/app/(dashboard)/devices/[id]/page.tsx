'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Action,
  Device,
  DeploymentProfile,
  Script,
  applyProfile,
  createDeviceAction,
  deleteDevice,
  fetchDevice,
  fetchDeviceActions,
  fetchProfiles,
  fetchScripts,
} from '@/lib/api'
import { DeviceStatusBadge } from '@/components/DeviceStatusBadge'
import { ActionStatusBadge } from '@/components/ActionStatusBadge'
import { LogsModal } from '@/components/LogsModal'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
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

  const [profiles, setProfiles] = useState<DeploymentProfile[]>([])
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [logAction, setLogAction] = useState<Action | null>(null)

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
      const filtered = device?.os_type
        ? data.filter((s) => !s.target_os_type || s.target_os_type === device.os_type)
        : data
      setScripts(filtered)
      if (filtered.length === 0) {
        setActionError('No compatible scripts for this device OS. Create one first.')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load scripts')
    }
  }

  const openProfileModal = async () => {
    setProfileModalOpen(true)
    try {
      const data = await fetchProfiles()
      const compatible = data.filter((profile) => {
        if (profile.is_template) return false
        if (!device?.os_type || !profile.target_os_type) return true
        return profile.target_os_type === device.os_type
      })
      setProfiles(compatible)
      if (compatible.length === 0) {
        setProfileError('No compatible profiles available for this device OS.')
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to load profiles')
    }
  }

  const submitProfileApply = async () => {
    if (!selectedProfileId) {
      setProfileError('Select a profile to apply')
      return
    }
    setSubmittingProfile(true)
    setProfileError(null)
    try {
      await applyProfile(selectedProfileId, deviceId)
      const updated = await fetchDeviceActions(deviceId)
      setActions(updated)
      setProfileModalOpen(false)
      setSelectedProfileId(null)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to apply profile')
    } finally {
      setSubmittingProfile(false)
    }
  }

  const submitRunScript = async () => {
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

  const confirmDelete = async () => {
    const confirmed = window.confirm(
      `Delete device ${device.hostname}? This will queue a remote agent uninstall and remove it from the console.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDevice(device.id)
      router.push('/devices')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete device'
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Device</p>
          <h1 className="text-2xl font-semibold text-white">{device.hostname}</h1>
          <p className="text-xs text-zinc-500">ID: {device.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="rounded-md border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete device'}
          </button>
          <DeviceStatusBadge status={device.status} osType={device.os_type} lastCheckIn={device.last_check_in} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-3 grid gap-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-md bg-zinc-900/50 px-3 py-2">
              <dt className="text-zinc-500">Hostname</dt>
              <dd className="text-zinc-100">{device.hostname}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-900/50 px-3 py-2">
              <dt className="text-zinc-500">OS Type</dt>
              <dd className="text-zinc-100">{device.os_type ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-900/50 px-3 py-2">
              <dt className="text-zinc-500">OS Version</dt>
              <dd className="text-zinc-100">{device.os_version ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-900/50 px-3 py-2">
              <dt className="text-zinc-500">Last Check-In</dt>
              <dd className="text-zinc-100">{formatDate(device.last_check_in)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Actions</h2>
              <p className="text-sm text-zinc-400">Queue scripts or apply deployment profiles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openProfileModal}
                className="rounded-md border border-blue-400/40 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10"
              >
                Apply Profile
              </button>
              <button
                onClick={openScriptModal}
                className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
              >
                Run Script
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/70">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Created</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Completed</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {actions.map((action) => (
                  <tr key={action.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-3 text-sm text-zinc-200">{action.id}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-zinc-100">{action.type}</td>
                    <td className="px-3 py-3 text-sm text-zinc-200">
                      <ActionStatusBadge status={action.status} />
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{formatDate(action.created_at)}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{formatDate(action.completed_at)}</td>
                    <td className="px-3 py-3 text-right text-sm">
                      <button
                        onClick={() => setLogAction(action)}
                        className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                      >
                        View logs
                      </button>
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-zinc-400">
                      No actions yet for this device.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteError && <p className="text-sm text-rose-400">{deleteError}</p>}

      {profileModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Apply Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-sm text-zinc-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {profileError && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{profileError}</div>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Select profile</label>
                <select
                  value={selectedProfileId ?? ''}
                  onChange={(e) => setSelectedProfileId(Number(e.target.value) || null)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Choose a profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} {profile.target_os_type ? `(${profile.target_os_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={submitProfileApply}
                  disabled={submittingProfile}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingProfile ? 'Applying…' : 'Apply Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scriptModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
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
                  value={selectedScriptId ?? ''}
                  onChange={(e) => setSelectedScriptId(Number(e.target.value) || null)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Choose a script</option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.name} {script.target_os_type ? `(${script.target_os_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRunScript}
                  disabled={submittingAction}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingAction ? 'Queuing…' : 'Run Script'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LogsModal action={logAction} onClose={() => setLogAction(null)} />
    </div>
  )
}
