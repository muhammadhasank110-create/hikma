import { describe, expect, it } from "vitest";
import { getInteractiveAncestor, leavesInteractiveControl } from "./useSpokenLabels";

type StubElement = {
  tagName: string;
  getAttribute: (name: string) => string | null;
  parentElement: StubElement | null;
};

function element(tagName: string, attributes: Record<string, string> = {}, parentElement: StubElement | null = null): StubElement {
  return {
    tagName: tagName.toUpperCase(),
    getAttribute: (name) => attributes[name] ?? null,
    parentElement,
  };
}

describe("spoken-label hover target resolution", () => {
  it("resolves a nested icon to its interactive button", () => {
    const button = element("button");
    const icon = element("svg", {}, button);
    expect(getInteractiveAncestor(icon as unknown as EventTarget)).toBe(button);
  });

  it("does not treat movement between children of one control as a control exit", () => {
    const button = element("button");
    const icon = element("svg", {}, button);
    const label = element("span", {}, button);
    expect(leavesInteractiveControl(icon as unknown as EventTarget, label as unknown as EventTarget)).toBe(false);
  });

  it("stops only when the pointer leaves the interactive control", () => {
    const button = element("button");
    const icon = element("svg", {}, button);
    expect(leavesInteractiveControl(icon as unknown as EventTarget, null)).toBe(true);
  });
});
