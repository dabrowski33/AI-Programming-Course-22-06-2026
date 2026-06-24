import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Decision = "zaakceptowano" | "odrzucono" | "wymaga_weryfikacji"

interface DecisionBadgeProps {
  decision: Decision
}

const DECISION_CONFIG: Record<
  Decision,
  { label: string; className: string }
> = {
  zaakceptowano: {
    label: "Zaakceptowano",
    className:
      "bg-green-100 text-green-800 border border-green-200 hover:bg-green-100",
  },
  odrzucono: {
    label: "Odrzucono",
    className:
      "bg-red-100 text-red-800 border border-red-200 hover:bg-red-100",
  },
  wymaga_weryfikacji: {
    label: "Wymaga weryfikacji",
    className:
      "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100",
  },
}

export default function DecisionBadge({ decision }: DecisionBadgeProps) {
  const { label, className } = DECISION_CONFIG[decision]
  return (
    <Badge
      className={cn("text-sm px-3 py-1 h-auto font-semibold", className)}
      data-testid="decision-badge"
    >
      {label}
    </Badge>
  )
}
