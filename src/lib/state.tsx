import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, json } from "./api";
import type { User } from "./types";
import { AuthContext, SettingsContext, type Settings } from "./contexts";
type AuthResult = { access_token: string; user: User };
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(
    !!localStorage.getItem("bestin_token"),
  );
  useEffect(() => {
    const token = localStorage.getItem("bestin_token");
    if (token)
      api<User>("/api/auth/me")
        .then(setUser)
        .catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 401 && localStorage.getItem("bestin_token") === token)
            localStorage.removeItem("bestin_token");
        })
        .finally(() => setLoading(false));
  }, []);
  async function signIn(email: string, password: string, name?: string) {
    const result = await api<AuthResult>(
      `/api/auth/${name === undefined ? "login" : "register"}`,
      {
        method: "POST",
        body: json(
          name === undefined ? { email, password } : { email, password, name },
        ),
      },
    );
    queryClient.clear();
    localStorage.setItem("bestin_token", result.access_token);
    setUser(result.user);
  }
  function signOut() {
    localStorage.removeItem("bestin_token");
    queryClient.clear();
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
const defaults: Settings = {
  voice: "en-US-AriaNeural",
  mute: false,
  autoplay: true,
  style: "concise",
  character: "sage",
  background: "library",
  theme: "light",
  captions: true,
};
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem("bestin_settings") || "{}"),
      };
    } catch {
      return defaults;
    }
  });
  useEffect(() => {
    localStorage.setItem("bestin_settings", JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);
  return (
    <SettingsContext.Provider
      value={{ settings, update: (v) => setSettings((s) => ({ ...s, ...v })) }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

