import { type AgentDecision } from "@/lib/validation/types"
import DecisionBadge from "./DecisionBadge"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  isFirstMessage?: boolean
  agentDecision?: AgentDecision
}

export default function MessageBubble({
  role,
  content,
  isFirstMessage,
  agentDecision,
}: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-blue-50 text-blue-900 rounded-br-sm"
            : "bg-white text-foreground border border-border rounded-bl-sm"
        }`}
      >
        {isFirstMessage && agentDecision ? (
          <FirstMessageContent decision={agentDecision} />
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  )
}

function FirstMessageContent({ decision }: { decision: AgentDecision }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-foreground">
        Dzień dobry, oto wynik analizy zgłoszenia.
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          Decyzja:
        </span>
        <DecisionBadge decision={decision.decision} />
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Uzasadnienie:</p>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
          {decision.justification}
        </p>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1">Kolejne kroki:</p>
        <ol className="list-decimal list-inside flex flex-col gap-1">
          {decision.nextSteps.map((step, i) => (
            <li key={i} className="text-sm text-foreground/90">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-2">
        {decision.disclaimer}
      </p>
    </div>
  )
}
