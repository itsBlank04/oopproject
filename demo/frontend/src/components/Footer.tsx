import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'

const sections = [
  {
    title: 'Our Services',
    links: [
      { label: 'Products', to: '/products' },
      { label: 'Auctions', to: '/auctions' },
      { label: 'Used Items', to: '/used-listings' },
      { label: 'Repairs', to: '/repair/technicians' },
      { label: 'Vendors', to: '/shop' },
      { label: 'Become a Vendor', to: '/profile#role-upgrade' },
    ],
  },
  {
    title: 'Contact Us',
    links: [
      { label: 'hello@atomdrops.com', to: 'mailto:hello@atomdrops.com' },
      { label: '+880 1700-000000', to: 'tel:+8801700000000' },
      { label: 'Dhaka, Bangladesh', to: '#' },
      { label: 'Facebook', to: 'https://facebook.com/atomdrops' },
      { label: 'Instagram', to: 'https://instagram.com/atomdrops' },
    ],
  },
  {
    title: 'Customer Support',
    links: [
      { label: 'Help Center', to: '#' },
      { label: 'FAQ', to: '#' },
      { label: 'Live Chat', to: '#' },
      { label: 'Returns & Refunds', to: '#' },
      { label: 'Shipping Info', to: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '#' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Cookie Policy', to: '#' },
      { label: 'Refund Policy', to: '#' },
      { label: 'Trust & Safety', to: '#' },
    ],
  },
]

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cbd5e1] text-[#94A3B8] transition-all hover:border-[#94A3B8] hover:bg-[#eef2ff] hover:text-[#1e293b]"
    >
      {children}
    </a>
  )
}

export default function Footer() {
  const { user, logout } = useAuth()
  const { openModal } = useAuthModal()

  const accountLinks = user
    ? [
        { label: 'Profile', to: '/profile' },
        { label: 'My Orders', to: '/account/orders' },
        { label: 'Wishlist', to: '/wishlist' },
        { label: 'Addresses', to: '/addresses' },
        { label: 'Sign Out', to: '#', action: () => { logout(); window.scrollTo(0, 0) } },
      ]
    : [
        { label: 'Sign In', to: '#', action: () => openModal('signin') },
        { label: 'Register', to: '#', action: () => openModal('register') },
        { label: 'Become a Vendor', to: '/profile#role-upgrade' },
      ]

  return (
    <footer className="border-t border-[#e0e7ff] bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:px-8">
        {/* Brand row */}
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="AtomDrops" className="h-auto w-auto max-h-16 max-w-32 object-contain" />
          </Link>

          <p className="max-w-xs text-xs leading-relaxed text-[#94A3B8]">
            Your trusted marketplace for verified pre-owned tech, furniture, and repairs across Bangladesh.
          </p>

          <div className="flex items-center gap-2">
            <SocialIcon href="https://facebook.com/atomdrops" label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </SocialIcon>
            <SocialIcon href="https://instagram.com/atomdrops" label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
            </SocialIcon>
            <SocialIcon href="https://x.com/atomdrops" label="X">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </SocialIcon>
            <SocialIcon href="https://linkedin.com/company/atomdrops" label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
            </SocialIcon>
          </div>
        </div>

        {/* Faded divider */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-[#cbd5e1] to-transparent" />

        {/* Links grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map(section => (
            <div key={section.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                {section.title}
              </p>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-[#94A3B8] transition-colors hover:text-[#1e293b]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Account column */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Account
            </p>
            <ul className="space-y-2.5">
              {accountLinks.map(link => (
                <li key={link.label}>
                  {'action' in link ? (
                    <button
                      onClick={link.action}
                      className="text-sm text-[#94A3B8] transition-colors hover:text-[#1e293b]"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-sm text-[#94A3B8] transition-colors hover:text-[#1e293b]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 border-t border-[#e0e7ff] pt-6 text-center">
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} AtomDrops · Made in Dhaka, Bangladesh · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
