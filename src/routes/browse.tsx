import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterBar, type FilterValues } from "@/components/common/FilterBar";
import { PageHeader } from "@/components/common/PageHeader";
import { TipCard, TipCardSkeleton } from "@/components/tips/TipCard";
import { tipsQuery } from "@/lib/queries";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse senior tips · Seniors' Wisdom" },
      {
        name: "description",
        content: "Search and filter tips from seniors by course, professor, tip type and year.",
      },
      { property: "og:title", content: "Browse senior tips · Seniors' Wisdom" },
      { property: "og:description", content: "Search and filter tips by course, professor, tip type and year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function BrowsePage() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState<"helpful" | "recent">("helpful");
  const search = useDebounced(filters.search);
  const { data, isLoading } = useQuery(tipsQuery({ ...filters, search, sort }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Browse"
        title="Tips from seniors"
        description="Prep strategies, grading quirks, project advice and placement stories, all from people who've done it."
      >
        <Button asChild variant="soft">
          <Link to="/share">Share a tip</Link>
        </Button>
      </PageHeader>

      <div className="mb-6 rounded-3xl border bg-card p-4 shadow-soft sm:p-5">
        <FilterBar
          value={filters}
          onChange={setFilters}
          fields={["course", "professor", "type", "year"]}
          showSearch
          searchPlaceholder="Search tips, e.g. “PYQs” or “Prof. Iyer”"
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Loading tips…" : `${data?.length ?? 0} tips`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-muted-foreground">
            Sort by
          </label>
          <Select value={sort} onValueChange={(v) => setSort(v as "helpful" | "recent")}>
            <SelectTrigger id="sort" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Most helpful</SelectItem>
              <SelectItem value="recent">Most recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TipCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No tips match these filters"
          description="Try clearing a filter, or be the one to write the first tip."
          action={
            <Button asChild>
              <Link to="/share">Share a tip</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
