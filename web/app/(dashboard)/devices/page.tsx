'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchDevices, deleteDevice, Device } from '@/lib/api'
import { DeviceStatusBadge } from '@/components/DeviceStatusBadge'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDevices()
        setDevices(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load devices'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Devices</h1>
          <p className="text-sm text-zinc-400">All enrolled endpoints reporting in via the DeployFlow agent.</p>
        </div>
        <div className="rounded-md bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
          {loading && 'Loading devices…'}
          {!loading && error && <span className="text-rose-400">{error}</span>}
          {!loading && !error && `${devices.length} device${devices.length === 1 ? '' : 's'}`}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <Link href={`/devices/${device.id}`} className="text-lg font-semibold text-blue-200 hover:text-white">
                  {device.hostname}
                </Link>
                <p className="text-xs text-zinc-500">ID: {device.id}</p>
              </div>
              <DeviceStatusBadge status={device.status} osType={device.os_type} lastCheckIn={device.last_check_in} />
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-zinc-300">
              <div className="flex items-center justify-between rounded-md bg-zinc-900/60 px-3 py-2">
                <dt className="text-zinc-400">OS Version</dt>
                <dd className="text-zinc-100">{device.os_version ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-zinc-900/60 px-3 py-2">
                <dt className="text-zinc-400">Last Check-In</dt>
                <dd className="text-zinc-100">{formatDate(device.last_check_in)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex justify-end">
              <Link
                href={`/devices/${device.id}`}
                className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
              >
                View
              </Link>
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Delete device ${device.hostname}? This will also queue a remote uninstall of the agent.`,
                  )
                  if (!confirmed) return
                  setDeleteError(null)
                  setDeleteNotice(null)
                  setDeletingId(device.id)
                  try {
                    const { status } = await deleteDevice(device.id)
                    setDevices((prev) => prev.filter((d) => d.id !== device.id))
                    if (status === 404 || status === 410) {
                      setDeleteNotice('Device already removed. List refreshed.')
                    } else {
                      setDeleteNotice('Device deletion requested; agent uninstall will run on next check-in.')
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to delete device'
                    setDeleteError(message)
                  } finally {
                    setDeletingId(null)
                  }
                }}
                disabled={deletingId === device.id}
                className="ml-2 rounded-md border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
              >
                {deletingId === device.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}

        {!loading && !error && devices.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
            No devices yet. Agents will appear here after registering.
          </div>
        )}
      </div>

      {deleteError && <p className="text-sm text-rose-400">{deleteError}</p>}
      {deleteNotice && <p className="text-sm text-emerald-300">{deleteNotice}</p>}
    </div>
  )
}
