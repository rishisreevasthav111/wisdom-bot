import { describe, expect, it } from "vitest";
import { buildAnswer, formatYearRange, selectTips, splitBulkText } from "@/lib/answer-engine";
import { validateNewTip } from "@/lib/api";
import { generateTipEmbedding } from "@/lib/embeddings";
import { MOCK_TIPS } from "@/lib/mock-data";

describe("Share a tip validation", () => {
  it("rejects a tip shorter than 50 characters", () => {
    expect(validateNewTip({ course: "DBMS", text: "a".repeat(49) })).not.toBeNull();
  });
  it("accepts a tip of exactly 50 characters", () => {
    expect(validateNewTip({ course: "DBMS", text: "a".repeat(50) })).toBeNull();
  });
  it("requires a course when category is course", () => {
    expect(validateNewTip({ category: "course", course: "", text: "a".repeat(80) })).not.toBeNull();
  });
  it("requires a professor when category is professor", () => {
    expect(validateNewTip({ category: "professor", professor: "", text: "a".repeat(80) })).not.toBeNull();
    expect(validateNewTip({ category: "professor", professor: "Prof. Iyer", text: "a".repeat(80) })).toBeNull();
  });
  it("requires a company when category is company", () => {
    expect(validateNewTip({ category: "company", company: "", text: "a".repeat(80) })).not.toBeNull();
    expect(validateNewTip({ category: "company", company: "Amazon", text: "a".repeat(80) })).toBeNull();
  });
});

describe("pgvector embedding generation", () => {
  it("generates a 1536-dimensional normalized vector", () => {
    const vector = generateTipEmbedding({
      category: "course",
      course_code: "OS",
      text: "Do all the xv6 labs, they're half the exam",
    });
    expect(vector.length).toBe(1536);
    expect(vector.every((val) => typeof val === "number" && !isNaN(val))).toBe(true);
  });

  it("stores row metadata according to schema", () => {
    const tip = MOCK_TIPS[0];
    expect(tip.category).toBeDefined();
    expect(tip.author_batch).toBeDefined();
    expect(typeof tip.anonymous).toBe("boolean");
    expect(tip.embedding?.length).toBe(1536);
  });
});

describe("askQuestion mock", () => {
  it("answers an OS question only from Operating Systems tips", () => {
    const tips = selectTips("How do I prepare for the OS course?", MOCK_TIPS);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.every((t) => t.course === "Operating Systems")).toBe(true);
  });

  it("shows a disagreement for conflicting OS tips", () => {
    const tips = selectTips("How do I prepare for the OS course?", MOCK_TIPS);
    const answer = buildAnswer("q", tips, "a1");
    expect(answer.disagreement?.sideA.tips.map((t) => t.id)).toEqual(["t1"]);
    expect(answer.disagreement?.sideB.tips.map((t) => t.id)).toEqual(["t2"]);
  });

  it("returns no tips for a topic nobody has covered", () => {
    expect(selectTips("Any tips for Theory of Computation?", MOCK_TIPS)).toEqual([]);
  });

  it("retrieves professor tips when asked by first name or title", () => {
    const rameshTip: Tip = {
      id: "ramesh-1",
      category: "general",
      professor: "Prof Ramesh Jhalllu",
      text: "Ramesh sir is a good teacher, he has expertise in teaching toc.",
      course: "General",
      type: "Prep",
      year: 2023,
      semester: "Sem 5",
      author: { anonymous: true, verified: false, showBadge: false },
      upvotes: 0,
      createdAt: "2026-11-15",
    };
    const pool = [rameshTip, ...MOCK_TIPS];

    const match1 = selectTips("who is ramesh", pool);
    expect(match1.map((t) => t.id)).toContain("ramesh-1");

    const match2 = selectTips("tell me about prof ramesh", pool);
    expect(match2.map((t) => t.id)).toContain("ramesh-1");

    const answer = buildAnswer("who is ramesh", match1, "ans-1");
    expect(answer.topic).toBe("Prof Ramesh Jhalllu");
    expect(answer.intro).toContain("Prof Ramesh Jhalllu");
  });

  it("formats the year range like 2023-25", () => {
    expect(formatYearRange([2023, 2025, 2024])).toBe("2023-25");
  });
});

describe("bulk paste splitter", () => {
  it("splits WhatsApp messages into separate tips", () => {
    const raw = `[12/03/24, 9:41 PM] Rohit: For OS solve all the scheduling PYQs twice before the midsem.
[12/03/24, 9:43 PM] Rohit: DBMS lab tests are timed so practise SQL joins every week.`;
    const drafts = splitBulkText(raw);
    expect(drafts.map((d) => d.course)).toEqual(["Operating Systems", "DBMS"]);
  });
});
