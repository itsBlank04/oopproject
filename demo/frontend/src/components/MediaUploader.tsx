import { useState, useRef, useCallback } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

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
            <div key={m.url} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[#e4d6c8]">
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
              className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-[#d7c7b8] text-[#8c7564] hover:border-[#221b16] hover:text-[#221b16] transition disabled:opacity-50">
              {uploading ? (
                <span className="text-xs">{progress.uploaded}/{progress.total}</span>
              ) : (
                <span className="text-xl">+</span>
              )}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" multiple accept={acceptTypes} className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-[#221b16]">{label}</label>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition
          ${dragOver ? 'border-[#221b16] bg-[#f0e8df]' : 'border-[#d7c7b8] bg-[#faf6f1] hover:border-[#b8a494]'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#221b16] text-2xl text-[#f9f5f0]">
            📷
          </div>
          <div>
            <p className="font-semibold text-[#221b16]">
              {uploading ? `Uploading ${progress.uploaded}/${progress.total}...` : 'Drop files here or click to browse'}
            </p>
            <p className="mt-1 text-xs text-[#8c7564]">
              {allowVideo ? 'Images (JPG, PNG, WebP, GIF) & Videos (MP4, WebM)' : 'Images (JPG, PNG, WebP, GIF)'}
              {' '} · Max {maxSizeMB}MB each · Up to {maxFiles} files
            </p>
          </div>
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl bg-[#e4d6c8]">
            <div className="h-full bg-[#221b16] transition-all duration-300"
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
            <div key={m.url} className="group relative overflow-hidden rounded-xl border border-[#e4d6c8] bg-white">
              {m.type === 'video' ? (
                <video src={m.url} controls className="aspect-square w-full object-cover" />
              ) : (
                <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition">
                <div className="flex w-full items-center justify-between p-2">
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-[#221b16] truncate max-w-[60%]">
                    {m.type === 'video' ? '🎬' : '🖼️'} {m.name}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleRemove(m.url) }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600 transition">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
