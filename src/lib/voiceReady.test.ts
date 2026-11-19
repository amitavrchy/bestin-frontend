// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { checkVoiceReady, waitForVoiceRetry } from "./voiceReady";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("treats a healthy AI service as ready for voice", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", ai: "ok" }), {
        status: 200,
      }),
    ),
  );
  await expect(checkVoiceReady()).resolves.toBe(true);
});

it("treats an unreachable AI service as not ready for voice", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", ai: "unreachable" }), {
        status: 200,
      }),
    ),
  );
  await expect(checkVoiceReady()).resolves.toBe(false);
});

it("treats a slow health check as not ready for voice", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise((_, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            ),
          );
        }),
    ),
  );
  await expect(checkVoiceReady(40)).resolves.toBe(false);
});

it("stops waiting when the retry delay is aborted", async () => {
  const controller = new AbortController();
  const pending = waitForVoiceRetry(50, controller.signal);
  controller.abort();
  await expect(pending).resolves.toBe(false);
});
