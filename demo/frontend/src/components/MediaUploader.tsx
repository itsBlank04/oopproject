import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadFiles, validateFile, getFileType } from '../lib/supabaseStorage'
import toast from 'react-hot-toast'

type MediaItem = {
  url: string
  type: 'image' | 'video' | 'other'
  name: string
}

type MediaUploaderProps = {
  folder: string
  existingMedia?: MediaItem[]
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  allowVideo?: boolean
  onUpload: (urls: string[]) => void
  onRemove?: (url: string) => void
  label?: string
  compact?: boolean
}

export default function MediaUploader({
  folder,
  existingMedia = [],
  maxFiles = 10,
  maxSizeMB = 10,
  accept,
  allowVideo = true,
  onUpload,
  onRemove,
  label = 'Upload Media',
  compact = false,
}: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lightboxUrl])

  const acceptTypes = accept || (allowVideo
    ? 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'
    : 'image/jpeg,image/png,image/webp,image/gif')

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = maxFiles - media.length
    if (remaining <= 0) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }
    const toUpload = fileArray.slice(0, remaining)

    // Validate each file
    for (const f of toUpload) {
      const err = validateFile(f, maxSizeMB)
      if (err) { toast.error(err); return }
    }

    setUploading(true)
    setProgress({ uploaded: 0, total: toUpload.length })

    try {
      const urls = await uploadFiles(folder, toUpload, (uploaded, total) => {
        setProgress({ uploaded, total })
      })

      const newItems: MediaItem[] = urls.map((url, i) => ({
        url,
        type: getFileType(toUpload[i]),
        name: toUpload[i].name,
      }))

      const updated = [...media, ...newItems]
      setMedia(updated)
      onUpload(updated.map(m => m.url))
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 2000)
      toast.success(`${urls.length} file${urls.length > 1 ? 's' : ''} uploaded`)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress({ uploaded: 0, total: 0 })
    }
  }, [folder, maxFiles, maxSizeMB, media, onUpload])

  const handleRemove = (url: string) => {
    const updated = media.filter(m => m.url !== url)
    setMedia(updated)
    onUpload(updated.map(m => m.url))
    onRemove?.(url)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {media.map(m => (
            <div key={m.url} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[#e0e7ff]">
              {m.type === 'video' ? (
                <video src={m.url} className="h-full w-full object-cover" />
              ) : (
                <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
              )}
              <button onClick={() => handleRemove(m.url)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition text-xs">
                ✕
              </button>
            </div>
          ))}
          {media.length < maxFiles && (
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-[#cbd5e1] text-[#94A3B8] hover:border-[#1e293b] hover:text-[#1e293b] transition disabled:opacity-50">
              {uploading ? (
                <span className="text-xs">{progress.uploaded}/{progress.total}</span>
              ) : (
                <span className="text-xl">+</span>
              )}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" multiple accept={acceptTypes} className="hidden"
          onChange={e => { if (e.target.files) { handleFiles(e.target.files); e.target.value = '' } }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      <label className="text-sm font-semibold text-[#1e293b]">{label}</label>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 text-center transition
          ${dragOver ? 'border-[#1e293b] bg-[#eef2ff] border-dashed' : media.length > 0 ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 p-5' : 'border-dashed border-[#cbd5e1] bg-[#f8fafc] hover:border-[#cbd5e1] p-8'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
          ${successFlash ? '!border-emerald-500 !bg-emerald-50' : ''}`}
      >
        <div className="space-y-3">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-[#f8fafc] transition-colors ${media.length > 0 ? 'bg-emerald-600' : 'bg-[#1e293b]'}`}>
            {successFlash ? '✓' : '📷'}
          </div>
          <div>
            {uploading ? (
              <p className="font-semibold text-[#1e293b]">
                Uploading {progress.uploaded}/{progress.total}...
              </p>
            ) : media.length > 0 ? (
              <>
                <p className="font-semibold text-emerald-800">
                  {media.length} file{media.length > 1 ? 's' : ''} uploaded
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Drag or click to add more · up to {maxFiles} files
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[#1e293b]">Drop files here or click to browse</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {allowVideo ? 'Images (JPG, PNG, WebP, GIF) & Videos (MP4, WebM)' : 'Images (JPG, PNG, WebP, GIF)'}
                  {' '}· Max {maxSizeMB}MB each · Up to {maxFiles} files
                </p>
              </>
            )}
          </div>
          {media.length > 0 && !uploading && (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              {media.length}/{maxFiles}
            </div>
          )}
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl bg-[#e0e7ff]">
            <div className="h-full bg-[#1e293b] transition-all duration-300"
              style={{ width: `${(progress.uploaded / progress.total) * 100}%` }} />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" multiple accept={acceptTypes} className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />

      {/* Preview grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map(m => (
            <div key={m.url} className="group relative overflow-hidden rounded-xl border border-[#e0e7ff] bg-white">
              {m.type === 'video' ? (
                <video src={m.url} controls className="aspect-square w-full object-cover" />
              ) : (
                <button type="button" onClick={() => setLightboxUrl(m.url)} className="w-full">
                  <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" />
                </button>
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition">
                <button type="button" onClick={() => setLightboxUrl(m.url)} className="flex h-full w-full items-end">
                  <div className="flex w-full items-center justify-between p-2">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-[#1e293b] truncate max-w-[60%]">
                      {m.type === 'video' ? '🎬' : '🖼️'} {m.name}
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); handleRemove(m.url) }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600 transition cursor-pointer">
                      ✕
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (() => {
        const item = media.find(m => m.url === lightboxUrl)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setLightboxUrl(null)}
          >
            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
              style={{ animation: 'scaleIn 0.2s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-center bg-[#111]">
                {item?.type === 'video' ? (
                  <video src={item.url} controls className="max-h-[80vh] w-full" />
                ) : (
                  <img src={lightboxUrl} alt="" className="max-h-[80vh] w-full object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-xs text-[#94A3B8]">Click outside or press Esc to close</p>
                <div className="flex items-center gap-2">
                  {item && (
                    <button
                      type="button"
                      onClick={() => { handleRemove(item.url); setLightboxUrl(null) }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:border-red-300 hover:bg-red-50"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.53l.67 2.68.67-2.68a.75.75 0 0 1 1.44.422l-1.12 4.48a.75.75 0 0 1-1.44 0l-1.12-4.48a.75.75 0 0 1 .7-.952Z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#64748b] transition hover:bg-[#e0e7ff]"
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
      })()}
    </div>
  )
}
