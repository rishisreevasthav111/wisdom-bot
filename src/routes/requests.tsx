import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandHeart, Inbox, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { unansweredQuery } from "@/lib/queries";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Unanswered questions · Seniors' Wisdom" },
      {
        name: "description",
        content: "Questions juniors asked that no senior has answered yet. Know the answer? Share a tip.",
      },
      { property: "og:title", content: "Unanswered questions · Seniors' Wisdom" },
      { property: "og:description", content: "Questions juniors asked that no senior has answered yet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function RequestsPage() {
  const { data, isLoading } = useQuery(unansweredQuery());
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Requests"
        title="Juniors are waiting on these"
        description="These questions didn't match any senior tips yet. If you know the answer, a single tip helps everyone who asks next."
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : data?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((q) => (
            <li key={q.id} className="flex flex-col rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">
                  {q.topic}
                </span>
                <span className="text-muted-foreground">Asked {formatDate(q.askedAt)}</span>
              </div>
              <p className="flex-1 text-lg font-semibold leading-snug">{q.question}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  {q.askCount} {q.askCount === 1 ? "junior" : "juniors"} asked
                </span>
                <Button asChild size="sm">
                  <Link to="/share" search={{ topic: q.topic, question: q.question }}>
                    <HandHeart aria-hidden /> I can answer this
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Inbox} title="Every question has an answer" description="Nice work, seniors!" />
      )}
    </div>
  );
}
