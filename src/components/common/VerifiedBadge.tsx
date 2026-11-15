import { BadgeCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TipAuthor } from "@/lib/types";

export function VerifiedBadge({ author }: { author: TipAuthor }) {
  if (author.anonymous || !author.showBadge) {
    return (
      <Badge variant="muted" aria-label="Posted anonymously">
        <UserRound className="size-3" aria-hidden />
        Anonymous
      </Badge>
    );
  }
  const label = `Class of ${author.batch}${author.branch ? `, ${author.branch}` : ""}`;
  return (
    <Badge variant={author.verified ? "success" : "muted"} title={author.verified ? "Verified senior" : undefined}>
      {author.verified && <BadgeCheck className="size-3" aria-hidden />}
      <span className="sr-only">{author.verified ? "Verified senior, " : ""}</span>
      {label}
    </Badge>
  );
}
