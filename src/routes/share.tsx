import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardPaste, Database, Info, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { BulkPasteForm, TipForm } from "@/components/tips";
import type { Tip } from "@/lib/types";

export const Route = createFileRoute("/share")({
  validateSearch: (search: Record<string, unknown>): { topic?: string | undefined; question?: string | undefined } => ({
    topic: typeof search["topic"] === "string" && search["topic"] ? search["topic"] : undefined,
    question: typeof search["question"] === "string" && search["question"] ? search["question"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Share a tip · Seniors' Wisdom" },
      {
        name: "description",
        content: "Seniors: share what you wish you'd known about a course, professor or placement.",
      },
      { property: "og:title", content: "Share a tip · Seniors' Wisdom" },
      { property: "og:description", content: "Share what you wish you'd known about a course, professor or placement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharePage,
});

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["tips"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
    void qc.invalidateQueries({ queryKey: ["companies"] });
  };
}

function SharePage() {
  const search = Route.useSearch();
  const invalidate = useInvalidateAll();
  const [done, setDone] = useState<null | { count: number }>(null);

  const handleSingleSuccess = (_tip: Tip) => {
    invalidate();
    setDone({ count: 1 });
  };

  const handleBulkSuccess = (count: number) => {
    invalidate();
    setDone({ count });
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="animate-rise rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h1 className="text-center text-3xl font-extrabold">Thank you, senior!</h1>
          <p className="mt-2 text-center text-muted-foreground">
            {done.count === 1 ? "Your tip has been submitted" : `${done.count} tips have been submitted`} and will start
            helping juniors right away.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => setDone(null)}>Share another tip</Button>
            <Button asChild variant="outline">
              <Link to="/browse">Browse tips</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Share a tip"
        title="Pass on what you learned"
        description="Select a category, fill in details, and store your advice with pgvector semantic search."
      />

      {search.question && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-primary/40 bg-primary-soft p-4">
          <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-primary-ink" aria-hidden />
          <div>
            <p className="text-sm font-semibold">You're answering a junior's question</p>
            <p className="text-sm text-accent-foreground">“{search.question}”</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="single" className="min-w-0">
          <TabsList className="mb-4 h-11 rounded-xl p-1">
            <TabsTrigger value="single" className="rounded-lg px-4">
              Single tip
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-lg px-4">
              <ClipboardPaste className="size-4" aria-hidden /> Bulk paste
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <TipForm
              initialTopic={search.topic && search.topic !== "General" ? search.topic : ""}
              onSuccess={handleSingleSuccess}
            />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkPasteForm onSuccess={handleBulkSuccess} />
          </TabsContent>
        </Tabs>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border bg-info-soft p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-info">
              <Info className="size-4" aria-hidden /> Guidelines
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              Focus on syllabus strategy, exam format, viva expectations, and interview insights.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
              <li>• Choose the right category for contextual fields.</li>
              <li>• Be specific: name chapters, questions, and mark splits.</li>
              <li>• You can post anonymously or show your verified badge.</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Database className="size-4 text-primary" aria-hidden /> Database & Vector Store
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Each tip generates a 1536-dimensional float vector stored in PostgreSQL with pgvector, enabling semantic
              search across courses, professors, companies, and advice.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
