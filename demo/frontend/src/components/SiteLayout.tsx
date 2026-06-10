import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { activeRole } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hasSidebar = activeRole !== null

  useEffect(() => {
    if (activeRole) setSidebarOpen(true)
  }, [activeRole])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />
      <main className={`flex-1 transition-all duration-300 ${hasSidebar && sidebarOpen ? 'lg:ml-60' : ''}`}>{children}</main>
      <Footer />
    </div>
  )
}
