'use client'

interface ActionStatusBadgeProps {
  status: string
}

const colorMap: Record<string, string> = {
  pending: 'bg-amber-300/10 text-amber-200 border-amber-300/30',
  running: 'bg-blue-400/10 text-blue-200 border-blue-400/30 animate-pulse',
  succeeded: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/30',
  failed: 'bg-rose-400/10 text-rose-200 border-rose-400/30',
}

export function ActionStatusBadge({ status }: ActionStatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? 'pending'
  const color = colorMap[normalized] ?? colorMap.pending

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${color}`}>
      {status}
    </span>
  )
}
