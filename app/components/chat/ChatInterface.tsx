"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MessageBubble from "./MessageBubble"
import {
  type AgentDecision,
  type ImageAnalysisResult,
  type ChatContext,
} from "@/lib/validation/types"
import { SendHorizonalIcon, PlusCircleIcon } from "lucide-react"

interface StoredSession {
  imageAnalysis: ImageAnalysisResult
  decision: AgentDecision
  formData: {
    requestType: "reklamacja" | "zwrot"
    equipmentCategory: string
    equipmentModel: string
    purchaseDate: string
    complaintReason?: string
  }
}

function getTextFromMessage(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } & typeof p => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export default function ChatInterface() {
  const router = useRouter()
  const [session, setSession] = useState<StoredSession | null>(null)
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const raw = sessionStorage.getItem("copilot_session")
    if (!raw) {
      router.push("/")
      return
    }
    try {
      const parsed: StoredSession = JSON.parse(raw)
      setSession(parsed)
    } catch {
      router.push("/")
    }
  }, [router])

  const buildContext = useCallback((): ChatContext | null => {
    if (!session) return null
    return {
      requestType: session.formData.requestType,
      equipmentCategory: session.formData.equipmentCategory,
      equipmentModel: session.formData.equipmentModel,
      purchaseDate: session.formData.purchaseDate,
      complaintReason: session.formData.complaintReason,
      imageConditionSummary: session.imageAnalysis.conditionSummary,
      decisionResult: session.decision.decision,
      decisionJustification: session.decision.justification,
      rulesApplied: session.decision.rulesApplied,
    }
  }, [session])

  const context = buildContext()

  const { messages, status, sendMessage } = useChat(
    context
      ? {
          transport: new DefaultChatTransport({
            api: "/api/chat",
            body: { context },
          }),
        }
      : undefined
  )

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  function handleNewCase() {
    sessionStorage.removeItem("copilot_session")
    router.push("/")
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mounted || !session) return null

  const appTitle =
    process.env.NEXT_PUBLIC_APP_TITLE ?? "Hardware Service Decision Copilot"

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-sm flex-shrink-0">
        <h1 className="text-base font-semibold text-foreground truncate">
          {appTitle}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewCase}
          className="flex items-center gap-1.5 flex-shrink-0"
        >
          <PlusCircleIcon className="size-4" />
          Nowe zgłoszenie
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* First decision message – display only, not in useChat messages */}
          <MessageBubble
            role="assistant"
            content=""
            isFirstMessage
            agentDecision={session.decision}
          />

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={getTextFromMessage(msg)}
            />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start mb-3">
              <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <span className="flex gap-1 items-center h-4">
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <Textarea
            placeholder="Wpisz wiadomość…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 resize-none min-h-[40px] max-h-32 py-2"
            rows={1}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="flex-shrink-0 size-10"
          >
            <SendHorizonalIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
