import { describe, expect, it } from "vitest";
import { buildAnswer, formatYearRange, selectTips, splitBulkText } from "@/lib/answer-engine";
import { validateNewTip } from "@/lib/api";
import { MOCK_TIPS } from "@/lib/mock-data";

describe("Share a tip validation", () => {
  it("rejects a tip shorter than 50 characters", () => {
    expect(validateNewTip({ course: "DBMS", text: "a".repeat(49) })).not.toBeNull();
  });
  it("accepts a tip of exactly 50 characters", () => {
    expect(validateNewTip({ course: "DBMS", text: "a".repeat(50) })).toBeNull();
  });
  it("requires a course", () => {
    expect(validateNewTip({ course: "", text: "a".repeat(80) })).not.toBeNull();
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
