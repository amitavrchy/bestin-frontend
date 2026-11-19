import { createContext, useContext } from "react";
import type { User } from "./types";
export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
};
export const AuthContext = createContext<AuthContextType>(null!);
export type Settings = {
  voice: string;
  mute: boolean;
  autoplay: boolean;
  style: "concise" | "detailed";
  character: string;
  background: string;
  theme: "light" | "dark";
  captions: boolean;
};
export const SettingsContext = createContext<{
  settings: Settings;
  update: (v: Partial<Settings>) => void;
}>(null!);

export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);
