"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

import SoftwareEditorModal from '@/components/SoftwareEditorModal'
import { deleteSoftware, fetchSoftwareItem, SoftwarePackage } from '@/lib/api'
import { formatTargetOs } from '@/lib/osTypes'

interface SoftwareDetailPageProps {
  params: { id: string }
}

export default function SoftwareDetailPage({ params }: SoftwareDetailPageProps) {
  const [software, setSoftware] = useState<SoftwarePackage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const softwareId = Number(params.id)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSoftwareItem(softwareId)
        setSoftware(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load software'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [softwareId])

  const handleDelete = async () => {
    if (!software) return
    const confirmed = window.confirm(`Delete software "${software.name}"? This cannot be undone.`)
    if (!confirmed) return
    try {
      await deleteSoftware(software.id)
      window.alert('Software deleted')
      window.location.href = '/software'
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete software'
      setError(message)
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">Loading software…</div>
  }

  if (error || !software) {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-rose-300">{error || 'Software not found'}</p>
        <Link href="/software" className="text-blue-200 hover:text-white">
          Back to software
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{software.name}</h1>
          <p className="text-sm text-zinc-400">Installer: {software.installer_type}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-rose-500 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-100">Details</h2>
          <p><span className="text-zinc-400">Version:</span> {software.version || '—'}</p>
          <p><span className="text-zinc-400">Target OS:</span> {formatTargetOs(software.target_os_type)}</p>
          <p><span className="text-zinc-400">Installer type:</span> {software.installer_type}</p>
          <p><span className="text-zinc-400">Source type:</span> {software.source_type}</p>
          <p className="break-all"><span className="text-zinc-400">Source:</span> {software.source || '—'}</p>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-100">Commands</h2>
          <p><span className="text-zinc-400">Install args:</span> {software.install_args || '—'}</p>
          <p><span className="text-zinc-400">Uninstall args:</span> {software.uninstall_args || '—'}</p>
        </div>
      </div>

      <SoftwareEditorModal
        open={modalOpen}
        mode="edit"
        initialSoftware={software}
        onClose={() => setModalOpen(false)}
        onSaved={(updated) => {
          setSoftware(updated)
          setModalOpen(false)
        }}
      />
    </div>
  )
}

