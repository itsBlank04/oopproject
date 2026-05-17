import { useState, useEffect } from 'react'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    apiClient.get('/api/chat/conversations')
      .then(r => setConversations(Array.isArray(r.data) ? r.data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  const loadMessages = async (conv: any) => {
    setSelected(conv)
    try {
      const r = await apiClient.get(`/api/chat/conversations/${conv.id}/messages`)
      setMessages(Array.isArray(r.data) ? r.data : [])
    } catch { setMessages([]) }
  }

  const send = async () => {
    if ((!newMsg.trim() && attachments.length === 0) || !selected) return
    try {
      const body = attachments.length > 0
        ? `${newMsg}\n${attachments.map(u => `[attachment](${u})`).join('\n')}`
        : newMsg
      await apiClient.post(`/api/chat/conversations/${selected.id}/messages`, { body })
      setNewMsg('')
      setAttachments([])
      loadMessages(selected)
    } catch { toast.error('Failed to send') }
  }

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url)
  const isVideoUrl = (url: string) => /\.(mp4|webm)($|\?)/i.test(url)

  const renderBody = (body: string) => {
    const parts = body.split('\n')
    return parts.map((line, i) => {
      const match = line.match(/\[attachment\]\((.+)\)/)
      if (match) {
        const url = match[1]
        if (isImageUrl(url)) return <img key={i} src={url} alt="attachment" className="mt-2 max-h-48 rounded-xl" />
        if (isVideoUrl(url)) return <video key={i} src={url} controls className="mt-2 max-h-48 rounded-xl" />
        return <a key={i} href={url} target="_blank" className="text-blue-400 underline">📎 Attachment</a>
      }
      return line ? <p key={i}>{line}</p> : null
    })
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Messages</h1>
        <div className="mt-6 grid h-[650px] grid-cols-[280px_1fr] gap-4 overflow-hidden rounded-2xl border border-[#e4d6c8] bg-white">
          {/* Conversation list */}
          <div className="border-r border-[#e4d6c8] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-[#8c7564]">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-[#8c7564]">No conversations yet</p>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => loadMessages(c)}
                className={`w-full border-b border-[#e4d6c8] p-4 text-left transition hover:bg-[#f9f5f0] ${selected?.id === c.id ? 'bg-[#f0e8df]' : ''}`}>
                <p className="font-semibold text-[#221b16] text-sm">Conversation #{c.id}</p>
                <p className="text-xs text-[#8c7564]">{new Date(c.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
          {/* Chat area */}
          <div className="flex flex-col">
            {selected ? (
              <>
                <div className="border-b border-[#e4d6c8] p-4">
                  <p className="font-semibold text-[#221b16]">Conversation #{selected.id}</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map(m => (
                    <div key={m.id} className={`max-w-[70%] rounded-2xl p-3 text-sm ${m.isMine ? 'ml-auto bg-[#221b16] text-[#f9f5f0]' : 'bg-[#f0e8df] text-[#221b16]'}`}>
                      {renderBody(m.body)}
                      <p className="mt-1 text-xs opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
                {/* Attachment preview */}
                {attachments.length > 0 && (
                  <div className="flex gap-2 border-t border-[#e4d6c8] px-4 pt-3">
                    {attachments.map((url, i) => (
                      <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[#e4d6c8]">
                        {isVideoUrl(url)
                          ? <video src={url} className="h-full w-full object-cover" />
                          : <img src={url} className="h-full w-full object-cover" />}
                        <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Input area */}
                <div className="flex items-center gap-2 border-t border-[#e4d6c8] p-4">
                  <MediaUploader
                    folder="messages"
                    maxFiles={5}
                    maxSizeMB={10}
                    allowVideo={true}
                    compact
                    onUpload={setAttachments}
                  />
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..." className="flex-1 rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none" />
                  <button onClick={send} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">Send</button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8c7564]">Select a conversation</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
