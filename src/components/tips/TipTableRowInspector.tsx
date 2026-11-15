import { Database } from "lucide-react";
import type { Tip } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TipTableRowInspectorProps {
  tip: Tip;
  className?: string | undefined;
}

/**
 * Renders the exact stored PostgreSQL + pgvector database row representation
 * of a tip, matching the table schema view.
 */
export function TipTableRowInspector({ tip, className }: TipTableRowInspectorProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/70 bg-muted/40 p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            What the row looks like in the table
          </h2>
        </div>
        <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-ink">
          PostgreSQL + pgvector
        </span>
      </div>

      <div className="overflow-x-auto font-mono text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-1.5 pr-4 font-semibold">Column</th>
              <th className="py-1.5 font-semibold">Stored value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-foreground/90">
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">id</td>
              <td className="py-1.5 text-primary-ink">{tip.id}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">author_id</td>
              <td className="py-1.5">{tip.author_id ?? "NULL"}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">text</td>
              <td className="py-1.5 font-sans font-medium text-foreground">{tip.text}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">category</td>
              <td className="py-1.5 font-semibold text-amber-500">{tip.category}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">course_code</td>
              <td className="py-1.5">{tip.course_code ?? "NULL"}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">professor</td>
              <td className="py-1.5">{tip.professor ?? "NULL"}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">company</td>
              <td className="py-1.5">{tip.company ?? "NULL"}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">author_batch</td>
              <td className="py-1.5">{tip.author_batch ?? "NULL"}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">anonymous</td>
              <td className="py-1.5 font-semibold text-indigo-500">{String(tip.anonymous)}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">embedding</td>
              <td className="py-1.5 text-muted-foreground">
                {tip.embedding
                  ? `[${tip.embedding.slice(0, 3).map((n) => n.toFixed(4)).join(", ")}, ...] (${tip.embedding.length} floats)`
                  : "NULL"}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium text-muted-foreground">created_at</td>
              <td className="py-1.5 text-muted-foreground">{tip.created_at ?? tip.createdAt}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
