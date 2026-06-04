import { createContext, useContext, useState, type ReactNode } from 'react'

export type AuthModalTab = 'signin' | 'register'

type AuthModalContextType = {
  open: boolean
  tab: AuthModalTab
  openModal: (tab?: AuthModalTab) => void
  closeModal: () => void
  setTab: (tab: AuthModalTab) => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<AuthModalTab>('signin')

  return (
    <AuthModalContext.Provider
      value={{
        open,
        tab,
        openModal: (t) => { setTab(t ?? 'signin'); setOpen(true) },
        closeModal: () => setOpen(false),
        setTab,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
