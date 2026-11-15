/**
 * Pure, synchronous mock "retrieval + answer" logic.
 * Replace with the AI backend later; api.ts is the only caller.
 */
import {
  COURSES,
  COURSE_CODE_MAP,
  TIP_TYPES,
  type Answer,
  type AskFilters,
  type Course,
  type DraftTip,
  type Freshness,
  type Tip,
  type TipType,
} from "./types";

const COURSE_ALIASES: Record<Course, string[]> = {
  "Operating Systems": ["operating system", "operating systems", " os ", "os course", "xv6", "galvin", "scheduling", "deadlock", "paging"],
  DBMS: ["dbms", "database", "databases", "sql", "normalization", "normalisation", "er diagram"],
  "Data Structures": ["data structure", "data structures", "dsa", " ds ", "linked list", "bst", "heap", "avl"],
  "Computer Networks": ["computer network", "computer networks", "networks", "networking", " cn ", "subnetting", "wireshark", "tcp"],
  "Machine Learning": ["machine learning", " ml ", "ml course", "regression", "kaggle", "svm"],
  "Software Engineering": ["software engineering", " se ", "uml", "sdlc", "agile", "team project"],
};

const TYPE_KEYWORDS: Record<TipType, string[]> = {
  Prep: ["prepare", "prep", "study", "revise", "book", "resources", "read", "exam prep"],
  Grading: ["grade", "grading", "marks", "exam", "midsem", "endsem", "end-sem", "attendance", "score", "pass"],
  Placements: ["placement", "placements", "interview", "job", "resume", "internship", "intern", "offer"],
  Projects: ["project", "projects", "assignment", "lab", "mini project"],
  General: [],
};

const STOPWORDS = new Set(
  "what which when where who how does do did the and for with this that from your about have should into than then them they their there these those just like will would could also more most very really course courses prof professor seniors senior tips tip any some best".split(
    " ",
  ),
);

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9+#\s-]/g, " ").replace(/\s+/g, " ")} `;

export function detectCourses(text: string): Course[] {
  const t = norm(text);
  return COURSES.filter((c) => COURSE_ALIASES[c].some((a) => t.includes(a)));
}

export function detectTypes(text: string): TipType[] {
  const t = norm(text);
  return TIP_TYPES.filter((type) => TYPE_KEYWORDS[type].some((k) => t.includes(` ${k}`)));
}

function detectProfessors(text: string, tips: Tip[]): string[] {
  const t = norm(text);
  const profs = Array.from(new Set(tips.map((x) => x.professor).filter(Boolean))) as string[];
  return profs.filter((p) => {
    const parts = p
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((part) => part.length >= 3 && !["prof", "dr", "mr", "mrs", "sir"].includes(part));
    return parts.some((part) => t.includes(` ${part} `));
  });
}

function detectCompanies(text: string, tips: Tip[]): string[] {
  const t = norm(text);
  const companies = Array.from(new Set(tips.map((x) => x.company).filter(Boolean))) as string[];
  return companies.filter((c) => t.includes(` ${c.toLowerCase()} `));
}

function keywordScore(question: string, tip: Tip): number {
  const words = norm(question)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  const hay = norm(`${tip.text} ${tip.course} ${tip.professor ?? ""} ${tip.company ?? ""}`);
  return words.reduce((n, w) => (hay.includes(` ${w}`) ? n + 1 : n), 0);
}

export function formatYearRange(years: number[]): string {
  if (years.length === 0) return "";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}-${String(max).slice(2)}`;
}

export function freshnessFor(years: number[], currentYear = 2025): Freshness {
  const latest = Math.max(...years);
  if (latest >= currentYear) return "Fresh";
  if (latest >= currentYear - 1) return "Recent";
  return "May be outdated";
}

function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  return (m?.[1] ?? text).trim();
}

/** Picks the tips relevant to a question. Returns [] when nothing relevant exists. */
export function selectTips(question: string, allTips: Tip[], filters: AskFilters = {}): Tip[] {
  let pool = allTips.filter(
    (t) =>
      (!filters.course || t.course === filters.course) &&
      (!filters.professor || t.professor === filters.professor) &&
      (!filters.type || t.type === filters.type),
  );

  const courses = detectCourses(question);
  const companies = detectCompanies(question, pool);
  const profs = detectProfessors(question, pool);
  const types = detectTypes(question);

  let matched: Tip[];
  if (companies.length) {
    matched = pool.filter((t) => t.company && companies.includes(t.company));
  } else if (courses.length || profs.length) {
    matched = pool.filter(
      (t) =>
        (courses.length === 0 || courses.includes(t.course as Course)) &&
        (profs.length === 0 || (t.professor && profs.includes(t.professor))),
    );
  } else if (types.includes("Placements")) {
    matched = pool.filter((t) => t.type === "Placements");
  } else {
    const questionWords = norm(question)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    const minThreshold = questionWords.length <= 1 ? 1 : 2;
    matched = pool.filter((t) => keywordScore(question, t) >= minThreshold);
  }
  pool = matched;
  if (pool.length === 0) return [];

  const ranked = [...pool].sort((a, b) => {
    const ta = types.includes(a.type) ? 1 : 0;
    const tb = types.includes(b.type) ? 1 : 0;
    if (ta !== tb) return tb - ta;
    const ka = keywordScore(question, a);
    const kb = keywordScore(question, b);
    if (ka !== kb) return kb - ka;
    return b.upvotes - a.upvotes;
  });

  const picked = ranked.slice(0, 6);
  // Always bring in the other side of any disagreement we touched.
  const groups = new Set(picked.map((t) => t.conflict?.group).filter(Boolean));
  for (const t of pool) {
    if (t.conflict && groups.has(t.conflict.group) && !picked.includes(t)) picked.push(t);
  }
  return picked;
}

export function buildAnswer(question: string, tips: Tip[], id: string): Answer {
  const topics = Array.from(
    new Set(
      tips.map((t) => t.professor || t.company || t.course_name || t.course || "General"),
    ),
  );
  const topic = topics.slice(0, 2).join(" & ");
  const years = tips.map((t) => t.year);

  const conflictTips = tips.filter((t) => t.conflict);
  let disagreement: Answer["disagreement"];
  const group = conflictTips[0]?.conflict?.group;
  if (group) {
    const a = conflictTips.filter((t) => t.conflict?.group === group && t.conflict.stance === "a");
    const b = conflictTips.filter((t) => t.conflict?.group === group && t.conflict.stance === "b");
    const a0 = a[0];
    const b0 = b[0];
    if (a0 && b0) {
      disagreement = {
        topic: `${a0.course}${a0.professor ? ` with ${a0.professor}` : ""}`,
        sideA: { label: a0.conflict?.label ?? "One view", tips: a },
        sideB: { label: b0.conflict?.label ?? "Another view", tips: b },
      };
    }
  }

  const consensus = tips.filter((t) => !t.conflict).sort((x, y) => y.upvotes - x.upvotes);
  const points = consensus.slice(0, 5).map((t) => firstSentence(t.text));
  const n = tips.length;

  return {
    id,
    question,
    topic,
    intro:
      points.length > 0
        ? `Here's what ${n} senior${n === 1 ? "" : "s"} shared about ${topic}. The most upvoted advice comes first.`
        : `Seniors have shared ${n} tip${n === 1 ? "" : "s"} on ${topic}, but they don't fully agree. Here are both sides.`,
    points,
    tips,
    yearRange: formatYearRange(years),
    freshness: freshnessFor(years),
    disagreement,
  };
}

/** Mock splitter for pasted WhatsApp / Notion notes. */
export function splitBulkText(raw: string, idPrefix = "d"): DraftTip[] {
  const cleaned = raw
    .replace(/\r/g, "")
    // WhatsApp exports: "[12/03/24, 9:41 PM] Name: message" or "12/03/24, 9:41 pm - Name: message"
    .replace(/^\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s?[ap]m)?\]?\s*-?\s*[^:\n]{1,30}:\s*/gim, "\n");
  const chunks = cleaned
    .split(/\n\s*\n|\n(?=\s*(?:[-*•]|\d+[.)])\s+)/)
    .map((c) => c.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/\s+/g, " ").trim())
    .filter((c) => c.length >= 20);

  return chunks.map((text, i) => {
    const course = detectCourses(text)[0] ?? "";
    const type = detectTypes(text)[0] ?? "General";
    const category = type === "Placements" ? "company" : course ? "course" : "general";
    return {
      tempId: `${idPrefix}${i + 1}`,
      category,
      course,
      course_name: course || undefined,
      course_code: course ? COURSE_CODE_MAP[course] : undefined,
      type,
      text,
    };
  });
}
