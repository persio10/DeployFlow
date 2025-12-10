import type { ReactNode } from 'react'
import { TopNav } from '@/components/TopNav'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-x-0 top-0 z-10">
        <TopNav />
      </div>
      <div className="mt-14 flex w-full">
        <Sidebar />
        <main className="flex-1 px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
