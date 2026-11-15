import { useState } from "react";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FreshnessBadge } from "@/components/common/FreshnessBadge";
import { DisagreementCallout } from "./DisagreementCallout";
import { SourcesList } from "./SourcesList";
import { submitFeedback } from "@/lib/api";
import type { Answer } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AnswerCard({ answer }: { answer: Answer }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  const give = async (value: "up" | "down") => {
    setVote(value);
    await submitFeedback(answer.id, value);
    toast.success(value === "up" ? "Glad it helped!" : "Thanks, we'll use this to improve answers.");
  };

  return (
    <article className="animate-rise rounded-3xl border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-ink">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-4" aria-hidden />
        </span>
        From senior tips
      </div>

      <div className="space-y-3 leading-relaxed">
        <p>{answer.intro}</p>
        {answer.points.length > 0 && (
          <ul className="space-y-2">
            {answer.points.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Based on <strong className="text-foreground">{answer.tips.length} tips</strong> from {answer.yearRange}
        </span>
        <FreshnessBadge freshness={answer.freshness} />
      </div>

      {answer.disagreement && (
        <div className="mt-4">
          <DisagreementCallout disagreement={answer.disagreement} />
        </div>
      )}

      <div className="mt-4">
        <SourcesList tips={answer.tips} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Was this helpful?</span>
        <Button
          variant={vote === "up" ? "soft" : "ghost"}
          size="icon"
          className={cn("size-8", vote === "up" && "text-success")}
          aria-label="Helpful"
          aria-pressed={vote === "up"}
          onClick={() => give("up")}
        >
          <ThumbsUp aria-hidden />
        </Button>
        <Button
          variant={vote === "down" ? "soft" : "ghost"}
          size="icon"
          className={cn("size-8", vote === "down" && "text-destructive")}
          aria-label="Not helpful"
          aria-pressed={vote === "down"}
          onClick={() => give("down")}
        >
          <ThumbsDown aria-hidden />
        </Button>
      </div>
    </article>
  );
}

export function AnswerSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6" role="status" aria-label="Finding senior tips">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="size-7 rounded-full" />
        <span className="flex items-center gap-1" aria-hidden>
          <span className="typing-dot size-1.5 rounded-full bg-primary-ink" />
          <span className="typing-dot size-1.5 rounded-full bg-primary-ink [animation-delay:150ms]" />
          <span className="typing-dot size-1.5 rounded-full bg-primary-ink [animation-delay:300ms]" />
        </span>
        <span className="text-sm text-muted-foreground">Reading senior tips…</span>
      </div>
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="mb-2 h-4 w-4/6" />
      <Skeleton className="mt-4 h-10 w-full rounded-2xl" />
    </div>
  );
}
