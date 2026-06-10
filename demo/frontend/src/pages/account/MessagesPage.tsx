import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { supabase } from '../../lib/supabaseStorage'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

type Conv = {
  id: number
  type: string
  entityType: string
  entityId: number
  title: string
  status: string
  otherUserId: number
  otherUserName: string
  otherUserAvatar: string
  lastMessage?: string
  lastMessageAt?: string
  lastMessageSenderId?: number
  lastMessageType?: string
  unreadCount: number
  createdAt: string
}

type Msg = {
  id: number
  messageType: string
  body: string
  attachmentUrl: string | null
  attachmentName: string | null
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

type TabId = 'ORDER' | 'USED' | 'REPAIR'

const TAB_META: Record<TabId, { label: string; icon: string; desc: string; emptyTitle: string; emptyDesc: string }> = {
  ORDER: {
    label: 'Merchant',
    icon: '🛍️',
    desc: 'Marketplace orders',
    emptyTitle: 'No merchant conversations',
    emptyDesc: 'Conversations appear after you place an order',
  },
  USED: {
    label: 'Used Marketplace',
    icon: '♻️',
    desc: 'Used item chats',
    emptyTitle: 'No used item conversations',
    emptyDesc: 'Start a chat from a used item listing',
  },
  REPAIR: {
    label: 'Technician',
    icon: '🔧',
    desc: 'Repair job chats',
    emptyTitle: 'No technician conversations',
    emptyDesc: 'Conversations appear after a repair job is booked',
  },
}

export default function MessagesPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(searchParams.get('orderId') ? 'ORDER' : 'USED')
  const [selected, setSelected] = useState<Conv | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [search, setSearch] = useState('')
  const [lightboxAvatar, setLightboxAvatar] = useState<string | null>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const msgContainerRef = useRef<HTMLDivElement>(null)
  const [localMessages, setLocalMessages] = useState<Msg[]>([])
  const initialSelectDone = useRef(false)

  const { data: convs = [], isLoading } = useQuery<Conv[]>({
    queryKey: ['conversations', tab],
    queryFn: () => apiClient.get(`/api/chat/conversations?type=${tab}`).then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? [],
  })

  const filteredConvs = convs.filter(c =>
    !search || c.otherUserName?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  )

  // Auto-select conversation from query params
  useEffect(() => {
    if (initialSelectDone.current || convs.length === 0) return
    const orderId = searchParams.get('orderId')
    if (orderId) {
      const match = convs.find(c => c.type === 'ORDER' && c.entityId === parseInt(orderId))
      if (match) { setSelected(match); initialSelectDone.current = true }
    }
  }, [convs, searchParams])

  const { data: fetchedMessages = [] } = useQuery<Msg[]>({
    queryKey: ['messages', selected?.id],
    queryFn: () => apiClient.get(`/api/chat/conversations/${selected!.id}/messages`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!selected,
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? [],
  })

  useEffect(() => {
    setLocalMessages(fetchedMessages)
  }, [fetchedMessages])

  useEffect(() => {
    if (!selected) return
    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          const newMsg = payload.new as any
          setLocalMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            const isMine = newMsg.sender_id === parseInt(localStorage.getItem('userId') || '0')
            const msg: Msg = {
              id: newMsg.id,
              messageType: newMsg.message_type || 'TEXT',
              body: newMsg.body,
              attachmentUrl: newMsg.attachment_url,
              attachmentName: newMsg.attachment_name,
              senderId: newMsg.sender_id,
              senderName: '',
              senderAvatar: '',
              isMine,
              isRead: false,
              createdAt: newMsg.created_at,
            }
            return [...prev, msg]
          })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected, queryClient])

  useEffect(() => {
    if (localMessages.length > 0 && msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight
    }
  }, [localMessages])

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      apiClient.post(`/api/chat/conversations/${selected!.id}/messages`, { body }),
    onSuccess: (r) => {
      const msg = r.data as Msg
      setLocalMessages(prev => [...prev, msg])
      setNewMsg('')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Failed to send'),
  })

  const selectConv = (conv: Conv) => {
    setSelected(conv)
    setLocalMessages([])
    queryClient.setQueryData<Conv[]>(['conversations', tab], prev =>
      prev?.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c) ?? []
    )
  }

  const handleSend = () => {
    if (!newMsg.trim() || !selected || sendMutation.isPending) return
    sendMutation.mutate(newMsg.trim())
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="mx-auto flex h-[calc(100vh-80px)] max-w-6xl px-4 py-6">
        <div className="flex w-full overflow-hidden rounded-2xl border border-[#e4d6c8] bg-white shadow-sm">
          {/* Sidebar */}
          <div className="flex w-[360px] flex-shrink-0 flex-col border-r border-[#e4d6c8]">
            {/* Header */}
            <div className="border-b border-[#e4d6c8] px-5 py-4">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">Inbox</h2>
              <p className="mt-0.5 text-xs text-[#8c7564]">{convs.length} {TAB_META[tab].label.toLowerCase()} conversation{convs.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e4d6c8]">
              {(['ORDER', 'USED', 'REPAIR'] as TabId[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setSelected(null) }}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition border-b-2 ${
                    tab === t ? 'border-[#221b16] text-[#221b16]' : 'border-transparent text-[#8c7564] hover:text-[#221b16]'
                  }`}>
                  <span className="text-xs">{TAB_META[t].icon}</span>
                  <span className="text-[11px] leading-tight">{TAB_META[t].desc}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="border-b border-[#e4d6c8] px-4 py-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] py-2 pl-10 pr-4 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white" />
              </div>
            </div>

            {/* Conversation list */}
            <div className="min-h-0 flex-1 overflow-y-auto">
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
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f9f5f0]">
                      <svg className="h-6 w-6 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#221b16]">{TAB_META[tab].emptyTitle}</p>
                    <p className="mt-1 text-xs text-[#8c7564]">{TAB_META[tab].emptyDesc}</p>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  {filteredConvs.map(c => (
                    <button key={c.id} onClick={() => selectConv(c)}
                      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[#f9f5f0] ${
                        selected?.id === c.id ? 'bg-[#f9f5f0]' : ''
                      }`}>
                      <button type="button" onClick={() => setLightboxAvatar(c.otherUserAvatar)}
                        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8]">
                        {c.otherUserAvatar ? (
                          <img src={c.otherUserAvatar} alt="" loading="lazy" className="h-full w-full object-cover" />
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
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="truncate text-sm font-semibold text-[#221b16]">
                              {c.otherUserName || `User #${c.otherUserId}`}
                            </p>
                            {c.type === 'ORDER' && (
                              <span className="shrink-0 rounded-full bg-[#f9f5f0] px-2 py-0.5 text-[10px] font-medium text-[#6c5b4f]">
                                Merchant
                              </span>
                            )}
                            {c.type === 'USED' && (
                              <span className="shrink-0 rounded-full bg-[#e4d6c8] px-2 py-0.5 text-[10px] font-medium text-[#6c5b4f]">
                                Used
                              </span>
                            )}
                            {c.type === 'REPAIR' && (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Repair
                              </span>
                            )}
                          </div>
                          {c.lastMessageAt && (
                            <p className="ml-2 shrink-0 text-[10px] text-[#8c7564]">{timeAgo(c.lastMessageAt)}</p>
                          )}
                        </div>
                        {c.title && (
                          <p className="mt-0.5 truncate text-xs font-medium text-[#8c7564]">{c.title}</p>
                        )}
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
                {/* Chat header with context card */}
                <div className="border-b border-[#e4d6c8]">
                  <div className="flex items-center gap-3 px-6 py-3">
                    <button type="button" onClick={() => setLightboxAvatar(selected.otherUserAvatar)}
                      className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8]">
                      {selected.otherUserAvatar ? (
                        <img src={selected.otherUserAvatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-[#6c5b4f]">
                          {selected.otherUserName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#221b16]">
                        {selected.otherUserName || `User #${selected.otherUserId}`}
                      </p>
                      <p className="truncate text-xs text-[#8c7564]">{selected.title}</p>
                    </div>
                    {selected.type === 'ORDER' && (
                      <Link to={`/account/orders`}
                        className="shrink-0 rounded-lg border border-[#e4d6c8] px-3 py-1.5 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0]">
                        View Order
                      </Link>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div ref={msgContainerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
                  {localMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#8c7564]">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    localMessages.map((m, i) => {
                      const showDate = i === 0 || formatDate(localMessages[i-1].createdAt) !== formatDate(m.createdAt)
                      return (
                        <div key={m.id}>
                          {showDate && (
                            <div className="flex justify-center py-2">
                              <span className="rounded-full bg-[#f9f5f0] px-3 py-1 text-[10px] font-medium text-[#6c5b4f]">
                                {formatDate(m.createdAt)}
                              </span>
                            </div>
                          )}
                          {m.messageType === 'SYSTEM' ? (
                            <div className="flex justify-center">
                              <div className="rounded-xl bg-[#f9f5f0] px-4 py-2 text-xs text-[#8c7564]">
                                {m.body}
                              </div>
                            </div>
                          ) : (
                            <div className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                m.isMine ? 'bg-[#221b16] text-[#f9f5f0] rounded-br-md' : 'bg-[#f9f5f0] text-[#221b16] rounded-bl-md'
                              }`}>
                                {m.attachmentUrl && (
                                  <div className="mb-1">
                                    {m.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                                      <img src={m.attachmentUrl} alt={m.attachmentName || ''} loading="lazy"
                                        className="max-w-full rounded-lg" />
                                    ) : (
                                      <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-xs underline">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a.75.75 0 01-1.063-1.06l9.317-9.318" />
                                        </svg>
                                        {m.attachmentName || 'Attachment'}
                                      </a>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                                <p className={`mt-1 text-[10px] ${m.isMine ? 'text-[#e4d6c8]' : 'text-[#8c7564]'}`}>
                                  {formatTime(m.createdAt)}
                                  {m.isMine && (
                                    <span className="ml-1">{m.isRead ? '✓✓' : '✓'}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                  <div ref={msgEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-[#e4d6c8] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder={selected.type === 'ORDER' ? 'Type a message about this order...' : 'Type a message...'}
                      className="flex-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white" />
                    <button onClick={handleSend} disabled={!newMsg.trim() || sendMutation.isPending}
                      className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a3028] disabled:opacity-40 active:scale-[0.97]">
                      {sendMutation.isPending ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#e4d6c8]">
                    {selected.type === 'ORDER' ? 'Text only · Be respectful and stay on topic' : 'Be respectful and follow community guidelines'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
                  <svg className="h-8 w-8 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="font-semibold text-[#221b16]">Your Messages</p>
                <p className="text-sm text-[#8c7564]">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {lightboxAvatar && (
        <ImageLightbox
          images={[{ url: lightboxAvatar }]}
          initialIndex={0}
          onClose={() => setLightboxAvatar(null)}
        />
      )}
    </div>
  )
}
