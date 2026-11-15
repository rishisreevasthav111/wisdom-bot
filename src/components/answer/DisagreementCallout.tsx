import { Scale } from "lucide-react";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import type { Disagreement } from "@/lib/types";

function Side({ label, tips, tone }: { label: string; tips: Disagreement["sideA"]["tips"]; tone: "A" | "B" }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold">
        <span className="grid size-6 place-items-center rounded-full bg-disagree-soft text-xs text-disagree">
          {tone}
        </span>
        {label}
      </p>
      <ul className="space-y-2">
        {tips.map((t) => (
          <li key={t.id} className="text-sm leading-relaxed text-muted-foreground">
            “{t.text}”
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <VerifiedBadge author={t.author} />
              <span>{t.year}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DisagreementCallout({ disagreement }: { disagreement: Disagreement }) {
  return (
    <section
      aria-label="Seniors disagree"
      className="rounded-2xl border border-disagree/30 bg-disagree-soft p-4"
    >
      <h4 className="mb-1 flex items-center gap-2 text-base font-bold text-disagree">
        <Scale className="size-5" aria-hidden />
        Seniors disagree
      </h4>
      <p className="mb-3 text-sm text-foreground/80">
        Tips on {disagreement.topic} point in different directions. Weigh both sides.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Side label={disagreement.sideA.label} tips={disagreement.sideA.tips} tone="A" />
        <Side label={disagreement.sideB.label} tips={disagreement.sideB.tips} tone="B" />
      </div>
    </section>
  );
}
