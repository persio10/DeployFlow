'use client'

interface DeviceStatusBadgeProps {
  status?: string | null
  osType?: string | null
  lastCheckIn?: string | null
}

function formatRelative(lastCheckIn?: string | null): string {
  if (!lastCheckIn) return 'No recent check-in'
  const date = new Date(lastCheckIn)
  const diffMs = Date.now() - date.getTime()
  if (Number.isNaN(diffMs)) return lastCheckIn

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function DeviceStatusBadge({ status, osType, lastCheckIn }: DeviceStatusBadgeProps) {
  const normalized = (status ?? '').toLowerCase()
  const online = normalized === 'online'
  const statusClasses = online
    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30'
    : 'bg-amber-300/10 text-amber-200 border-amber-300/30'

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">
      <span className={`rounded-full border px-2 py-1 ${statusClasses}`}>
        {osType ? osType : 'Unknown OS'}
      </span>
      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] font-medium normal-case text-zinc-200">
        {online ? 'Online' : 'Offline'} • {formatRelative(lastCheckIn)}
      </span>
    </div>
  )
}
