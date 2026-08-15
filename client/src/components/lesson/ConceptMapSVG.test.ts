import { describe, expect, it } from "vitest";
import { chooseVisualizationType } from "./ConceptMapSVG";

describe("chooseVisualizationType", () => {
  it("keeps mathematics programmatic instead of requesting generic artwork", () => {
    expect(chooseVisualizationType("Mathematics", [{ type: "concept" }])).toBe("mathematics");
  });

  it("uses educational structures appropriate to science, history, geography, and English", () => {
    expect(chooseVisualizationType("Science", [{ type: "concept" }])).toBe("process");
    expect(chooseVisualizationType("History", [{ type: "concept" }])).toBe("timeline");
    expect(chooseVisualizationType("Geography", [{ type: "concept" }])).toBe("geography");
    expect(chooseVisualizationType("English", [{ type: "concept" }])).toBe("literature");
  });

  it("recognizes an authored process graph even when subject context is unavailable", () => {
    expect(chooseVisualizationType("", [{ type: "input" }, { type: "process" }, { type: "output" }])).toBe("process");
  });
});
