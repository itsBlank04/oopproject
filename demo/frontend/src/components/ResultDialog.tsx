import { useEffect, useRef } from 'react'

type Tone = 'success' | 'error'

type Props = {
  open: boolean
  title: string
  tone?: Tone
  onClose: () => void
}

export default function ResultDialog({ open, title, tone = 'success', onClose }: Props) {
  const okRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) okRef.current?.focus()
  }, [open])

  if (!open) return null

  const palette =
    tone === 'success'
      ? { ring: 'bg-emerald-50', icon: 'text-emerald-600', ok: 'bg-emerald-600 hover:bg-emerald-700' }
      : { ring: 'bg-rose-50', icon: 'text-rose-600', ok: 'bg-rose-600 hover:bg-rose-700' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e293b]/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        style={{ animation: 'resultIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes resultIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-[#f8fafc] hover:text-[#1e293b]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
        <div className="flex flex-col items-center px-6 pt-7 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${palette.ring}`}>
            {tone === 'success' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={`h-6 w-6 ${palette.icon}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={`h-6 w-6 ${palette.icon}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 id="result-title" className="mt-4 font-[Fraunces] text-lg text-[#1e293b]">
            {title}
          </h2>
        </div>
        <div className="mt-6 border-t border-[#eef2ff] bg-[#f8fafc] px-6 py-4">
          <button
            ref={okRef}
            type="button"
            onClick={onClose}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${palette.ok}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
