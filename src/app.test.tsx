// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Avatar } from "./components/Avatar";
import { visemeAt } from "./avatar/useLipSync";
import { api } from "./lib/api";
import { Stage } from "./components/Stage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
describe("viseme timeline", () => {
  const cues = [
    { start: 0, end: 0.5, value: "A" as const },
    { start: 0.5, end: 1, value: "D" as const },
  ];
  it("uses audio time and treats cue ends as exclusive", () => {
    expect(visemeAt(cues, 0)).toBe("A");
    expect(visemeAt(cues, 0.5)).toBe("D");
    expect(visemeAt(cues, 1)).toBe("X");
  });
  it("returns rest in gaps", () => expect(visemeAt(cues, 2)).toBe("X"));
});
it("sends the bearer token with requests", async () => {
  localStorage.setItem("bestin_token", "test-token");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await api("/api/books");
  expect(
    (fetchMock.mock.calls[0][1].headers as Headers).get("Authorization"),
  ).toBe("Bearer test-token");
});
it("renders an accessible avatar and scene", () => {
  render(<Stage background="garden" character="rose" expression="thinking" />);
  expect(screen.getByRole("img", { name: "Bestin, thinking" })).toBeTruthy();
});
it("renders a manually selected mouth", () => {
  render(<Avatar manual="D" />);
  expect(screen.getByRole("img", { name: "Bestin, idle" })).toBeTruthy();
});
