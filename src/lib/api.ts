/**
 * Data access layer. Every screen reads and writes through these functions.
 * Today they work against in-memory mock data; swap the bodies for Lovable Cloud
 * and AI calls later without touching the UI.
 */
import { buildAnswer, selectTips, splitBulkText } from "./answer-engine";
import { generateTipEmbedding } from "./embeddings";
import { generateAnswerWithGemini, isGeminiConfigured } from "./gemini";
import { MOCK_COMPANIES, MOCK_TIPS, MOCK_UNANSWERED } from "./mock-data";
import { supabase } from "./supabase";
import {
  COURSES,
  COURSE_CODE_MAP,
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
  type TipCategory,
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
  await delay(200);

  if (supabase) {
    try {
      let query = supabase.from("tips").select("*");
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.professor) query = query.eq("professor", filters.professor);
      if (filters.company) query = query.eq("company", filters.company);
      if (filters.course) {
        query = query.or(`course_name.eq.${filters.course},course_code.eq.${filters.course}`);
      }
      query = query.order("created_at", { ascending: filters.sort !== "recent" });

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbTips = data.map((row) => ({
          id: row.id,
          author_id: row.author_id,
          text: row.text,
          category: row.category,
          course_code: row.course_code ?? undefined,
          course_name: row.course_name ?? undefined,
          course: (row.course_name || row.course_code || (row.company ? PLACEMENTS_COURSE : "General")) as TipCourse,
          professor: row.professor ?? undefined,
          company: row.company ?? undefined,
          author_batch: row.author_batch ?? undefined,
          anonymous: Boolean(row.anonymous),
          embedding: row.embedding ?? undefined,
          created_at: row.created_at,
          createdAt: (row.created_at || "").slice(0, 10),
          type: row.company ? "Placements" : "Prep",
          year: parseInt((row.author_batch || "").replace(/\D/g, ""), 10) || 2026,
          semester: "Sem 5",
          author: row.anonymous
            ? { anonymous: true, verified: false, showBadge: false }
            : {
                anonymous: false,
                name: "Senior",
                batch: parseInt((row.author_batch || "").replace(/\D/g, ""), 10) || 2026,
                branch: "CSE",
                verified: true,
                showBadge: true,
              },
          upvotes: 0,
        }));
        for (const item of dbTips) {
          if (!tips.some((t) => t.id === item.id)) {
            tips.push(item);
          }
        }
        return dbTips;
      }
    } catch {
      // Fallback to in-memory tips
    }
  }

  const q = filters.search?.trim().toLowerCase();
  const list = tips.filter(
    (t) =>
      (!filters.category || t.category === filters.category) &&
      (!filters.course || t.course === filters.course || t.course_code === filters.course) &&
      (!filters.professor || t.professor === filters.professor) &&
      (!filters.company || t.company === filters.company) &&
      (!filters.type || t.type === filters.type) &&
      (!filters.year || String(t.year) === filters.year) &&
      (!q ||
        `${t.text} ${t.category} ${t.course} ${t.course_code ?? ""} ${t.professor ?? ""} ${t.company ?? ""}`
          .toLowerCase()
          .includes(q)),
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

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function validateNewTip(input: Partial<NewTipInput>): string | null {
  const category = input.category ?? "course";

  if (category === "course") {
    const hasCourse = Boolean(
      input.course?.trim() || input.course_name?.trim() || input.course_code?.trim(),
    );
    if (!hasCourse) return "Please choose a course.";
  } else if (category === "professor") {
    if (!input.professor?.trim()) return "Please enter the professor's name.";
  } else if (category === "company") {
    if (!input.company?.trim()) return "Please enter the company name.";
  }

  const len = (input.text ?? "").trim().length;
  if (len < MIN_TIP_LENGTH) return `Tips need at least ${MIN_TIP_LENGTH} characters.`;
  if (len > MAX_TIP_LENGTH) return `Tips can be at most ${MAX_TIP_LENGTH} characters.`;
  return null;
}

export async function submitTip(input: NewTipInput): Promise<Tip> {
  const error = validateNewTip(input);
  if (error) throw new Error(error);
  await delay(600);

  const category: TipCategory = input.category ?? (input.company ? "company" : input.professor ? "professor" : "course");
  const courseName = input.course_name?.trim() || input.course?.trim() || (category === "company" ? PLACEMENTS_COURSE : undefined);
  const courseCode = input.course_code?.trim() || (courseName ? (COURSE_CODE_MAP[courseName] ?? courseName) : undefined);
  const professor = input.professor?.trim() || undefined;
  const company = input.company?.trim() || undefined;
  const authorBatch = input.author_batch?.trim() || (input.year ? `${input.year} batch` : "2026 batch");
  const parsedBatchYear = parseInt(authorBatch.replace(/\D/g, ""), 10) || input.year || 2026;
  const authorId = generateUuid();
  const id = generateUuid();
  const now = new Date().toISOString();

  const embedding = generateTipEmbedding({
    text: input.text.trim(),
    category,
    course_code: courseCode,
    course_name: courseName,
    professor,
    company,
  });

  const tip: Tip = {
    id,
    author_id: authorId,
    category,
    course_code: courseCode,
    course_name: courseName,
    professor,
    company,
    author_batch: authorBatch,
    anonymous: Boolean(input.anonymous),
    embedding,
    created_at: now,

    // UI compatibility fields
    course: (courseName as TipCourse) || (category === "company" ? PLACEMENTS_COURSE : "General"),
    type: input.type ?? (category === "company" ? "Placements" : "Prep"),
    year: input.year ?? parsedBatchYear,
    semester: input.semester ?? "Sem 5",
    text: input.text.trim(),
    author: input.anonymous
      ? { anonymous: true, verified: false, showBadge: false, batch: parsedBatchYear }
      : {
          anonymous: false,
          name: "You",
          batch: parsedBatchYear,
          branch: "CSE",
          verified: true,
          showBadge: input.showBadge ?? true,
        },
    upvotes: 0,
    createdAt: now.slice(0, 10),
  };

  if (supabase) {
    try {
      const { error: insertError } = await supabase.from("tips").insert({
        id,
        author_id: authorId,
        text: tip.text,
        category: tip.category,
        course_code: tip.course_code ?? null,
        course_name: tip.course_name ?? null,
        professor: tip.professor ?? null,
        company: tip.company ?? null,
        author_batch: tip.author_batch ?? null,
        anonymous: tip.anonymous,
        embedding: tip.embedding ?? null,
        created_at: now,
      });
      if (insertError) {
        console.warn("Supabase insert error:", insertError.message);
      }
    } catch (e) {
      console.warn("Supabase insert exception:", e);
    }
  }

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
  const answerId = nextId("a");
  let picked: Tip[] = [];

  const mapDbRow = (row: Record<string, unknown>): Tip => {
    const rowBatch = typeof row["author_batch"] === "string" ? row["author_batch"] : undefined;
    const batchYear = parseInt((rowBatch || "").replace(/\D/g, ""), 10) || 2026;
    const courseCode = typeof row["course_code"] === "string" ? row["course_code"] : undefined;
    const courseName = typeof row["course_name"] === "string" ? row["course_name"] : undefined;
    const company = typeof row["company"] === "string" ? row["company"] : undefined;
    const professor = typeof row["professor"] === "string" ? row["professor"] : undefined;
    const isAnon = Boolean(row["anonymous"]);
    const createdAt = typeof row["created_at"] === "string" ? row["created_at"] : new Date().toISOString();

    return {
      id: String(row["id"]),
      author_id: typeof row["author_id"] === "string" ? row["author_id"] : undefined,
      text: String(row["text"]),
      category: (row["category"] as TipCategory) || "course",
      course_code: courseCode,
      course_name: courseName,
      course: (courseName || courseCode || (company ? PLACEMENTS_COURSE : "General")) as TipCourse,
      professor,
      company,
      author_batch: rowBatch,
      anonymous: isAnon,
      created_at: createdAt,
      createdAt: createdAt.slice(0, 10),
      type: company ? "Placements" : "Prep",
      year: batchYear,
      semester: "Sem 5",
      author: isAnon
        ? { anonymous: true, verified: false, showBadge: false }
        : {
            anonymous: false,
            name: "Senior",
            batch: batchYear,
            branch: "CSE",
            verified: true,
            showBadge: true,
          },
      upvotes: 0,
    };
  };

  // 1. Try semantic vector search in PostgreSQL with pgvector if connected
  if (supabase) {
    try {
      const queryEmbedding = generateTipEmbedding({ text: question });
      const { data, error } = await supabase.rpc("match_tips", {
        query_embedding: queryEmbedding,
        match_threshold: 0.15,
        match_count: 6,
        filter_category: filters.type === "Placements" ? "company" : null,
        filter_course: filters.course || null,
      });

      if (!error && data && data.length > 0) {
        picked = (data as Record<string, unknown>[]).map(mapDbRow);
      }
    } catch (e) {
      console.warn("Vector search error, falling back to database text query:", e);
    }

    // 2. Hybrid Search: If vector search had 0 matches, search Supabase table directly by keyword
    if (picked.length === 0) {
      try {
        const STOPWORDS_LOCAL = new Set([
          "what", "which", "when", "where", "who", "how", "does", "is", "are",
          "about", "tell", "any", "the", "and", "for", "with", "sir", "prof",
          "professor", "teacher", "give", "some", "tips", "info", "can", "you"
        ]);
        const cleanWords = question
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length >= 2 && !STOPWORDS_LOCAL.has(w));

        for (const word of cleanWords) {
          const { data: keywordData } = await supabase
            .from("tips")
            .select("*")
            .or(`text.ilike.%${word}%,professor.ilike.%${word}%,company.ilike.%${word}%,course_name.ilike.%${word}%,course_code.ilike.%${word}%`)
            .limit(6);

          if (keywordData && keywordData.length > 0) {
            const mapped = (keywordData as Record<string, unknown>[]).map(mapDbRow);
            for (const item of mapped) {
              if (!picked.some((p) => p.id === item.id)) {
                picked.push(item);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Keyword database search error:", e);
      }
    }

    // Sync any retrieved tips into memory pool
    for (const item of picked) {
      if (!tips.some((t) => t.id === item.id)) {
        tips.push(item);
      }
    }
  }

  // 3. Fallback to local keyword/filter engine if database had no matches or is offline
  if (picked.length === 0) {
    picked = selectTips(question, tips, filters);
  }

  // If still no tips exist on this topic, record as unanswered
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

  // 4. Synthesize answer with Google Gemini if configured
  if (isGeminiConfigured()) {
    try {
      const geminiAnswer = await generateAnswerWithGemini(question, picked, answerId);
      if (geminiAnswer) {
        return geminiAnswer;
      }
    } catch (e) {
      console.warn("Gemini synthesis error, falling back to rule-based engine:", e);
    }
  }

  // 5. Fallback to rule-based answer builder
  await delay(600);
  return buildAnswer(question, picked, answerId);
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
