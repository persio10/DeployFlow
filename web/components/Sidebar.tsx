import Link from 'next/link'

const links = [
  { href: '/devices', label: 'Devices' },
  { href: '/profiles', label: 'Profiles' },
  { href: '/templates', label: 'Templates' },
  { href: '/scripts', label: 'Scripts' },
  { href: '/software', label: 'Software' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="w-56 border-r border-zinc-800 bg-zinc-900/40 px-4 py-6">
      <nav className="space-y-2 text-sm text-zinc-300">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 hover:bg-zinc-800 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
