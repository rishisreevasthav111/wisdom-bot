import { cn } from "@/lib/utils";
import type { TipType } from "@/lib/types";

const TYPE_CLASS: Record<TipType, string> = {
  Prep: "tag-prep",
  Grading: "tag-grading",
  Placements: "tag-placements",
  Projects: "tag-projects",
  General: "tag-general",
};

export function TipTypeBadge({ type, className }: { type: TipType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TYPE_CLASS[type],
        className,
      )}
    >
      {type}
    </span>
  );
}
