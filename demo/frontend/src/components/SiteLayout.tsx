import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { activeRole } = useAuth()
  const hasSidebar = activeRole !== null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${hasSidebar ? 'lg:ml-60' : ''}`}>{children}</main>
      <Footer />
    </div>
  )
}
