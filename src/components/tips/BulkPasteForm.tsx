import { useState } from "react";
import { Loader2, Trash2, Wand2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { CourseCombobox } from "@/components/common/CourseCombobox";
import { processBulkPaste, submitTips, validateNewTip } from "@/lib/api";
import {
  COURSE_CODE_MAP,
  MAX_TIP_LENGTH,
  MIN_TIP_LENGTH,
  TIP_CATEGORIES,
  type DraftTip,
  type TipCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { BATCH_OPTIONS } from "./TipForm";

const SAMPLE_PASTE = `[12/03/24, 9:41 PM] Rohit: For OS with Iyer ma'am, solve all the scheduling PYQs twice. Every midsem has a Gantt chart numerical.
[12/03/24, 9:43 PM] Rohit: DBMS lab tests are timed. Practise joins and GROUP BY on LeetCode SQL 50 before the lab exam.
[12/03/24, 9:47 PM] Ananya: For placements start the Amazon tagged LeetCode list by June, and prepare STAR stories for the interview.`;

type DraftWithError = DraftTip & { error?: string | undefined };

function CharCounter({ length }: { length: number }) {
  const tooShort = length < MIN_TIP_LENGTH;
  return (
    <span className={cn("text-xs tabular-nums", tooShort ? "text-muted-foreground" : "text-success")}>
      {length}/{MAX_TIP_LENGTH}
      {tooShort && ` · ${MIN_TIP_LENGTH - length} more needed`}
    </span>
  );
}

interface BulkPasteFormProps {
  onSuccess: (count: number) => void;
  className?: string | undefined;
}

export function BulkPasteForm({ onSuccess, className }: BulkPasteFormProps) {
  const [raw, setRaw] = useState("");
  const [processing, setProcessing] = useState(false);
  const [drafts, setDrafts] = useState<DraftWithError[] | null>(null);
  const [authorBatch, setAuthorBatch] = useState("2023 batch");
  const [anonymous, setAnonymous] = useState(true);
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
    const checked = drafts.map((d) => ({
      ...d,
      error:
        validateNewTip({
          category: d.category ?? "course",
          course: d.course,
          course_name: d.course,
          company: d.company,
          professor: d.professor,
          text: d.text,
        }) ?? undefined,
    }));
    setDrafts(checked);
    if (checked.some((d) => d.error)) {
      toast.error("Some tips need fixing before you share");
      return;
    }
    setSubmitting(true);
    await submitTips(
      checked.map((d) => ({
        category: d.category ?? "course",
        course: d.course,
        course_name: d.course,
        course_code: d.course_code ?? (d.course ? COURSE_CODE_MAP[d.course] : undefined),
        professor: d.professor,
        company: d.company,
        text: d.text,
        author_batch: authorBatch,
        anonymous,
        showBadge: !anonymous,
      })),
    );
    setSubmitting(false);
    toast.success(`${checked.length} tips submitted!`, {
      description: "Your advice will start helping juniors right away.",
    });
    onSuccess(checked.length);
  };

  return (
    <div className={cn("space-y-5", className)}>
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
          rows={8}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="font-mono text-sm"
          placeholder="Paste WhatsApp messages, Notion notes or a bullet list. We'll split it into separate tips you can review."
        />
        <Button onClick={process} disabled={processing || !raw.trim()} variant="ink">
          {processing ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
          {processing ? "Processing…" : "Process notes"}
        </Button>
      </div>

      {drafts && drafts.length > 0 && (
        <section aria-label="Tip preview" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold">Preview · {drafts.length} tips</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-batch" className="text-sm">
                  Batch
                </Label>
                <Select value={authorBatch} onValueChange={setAuthorBatch}>
                  <SelectTrigger id="bulk-batch" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BATCH_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
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
              <li
                key={d.tempId}
                className={cn("animate-rise rounded-2xl border bg-card p-4 shadow-soft", d.error && "border-destructive")}
              >
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
                    <Label htmlFor={`${d.tempId}-category`} className="text-xs">
                      Category
                    </Label>
                    <Select
                      value={d.category ?? "course"}
                      onValueChange={(v) => update(d.tempId, { category: v as TipCategory })}
                    >
                      <SelectTrigger id={`${d.tempId}-category`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIP_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`${d.tempId}-context`} className="text-xs">
                      {d.category === "company" ? "Company" : "Course"}
                    </Label>
                    {d.category === "company" ? (
                      <Input
                        id={`${d.tempId}-context`}
                        value={d.company ?? ""}
                        placeholder="e.g. Amazon, Google"
                        onChange={(e) => update(d.tempId, { company: e.target.value })}
                      />
                    ) : (
                      <CourseCombobox
                        id={`${d.tempId}-context`}
                        value={d.course}
                        onChange={(v) => update(d.tempId, { course: v, course_name: v })}
                      />
                    )}
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
            {submitting ? "Submitting tips…" : `Share ${drafts.length} tips`}
          </Button>
        </section>
      )}
    </div>
  );
}
