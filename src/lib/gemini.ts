import type { Answer, Disagreement, Tip } from "./types";
import { formatYearRange, freshnessFor } from "./answer-engine";

/**
 * Returns the configured Gemini API key from environment variables.
 * Checks server process.env, Vite import.meta.env, and VITE_ prefixed keys.
 */
export function getGeminiApiKey(): string {
  if (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  if (metaEnv) {
    return metaEnv["GEMINI_API_KEY"] || metaEnv["VITE_GEMINI_API_KEY"] || "";
  }
  return "";
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

interface GeminiAnswerPayload {
  intro: string;
  topic?: string | undefined;
  points: string[];
  disagreement?: {
    topic: string;
    sideA: string;
    sideB: string;
  } | null | undefined;
}

/**
 * Calls Google Gemini (gemini-1.5-flash) to synthesize an answer based strictly
 * on the retrieved senior tips from PostgreSQL pgvector.
 */
export async function generateAnswerWithGemini(
  question: string,
  sourceTips: Tip[],
  id: string,
): Promise<Answer | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || sourceTips.length === 0) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const formattedTips = sourceTips
    .map(
      (t, i) =>
        `[Tip ${i + 1}] Category: ${t.category} | Course: ${t.course_name ?? t.course_code ?? t.course} | Professor: ${t.professor ?? "N/A"} | Company: ${t.company ?? "N/A"} | Advice: "${t.text}"`,
    )
    .join("\n\n");

  const prompt = `
You are "Seniors' Wisdom", an AI advisor for college students.
A junior student asked:
"${question}"

Here are real, verified tips shared by seniors from the database:
${formattedTips}

Instructions:
1. Answer the junior's question using ONLY the provided senior tips.
2. Return a valid JSON object matching this schema:
{
  "topic": "Short title for the course, company or topic (e.g. Operating Systems, Amazon, etc.)",
  "intro": "A friendly, direct 1-2 sentence summary answering the question based on what seniors shared.",
  "points": [
    "Specific actionable tip 1 from seniors",
    "Specific actionable tip 2 from seniors",
    "Specific actionable tip 3 from seniors"
  ],
  "disagreement": {
    "topic": "What seniors disagree on (if any, e.g. Textbook vs Slides)",
    "sideA": "One perspective",
    "sideB": "The opposing perspective"
  } // OR null if there is no conflict between tips
}
3. Keep points concrete: mention PYQs, labs, chapters, interview rounds, or exam patterns mentioned by seniors.
4. Do not invent details not present in the tips.
`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "You are Seniors' Wisdom AI. Synthesize advice strictly from the provided senior tips in JSON format.",
            },
          ],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      console.warn(
        `Gemini API error (${res.status} ${res.statusText}):`,
        errJson.error?.message || "Check your GEMINI_API_KEY",
      );
      return null;
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) return null;

    const parsed = JSON.parse(textResponse) as GeminiAnswerPayload;
    const years = sourceTips.map((t) => t.year).filter(Boolean);

    let disagreement: Disagreement | undefined;
    if (parsed.disagreement && parsed.disagreement.sideA && parsed.disagreement.sideB) {
      disagreement = {
        topic: parsed.disagreement.topic || `${sourceTips[0]?.course ?? "Topic"} viewpoints`,
        sideA: {
          label: parsed.disagreement.sideA,
          tips: sourceTips.slice(0, Math.ceil(sourceTips.length / 2)),
        },
        sideB: {
          label: parsed.disagreement.sideB,
          tips: sourceTips.slice(Math.ceil(sourceTips.length / 2)),
        },
      };
    }

    return {
      id,
      question,
      topic: parsed.topic || sourceTips[0]?.course_name || sourceTips[0]?.course || "Senior Advice",
      intro: parsed.intro,
      points: parsed.points || [],
      tips: sourceTips,
      yearRange: formatYearRange(years),
      freshness: freshnessFor(years),
      disagreement,
      model: "gemini-1.5-flash",
    };
  } catch (err) {
    console.warn("Error calling Gemini API:", err);
    return null;
  }
}
