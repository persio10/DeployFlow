'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchDevices, Device } from '@/lib/api'

function StatusBadge({ status }: { status: string }) {
  const color = status.toLowerCase() === 'online' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-300 bg-amber-300/10'
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {status || 'unknown'}
    </span>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Devices</h1>
        <p className="text-sm text-zinc-400">Enrolled endpoints reporting in via the DeployFlow agent.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          {loading && 'Loading devices…'}
          {error && !loading && <span className="text-rose-400">{error}</span>}
          {!loading && !error && `${devices.length} device${devices.length === 1 ? '' : 's'}`}
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Hostname</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">OS Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Last Check-In</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">OS Version</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-zinc-800/40">
                <td className="px-4 py-3 text-sm font-medium text-blue-300">
                  <Link href={`/devices/${device.id}`}>{device.hostname}</Link>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{device.os_type ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  {device.last_check_in ? new Date(device.last_check_in).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{device.os_version ?? '—'}</td>
              </tr>
            ))}
            {!loading && !error && devices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-400">
                  No devices yet. Agents will appear here after registering.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
