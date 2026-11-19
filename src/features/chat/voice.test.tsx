// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { VOICE_READY_POLL_MS } from "../../lib/voiceReady";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "../../lib/state";
import { ChatPage } from "./ChatPage";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({
  api: apiMock,
  json: JSON.stringify,
  ApiError: class extends Error {
    status = 0;
  },
}));
class Recorder {
  static isTypeSupported() {
    return true;
  }
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"]) });
    this.onstop?.();
  }
}
function setup() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SettingsProvider>
        <MemoryRouter initialEntries={["/books/1"]}>
          <Routes>
            <Route path="/books/:id" element={<ChatPage />} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}
function mockApi(health: unknown = { status: "ok", ai: "ok" }) {
  apiMock.mockImplementation((path: string, options?: RequestInit) => {
    if (path === "/health") {
      return health instanceof Error
        ? Promise.reject(health)
        : Promise.resolve(health);
    }
    if (path === "/api/conversations" && options?.method === "POST")
      return Promise.resolve({ id: 7 });
    if (path.endsWith("/ask-voice"))
      return Promise.resolve({
        user_message: { id: 1 },
        assistant_message: { id: 2 },
        speech: null,
        transcript: "Hi",
      });
    if (path.startsWith("/api/conversations?")) return Promise.resolve([]);
    if (path.startsWith("/api/conversations/"))
      return Promise.resolve({ messages: [] });
    return Promise.resolve({ title: "Book", suggested_questions: [] });
  });
}
beforeEach(() => {
  localStorage.setItem("bestin_settings", JSON.stringify({ mute: true }));
  apiMock.mockReset();
  mockApi();
  vi.stubGlobal("MediaRecorder", Recorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it("shows the microphone and uploads a finished recording", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  await screen.findByText("Send / Stop");
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now + 1000);
  fireEvent.click(screen.getByText("Send / Stop"));
  await waitFor(() =>
    expect(
      apiMock.mock.calls.some(
        (call) =>
          call[0] === "/api/conversations/7/ask-voice" &&
          call[1].body instanceof FormData,
      ),
    ).toBe(true),
  );
  vi.restoreAllMocks();
});
it("discards a cancelled recording", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  fireEvent.click(await screen.findByText("Cancel"));
  expect(
    apiMock.mock.calls.some((call) => String(call[0]).endsWith("/ask-voice")),
  ).toBe(false);
});
it("explains blocked microphone permissions", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
    new DOMException("blocked", "NotAllowedError"),
  );
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Microphone access was blocked",
  );
});
it("starts recording when the backend health check is ok", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  expect(await screen.findByText("Send / Stop")).toBeTruthy();
  expect(apiMock.mock.calls.some((call) => call[0] === "/health")).toBe(true);
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("shows a connection popup instead of recording when health fails", async () => {
  mockApi(new Error("offline"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("Please wait for server connection");
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Your question")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("closes the popup and starts recording once the server reconnects", async () => {
  vi.useFakeTimers();
  let healthCalls = 0;
  apiMock.mockImplementation((path: string, options?: RequestInit) => {
    if (path === "/health") {
      healthCalls += 1;
      return healthCalls === 1
        ? Promise.resolve({ status: "ok", ai: "unreachable" })
        : Promise.resolve({ status: "ok", ai: "ok" });
    }
    if (path === "/api/conversations" && options?.method === "POST")
      return Promise.resolve({ id: 7 });
    if (path.endsWith("/ask-voice"))
      return Promise.resolve({
        user_message: { id: 1 },
        assistant_message: { id: 2 },
        speech: null,
        transcript: "Hi",
      });
    if (path.startsWith("/api/conversations?")) return Promise.resolve([]);
    if (path.startsWith("/api/conversations/"))
      return Promise.resolve({ messages: [] });
    return Promise.resolve({ title: "Book", suggested_questions: [] });
  });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  await act(async () => {
    await Promise.resolve();
  });
  const dialog = screen.getByRole("dialog");
  expect(dialog.textContent).toContain("Please wait for server connection");
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(VOICE_READY_POLL_MS);
  });
  expect(screen.getByText("Send / Stop")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  expect(healthCalls).toBe(2);
});

it("stops polling when the waiting popup is closed", async () => {
  vi.useFakeTimers();
  mockApi(new Error("offline"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Ask by voice" }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.queryByRole("dialog")).toBeNull();
  mockApi({ status: "ok", ai: "ok" });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(VOICE_READY_POLL_MS * 2);
  });
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(screen.queryByText("Send / Stop")).toBeNull();
});
