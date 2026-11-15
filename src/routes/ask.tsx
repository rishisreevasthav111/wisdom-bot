import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleQuestion, PenLine, SendHorizontal, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerCard, AnswerSkeleton } from "@/components/answer/AnswerCard";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterBar, type FilterValues } from "@/components/common/FilterBar";
import { askQuestion } from "@/lib/api";
import type { Answer } from "@/lib/types";

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" && search["q"].trim() ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ask seniors · Seniors' Wisdom" },
      {
        name: "description",
        content: "Ask about courses, professors and placements and get answers built only from real senior tips.",
      },
      { property: "og:title", content: "Ask seniors · Seniors' Wisdom" },
      { property: "og:description", content: "Get answers built only from real senior tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskPage,
});

interface Message {
  id: string;
  question: string;
  status: "loading" | "done";
  answer: Answer | null;
}

const SUGGESTIONS = [
  "How do I prepare for the OS course?",
  "Is DBMS grading strict about normalization?",
  "Tips for the Machine Learning project?",
  "What are Google interviews like?",
];

function AskPage() {
  const { q } = Route.useSearch();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filters, setFilters] = useState<FilterValues>({});
  const [draft, setDraft] = useState("");
  const lastAsked = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text) return;
      const id = crypto.randomUUID();
      setMessages((m) => [...m, { id, question: text, status: "loading", answer: null }]);
      const answer = await askQuestion(text, {
        course: filters.course,
        professor: filters.professor,
        type: filters.type,
      });
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "done", answer } : msg)));
    },
    [filters],
  );

  useEffect(() => {
    if (q && lastAsked.current !== q) {
      lastAsked.current = q;
      void ask(q);
    }
  }, [q, ask]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = () => {
    if (!draft.trim()) return;
    void ask(draft);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="pt-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Ask the seniors</h1>
        <p className="mt-1 text-muted-foreground">Every answer is stitched together from tips real seniors shared.</p>
        <FilterBar
          className="mt-5"
          value={filters}
          onChange={setFilters}
          fields={["course", "professor", "type"]}
        />
      </div>

      <section aria-label="Conversation" aria-live="polite" className="flex-1 space-y-6 py-8">
        {messages.length === 0 && (
          <EmptyState
            icon={MessageCircleQuestion}
            title="What do you want to know?"
            description="Try one of these, or type your own question below."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" className="rounded-full" onClick={() => ask(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            }
          />
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            <div className="flex justify-end">
              <p className="animate-rise max-w-[85%] rounded-3xl rounded-br-md bg-foreground px-4 py-3 text-background shadow-soft">
                {m.question}
              </p>
            </div>
            {m.status === "loading" ? (
              <AnswerSkeleton />
            ) : m.answer ? (
              <AnswerCard answer={m.answer} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="No seniors have shared tips on this yet"
                description="We've added your question to the requests board so seniors can answer it."
                action={
                  <Button asChild>
                    <Link to="/share" search={{ question: m.question }}>
                      <PenLine aria-hidden /> Be the first to contribute
                    </Link>
                  </Button>
                }
                className="animate-rise"
              />
            )}
          </div>
        ))}
        <div ref={endRef} />
      </section>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/90 px-4 pb-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-card focus-within:ring-2 focus-within:ring-ring"
        >
          <label htmlFor="followup" className="sr-only">
            {messages.length ? "Ask a follow-up question" : "Ask a question"}
          </label>
          <textarea
            id="followup"
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={messages.length ? "Ask a follow-up…" : "How do I prepare for the OS course?"}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" className="size-10 shrink-0" disabled={!draft.trim()} aria-label="Send question">
            <SendHorizontal aria-hidden />
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Answers only use senior tips. Always double-check with your department.
        </p>
      </div>
    </div>
  );
}
