import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <main>{children}</main>
    </div>
  )
}
