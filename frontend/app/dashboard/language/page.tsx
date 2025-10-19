"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, Send, MessageSquare, AlertCircle, CheckCircle2, BookOpen, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { languageService } from "@/services"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type {
  ConversationSession,
  SessionMessage,
  GrammarFeedback,
  UnifiedResponse,
  TargetLanguage
} from "@/services/types/language"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  language: string
  topic: string
  date: string
  messageCount: number
}

interface GrammarError {
  text: string
  correction: string
  type: string
}

const mockConversations: Conversation[] = []

export default function LanguageLearningPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState("")
  // Voice features removed per request
  const [isWaitingResponse, setIsWaitingResponse] = useState(false)
  const [isGrammarLoading, setIsGrammarLoading] = useState(false)

  const [selectedLanguage, setSelectedLanguage] = useState<TargetLanguage>("spanish")
  const [topic, setTopic] = useState("")
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [grammarScore, setGrammarScore] = useState(0)
  const [pronunciationScore, setPronunciationScore] = useState(0)
  const [vocabularyScore, setVocabularyScore] = useState(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  function formatDateLabel(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const handleStartConversation = async () => {
    if (!topic.trim()) return
    try {
      const resp = await languageService.startSession({ target_language: selectedLanguage, conversation_topic: topic.trim() })
      const sessionId = resp.data.sessionId
      const languageCap = selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)
      const newConv: Conversation = {
        id: sessionId,
        language: languageCap,
        topic: topic.trim(),
        date: "Just now",
        messageCount: 0,
      }
      setConversations(prev => [newConv, ...prev])
      setActiveConversation(sessionId)
      setMessages([])
      setGrammarErrors([])
      setPronunciationScore(0)
      setVocabularyScore(0)
      setTopic("")
    } catch (e: any) {
      // Optionally surface error via toast later
      console.error('Failed to start session', e?.message || e)
    }
  }

  const handleSend = async () => {
  if (!input.trim() || !activeConversation) return

    let userMessage: Message
    userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsWaitingResponse(true)
    setIsGrammarLoading(true)

    try {
      const resp: UnifiedResponse = await languageService.sendTextMessage({
        session_id: activeConversation,
        text: input,
      })
      // AI reply
      const aiContent = resp.data?.aiResponse || ""
      const aiMessage: Message = {
        role: "assistant",
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsWaitingResponse(false)

      // Grammar feedback -> dynamic right panel values
      if (resp.data?.grammarFeedback) {
        const feedback = resp.data.grammarFeedback
        // Compute grammar score based on error density in the user's message
        const words = userMessage.content.split(/\s+/).filter(Boolean)
        const wordCount = Math.max(1, words.length)
        const totalErrors = Math.max(0, feedback.totalErrors || 0)
        const errorDensity = totalErrors / wordCount
        const computedGrammar = Math.round(Math.max(30, 100 - errorDensity * 120))
        setGrammarScore(computedGrammar)

        // Compute vocabulary score as unique word ratio (simple heuristic)
        const unique = new Set<string>(words.map((w: string) => w.toLowerCase())).size
        const vocab = Math.min(100, Math.round((unique / wordCount) * 100))
        setVocabularyScore(vocab)

        setGrammarErrors(
          (feedback.errors || []).map((err) => ({
            text: err.sentence,
            correction: err.replacement || "",
            type: err.errorType,
          }))
        )
      } else {
        setGrammarScore(0)
        setGrammarErrors([])
      }
      setIsGrammarLoading(false)
      // TODO: Pronunciation/vocab scores if available from backend
    } catch (e: any) {
      setIsWaitingResponse(false)
      setIsGrammarLoading(false)
      // Optionally surface error via toast
      const aiMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your message.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMessage])
    }
  }
  // Fetch existing sessions + messages for left column list
  useEffect(() => {
    let mounted = true
    async function loadSessions() {
      try {
        setIsLoadingSessions(true)
        const res = await languageService.getUserSessionsWithMessages()
        if (!mounted) return
        const mapped: Conversation[] = (res.data || []).map((s) => ({
          id: s.session_id,
          language: s.target_language.charAt(0).toUpperCase() + s.target_language.slice(1),
          topic: s.conversation_topic || 'General',
          date: formatDateLabel(s.updated_at || s.created_at),
          messageCount: s.total_messages || (s.messages?.length ?? 0),
        }))
        setConversations(mapped)
        setSessionsError(null)
      } catch (e: any) {
        setSessionsError(e?.message || 'Failed to load sessions')
      } finally {
        setIsLoadingSessions(false)
      }
    }
    loadSessions()
    return () => { mounted = false }
  }, [])

  // Hydrate messages when activeConversation changes
  useEffect(() => {
    async function loadMessagesForSession() {
      if (!activeConversation) {
        setMessages([])
        setGrammarErrors([])
        setGrammarScore(0)
        setPronunciationScore(0)
        setVocabularyScore(0)
        return
      }
      try {
        setMessages([])
        setGrammarErrors([])
        setGrammarScore(0)
        setPronunciationScore(0)
        setVocabularyScore(0)
        const res = await languageService.getUserSessionsWithMessages()
        const session = (res.data || []).find((s) => s.session_id === activeConversation)
        if (session && session.messages) {
          const mappedMsgs: Message[] = session.messages
            .sort((a, b) => a.message_order - b.message_order)
            .map((m) => ({
              role: m.message_type === "user" ? "user" : "assistant",
              content: m.content || m.transcription || "[No content]",
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              audioUrl: m.audio_url,
              transcription: m.transcription,
            }))
          setMessages(mappedMsgs)
        } else {
          setMessages([])
        }
      } catch (e) {
        setMessages([])
      }
    }
    loadMessagesForSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Voice features removed per request

  // Copy a suggested correction to clipboard
  const handleCopyCorrection = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(idx)
      setTimeout(() => setCopiedIndex(null), 1200)
    } catch {}
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Language Learning Companion</h1>
        <p className="text-muted-foreground mt-1">Practice with your AI language tutor</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* LEFT COLUMN: Conversation History + New Session Form */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* New Conversation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start New Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as TargetLanguage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., Travel, Food, Business"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartConversation()}
                />
              </div>
              <Button onClick={handleStartConversation} className="w-full">
                Start Conversation
              </Button>
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Conversation History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {isLoadingSessions && (
                <p className="text-xs text-muted-foreground px-2">Loading sessions...</p>
              )}
              {sessionsError && !isLoadingSessions && (
                <p className="text-xs text-destructive px-2">{sessionsError}</p>
              )}
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={activeConversation === conv.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto py-3 px-3"
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium line-clamp-1">{conv.topic}</p>
                      <p className="text-xs opacity-70">
                        {conv.language} • {conv.date}
                      </p>
                      <p className="text-xs opacity-60">{conv.messageCount} messages</p>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN: Live Chat */}
        <div className="col-span-6 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">AI Language Tutor</CardTitle>
                    <CardDescription>
                      {activeConversation
                        ? conversations.find((c) => c.id === activeConversation)?.language
                        : "Select or start a conversation"}
                    </CardDescription>
                  </div>
                </div>
                {activeConversation && <Badge variant="secondary">Active</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area - fixed height, scrollable */}
              <div
                className="relative mb-4 pr-2"
                style={{
                  height: "400px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  scrollBehavior: "smooth",
                  background: "inherit"
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Start a new conversation to begin practicing</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div key={index} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                        <Avatar className="flex-shrink-0">
                          <AvatarFallback>{message.role === "user" ? "You" : "AI"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1 max-w-[75%]">
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              <div className="text-sm">
                                <p className="text-sm">{message.content}</p>
                              </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground px-1">{message.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    {isWaitingResponse && (
                      <div className="flex gap-3">
                        <Avatar className="flex-shrink-0">
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1 max-w-[75%]">
                          <div className="rounded-lg p-3 bg-muted flex items-center">
                            <span className="three-dots-bounce">
                              <span className="dot" />
                              <span className="dot" />
                              <span className="dot" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Voice UI removed */}

              {/* Input Area */}
              <div className="flex gap-2">
                {/* Mic removed */}
                <Textarea
                  placeholder={activeConversation ? "Type your message..." : "Start a conversation first"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={!activeConversation}
                  className="min-h-[60px] max-h-[120px] resize-none"
                />
                <Button onClick={handleSend} disabled={!activeConversation || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Real-time Feedback */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          {/* Live Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Grammar</span>
                  <span className="font-bold">{grammarScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${grammarScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Vocabulary</span>
                  <span className="font-bold">{vocabularyScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${vocabularyScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Pronunciation</span>
                  <span className="font-bold">{pronunciationScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pronunciationScore}%` }}
                  />
                </div>
              </div>
              
            </CardContent>
          </Card>

          {/* Grammar Errors & Corrections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Grammar Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isGrammarLoading ? (
                <div className="flex justify-center py-4">
                  <span className="animate-spin w-8 h-8 border-4 border-t-4 border-primary rounded-full"></span>
                </div>
              ) : grammarErrors.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No errors detected</p>
                </div>
              ) : (
                grammarErrors.map((error, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-destructive line-through">{error.text}</p>
                        <p className="text-xs font-medium text-green-600 mt-1">{error.correction}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {error.type}
                        </Badge>
                      </div>
                      {error.correction && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleCopyCorrection(error.correction, index)}
                          title="Copy correction"
                        >
                          {copiedIndex === index ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
// Add three-dot bounce animation styles
// Add to your global CSS or in a style tag if needed
// .three-dots-bounce { display: inline-flex; gap: 4px; }
// .three-dots-bounce .dot { width: 8px; height: 8px; border-radius: 50%; background: #888; animation: bounce 1s infinite alternate; }
// .three-dots-bounce .dot:nth-child(2) { animation-delay: 0.2s; }
// .three-dots-bounce .dot:nth-child(3) { animation-delay: 0.4s; }
// @keyframes bounce { to { transform: translateY(-8px); background: #444; } }

}
