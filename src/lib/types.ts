export const TIP_CATEGORIES = ["course", "professor", "company", "general"] as const;
export type TipCategory = (typeof TIP_CATEGORIES)[number];

export const TIP_TYPES = ["Prep", "Grading", "Placements", "Projects", "General"] as const;
export type TipType = (typeof TIP_TYPES)[number];

export const COURSES = [
  "Operating Systems",
  "DBMS",
  "Data Structures",
  "Computer Networks",
  "Machine Learning",
  "Software Engineering",
] as const;
export type Course = (typeof COURSES)[number];

export const COURSE_CODE_MAP: Record<string, string> = {
  "Operating Systems": "OS",
  DBMS: "DBMS",
  "Data Structures": "DSA",
  "Computer Networks": "CN",
  "Machine Learning": "ML",
  "Software Engineering": "SE",
};

/** Placement tips use this pseudo-course so they can sit alongside course tips. */
export const PLACEMENTS_COURSE = "Placements";
export type TipCourse = Course | typeof PLACEMENTS_COURSE;

export const PLACEMENT_SECTIONS = ["Rounds", "Prep Resources", "Interview Experiences"] as const;
export type PlacementSection = (typeof PLACEMENT_SECTIONS)[number];

export interface TipAuthor {
  anonymous: boolean;
  name?: string | undefined;
  /** Graduating batch, e.g. 2025 → "Class of 2025" */
  batch?: number | undefined;
  branch?: string | undefined;
  verified: boolean;
  /** When false, the verified badge is hidden even if the author is verified. */
  showBadge: boolean;
}

export interface Tip {
  /** UUID primary key */
  id: string;
  /** UUID of the author */
  author_id?: string | undefined;
  /** Primary category: course | professor | company | general */
  category: TipCategory;
  /** Short course code (e.g. 'OS', 'DBMS', 'CS301') */
  course_code?: string | undefined;
  /** Full course name */
  course_name?: string | undefined;
  /** Backwards compatibility for existing UI */
  course: TipCourse;
  /** Professor name if applicable */
  professor?: string | undefined;
  /** Company name if applicable */
  company?: string | undefined;
  /** Author batch string (e.g. '2023 batch') */
  author_batch?: string | undefined;
  /** Anonymity flag */
  anonymous: boolean;
  /** 1536-dimensional embedding vector */
  embedding?: number[] | undefined;
  /** ISO timestamp for database */
  created_at?: string | undefined;

  /** Legacy / UI display fields */
  type: TipType;
  /** Year the senior took the course / went through placements */
  year: number;
  semester: string;
  text: string;
  author: TipAuthor;
  upvotes: number;
  createdAt: string;
  placementSection?: PlacementSection | undefined;
  /** Tips sharing a conflict group disagree with each other, split by stance. */
  conflict?: { group: string; stance: "a" | "b"; label: string } | undefined;
}

export interface TipFilters {
  search?: string | undefined;
  category?: string | undefined;
  course?: string | undefined;
  professor?: string | undefined;
  company?: string | undefined;
  type?: string | undefined;
  year?: string | undefined;
  sort?: "helpful" | "recent" | undefined;
}

export interface Disagreement {
  topic: string;
  sideA: { label: string; tips: Tip[] };
  sideB: { label: string; tips: Tip[] };
}

export type Freshness = "Fresh" | "Recent" | "May be outdated";

export interface Answer {
  id: string;
  question: string;
  topic: string;
  intro: string;
  points: string[];
  tips: Tip[];
  yearRange: string;
  freshness: Freshness;
  disagreement?: Disagreement | undefined;
  model?: string | undefined;
}

export interface AskFilters {
  course?: string | undefined;
  professor?: string | undefined;
  type?: string | undefined;
}

export interface Company {
  slug: string;
  name: string;
  tagline: string;
  roles: string[];
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  topic: string;
  askedAt: string;
  askCount: number;
}

export interface NewTipInput {
  category: TipCategory;
  course?: string | undefined;
  course_code?: string | undefined;
  course_name?: string | undefined;
  professor?: string | undefined;
  company?: string | undefined;
  author_batch?: string | undefined;
  anonymous: boolean;
  text: string;
  showBadge?: boolean | undefined;
  type?: TipType | undefined;
  year?: number | undefined;
  semester?: string | undefined;
}

export interface DraftTip {
  tempId: string;
  category?: TipCategory | undefined;
  course?: string | undefined;
  course_code?: string | undefined;
  course_name?: string | undefined;
  professor?: string | undefined;
  company?: string | undefined;
  type: TipType;
  text: string;
}

export const REPORT_REASONS = ["Personal attack", "Spam", "Outdated", "Incorrect"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MIN_TIP_LENGTH = 50;
export const MAX_TIP_LENGTH = 1200;
