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
  id: string;
  course: TipCourse;
  professor?: string | undefined;
  type: TipType;
  /** Year the senior took the course / went through placements */
  year: number;
  semester: string;
  text: string;
  author: TipAuthor;
  upvotes: number;
  createdAt: string;
  company?: string | undefined;
  placementSection?: PlacementSection | undefined;
  /** Tips sharing a conflict group disagree with each other, split by stance. */
  conflict?: { group: string; stance: "a" | "b"; label: string } | undefined;
}

export interface TipFilters {
  search?: string | undefined;
  course?: string | undefined;
  professor?: string | undefined;
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
  course: string;
  professor?: string | undefined;
  type: TipType;
  year: number;
  semester: string;
  text: string;
  anonymous: boolean;
  showBadge: boolean;
}

export interface DraftTip {
  tempId: string;
  course: string;
  type: TipType;
  text: string;
}

export const REPORT_REASONS = ["Personal attack", "Spam", "Outdated", "Incorrect"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MIN_TIP_LENGTH = 50;
export const MAX_TIP_LENGTH = 1200;
