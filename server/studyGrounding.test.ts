import { afterEach, describe, expect, it, vi } from "vitest";
import { formatStudyGrounding, retrieveCurrentStudySources } from "./studyGrounding";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("study grounding", () => {
  it("does not retrieve metadata for unrelated requests", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    await expect(retrieveCurrentStudySources("Hello Hikma")).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps scholarly metadata to safe citation fields", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{
      id: "https://openalex.org/W1", title: "Retrieval practice research", publication_year: 2026,
      doi: "https://doi.org/10.1000/example", authorships: [{ author: { display_name: "A. Researcher" } }],
      primary_location: { source: { display_name: "Learning Science Journal" } },
    }] }))) as unknown as typeof fetch;
    const sources = await retrieveCurrentStudySources("latest study tips for revision");
    expect(sources).toEqual([expect.objectContaining({ title: "Retrieval practice research", year: 2026, url: "https://doi.org/10.1000/example" })]);
    expect(formatStudyGrounding(sources)).toContain("untrusted reference data");
  });

  it("fails safely when the external metadata service is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    await expect(retrieveCurrentStudySources("study revision techniques")).resolves.toEqual([]);
  });
});
