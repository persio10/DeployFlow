'use client'

import { useMemo, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DeploymentProfileWithTasks, fetchProfile } from '@/lib/api'
import { formatTargetOs } from '@/lib/osTypes'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}


export default function ProfileDetailPage() {
  const params = useParams()
  const paramId = params?.id
  const profileId = useMemo(() => {
    const value = Array.isArray(paramId) ? paramId[0] : paramId
    return Number(value)
  }, [paramId])

  const [profile, setProfile] = useState<DeploymentProfileWithTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(profileId)) return

    const load = async () => {
      try {
        const data = await fetchProfile(profileId)
        setProfile(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profileId])

  if (loading) {
    return <div className="text-sm text-zinc-300">Loading profile…</div>
  }

  if (error || !profile) {
    return <div className="text-sm text-rose-400">{error ?? 'Profile not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Deployment Profile</p>
          <h1 className="text-2xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-zinc-400">Profile ID: {profile.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
            Target OS: {formatTargetOs(profile.target_os_type)}
          </span>
          {profile.is_template && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
              Template
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-3 grid gap-3 text-sm text-zinc-300">
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Description</dt>
              <dd>{profile.description ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Created</dt>
              <dd>{formatDate(profile.created_at)}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-zinc-900/50 p-3">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Updated</dt>
              <dd>{formatDate(profile.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="mt-3 overflow-hidden rounded-md border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/70">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Order</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Action Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Script ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Continue on Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {profile.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.order_index}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-zinc-100">{task.name}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.action_type}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.script_id ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-zinc-300">{task.continue_on_error ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {profile.tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-400">
                      No tasks configured for this profile yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
