import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PenLine, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { TipCard, TipCardSkeleton } from "@/components/tips/TipCard";
import { findCompany } from "@/lib/api";
import { companyQuery } from "@/lib/queries";
import { PLACEMENT_SECTIONS } from "@/lib/types";

export const Route = createFileRoute("/placements/$company")({
  loader: ({ params }) => {
    const company = findCompany(params.company);
    if (!company) throw notFound();
    return { name: company.name, tagline: company.tagline };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} placement tips · Seniors' Wisdom` : "Company not found · Seniors' Wisdom";
    const description = loaderData
      ? `${loaderData.name} interview rounds, prep resources and interview experiences shared by seniors.`
      : "This company page doesn't exist.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon={SearchX}
        title="We don't have that company yet"
        action={
          <Button asChild>
            <Link to="/placements">See all companies</Link>
          </Button>
        }
      />
    </div>
  ),
  component: CompanyPage,
});

function CompanyPage() {
  const { company: slug } = Route.useParams();
  const meta = Route.useLoaderData();
  const { data, isLoading } = useQuery(companyQuery(slug));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/placements" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All companies
      </Link>
      <header className="mb-8 flex flex-col gap-4 rounded-3xl border bg-warm-glow bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary font-display text-3xl font-extrabold text-primary-foreground">
            {meta.name[0]}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{meta.name}</h1>
            <p className="text-muted-foreground">
              {meta.tagline}
              {data && ` · ${data.tips.length} senior tips`}
            </p>
          </div>
        </div>
        <Button asChild variant="soft">
          <Link to="/share" search={{ topic: "Placements" }}>
            <PenLine aria-hidden /> Add your experience
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="Rounds">
        <TabsList className="mb-5 h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1 sm:w-auto">
          {PLACEMENT_SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s} className="rounded-lg px-4 py-2">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
        {PLACEMENT_SECTIONS.map((section) => {
          const tips = data?.tips.filter((t) => t.placementSection === section) ?? [];
          return (
            <TabsContent key={section} value={section}>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <TipCardSkeleton />
                  <TipCardSkeleton />
                </div>
              ) : tips.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {tips.map((t) => (
                    <TipCard key={t.id} tip={t} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={SearchX}
                  title={`No ${section.toLowerCase()} tips for ${meta.name} yet`}
                  action={
                    <Button asChild>
                      <Link to="/share" search={{ topic: "Placements" }}>
                        Be the first to contribute
                      </Link>
                    </Button>
                  }
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
