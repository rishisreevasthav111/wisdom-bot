import { useState } from "react";
import { ArrowBigUp, Flag, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TipTypeBadge } from "@/components/common/TipTypeBadge";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { ReportDialog } from "./ReportDialog";
import { hasUpvoted, upvoteTip } from "@/lib/api";
import type { Tip } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRUNCATE_AT = 180;

export function TipCard({ tip, className }: { tip: Tip; className?: string | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [votes, setVotes] = useState(tip.upvotes);
  const [voted, setVoted] = useState(() => hasUpvoted(tip.id));

  const long = tip.text.length > TRUNCATE_AT;
  const shown = !long || expanded ? tip.text : `${tip.text.slice(0, TRUNCATE_AT).trimEnd()}…`;

  const vote = async () => {
    // Optimistic update
    setVoted(!voted);
    setVotes((v) => v + (voted ? -1 : 1));
    try {
      const res = await upvoteTip(tip.id);
      setVotes(res.upvotes);
      setVoted(res.upvoted);
      if (res.upvoted) toast.success("Marked as helpful");
    } catch {
      setVoted(voted);
      setVotes(tip.upvotes);
      toast.error("Couldn't save your vote");
    }
  };

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-card",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          <GraduationCap className="size-3.5" aria-hidden />
          {tip.company ? `${tip.company}` : tip.course}
        </span>
        <TipTypeBadge type={tip.type} />
      </div>

      {tip.professor && <p className="mb-1.5 text-sm font-semibold text-muted-foreground">{tip.professor}</p>}

      <p className="flex-1 leading-relaxed text-card-foreground">
        {shown}{" "}
        {long && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded font-semibold text-primary-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {tip.year} · {tip.semester}
        </span>
        <VerifiedBadge author={tip.author} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <Button
          variant={voted ? "soft" : "ghost"}
          size="sm"
          onClick={vote}
          aria-pressed={voted}
          aria-label={`${voted ? "Remove upvote" : "Upvote"}, ${votes} found this helpful`}
          className={cn(voted && "text-primary-ink")}
        >
          <ArrowBigUp className={cn(voted && "fill-current")} aria-hidden />
          {votes} helpful
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setReportOpen(true)}
          aria-label="Report this tip"
          className="size-8 text-muted-foreground hover:text-destructive"
        >
          <Flag aria-hidden />
        </Button>
      </div>
      <ReportDialog tipId={tip.id} open={reportOpen} onOpenChange={setReportOpen} />
    </article>
  );
}

export function TipCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft" aria-hidden>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-11/12" />
      <Skeleton className="mb-5 h-4 w-2/3" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}
