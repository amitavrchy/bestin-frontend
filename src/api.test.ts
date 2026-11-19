// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { api, ApiError, json } from "./lib/api";
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});
it("attaches the bearer token and JSON content type", async () => {
  localStorage.setItem("bestin_token", "example-token");
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await api("/api/example", { method: "POST", body: json({ test: true }) });
  const headers = fetchMock.mock.calls[0][1].headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer example-token");
  expect(headers.get("Content-Type")).toBe("application/json");
});
it("maps backend errors to ApiError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "stt_unavailable" }), {
        status: 503,
      }),
    ),
  );
  await expect(api("/api/stt")).rejects.toMatchObject({
    message: "stt_unavailable",
    status: 503,
  });
});
it("maps network failures to a helpful error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(api("/api/books")).rejects.toBeInstanceOf(ApiError);
});
it("handles an empty 204 response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  await expect(
    api("/api/books/1", { method: "DELETE" }),
  ).resolves.toBeUndefined();
});
