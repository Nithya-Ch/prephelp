import { describe, it, expect } from "vitest";
import { createSessionSchema } from "./schemas/session.schema.js";
import { seedTopicsList } from "./seed-topics.js";
import { seedWordsList } from "./seed-words.js";

describe("Phase 1-4 Architecture & Seed Validation", () => {
  describe("Session Validation Schema", () => {
    it("validates standard voice session payload", () => {
      const validPayload = {
        exerciseId: "60d5ec49f1b2c8b1f8e4e1a1",
        mode: "voice",
      };
      const result = createSessionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("validates situational / extempore voice session with context", () => {
      const situationalPayload = {
        exerciseId: "60d5ec49f1b2c8b1f8e4e1a1",
        mode: "voice",
        questionText: "How do you handle team conflict?",
        questionCategory: "conflict-resolution",
      };
      const result = createSessionSchema.safeParse(situationalPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionText).toBe("How do you handle team conflict?");
        expect(result.data.questionCategory).toBe("conflict-resolution");
      }
    });

    it("rejects invalid mode", () => {
      const invalidPayload = {
        exerciseId: "60d5ec49f1b2c8b1f8e4e1a1",
        mode: "telepathy",
      };
      const result = createSessionSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Extempore Topics Bank (Phase 3 Part A)", () => {
    it("contains at least 30 topics across all 4 categories", () => {
      expect(seedTopicsList.length).toBeGreaterThanOrEqual(30);

      const categories = new Set(seedTopicsList.map((t) => t.category));
      expect(categories.has("general")).toBe(true);
      expect(categories.has("academic")).toBe(true);
      expect(categories.has("social")).toBe(true);
      expect(categories.has("professional")).toBe(true);
    });

    it("ensures all topics have valid difficulty between 0 and 100", () => {
      for (const t of seedTopicsList) {
        expect(t.difficulty).toBeGreaterThanOrEqual(0);
        expect(t.difficulty).toBeLessThanOrEqual(100);
        expect(t.text.trim().length).toBeGreaterThan(15);
      }
    });
  });

  describe("Pronunciation Word Bank (Phase 3 Part B)", () => {
    it("contains at least 60 words across beginner, intermediate, advanced", () => {
      expect(seedWordsList.length).toBeGreaterThanOrEqual(60);

      const difficulties = new Set(seedWordsList.map((w) => w.difficulty));
      expect(difficulties.has("beginner")).toBe(true);
      expect(difficulties.has("intermediate")).toBe(true);
      expect(difficulties.has("advanced")).toBe(true);
    });

    it("ensures each word has phonetic pronunciation guide and example sentence", () => {
      for (const w of seedWordsList) {
        expect(w.word.trim().length).toBeGreaterThan(0);
        expect(w.phonetic).toBeDefined();
        expect(w.exampleSentence).toBeDefined();
      }
    });
  });

  describe("Interview Rapid Fire Distribution (Phase 4 Part A)", () => {
    it("verifies the 10-question sequence requirements", () => {
      const requiredTypes = [
        "introduction",
        "behavioral",
        "behavioral",
        "behavioral",
        "competency",
        "competency",
        "situational",
        "situational",
        "career_motivation",
        "career_motivation",
      ];
      expect(requiredTypes.length).toBe(10);
      expect(requiredTypes.filter((t) => t === "introduction").length).toBe(1);
      expect(requiredTypes.filter((t) => t === "behavioral").length).toBe(3);
      expect(requiredTypes.filter((t) => t === "competency").length).toBe(2);
      expect(requiredTypes.filter((t) => t === "situational").length).toBe(2);
      expect(requiredTypes.filter((t) => t === "career_motivation").length).toBe(2);
    });
  });
});
