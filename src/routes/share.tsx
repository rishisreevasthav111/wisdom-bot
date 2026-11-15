import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardPaste, Info, Loader2, MessageSquareQuote, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CourseCombobox } from "@/components/common/CourseCombobox";
import { PageHeader } from "@/components/common/PageHeader";
import { getProfessorOptions, processBulkPaste, submitTip, submitTips, validateNewTip } from "@/lib/api";
import {
  MAX_TIP_LENGTH,
  MIN_TIP_LENGTH,
  TIP_TYPES,
  type DraftTip,
  type TipType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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

const YEARS = ["2026", "2025", "2024", "2023", "2022"];
const SEMESTERS = Array.from({ length: 8 }, (_, i) => `Sem ${i + 1}`);

const SAMPLE_PASTE = `[12/03/24, 9:41 PM] Rohit: For OS with Iyer ma'am, solve all the scheduling PYQs twice. Every midsem has a Gantt chart numerical.
[12/03/24, 9:43 PM] Rohit: DBMS lab tests are timed. Practise joins and GROUP BY on LeetCode SQL 50 before the lab exam.
[12/03/24, 9:47 PM] Ananya: For placements start the Amazon tagged LeetCode list by June, and prepare STAR stories for the interview.`;

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
  const [done, setDone] = useState<null | { count: number }>(null);

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <div className="animate-rise rounded-3xl border bg-card p-8 shadow-card">
          <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h1 className="text-3xl font-extrabold">Thank you, senior!</h1>
          <p className="mt-2 text-muted-foreground">
            {done.count === 1 ? "Your tip is live" : `${done.count} tips are live`} and will start helping juniors
            right away.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
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
        description="Two minutes of your time can save a junior a whole semester of guesswork."
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
            <SingleTipForm
              initialCourse={search.topic && search.topic !== "General" ? search.topic : ""}
              onDone={() => setDone({ count: 1 })}
            />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkPaste onDone={(count) => setDone({ count })} />
          </TabsContent>
        </Tabs>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border bg-info-soft p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-info">
              <Info className="size-4" aria-hidden /> Guidelines
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              Focus on teaching style, exam format and prep strategy. No personal attacks.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
              <li>• Be specific: name chapters, resources, mark splits.</li>
              <li>• Mention the year so juniors know how fresh it is.</li>
              <li>• Disagree with another tip? Share your side, kindly.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function CharCounter({ length }: { length: number }) {
  const tooShort = length < MIN_TIP_LENGTH;
  return (
    <span className={cn("text-xs tabular-nums", tooShort ? "text-muted-foreground" : "text-success")}>
      {length}/{MAX_TIP_LENGTH}
      {tooShort && ` · ${MIN_TIP_LENGTH - length} more needed`}
    </span>
  );
}

function SingleTipForm({ initialCourse, onDone }: { initialCourse: string; onDone: () => void }) {
  const invalidate = useInvalidateAll();
  const [course, setCourse] = useState(initialCourse);
  const [professor, setProfessor] = useState("");
  const [type, setType] = useState<TipType>("Prep");
  const [year, setYear] = useState("2025");
  const [semester, setSemester] = useState("Sem 5");
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [errors, setErrors] = useState<{ course?: string | undefined; text?: string | undefined }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!course.trim()) next.course = "Please choose a course.";
    const len = text.trim().length;
    if (len < MIN_TIP_LENGTH) next.text = `Your tip needs at least ${MIN_TIP_LENGTH} characters (currently ${len}).`;
    if (len > MAX_TIP_LENGTH) next.text = `Please keep it under ${MAX_TIP_LENGTH} characters.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      await submitTip({
        course,
        professor,
        type,
        year: Number(year),
        semester,
        text,
        anonymous,
        showBadge: !anonymous && showBadge,
      });
      invalidate();
      toast.success("Tip shared!", { description: "Juniors can see it now." });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't share your tip");
    } finally {
      setSubmitting(false);
    }
  };

  const professors = getProfessorOptions(course);

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="course">
            Course <span className="text-destructive">*</span>
          </Label>
          <CourseCombobox
            id="course"
            value={course}
            onChange={(v) => {
              setCourse(v);
              setErrors((x) => ({ ...x, course: undefined }));
            }}
            invalid={Boolean(errors.course)}
            describedBy={errors.course ? "course-error" : undefined}
          />
          <FieldError id="course-error" message={errors.course} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="professor">
            Professor <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="professor"
            list="professor-options"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            placeholder="e.g. Prof. Meera Iyer"
          />
          <datalist id="professor-options">
            {professors.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="type">Tip type</Label>
          <Select value={type} onValueChange={(v) => setType(v as TipType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="semester">Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger id="semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="tip-text">
            Your tip <span className="text-destructive">*</span>
          </Label>
          <CharCounter length={text.trim().length} />
        </div>
        <Textarea
          id="tip-text"
          rows={6}
          value={text}
          maxLength={MAX_TIP_LENGTH}
          onChange={(e) => {
            setText(e.target.value);
            if (errors.text && e.target.value.trim().length >= MIN_TIP_LENGTH)
              setErrors((x) => ({ ...x, text: undefined }));
          }}
          onBlur={() => text && validate()}
          aria-invalid={Boolean(errors.text) || undefined}
          aria-describedby={errors.text ? "text-error" : "text-hint"}
          className={cn("text-base", errors.text && "border-destructive")}
          placeholder="What would you tell your junior self? Exam pattern, how the prof teaches, which resources actually helped…"
        />
        <p id="text-hint" className="text-xs text-muted-foreground">
          At least {MIN_TIP_LENGTH} characters.
        </p>
        <FieldError id="text-error" message={errors.text} />
      </div>

      <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
        <div className="flex items-center gap-3">
          <Checkbox id="anon" checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
          <Label htmlFor="anon" className="cursor-pointer">
            Post anonymously
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="badge"
            checked={!anonymous && showBadge}
            disabled={anonymous}
            onCheckedChange={(v) => setShowBadge(v === true)}
          />
          <Label htmlFor="badge" className={cn("cursor-pointer", anonymous && "opacity-50")}>
            Show my verified badge
          </Label>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting && <Loader2 className="animate-spin" aria-hidden />}
        {submitting ? "Sharing…" : "Share tip"}
      </Button>
    </form>
  );
}

type DraftWithError = DraftTip & { error?: string | undefined };

function BulkPaste({ onDone }: { onDone: (count: number) => void }) {
  const invalidate = useInvalidateAll();
  const [raw, setRaw] = useState("");
  const [processing, setProcessing] = useState(false);
  const [drafts, setDrafts] = useState<DraftWithError[] | null>(null);
  const [year, setYear] = useState("2025");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const process = async () => {
    if (raw.trim().length < 20) {
      toast.error("Paste a bit more text first");
      return;
    }
    setProcessing(true);
    const result = await processBulkPaste(raw);
    setProcessing(false);
    setDrafts(result);
    if (result.length === 0) toast.error("We couldn't find any tips in that text");
    else toast.success(`Found ${result.length} tips`, { description: "Review and edit them before sharing." });
  };

  const update = (id: string, patch: Partial<DraftWithError>) =>
    setDrafts((d) => d?.map((x) => (x.tempId === id ? { ...x, ...patch, error: undefined } : x)) ?? null);

  const submitAll = async () => {
    if (!drafts?.length) return;
    const checked = drafts.map((d) => ({ ...d, error: validateNewTip(d) ?? undefined }));
    setDrafts(checked);
    if (checked.some((d) => d.error)) {
      toast.error("Some tips need fixing before you share");
      return;
    }
    setSubmitting(true);
    await submitTips(
      checked.map((d) => ({
        course: d.course,
        type: d.type,
        text: d.text,
        year: Number(year),
        semester: "Sem 5",
        anonymous,
        showBadge: !anonymous,
      })),
    );
    setSubmitting(false);
    invalidate();
    toast.success(`${checked.length} tips shared!`);
    onDone(checked.length);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="bulk">Paste your old notes</Label>
          <button
            type="button"
            className="text-sm font-semibold text-primary-ink hover:underline"
            onClick={() => setRaw(SAMPLE_PASTE)}
          >
            Try a sample
          </button>
        </div>
        <Textarea
          id="bulk"
          rows={9}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="font-mono text-sm"
          placeholder="Paste WhatsApp messages, Notion notes or a bullet list. We'll split it into separate tips you can review."
        />
        <Button onClick={process} disabled={processing || !raw.trim()} variant="ink">
          {processing ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
          {processing ? "Processing…" : "Process"}
        </Button>
      </div>

      {drafts && drafts.length > 0 && (
        <section aria-label="Tip preview" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold">Preview · {drafts.length} tips</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-year" className="text-sm">
                  Year
                </Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger id="bulk-year" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="bulk-anon" checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
                <Label htmlFor="bulk-anon">Post anonymously</Label>
              </div>
            </div>
          </div>

          <ol className="space-y-3">
            {drafts.map((d, i) => (
              <li key={d.tempId} className={cn("animate-rise rounded-2xl border bg-card p-4 shadow-soft", d.error && "border-destructive")}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-muted-foreground">Tip {i + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove tip ${i + 1}`}
                    onClick={() => setDrafts((all) => all?.filter((x) => x.tempId !== d.tempId) ?? null)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`${d.tempId}-course`} className="text-xs">
                      Course
                    </Label>
                    <CourseCombobox id={`${d.tempId}-course`} value={d.course} onChange={(v) => update(d.tempId, { course: v })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${d.tempId}-type`} className="text-xs">
                      Tip type
                    </Label>
                    <Select value={d.type} onValueChange={(v) => update(d.tempId, { type: v as TipType })}>
                      <SelectTrigger id={`${d.tempId}-type`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIP_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor={`${d.tempId}-text`} className="text-xs">
                      Tip text
                    </Label>
                    <CharCounter length={d.text.trim().length} />
                  </div>
                  <Textarea
                    id={`${d.tempId}-text`}
                    rows={3}
                    value={d.text}
                    maxLength={MAX_TIP_LENGTH}
                    onChange={(e) => update(d.tempId, { text: e.target.value })}
                  />
                </div>
                {d.error && (
                  <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {d.error}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <Button size="lg" onClick={submitAll} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden />}
            {submitting ? "Sharing…" : `Share ${drafts.length} tips`}
          </Button>
        </section>
      )}
    </div>
  );
}
