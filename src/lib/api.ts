/**
 * Data access layer. Every screen reads and writes through these functions.
 * Today they work against in-memory mock data; swap the bodies for Lovable Cloud
 * and AI calls later without touching the UI.
 */
import { buildAnswer, selectTips, splitBulkText } from "./answer-engine";
import { MOCK_COMPANIES, MOCK_TIPS, MOCK_UNANSWERED } from "./mock-data";
import {
  COURSES,
  MAX_TIP_LENGTH,
  MIN_TIP_LENGTH,
  PLACEMENTS_COURSE,
  type Answer,
  type AskFilters,
  type Company,
  type DraftTip,
  type NewTipInput,
  type ReportReason,
  type Tip,
  type TipCourse,
  type TipFilters,
  type UnansweredQuestion,
} from "./types";

// In-memory "database" (resets on page reload).
let tips: Tip[] = [...MOCK_TIPS];
let unanswered: UnansweredQuestion[] = [...MOCK_UNANSWERED];
const reports: { tipId: string; reason: ReportReason; details?: string | undefined }[] = [];
const feedback: Record<string, "up" | "down"> = {};
const upvoted = new Set<string>();
let seq = 1000;

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const nextId = (p: string) => `${p}${++seq}`;

export async function getTips(filters: TipFilters = {}): Promise<Tip[]> {
  await delay(400);
  const q = filters.search?.trim().toLowerCase();
  const list = tips.filter(
    (t) =>
      (!filters.course || t.course === filters.course) &&
      (!filters.professor || t.professor === filters.professor) &&
      (!filters.type || t.type === filters.type) &&
      (!filters.year || String(t.year) === filters.year) &&
      (!q ||
        `${t.text} ${t.course} ${t.professor ?? ""} ${t.company ?? ""}`.toLowerCase().includes(q)),
  );
  return list.sort((a, b) =>
    filters.sort === "recent"
      ? b.createdAt.localeCompare(a.createdAt)
      : b.upvotes - a.upvotes,
  );
}

export async function getStats() {
  await delay(250);
  const courseTips = tips.filter((t) => t.course !== PLACEMENTS_COURSE);
  const seniors = new Set(
    tips.map((t) => (t.author.anonymous ? `anon-${t.id}` : `${t.author.name}-${t.author.batch}`)),
  );
  return {
    tips: tips.length,
    courses: new Set(courseTips.map((t) => t.course)).size,
    seniors: seniors.size,
  };
}

export function getCourseOptions(): TipCourse[] {
  return [...COURSES, PLACEMENTS_COURSE];
}

export function getProfessorOptions(course?: string): string[] {
  return Array.from(
    new Set(
      tips
        .filter((t) => !course || t.course === course)
        .map((t) => t.professor)
        .filter((p): p is string => Boolean(p)),
    ),
  ).sort();
}

export function getYearOptions(): string[] {
  return Array.from(new Set(tips.map((t) => String(t.year)))).sort().reverse();
}

export function validateNewTip(input: Pick<NewTipInput, "course" | "text">): string | null {
  if (!input.course?.trim()) return "Please choose a course.";
  const len = input.text.trim().length;
  if (len < MIN_TIP_LENGTH) return `Tips need at least ${MIN_TIP_LENGTH} characters.`;
  if (len > MAX_TIP_LENGTH) return `Tips can be at most ${MAX_TIP_LENGTH} characters.`;
  return null;
}

export async function submitTip(input: NewTipInput): Promise<Tip> {
  const error = validateNewTip(input);
  if (error) throw new Error(error);
  await delay(600);
  const tip: Tip = {
    id: nextId("t"),
    course: input.course as TipCourse,
    professor: input.professor?.trim() || undefined,
    type: input.type,
    year: input.year,
    semester: input.semester,
    text: input.text.trim(),
    author: input.anonymous
      ? { anonymous: true, verified: false, showBadge: false }
      : { anonymous: false, name: "You", batch: 2026, branch: "CSE", verified: true, showBadge: input.showBadge },
    upvotes: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  tips = [tip, ...tips];
  return tip;
}

export async function submitTips(inputs: NewTipInput[]): Promise<Tip[]> {
  const created: Tip[] = [];
  for (const input of inputs) created.push(await submitTip(input));
  return created;
}

export async function processBulkPaste(raw: string): Promise<DraftTip[]> {
  await delay(900);
  return splitBulkText(raw, nextId("d"));
}

/** Toggles the current user's upvote and returns the new count. */
export async function upvoteTip(tipId: string): Promise<{ upvotes: number; upvoted: boolean }> {
  await delay(150);
  const tip = tips.find((t) => t.id === tipId);
  if (!tip) throw new Error("Tip not found");
  const was = upvoted.has(tipId);
  if (was) upvoted.delete(tipId);
  else upvoted.add(tipId);
  tip.upvotes += was ? -1 : 1;
  return { upvotes: tip.upvotes, upvoted: !was };
}

export function hasUpvoted(tipId: string) {
  return upvoted.has(tipId);
}

export async function reportTip(tipId: string, reason: ReportReason, details?: string | undefined) {
  await delay(400);
  reports.push({ tipId, reason, details });
  return { ok: true };
}

export async function askQuestion(
  question: string,
  filters: AskFilters = {},
): Promise<Answer | null> {
  await delay(1300);
  const picked = selectTips(question, tips, filters);
  if (picked.length === 0) {
    unanswered = [
      {
        id: nextId("q"),
        question,
        topic: filters.course || "General",
        askedAt: new Date().toISOString().slice(0, 10),
        askCount: 1,
      },
      ...unanswered,
    ];
    return null;
  }
  return buildAnswer(question, picked, nextId("a"));
}

export async function submitFeedback(answerId: string, value: "up" | "down") {
  await delay(150);
  feedback[answerId] = value;
  return { ok: true };
}

export async function getCompanies(): Promise<(Company & { tipCount: number })[]> {
  await delay(350);
  return MOCK_COMPANIES.map((c) => ({
    ...c,
    tipCount: tips.filter((t) => t.company === c.name).length,
  })).sort((a, b) => b.tipCount - a.tipCount);
}

export async function getCompany(slug: string): Promise<{ company: Company; tips: Tip[] } | null> {
  await delay(350);
  const company = MOCK_COMPANIES.find((c) => c.slug === slug);
  if (!company) return null;
  return {
    company,
    tips: tips
      .filter((t) => t.company === company.name)
      .sort((a, b) => b.upvotes - a.upvotes),
  };
}

export function findCompany(slug: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.slug === slug);
}

export async function getUnansweredQuestions(): Promise<UnansweredQuestion[]> {
  await delay(350);
  return [...unanswered].sort((a, b) => b.askedAt.localeCompare(a.askedAt));
}
