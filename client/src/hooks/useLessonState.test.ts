import { describe, expect, it } from "vitest";
import { normaliseSimplifiedMarkdown } from "./useLessonState";

describe("normaliseSimplifiedMarkdown", () => {
  it("keeps completed bold text while repairing a trailing streamed delimiter", () => {
    expect(normaliseSimplifiedMarkdown("Use ** short chunks ** while reading **")).toBe("Use **short chunks** while reading ");
  });

  it("converts stray asterisk list markers without damaging completed emphasis", () => {
    expect(normaliseSimplifiedMarkdown("* First point\n* **Important** idea")).toBe("- First point\n- **Important** idea");
  });
});

