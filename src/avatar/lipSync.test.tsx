// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLipSync, visemeAt } from "./useLipSync";
import { VISEMES, type Viseme } from "../types";
import { Avatar } from "../components/Avatar";
import { render, screen } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const cues: Viseme[] = VISEMES.map((value, i) => ({
  start: i,
  end: i + 0.8,
  value,
}));
describe("viseme timeline", () => {
  it.each(VISEMES)("finds %s at its cue time", (value) => {
    const cue = cues.find((c) => c.value === value)!;
    expect(visemeAt(cues, cue.start + 0.1)).toBe(value);
  });
  it("returns rest before a cue and in gaps", () => {
    expect(visemeAt(cues, -1)).toBe("X");
    expect(visemeAt(cues, 0.9)).toBe("X");
  });
  it("excludes the cue end", () => expect(visemeAt(cues, 0.8)).toBe("X"));
  it("uses audio position after pause, resume and seek", () => {
    let callback: FrameRequestCallback = () => {};
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const audio = document.createElement("audio");
    let paused = false;
    Object.defineProperty(audio, "paused", { get: () => paused });
    const { result } = renderHook(() => useLipSync(audio, cues));
    expect(result.current).toBe("A");
    act(() => {
      audio.currentTime = 3.2;
      callback(0);
    });
    expect(result.current).toBe("D");
    act(() => {
      paused = true;
      callback(0);
    });
    expect(result.current).toBe("X");
    act(() => {
      paused = false;
      audio.currentTime = 5.2;
      callback(0);
    });
    expect(result.current).toBe("F");
  });
});
describe("avatar shapes", () => {
  it.each(VISEMES)("renders %s", (shape) => {
    render(<Avatar manual={shape} />);
    expect(screen.getByRole("img", { name: "Bestin, idle" })).toBeTruthy();
  });
  it("renders the owl character", () => {
    render(<Avatar character="owl" manual="D" />);
    expect(screen.getByRole("img", { name: "Owl-sage, idle" })).toBeTruthy();
  });
});
