'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DeploymentProfile, fetchProfiles } from '@/lib/api'

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<DeploymentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProfiles()
        setProfiles(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profiles')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Deployment Profiles</h1>
        <p className="text-sm text-zinc-400">Reusable task sequences for building or configuring devices.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          {loading && 'Loading profiles…'}
          {error && !loading && <span className="text-rose-400">{error}</span>}
          {!loading && !error && `${profiles.length} profile${profiles.length === 1 ? '' : 's'}`}
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Target OS</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-zinc-800/40">
                <td className="px-4 py-3 text-sm font-medium text-blue-300">
                  <Link href={`/profiles/${profile.id}`}>{profile.name}</Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{profile.target_os_type ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  {profile.created_at ? new Date(profile.created_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {!loading && !error && profiles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-zinc-400">
                  No deployment profiles yet. Create one via the API to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
