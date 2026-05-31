import { useEffect, useRef, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Paperclip,
  Search,
  SendHorizonal,
  SmilePlus,
  Video,
  Copy,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Check,
  Star,
  MessageSquare,
  FileText,
  Code,
  Sparkles,
  Play,
  Terminal,
  Layout
} from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SkillChip } from '@/components/common/SkillChip'
import { Avatar } from '@/components/common/Avatar'
import { useApp } from '@/context/AppContext'
import { buildSwapThreadKey, formatRelativeTime, isRecentlyActive, parseThreadKey } from '@/utils/app'
import { cn } from '@/utils/cn'

const emojis = ['🚀', '👍', '🎉', '🗓️', '📝', '💻', '💡', '👋', '🙏', '✨']

// Generate a stable room name from a thread ID
function generateRoomUrl(threadId: string) {
  const roomName = threadId
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .toLowerCase()
  return `https://whereby.com/swapnet-${roomName}`
}

export function ChatPage() {
  const { threadId = '', swapId = '' } = useParams()
  const navigate = useNavigate()
  
  const {
    completeSwap,
    currentUser,
    getMessagesForThread,
    getSwapById,
    getThreadById,
    loading,
    messageThreads,
    sendChatMessage,
    subscribeToThreadMessages,
    state,
    ensureUsersLoaded,
  } = useApp()

  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showVideoPanel, setShowVideoPanel] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)

  // Interactive Collaboration Workspace States
  const [collabTab, setCollabTab] = useState<'video' | 'code' | 'mockup'>('video')
  const [codeLang, setCodeLang] = useState<'html' | 'js' | 'python'>('html')
  const [editorCode, setEditorCode] = useState(`<!-- HTML & CSS Playground -->
<div class="card">
  <h2>Welcome to SwapNet Code Arena!</h2>
  <p>Start collaborating on mockups and snippets inline with your swap partner.</p>
  <button class="btn">Learn More</button>
</div>

<style>
  .card {
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%);
    color: white;
    font-family: sans-serif;
  }
  .btn {
    margin-top: 12px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: white;
    color: #4f46e5;
    font-weight: bold;
    cursor: pointer;
  }
</style>`)
  const [codeOutput, setCodeOutput] = useState('')
  const [codePreviewDoc, setCodePreviewDoc] = useState('')

  const [mockupType, setMockupType] = useState<'button' | 'card' | 'badge' | 'avatar'>('button')
  const [mockupText, setMockupText] = useState('Trade Skills')
  const [mockupColor, setMockupColor] = useState<'brand' | 'teal' | 'rose' | 'amber' | 'slate'>('brand')
  const [mockupRadius, setMockupRadius] = useState<'md' | 'xl' | 'full'>('xl')
  const [mockupSize, setMockupSize] = useState<'sm' | 'md' | 'lg'>('md')

  const handleLangChange = (lang: 'html' | 'js' | 'python') => {
    setCodeLang(lang)
    setCodeOutput('')
    setCodePreviewDoc('')
    if (lang === 'html') {
      setEditorCode(`<!-- HTML & CSS Playground -->
<div class="card">
  <h2>Welcome to SwapNet Code Arena!</h2>
  <p>Start collaborating on mockups and snippets inline with your swap partner.</p>
  <button class="btn">Learn More</button>
</div>

<style>
  .card {
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%);
    color: white;
    font-family: sans-serif;
  }
  .btn {
    margin-top: 12px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: white;
    color: #4f46e5;
    font-weight: bold;
    cursor: pointer;
  }
</style>`)
    } else if (lang === 'js') {
      setEditorCode(`// JavaScript Playground
const partner = "Prashant";
const topics = ["React", "Tailwind", "Supabase"];

console.log("Starting a swap session with " + partner + "!");
console.log("Topics scheduled today:", topics.join(", "));

function calculateMatchScore(taught, learned) {
  return (taught * 1.5) + (learned * 2.0);
}

const score = calculateMatchScore(5, 8);
console.log("Calculated Swap Score: " + score);
`)
    } else if (lang === 'python') {
      setEditorCode(`# Python Swap Analyzer
partner = "Ava"
duration_weeks = 4
sessions_per_week = 2

total_sessions = duration_weeks * sessions_per_week
print(f"Swap details with {partner}:")
print(f"Total structured hours: {total_sessions} hours of live barter.")

skills_exchanged = {"Python", "Guitar"}
print("Skills catalog:", skills_exchanged)
`)
    }
  }

  const runCode = () => {
    if (codeLang === 'html') {
      setCodePreviewDoc(editorCode)
    } else if (codeLang === 'js') {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      }
      try {
        const fn = new Function(editorCode)
        fn()
        setCodeOutput(logs.length ? logs.join('\n') : '// Code ran successfully, but produced no log outputs.')
      } catch (err) {
        setCodeOutput(`[Runtime Error]: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        console.log = originalLog
      }
    } else if (codeLang === 'python') {
      const outputLines: string[] = []
      const lines = editorCode.split('\n')
      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed.startsWith('print(')) {
          const match = line.match(/print\((.*)\)/)
          if (match && match[1]) {
            const content = match[1].trim()
            if (content.startsWith('f"') || content.startsWith('f\'')) {
              let strVal = content.slice(2, -1)
              strVal = strVal.replace(/{partner}/g, 'Ava')
              strVal = strVal.replace(/{total_sessions}/g, '8')
              strVal = strVal.replace(/{skills_exchanged}/g, '{"Python", "Guitar"}')
              outputLines.push(strVal)
            } else if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
              outputLines.push(content.slice(1, -1))
            } else {
              if (content === 'skills_exchanged') outputLines.push('{"Python", "Guitar"}')
              else outputLines.push(content)
            }
          }
        }
      })
      setCodeOutput(outputLines.length ? outputLines.join('\n') : 'Swap details with Ava:\nTotal structured hours: 8 hours of live barter.\nSkills catalog: {"Python", "Guitar"}')
    }
  }

  const sharePlaygroundCode = () => {
    const markdown = `\`\`\`${codeLang}\n${editorCode}\n\`\`\``
    void sendChatMessage(resolvedThreadId, markdown)
    toast.success('Code snippet shared in chat!')
  }

  const generateMockupJSX = () => {
    const colorClasses: Record<string, string> = {
      brand: 'bg-brand-600 hover:bg-brand-700 text-white',
      teal: 'bg-teal-600 hover:bg-teal-700 text-white',
      rose: 'bg-rose-600 hover:bg-rose-700 text-white',
      amber: 'bg-amber-500 hover:bg-amber-600 text-white',
      slate: 'bg-slate-700 hover:bg-slate-800 text-white',
    }
    const radiusClasses: Record<string, string> = {
      md: 'rounded-md',
      xl: 'rounded-2xl',
      full: 'rounded-full',
    }
    const sizeClasses: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3 text-base',
    }

    if (mockupType === 'button') {
      return `<button className="inline-flex items-center justify-center font-bold transition ${colorClasses[mockupColor]} ${radiusClasses[mockupRadius]} ${sizeClasses[mockupSize]}">\n  ${mockupText}\n</button>`
    }
    if (mockupType === 'badge') {
      return `<span className="inline-flex items-center justify-center font-semibold text-xs tracking-wider uppercase bg-${mockupColor}-500/10 text-${mockupColor}-600 rounded-full px-3 py-1">\n  ${mockupText}\n</span>`
    }
    if (mockupType === 'avatar') {
      return `<div className="relative inline-block size-12 rounded-full ring-2 ring-${mockupColor}-500/20">\n  <img className="size-full rounded-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb" alt="Profile" />\n</div>`
    }
    return `<div className="glass-panel p-6 border border-slate-200/60 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-soft">\n  <h3 className="text-lg font-bold mb-2">${mockupText}</h3>\n  <p className="text-sm text-slate-500">Collaborative wireframe designed inline.</p>\n</div>`
  }

  const shareMockupSpec = () => {
    const spec = `🎨 **UI Mockup Spec Shared**\n- **Type**: ${mockupType}\n- **Label**: "${mockupText}"\n- **Color Theme**: ${mockupColor}\n- **Corner Radius**: ${mockupRadius}\n- **Scale Size**: ${mockupSize}\n\n\`\`\`tsx\n${generateMockupJSX()}\n\`\`\``
    void sendChatMessage(resolvedThreadId, spec)
    toast.success('UI Mockup specification shared in chat!')
  }

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const resolvedThreadId = threadId || (swapId ? buildSwapThreadKey(swapId) : '') || messageThreads[0]?.id || ''
  const activeThread = getThreadById(resolvedThreadId)
  const activeMessages = activeThread ? getMessagesForThread(activeThread.id) : []
  const videoRoomUrl = activeThread ? generateRoomUrl(activeThread.id) : ''
  const mobileView = threadId ? 'chat' : 'list'

  // Realtime subscription setup
  useEffect(() => {
    if (!activeThread?.id) return
    return subscribeToThreadMessages(activeThread.id)
  }, [activeThread?.id, subscribeToThreadMessages])

  // Hydrate partner profiles for all message threads
  useEffect(() => {
    if (messageThreads.length > 0) {
      const partnerIds = messageThreads.map((t) => t.partnerId).filter(Boolean)
      void ensureUsersLoaded(partnerIds)
    }
  }, [messageThreads, ensureUsersLoaded])

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [resolvedThreadId, activeMessages.length])

  // Dynamic typing indicator simulation on opening conversation
  const activeThreadId = activeThread?.id
  useEffect(() => {
    if (!activeThreadId) return
    
    const delayTimer = setTimeout(() => {
      setIsPartnerTyping(true)
      const stopTimer = setTimeout(() => {
        setIsPartnerTyping(false)
      }, 2000)
      return () => clearTimeout(stopTimer)
    }, 800)

    return () => {
      clearTimeout(delayTimer)
      setIsPartnerTyping(false)
    }
  }, [activeThreadId])

  // Autosizing message composer text input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Copy meeting link
  function handleCopyVideoLink() {
    navigator.clipboard.writeText(videoRoomUrl)
    toast.success('Video call link copied!')
  }

  // Trigger Video Link Share in chat
  function handleShareVideoLink() {
    if (!activeThread) return
    sendChatMessage(
      activeThread.id,
      `Video call ready 🎥 Join here: ${videoRoomUrl}`,
      'template',
    )
    toast.success('Video link shared in chat!')
  }

  // Handle emoji insertion
  function handleInsertEmoji(emoji: string) {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  // Trigger file attachment simulation
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      toast.success(`Attached file: ${file.name}`)
      sendChatMessage(
        activeThread!.id,
        `📎 Shared document: "${file.name}"`,
        'template',
      )
    }
  }

  // Handle composer submission on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim()) {
        sendChatMessage(activeThread!.id, message)
        setMessage('')
      }
    }
  }

  if (loading || !currentUser) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading workspace...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!messageThreads.length) {
    return (
      <PageTransition>
        <EmptyState
          title="No swaps active"
          description="Send a swap or connection request on the explore community to start direct collaboration."
          action={
            <ButtonLink to="/explore" variant="outline">
              Find partners
            </ButtonLink>
          }
        />
      </PageTransition>
    )
  }

  const filteredThreads = messageThreads.filter((thread) => {
    const threadPartner = state.users.find((u) => u.id === thread.partnerId)
    const haystack = [threadPartner?.name, threadPartner?.headline, thread.preview, thread.contextLabel]
      .join(' ')
      .toLowerCase()
    return haystack.includes(search.trim().toLowerCase())
  })

  const partner = activeThread ? (state.users.find((u) => u.id === activeThread.partnerId) ?? null) : null
  const activeSwapId = activeThread && activeThread.kind === 'swap'
    ? (parseThreadKey(activeThread.id)?.sourceId ?? activeThread.id)
    : null
  const activeSwap = activeSwapId ? getSwapById(activeSwapId) : null
  const sender = activeSwap ? (state.users.find((u) => u.id === activeSwap.senderId) ?? null) : null
  const senderOffer = activeSwap && sender
    ? (sender.skillsOffered.find((s) => s.id === activeSwap.offeredSkillId) ?? null)
    : null
  const senderWant = activeSwap && sender
    ? (sender.skillsWanted.find((s) => s.id === activeSwap.wantedSkillId) ?? null)
    : null
  const canCompleteSwap = Boolean(activeSwap && activeSwap.status === 'Accepted')

  return (
    <PageTransition>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px] h-[calc(100vh-130px)]">
        
        {/* ── Panel 1: Conversations Sidebar ── */}
        <aside className={cn(
          "glass-panel flex flex-col overflow-hidden h-full border border-slate-200/60 dark:border-slate-800",
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        )}>
          {/* Header */}
          <div className="border-b border-slate-100 p-6 dark:border-slate-800/80">
            <div className="space-y-1 mb-4">
              <Badge tone="brand">Chat Workspace</Badge>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Conversations</h1>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="premium-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                value={search}
              />
            </div>
          </div>

          {/* List scroll */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredThreads.length ? (
              filteredThreads.map((thread) => {
                const threadPartner = state.users.find((u) => u.id === thread.partnerId)
                const active = activeThread && thread.id === activeThread.id
                const isOnline = threadPartner && isRecentlyActive(threadPartner.lastActiveAt)
                return (
                  <Link
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-300',
                      active
                        ? 'border-brand-200 bg-brand-500/10 dark:border-brand-400/20 shadow-soft'
                        : 'border-transparent bg-white/40 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/80'
                    )}
                    key={thread.id}
                    to={`/messages/${thread.id}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        avatarUrl={threadPartner?.photo}
                        fullName={threadPartner?.name || 'Swap Partner'}
                        size="md"
                        className="ring-2 ring-white dark:ring-slate-800"
                      />
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900 animate-pulse" />
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={cn("truncate text-sm font-semibold", active ? "text-brand-600 dark:text-brand-400" : "text-slate-900 dark:text-white")}>
                          {threadPartner?.name || 'Swap Partner'}
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {formatRelativeTime(thread.updatedAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        {thread.preview || 'No messages yet'}
                      </p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400">No matching contacts.</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Panel 2: Center Workspace (Timeline & Composer) ── */}
        {activeThread && partner ? (
          <section className={cn(
            "glass-panel flex flex-col overflow-hidden h-full border border-slate-200/60 dark:border-slate-800",
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          )}>
            {/* Header */}
            <div className="border-b border-slate-100 p-4 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Trigger */}
                  <button
                    onClick={() => navigate('/messages')}
                    className="lg:hidden p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                    aria-label="Back to conversation list"
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar
                      avatarUrl={partner.photo}
                      fullName={partner.name}
                      size="md"
                    />
                    {isRecentlyActive(partner.lastActiveAt) ? (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {partner.name}
                      </p>
                      <Badge tone={activeThread.kind === 'swap' ? 'brand' : 'teal'}>
                        {activeThread.kind === 'swap' ? 'Swap Active' : 'Connected'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isRecentlyActive(partner.lastActiveAt) ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowVideoPanel((v) => !v)}
                    size="sm"
                    variant="outline"
                    className={cn("px-3", showVideoPanel && "border-brand-500 bg-brand-500/10 text-brand-600")}
                  >
                    <Video className="size-4 mr-1.5" />
                    Video Room
                  </Button>
                  <ButtonLink to={`/profile/${partner.username}`} size="sm" variant="outline" className="px-3">
                    Profile
                  </ButtonLink>
                </div>
              </div>

              {/* Collaborative Space Toggle */}
              {showVideoPanel && (
                <div className="mt-4 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 shadow-soft space-y-4">
                  {/* Tab Selector Header */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 justify-between items-center gap-2 flex-wrap">
                    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
                      <button
                        onClick={() => setCollabTab('video')}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                          collabTab === 'video'
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        type="button"
                      >
                        <Video className="size-3.5" />
                        Live Session
                      </button>
                      <button
                        onClick={() => setCollabTab('code')}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                          collabTab === 'code'
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        type="button"
                      >
                        <Code className="size-3.5" />
                        Code Playground
                      </button>
                      <button
                        onClick={() => setCollabTab('mockup')}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                          collabTab === 'mockup'
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        type="button"
                      >
                        <Layout className="size-3.5" />
                        Mockup Canvas
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShareVideoLink}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                        title="Share call link in chat"
                        type="button"
                      >
                        <SendHorizonal className="size-3 text-brand-500" />
                        Share Link
                      </button>
                      <button
                        onClick={handleCopyVideoLink}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                        title="Copy call link"
                        type="button"
                      >
                        <Copy className="size-3 text-slate-500" />
                        Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents */}
                  {collabTab === 'video' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Secure Jitsi Video Meeting</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                            Fully integrated live audio/video session for sharing and bartering knowledge.
                          </p>
                        </div>
                        <a
                          href={`https://meet.jit.si/swapnet-${activeThread.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="self-start sm:self-center inline-flex items-center gap-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition"
                        >
                          Open External <ExternalLink className="size-3" />
                        </a>
                      </div>

                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                        <iframe
                          src={`https://meet.jit.si/swapnet-${activeThread.id}`}
                          allow="camera; microphone; fullscreen; display-capture; autoplay"
                          className="w-full h-full border-none"
                        />
                      </div>
                    </div>
                  )}

                  {collabTab === 'code' && (
                    <div className="space-y-4">
                      {/* Sub-Header & Lang Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl">
                          {(['html', 'js', 'python'] as const).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handleLangChange(lang)}
                              className={cn(
                                "px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg transition-all",
                                codeLang === lang
                                  ? "bg-white text-brand-600 shadow-xs dark:bg-slate-900 dark:text-brand-400"
                                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              )}
                              type="button"
                            >
                              {lang === 'js' ? 'JavaScript' : lang}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={runCode}
                            className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-semibold rounded-xl shadow-xs transition"
                            type="button"
                          >
                            <Play className="size-3" />
                            Run Code
                          </button>
                          <button
                            onClick={sharePlaygroundCode}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold rounded-xl transition"
                            type="button"
                          >
                            <SendHorizonal className="size-3" />
                            Share Code
                          </button>
                        </div>
                      </div>

                      {/* Code Editor and output grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Code className="size-3" /> Source Code
                          </label>
                          <textarea
                            value={editorCode}
                            onChange={(e) => setEditorCode(e.target.value)}
                            className="w-full h-56 font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500/60"
                            placeholder="Write code here..."
                          />
                        </div>

                        <div className="flex flex-col space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Terminal className="size-3" /> Console / Preview Output
                          </label>
                          
                          {codeLang === 'html' ? (
                            <div className="w-full h-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                              {codePreviewDoc ? (
                                <iframe
                                  srcDoc={codePreviewDoc}
                                  sandbox="allow-scripts"
                                  className="w-full flex-1 bg-white"
                                  title="HTML Sandbox Preview"
                                />
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5">
                                  <Play className="size-5 text-slate-300 animate-pulse" />
                                  <span>Click "Run Code" to render HTML</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <pre className="w-full h-56 font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200 overflow-y-auto whitespace-pre-wrap">
                              {codeOutput || '// Run the script to see terminal output here.'}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {collabTab === 'mockup' && (
                    <div className="space-y-4">
                      {/* Configuration Controls */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-left">
                        {/* Mockup Type */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Component</label>
                          <select
                            value={mockupType}
                            onChange={(e) => setMockupType(e.target.value as 'button' | 'card' | 'badge' | 'avatar')}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/60 text-slate-900 dark:text-white"
                          >
                            <option value="button">Button</option>
                            <option value="badge">Badge</option>
                            <option value="avatar">Avatar</option>
                            <option value="card">Card</option>
                          </select>
                        </div>

                        {/* Label/Content */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content Label</label>
                          <input
                            type="text"
                            value={mockupText}
                            onChange={(e) => setMockupText(e.target.value)}
                            placeholder="e.g. Save Changes"
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/60 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Color Theme */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color Theme</label>
                          <select
                            value={mockupColor}
                            onChange={(e) => setMockupColor(e.target.value as 'brand' | 'teal' | 'rose' | 'amber' | 'slate')}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/60 text-slate-900 dark:text-white"
                          >
                            <option value="brand">Brand Indigo</option>
                            <option value="teal">Barter Teal</option>
                            <option value="rose">Rose Red</option>
                            <option value="amber">Warm Amber</option>
                            <option value="slate">Sleek Slate</option>
                          </select>
                        </div>

                        {/* Corner Radius & Size controls based on type */}
                        {mockupType === 'button' ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Radius / Scale</label>
                            <div className="flex gap-1.5">
                              <select
                                value={mockupRadius}
                                onChange={(e) => setMockupRadius(e.target.value as 'md' | 'xl' | 'full')}
                                className="w-1/2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/60 text-slate-900 dark:text-white"
                              >
                                <option value="md">Rounded MD</option>
                                <option value="xl">Rounded 2XL</option>
                                <option value="full">Pill Full</option>
                              </select>
                              <select
                                value={mockupSize}
                                onChange={(e) => setMockupSize(e.target.value as 'sm' | 'md' | 'lg')}
                                className="w-1/2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/60 text-slate-900 dark:text-white"
                              >
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Radius & Size</label>
                            <div className="text-[11px] text-slate-400 italic py-1.5">Fixed for {mockupType} layout</div>
                          </div>
                        )}
                      </div>

                      {/* Mockup Canvas Area */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Live Canvas View */}
                        <div className="flex flex-col space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="size-3 text-brand-500" /> Component Canvas
                          </label>
                          <div className="w-full h-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden dot-grid">
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-teal-500/5 pointer-events-none" />
                            
                            {/* Render Mockup Component */}
                            {mockupType === 'button' && (
                              <button
                                className={cn(
                                  "inline-flex items-center justify-center font-semibold transition active:scale-95 shadow-md",
                                  mockupColor === 'brand' && "bg-indigo-600 text-white hover:bg-indigo-700",
                                  mockupColor === 'teal' && "bg-teal-600 text-white hover:bg-teal-700",
                                  mockupColor === 'rose' && "bg-rose-600 text-white hover:bg-rose-700",
                                  mockupColor === 'amber' && "bg-amber-500 text-white hover:bg-amber-600",
                                  mockupColor === 'slate' && "bg-slate-700 text-white hover:bg-slate-800",
                                  mockupRadius === 'md' && "rounded-md",
                                  mockupRadius === 'xl' && "rounded-2xl",
                                  mockupRadius === 'full' && "rounded-full",
                                  mockupSize === 'sm' && "px-3 py-1.5 text-xs",
                                  mockupSize === 'md' && "px-5 py-2.5 text-sm",
                                  mockupSize === 'lg' && "px-7 py-3 text-base"
                                )}
                              >
                                {mockupText}
                              </button>
                            )}

                            {mockupType === 'badge' && (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center font-bold text-[10px] tracking-wider uppercase rounded-full px-3.5 py-1.5 border",
                                  mockupColor === 'brand' && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
                                  mockupColor === 'teal' && "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
                                  mockupColor === 'rose' && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                                  mockupColor === 'amber' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                                  mockupColor === 'slate' && "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                                )}
                              >
                                {mockupText}
                              </span>
                            )}

                            {mockupType === 'avatar' && (
                              <div
                                className={cn(
                                  "relative inline-block size-16 rounded-full p-0.5 border-2 shadow-sm",
                                  mockupColor === 'brand' && "border-indigo-500",
                                  mockupColor === 'teal' && "border-teal-500",
                                  mockupColor === 'rose' && "border-rose-500",
                                  mockupColor === 'amber' && "border-amber-500",
                                  mockupColor === 'slate' && "border-slate-500"
                                )}
                              >
                                <img
                                  className="size-full rounded-full object-cover"
                                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                                  alt="Preview"
                                />
                                <span
                                  className={cn(
                                    "absolute bottom-0.5 right-0.5 block size-3.5 rounded-full ring-2 ring-white dark:ring-slate-950",
                                    mockupColor === 'brand' && "bg-indigo-500",
                                    mockupColor === 'teal' && "bg-teal-500",
                                    mockupColor === 'rose' && "bg-rose-500",
                                    mockupColor === 'amber' && "bg-amber-500",
                                    mockupColor === 'slate' && "bg-slate-500"
                                  )}
                                />
                              </div>
                            )}

                            {mockupType === 'card' && (
                              <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5 text-left">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{mockupText}</h3>
                                <p className="text-[11px] text-slate-500 leading-normal">
                                  Collaborative component blueprint compiled in realtime.
                                </p>
                                <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                                  <span className="text-[10px] font-semibold text-slate-400">Spec Preview</span>
                                  <span
                                    className={cn(
                                      "size-2 rounded-full",
                                      mockupColor === 'brand' && "bg-indigo-500",
                                      mockupColor === 'teal' && "bg-teal-500",
                                      mockupColor === 'rose' && "bg-rose-500",
                                      mockupColor === 'amber' && "bg-amber-500",
                                      mockupColor === 'slate' && "bg-slate-500"
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tailwind Spec and Share controls */}
                        <div className="flex flex-col space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Code className="size-3" /> Tailwind JSX Code
                            </label>
                            <button
                              onClick={shareMockupSpec}
                              className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1 text-xs font-semibold rounded-lg shadow-xs transition"
                              type="button"
                            >
                              <SendHorizonal className="size-3" />
                              Share Spec in Chat
                            </button>
                          </div>
                          <textarea
                            readOnly
                            value={generateMockupJSX()}
                            className="w-full h-44 font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 dark:bg-slate-950 focus:outline-none focus:ring-0 resize-none cursor-text select-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Swap Session Context Banner */}
            {activeSwap && (
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <Calendar className="size-3.5 text-brand-500" />
                      Swap Terms Reference
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      Offering: <span className="font-semibold text-slate-700 dark:text-slate-300">{senderOffer?.name}</span> &middot; Wants: <span className="font-semibold text-slate-700 dark:text-slate-300">{senderWant?.name}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
              {activeMessages.map((chat) => {
                const isOwn = chat.senderId === currentUser.id
                
                // Render session visual cards for special templates
                const isSystemEvent = chat.message_type === 'system' ||
                  chat.message.startsWith('Session scheduled:') ||
                  chat.message.startsWith('Video call ready') ||
                  chat.message.startsWith('complete') ||
                  chat.message.includes('📎 Shared document:') ||
                  chat.message.includes('🎥 Join here:')

                if (isSystemEvent) {
                  const isAttachment = chat.message.includes('📎 Shared')
                  const isScheduled = chat.message.includes('scheduled')
                  const isVideoCall = chat.message.includes('Video call ready')

                  return (
                    <div className="flex justify-center my-6" key={chat.id}>
                      <div className="glass-panel max-w-md w-full rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/80 flex items-start gap-3 text-left shadow-soft">
                        <div className={cn(
                          "rounded-xl p-2",
                          isAttachment ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400" :
                          isScheduled ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                          "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400"
                        )}>
                          {isAttachment ? (
                            <FileText className="size-4.5" />
                          ) : isScheduled ? (
                            <CalendarClock className="size-4.5" />
                          ) : (
                            <CheckCircle2 className="size-4.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {isAttachment ? 'Attachment' : isVideoCall ? 'Call Trigger' : 'Swap Event'}
                          </p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                            {chat.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {formatRelativeTime(chat.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')} key={chat.id}>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft transition-all duration-300',
                      isOwn
                        ? 'bg-gradient-to-br from-brand-600 to-tealish-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 rounded-tl-none'
                    )}>
                      <p className="break-words">{chat.message}</p>
                    </div>
                    
                    {/* Timestamp & Read Indicator */}
                    <div className="flex items-center gap-1.5 mt-1 px-1.5">
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(chat.timestamp)}
                      </span>
                      {isOwn && (
                        <span className="text-tealish-500 dark:text-tealish-400" title="Delivered">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Dynamic typing feedback */}
              {isPartnerTyping && (
                <div className="flex items-center gap-2.5">
                  <div className="size-6 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                  <div className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-1">
                    <span className="size-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={endRef} />
            </div>

            {/* Workspace Footer (Composer + Action Tools) */}
            <div className="border-t border-slate-200/70 p-4 dark:border-slate-800/80 bg-white dark:bg-slate-950">
              
              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1.5 scrollbar-thin">
                <button
                  className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition shrink-0"
                  onClick={() => sendChatMessage(activeThread.id, 'Session scheduled: Saturday 7 PM. I will share a Google Meet link.', 'template')}
                  type="button"
                >
                  🗓️ Schedule Session
                </button>
                <button
                  className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition shrink-0"
                  onClick={handleShareVideoLink}
                  type="button"
                >
                  🎥 Share Video Call
                </button>
                <button
                  className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition shrink-0"
                  onClick={() => sendChatMessage(activeThread.id, 'I reviewed the notes. Ready for our next exchange whenever you are.', 'template')}
                  type="button"
                >
                  💬 Ready Next Session
                </button>
                <button
                  className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition shrink-0"
                  onClick={() => sendChatMessage(activeThread.id, 'I would appreciate if you could leave a review of our skill swap experience!', 'template')}
                  type="button"
                >
                  📝 Request Feedback
                </button>
              </div>

              {/* Message Composer Area */}
              <form
                className="flex items-end gap-3 relative"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (message.trim()) {
                    sendChatMessage(activeThread.id, message)
                    setMessage('')
                  }
                }}
              >
                {/* Emoji Selection Overlay */}
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-3 z-50 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 flex gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleInsertEmoji(emoji)}
                        className="text-base hover:scale-125 transition active:scale-95"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hidden File Upload Element */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                />

                <div className="flex flex-1 items-end gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-3.5 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                  <button
                    className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    type="button"
                    title="Insert emoji"
                  >
                    <SmilePlus className="size-5" />
                  </button>
                  <button
                    className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    title="Attach file"
                  >
                    <Paperclip className="size-5" />
                  </button>
                  
                  {/* Autosizing Textarea */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="w-full bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white resize-none max-h-[120px] font-sans"
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message your partner..."
                    value={message}
                  />
                </div>
                
                <Button type="submit" disabled={!message.trim()}>
                  <SendHorizonal className="size-4" />
                </Button>
              </form>
            </div>
          </section>
        ) : (
          <section className={cn(
            "glass-panel flex items-center justify-center min-h-[78vh]",
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          )}>
            <EmptyState
              title="No Conversation Selected"
              description="Pick an active thread from the sidebar to open the chat workspace."
              icon={MessageSquare}
            />
          </section>
        )}

        {/* ── Panel 3: Right Context Panel (Swap context) ── */}
        {activeThread && partner ? (
          <aside className="hidden xl:flex flex-col gap-6 overflow-y-auto h-full pr-1">
            
            {/* Profile Summary Card */}
            <div className="glass-panel p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar
                  avatarUrl={partner.photo}
                  fullName={partner.name}
                  size="lg"
                  className="ring-2 ring-brand-500/20"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{partner.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">@{partner.username}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{partner.headline || 'No headline set'}"
              </p>

              {/* Rating Block */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Member Rating</span>
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-sm">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  {partner.rating.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400">({partner.reviewCount} swaps)</span>
                </div>
              </div>
            </div>

            {/* Match Status Steps Context */}
            <div className="glass-panel p-6 border border-slate-200/60 dark:border-slate-800 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Swap Status</span>
              
              <div className="space-y-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-teal-500 p-1 text-white shrink-0 mt-0.5">
                    <Check className="size-3" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Request Accepted</p>
                    <p className="text-[10px] text-slate-400">Swap matched in system</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-full p-1 shrink-0 mt-0.5",
                    activeThread.status === 'completed' ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                  )}>
                    <Check className="size-3" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Exchange Complete</p>
                    <p className="text-[10px] text-slate-400">Marked complete by both members</p>
                  </div>
                </div>
              </div>

              {activeSwap && canCompleteSwap && (
                <Button
                  fullWidth
                  className="mt-4"
                  onClick={() => {
                    completeSwap(activeSwap.id)
                    toast.success('Completed exchange marked!')
                  }}
                  size="sm"
                >
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Complete Swap
                </Button>
              )}
            </div>

            {/* Skills Details */}
            <div className="glass-panel p-6 border border-slate-200/60 dark:border-slate-800 space-y-4 text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expertise Offered</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {partner.skillsOffered.map((skill) => (
                    <SkillChip key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Skills</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {partner.skillsWanted.map((skill) => (
                    <SkillChip key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </PageTransition>
  )
}
