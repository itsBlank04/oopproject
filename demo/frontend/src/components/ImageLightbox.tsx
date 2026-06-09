import { useEffect, useState } from 'react'

type LightboxImage = {
  url: string
  name?: string
  type?: string
}

type Props = {
  images: LightboxImage[]
  initialIndex?: number
  onClose: () => void
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const current = images[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowLeft') setIndex(i => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setIndex(i => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        style={{ animation: 'lbScaleIn 0.2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes lbScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>

        {/* Main image area */}
        <div className="relative flex items-center justify-center bg-[#111]">
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex(i => (i > 0 ? i - 1 : images.length - 1)) }}
                className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/25 hover:text-white"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex(i => (i < images.length - 1 ? i + 1 : 0)) }}
                className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/25 hover:text-white"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
              </button>
            </>
          )}
          {current?.type === 'video' ? (
            <video src={current.url} controls className="max-h-[80vh] w-full" />
          ) : (
            <img src={current?.url} alt="" className="max-h-[80vh] w-full object-contain" />
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {images.length > 1 && (
              <span className="rounded-full bg-[#f9f5f0] px-2.5 py-0.5 text-xs font-semibold text-[#6c5b4f]">
                {index + 1} / {images.length}
              </span>
            )}
            {current?.name && (
              <span className="max-w-[200px] truncate text-xs text-[#8c7564]">
                {current.type === 'video' ? '🎬' : '🖼️'} {current.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden text-xs text-[#8c7564] sm:block">Click outside or press Esc</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f9f5f0] text-[#6c5b4f] transition hover:bg-[#e4d6c8]"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
