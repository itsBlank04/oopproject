import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Conversation, Message } from '@/types'

export default function Inbox() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedConv, setSelectedConv] = useState<number | null>(null)
  const [newMsg, setNewMsg] = useState('')

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<Conversation[]>('/chats'),
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConv],
    queryFn: () => api.get<Message[]>(`/chats/${selectedConv}/messages`),
    enabled: !!selectedConv,
  })

  const sendMsg = useMutation({
    mutationFn: (msg: string) => api.post(`/chats/${selectedConv}/messages`, { message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConv] })
      setNewMsg('')
      toast.success('Message sent')
    },
    onError: () => toast.error('Failed to send message'),
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-cream-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-cream-100 bg-cream-50">
            <h2 className="font-medium text-ink-950">Conversations</h2>
          </div>
          {!conversations?.length ? (
            <p className="p-4 text-sm text-ink-400">No conversations yet</p>
          ) : (
            <div className="divide-y divide-cream-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left p-4 hover:bg-cream-50 transition ${selectedConv === conv.id ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}
                >
                  <p className="text-sm font-medium text-ink-950">Conversation #{conv.id}</p>
                  <p className="text-xs text-ink-400 mt-1">{new Date(conv.createdAt).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 border border-cream-200 rounded-xl overflow-hidden flex flex-col">
          {selectedConv ? (
            <>
              <div className="flex-1 p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages?.length === 0 && (
                  <p className="text-sm text-ink-400 text-center py-8">No messages yet. Start the conversation!</p>
                )}
                {messages?.map((msg) => {
                  const senderId = typeof msg.sender === 'object' ? msg.sender.id : msg.sender
                  const senderName = typeof msg.sender === 'object' ? msg.sender.displayName : `User #${senderId}`
                  const isMine = senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-4 py-2 ${isMine ? 'bg-teal-600 text-white' : 'bg-cream-100 text-ink-950'}`}>
                        <p className="text-xs opacity-70 mb-1">{isMine ? 'You' : senderName}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-cream-200 p-4 flex gap-2">
                <input
                  className="input flex-1"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && newMsg.trim()) sendMsg.mutate(newMsg.trim()) }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => { if (newMsg.trim()) sendMsg.mutate(newMsg.trim()) }}
                  disabled={sendMsg.isPending || !newMsg.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-20">
              <p className="text-ink-400">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
