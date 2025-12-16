"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

import SoftwareEditorModal from '@/components/SoftwareEditorModal'
import { deleteSoftware, fetchSoftware, SoftwarePackage } from '@/lib/api'
import { formatTargetOs, TargetOsType } from '@/lib/osTypes'

function TargetOsBadge({ value }: { value?: TargetOsType | null }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-200">
      {formatTargetOs(value)}
    </span>
  )
}

export default function SoftwarePage() {
  const [software, setSoftware] = useState<SoftwarePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<SoftwarePackage | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSoftware()
        setSoftware(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load software'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const upsertSoftware = (item: SoftwarePackage) => {
    setSoftware((prev) => {
      const exists = prev.some((s) => s.id === item.id)
      if (exists) {
        return prev.map((s) => (s.id === item.id ? item : s))
      }
      return [item, ...prev]
    })
  }

  const handleSaved = (item: SoftwarePackage) => {
    upsertSoftware(item)
    setEditing(null)
    setModalOpen(false)
  }

  const handleDelete = async (item: SoftwarePackage) => {
    const confirmed = window.confirm(`Delete software "${item.name}"? This cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteSoftware(item.id)
      setSoftware((prev) => prev.filter((s) => s.id !== item.id))
      window.alert('Software deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete software'
      setError(message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Software</h1>
          <p className="text-sm text-zinc-400">Reusable software definitions for install actions.</p>
        </div>
        <button
          onClick={() => {
            setModalMode('create')
            setEditing(null)
            setModalOpen(true)
          }}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
        >
          New Software
        </button>
      </div>

      {error && <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          {loading && 'Loading software…'}
          {error && !loading && <span className="text-rose-400">{error}</span>}
          {!loading && !error && `${software.length} package${software.length === 1 ? '' : 's'}`}
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Version</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Installer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Target OS</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {software.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-800/40">
                <td className="px-4 py-3 text-sm font-medium text-zinc-100">
                  <Link href={`/software/${item.id}`} className="text-blue-200 hover:text-white">
                    {item.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300">{item.version || '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{item.installer_type}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  <TargetOsBadge value={item.target_os_type} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-md px-3 py-1 text-sm font-semibold text-amber-200 hover:bg-amber-500/10"
                      onClick={() => {
                        setModalMode('edit')
                        setEditing(item)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md px-3 py-1 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !error && software.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-400">
                  No software packages yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SoftwareEditorModal
        open={modalOpen}
        mode={modalMode}
        initialSoftware={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}

