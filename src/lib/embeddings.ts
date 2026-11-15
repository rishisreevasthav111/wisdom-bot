/**
 * Generates embeddings and similarity computations for tips.
 * When integrated with PostgreSQL + pgvector and an embedding model (like OpenAI text-embedding-3-small or Gemini),
 * the embedding vector (1536 floats) encodes the composite representation of:
 * - Tip advice text
 * - Category (e.g. 'course', 'professor', 'company', 'general')
 * - Course name and/or code
 * - Professor name
 * - Company name
 */

export const EMBEDDING_DIMENSION = 1536;

export interface TipEmbeddingPayload {
  text: string;
  category?: string | undefined;
  course_code?: string | undefined;
  course_name?: string | undefined;
  professor?: string | undefined;
  company?: string | undefined;
}

/**
 * Returns the standardized composite string used to generate the embedding.
 * This exact format can also be mirrored in PostgreSQL triggers or backend functions.
 */
export function getTipEmbeddingText(payload: TipEmbeddingPayload): string {
  const parts: string[] = [];

  if (payload.category) {
    parts.push(`Category: ${payload.category}`);
  }

  const course = payload.course_name || payload.course_code;
  if (course) {
    const code = payload.course_code && payload.course_name && payload.course_code !== payload.course_name
      ? ` (${payload.course_code})`
      : "";
    parts.push(`Course: ${course}${code}`);
  }

  if (payload.professor) {
    parts.push(`Professor: ${payload.professor}`);
  }

  if (payload.company) {
    parts.push(`Company: ${payload.company}`);
  }

  parts.push(`Tip: ${payload.text.trim()}`);

  return parts.join(" | ");
}

/**
 * Deterministic pseudo-random 32-bit hash function (FNV-1a / Murmur hybrid)
 * to seed deterministic float generation in client/mock mode.
 */
function hashString(str: string, seed = 0): number {
  let h = seed ^ 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 13;
  }
  return h >>> 0;
}

/**
 * Mulberry32 PRNG to generate high-quality pseudo-random floats given a seed.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a normalized 1536-dimensional float vector matching pgvector's vector(1536) format.
 * Deterministic based on the composite text of the tip.
 */
export function generateTipEmbedding(payload: TipEmbeddingPayload): number[] {
  const text = getTipEmbeddingText(payload);
  const seed = hashString(text, 1337);
  const prng = mulberry32(seed);

  const raw: number[] = new Array(EMBEDDING_DIMENSION);
  let sumSq = 0;

  // Box-Muller transform to generate standard normal variables N(0, 1)
  for (let i = 0; i < EMBEDDING_DIMENSION; i += 2) {
    const u1 = Math.max(prng(), 1e-7);
    const u2 = prng();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);

    raw[i] = z0;
    sumSq += z0 * z0;

    if (i + 1 < EMBEDDING_DIMENSION) {
      raw[i + 1] = z1;
      sumSq += z1 * z1;
    }
  }

  // Normalize to unit length (L2 norm = 1.0) so cosine distance <=> works cleanly
  const norm = Math.sqrt(sumSq) || 1;
  const vector = new Array<number>(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    // Round to 4 decimal places for compact storage and realistic display matching the screenshot
    vector[i] = Math.round((raw[i] / norm) * 10000) / 10000;
  }

  return vector;
}

/**
 * Computes cosine similarity between two float vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
