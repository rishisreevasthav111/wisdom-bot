import { Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Freshness } from "@/lib/types";

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  if (freshness === "Fresh")
    return (
      <Badge variant="success">
        <Sparkles className="size-3" aria-hidden /> Fresh
      </Badge>
    );
  if (freshness === "Recent")
    return (
      <Badge variant="info">
        <Clock className="size-3" aria-hidden /> Recent
      </Badge>
    );
  return (
    <Badge variant="disagree">
      <Clock className="size-3" aria-hidden /> May be outdated
    </Badge>
  );
}
