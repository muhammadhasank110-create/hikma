import { describe, expect, it } from "vitest";
import { interpretVoiceCommand, type VoiceSubject } from "./useVoiceCommands";

const subjects: VoiceSubject[] = [
  { id: 1, curriculumId: 1, code: "MATH-IGCSE", titleEn: "Mathematics", titleAr: "الرياضيات" },
  { id: 2, curriculumId: 1, code: "ENG-IGCSE", titleEn: "English Language", titleAr: "اللغة الإنجليزية" },
  { id: 3, curriculumId: 1, code: "SCI-IGCSE", titleEn: "Science (Double)", titleAr: "العلوم (مزدوج)" },
];

describe("interpretVoiceCommand", () => {
  it.each([
    ["Go home", "go_home"],
    ["take me home", "go_home"],
    ["Show my progress", "navigate"],
    ["How am I doing?", "navigate"],
    ["Open practice", "navigate"],
    ["Open the AI tutor", "open_tutor"],
    ["Open my profile", "navigate"],
    ["Read aloud", "read_aloud"],
    ["Next section", "next_section"],
    ["Previous section", "prev_section"],
    ["Stop reading", "stop_speech"],
    ["Focus mode", "focus_mode"],
  ])("maps supported English command %s", (phrase, expectedType) => {
    const result = interpretVoiceCommand(phrase, subjects);
    expect(result.kind).toBe("action");
    expect(result.action?.type).toBe(expectedType);
  });

  it.each([
    ["افتح الرئيسية", "go_home"],
    ["افتح التقدّم", "navigate"],
    ["افتح التدريب", "navigate"],
    ["افتح المعلّم الذكي", "open_tutor"],
    ["القسم التالي", "next_section"],
    ["أوقف", "stop_speech"],
  ])("maps supported Arabic command %s", (phrase, expectedType) => {
    const result = interpretVoiceCommand(phrase, subjects, "ar");
    expect(result.kind).toBe("action");
    expect(result.action?.type).toBe(expectedType);
  });

  it.each([
    ["Open maths", "/subjects/1/topics/1"],
    ["Open mathematics", "/subjects/1/topics/1"],
    ["Open English", "/subjects/1/topics/2"],
    ["Open science", "/subjects/1/topics/3"],
    ["افتح الرياضيات", "/subjects/1/topics/1"],
    ["افتح العلوم", "/subjects/1/topics/3"],
  ])("maps only a live subject command %s", (phrase, expectedPath) => {
    const result = interpretVoiceCommand(phrase, subjects, phrase.includes("افتح") ? "ar" : "en");
    expect(result.kind).toBe("action");
    expect(result.action).toEqual({ type: "navigate", path: expectedPath });
  });

  it("does not invent an Arabic subject when the interface is Arabic", () => {
    const result = interpretVoiceCommand("افتح العربية", subjects, "ar");
    expect(result.kind).toBe("unsupported");
    expect(result.feedback).toContain("غير متاحة");
  });

  it("routes a genuine question to the existing tutor path", () => {
    expect(interpretVoiceCommand("What is photosynthesis?", subjects).kind).toBe("ask_tutor");
  });
});
