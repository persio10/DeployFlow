import Link from 'next/link'

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 py-3">
      <div className="text-lg font-semibold">DeployFlow Fleet</div>
      <nav className="flex items-center gap-4 text-sm text-zinc-300">
        <Link href="#" className="hover:text-white">Docs</Link>
        <Link href="#" className="hover:text-white">Support</Link>
      </nav>
    </header>
  )
}
