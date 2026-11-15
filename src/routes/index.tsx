import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, HelpCircle, PenLine, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statsQuery } from "@/lib/queries";
import heroImg from "@/assets/hero-seniors.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seniors' Wisdom · Advice from seniors who've been there" },
      {
        name: "description",
        content:
          "Ask anything about courses, professors and placements. Answers come only from real senior tips.",
      },
      { property: "og:title", content: "Seniors' Wisdom · Advice from seniors who've been there" },
      {
        property: "og:description",
        content: "Ask anything about courses, professors and placements. Answers come only from real senior tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const EXAMPLES = [
  "How do I prepare for the OS course?",
  "What's the grading like in DBMS?",
  "How are Amazon interview rounds?",
];

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const ask = (question: string) => {
    const text = question.trim();
    if (!text) return;
    navigate({ to: "/ask", search: { q: text } });
  };

  return (
    <>
      <section className="relative overflow-hidden bg-warm-glow">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Built by students, for students
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Advice from seniors who've <span className="text-primary-ink">been there</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Ask anything about courses, professors and placements. Answers come only from real senior tips.
            </p>

            <form
              className="mt-8 flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-card sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                ask(q);
              }}
              role="search"
            >
              <label htmlFor="hero-ask" className="sr-only">
                Ask a question
              </label>
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  id="hero-ask"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="How do I prepare for the OS course?"
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" size="lg" disabled={!q.trim()} className="h-12 sm:px-8">
                Ask <ArrowRight aria-hidden />
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Example questions">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => ask(ex)}
                  className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ex}
                </button>
              ))}
            </div>

            <Stats />
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-primary-soft" aria-hidden />
            <img
              src={heroImg}
              alt="A senior student explaining notes to two juniors on the campus steps"
              width={1280}
              height={1024}
              className="aspect-[5/4] w-full rounded-[1.75rem] object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="sr-only">
          Get started
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <CtaCard
            icon={HelpCircle}
            title="I'm a junior, I have questions"
            body="Get straight answers on courses, profs and placements, built only from tips seniors actually wrote."
            cta="Ask a question"
            to="/ask"
          />
          <CtaCard
            icon={PenLine}
            title="I'm a senior, I want to share tips"
            body="Spent four years figuring it out? Leave a tip in two minutes, or paste your old WhatsApp notes."
            cta="Share a tip"
            to="/share"
            accent
          />
        </div>
      </section>
    </>
  );
}

function Stats() {
  const { data, isLoading } = useQuery(statsQuery());
  const items = [
    { icon: BookOpen, label: "tips shared", value: data?.tips },
    { icon: Search, label: "courses covered", value: data?.courses },
    { icon: Users, label: "seniors contributing", value: data?.seniors },
  ];
  return (
    <dl className="mt-10 grid grid-cols-3 gap-3 sm:max-w-lg">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-2xl border bg-card/70 p-3 shadow-soft sm:p-4">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon className="hidden size-3.5 sm:block" aria-hidden />
            {label}
          </dt>
          <dd className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-12" /> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CtaCard({
  icon: Icon,
  title,
  body,
  cta,
  to,
  accent,
}: {
  icon: typeof HelpCircle;
  title: string;
  body: string;
  cta: string;
  to: "/ask" | "/share";
  accent?: boolean | undefined;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-3xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8 ${
        accent ? "bg-primary text-primary-foreground" : "bg-card"
      }`}
    >
      <span
        className={`mb-5 grid size-12 place-items-center rounded-2xl ${
          accent ? "bg-background/25" : "bg-primary-soft text-primary-ink"
        }`}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-2xl font-extrabold">{title}</h3>
      <p className={`mt-2 ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{body}</p>
      <span className="mt-6 inline-flex items-center gap-2 font-semibold">
        {cta} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
