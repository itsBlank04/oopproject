import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

type Conv = {
  id: number
  otherUserId: number
  otherUserName: string
  otherUserAvatar: string
  lastMessage?: string
  lastMessageAt?: string
  lastMessageSenderId?: number
  unreadCount: number
  createdAt: string
}

type Msg = {
  id: number
  body: string
  senderId: number
  senderName: string
  senderAvatar: string
  isMine: boolean
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Conv | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const msgEndRef = useRef<HTMLDivElement>(null)

  const { data: convs = [], isLoading } = useQuery<Conv[]>({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get('/api/chat/conversations').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  })

  const { data: messages = [] } = useQuery<Msg[]>({
    queryKey: ['messages', selected?.id],
    queryFn: () => apiClient.get(`/api/chat/conversations/${selected!.id}/messages`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!selected,
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? [],
  })

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/chat/conversations/${selected!.id}/messages`, { body: newMsg }),
    onSuccess: (r) => {
      setMessages((prev: Msg[]) => [...prev, r.data])
      setNewMsg('')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Failed to send'),
  })

  const selectConv = (conv: Conv) => {
    setSelected(conv)
    queryClient.setQueryData<Conv[]>(['conversations'], prev =>
      prev?.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c) ?? []
    )
  }

  const handleSend = () => {
    if (!newMsg.trim() || !selected || sendMutation.isPending) return
    sendMutation.mutate()
  }

  const setMessages = (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    queryClient.setQueryData(['messages', selected?.id], updater)
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="mx-auto flex h-[calc(100vh-80px)] max-w-6xl px-4 py-6">
        <div className="flex w-full overflow-hidden rounded-2xl border border-[#e4d6c8] bg-white shadow-sm">
          {/* Sidebar */}
          <div className="flex w-[340px] flex-shrink-0 flex-col border-r border-[#e4d6c8]">
            <div className="border-b border-[#e4d6c8] px-5 py-4">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">Messages</h2>
              <p className="mt-0.5 text-xs text-[#8c7564]">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-1 p-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 rounded-xl p-3 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-[#e4d6c8]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-[#e4d6c8]" />
                        <div className="h-2 w-40 rounded bg-[#e4d6c8]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[#8c7564]">
                  No conversations yet
                </div>
              ) : (
                <div className="py-1">
                  {convs.map(c => (
                    <button key={c.id} onClick={() => selectConv(c)}
                      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[#f9f5f0] ${
                        selected?.id === c.id ? 'bg-[#f0e8df]' : ''
                      }`}>
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8]">
                        {c.otherUserAvatar ? (
                          <img src={c.otherUserAvatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#6c5b4f]">
                            {c.otherUserName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        {c.unreadCount > 0 && (
                          <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {c.unreadCount > 9 ? '9+' : c.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-semibold text-[#221b16]">
                            {c.otherUserName || `User #${c.otherUserId}`}
                          </p>
                          {c.lastMessageAt && (
                            <p className="ml-2 shrink-0 text-[10px] text-[#8c7564]">{timeAgo(c.lastMessageAt)}</p>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#8c7564]">
                          {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Chat area */}
          <div className="flex flex-1 flex-col">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#e4d6c8] px-6 py-4">
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8]">
                    {selected.otherUserAvatar ? (
                      <img src={selected.otherUserAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-[#6c5b4f]">
                        {selected.otherUserName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#221b16]">{selected.otherUserName || `User #${selected.otherUserId}`}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        m.isMine ? 'bg-[#221b16] text-[#f9f5f0] rounded-br-md' : 'bg-[#f0e8df] text-[#221b16] rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${m.isMine ? 'text-[#b8a494]' : 'text-[#8c7564]'}`}>
                          {formatTime(m.createdAt)}
                          {m.isMine && (
                            <span className="ml-1">{m.isRead ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEndRef} />
                </div>
                <div className="border-t border-[#e4d6c8] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border border-[#d7c7b8] bg-[#faf8f6] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white" />
                    <button onClick={handleSend} disabled={!newMsg.trim() || sendMutation.isPending}
                      className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a2d24] disabled:opacity-40 active:scale-[0.97]">
                      {sendMutation.isPending ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
                  <svg className="h-8 w-8 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                </div>
                <p className="font-semibold text-[#221b16]">Your Messages</p>
                <p className="text-sm text-[#8c7564]">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
