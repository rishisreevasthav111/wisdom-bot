import { useState } from "react";
import { ChevronDown, Library } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TipTypeBadge } from "@/components/common/TipTypeBadge";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import type { Tip } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourcesList({ tips, defaultOpen = false }: { tips: Tip[]; defaultOpen?: boolean | undefined }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-background/60">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <Library className="size-4 text-primary-ink" aria-hidden />
          Sources ({tips.length} tips)
        </span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="space-y-3 px-4 pb-4">
          {tips.map((tip, i) => (
            <li key={tip.id} className="rounded-xl bg-card p-3 shadow-soft">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-muted-foreground">#{i + 1}</span>
                <span className="font-semibold">{tip.company ?? tip.course}</span>
                <TipTypeBadge type={tip.type} />
                <span className="text-muted-foreground">
                  {tip.year} · {tip.semester}
                </span>
                <VerifiedBadge author={tip.author} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{tip.text}</p>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
