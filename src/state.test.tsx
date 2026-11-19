// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { AuthProvider, SettingsProvider } from "./lib/state";
import { useSettings } from "./lib/contexts";
import { Guard } from "./pages/Common";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
function Preference() {
  const { settings, update } = useSettings();
  return (
    <button onClick={() => update({ theme: "dark" })}>{settings.theme}</button>
  );
}
it("persists settings and restores them on remount", async () => {
  const first = render(
    <SettingsProvider>
      <Preference />
    </SettingsProvider>,
  );
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("bestin_settings")!).theme).toBe(
      "dark",
    ),
  );
  first.unmount();
  render(
    <SettingsProvider>
      <Preference />
    </SettingsProvider>,
  );
  expect(screen.getByRole("button").textContent).toBe("dark");
});
function RoutesUnderTest() {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={["/private"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Sign in required</p>} />
            <Route path="/" element={<p>Library</p>} />
            <Route element={<Guard admin />}>
              <Route path="/private" element={<p>Admin page</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
it("redirects anonymous visitors to sign in", () => {
  render(<RoutesUnderTest />);
  expect(screen.getByText("Sign in required")).toBeTruthy();
});
it("redirects a non-admin away from admin routes", async () => {
  localStorage.setItem("bestin_token", "token");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "Reader", role: "user" }), {
        status: 200,
      }),
    ),
  );
  render(<RoutesUnderTest />);
  expect(await screen.findByText("Library")).toBeTruthy();
});
it("admits administrators to admin routes", async () => {
  localStorage.setItem("bestin_token", "token");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "Admin", role: "admin" }), {
        status: 200,
      }),
    ),
  );
  render(<RoutesUnderTest />);
  expect(await screen.findByText("Admin page")).toBeTruthy();
});
