import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { companiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/placements/")({
  head: () => ({
    meta: [
      { title: "Placement tips by company · Seniors' Wisdom" },
      {
        name: "description",
        content: "Interview rounds, prep resources and real interview experiences from seniors, company by company.",
      },
      { property: "og:title", content: "Placement tips by company · Seniors' Wisdom" },
      { property: "og:description", content: "Interview rounds, prep resources and experiences from seniors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlacementsPage,
});

function PlacementsPage() {
  const { data, isLoading } = useQuery(companiesQuery());
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Placements"
        title="Company-wise placement tips"
        description="How the rounds work, what to prepare, and what seniors were actually asked."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
          : data?.map((c) => (
              <Link
                key={c.slug}
                to="/placements/$company"
                params={{ company: c.slug }}
                className="group flex flex-col rounded-3xl border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft font-display text-xl font-extrabold text-primary-ink">
                    {c.name[0]}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    {c.tipCount} tips
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-extrabold">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink">
                  <Briefcase className="size-4" aria-hidden /> View rounds & experiences
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
      </div>
    </div>
  );
}
