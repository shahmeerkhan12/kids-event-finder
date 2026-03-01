'use client'
/**
 * ChatWidget — floating Parent Assistant Agent chatbot.
 * Opens/closes as a side panel; posts messages to /api/chat.
 */
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  events?: {
    id: string
    title: string
    date: string
    venue: string
    city: string
    category: string
  }[]
}

interface ChatWidgetProps {
  city: string
}

export default function ChatWidget({ city }: ChatWidgetProps) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role:    'assistant',
      content: `👋 Hi! I'm your personal event assistant. Tell me what kind of activities you're looking for and I'll find the best matches in ${city}!\n\nTry: *"Find outdoor activities for my 5-year-old this weekend"*`
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef         = useRef<HTMLDivElement>(null)
  const inputRef               = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, open])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: userMsg.content, history, city })
      })

      const data = await res.json() as { message: string; events?: Message['events'] }

      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.message,
        events:  data.events
      }])
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: "Sorry, I couldn't connect right now. Please try again! 😊"
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        aria-label="Open assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden"
             style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-bold text-white text-sm">Parent Assistant</p>
              <p className="text-amber-100 text-xs">Ask me to find events for your kids!</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-400 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {/* Format simple markdown */}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content.replace(/\*([^*]+)\*/g, '$1')}</p>

                  {/* Referenced events */}
                  {msg.events && msg.events.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.events.slice(0, 3).map(e => (
                        <Link key={e.id} href={`/events/${e.id}`}
                              className="block bg-white rounded-lg px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 border border-amber-100"
                              onClick={() => setOpen(false)}>
                          <span className="font-medium">{e.title}</span>
                          <span className="text-gray-400"> · {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2 text-sm text-gray-500">
                  <span className="animate-pulse">Searching for events...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about events..."
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
