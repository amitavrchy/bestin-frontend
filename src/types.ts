export const VISEMES = ["A", "B", "C", "D", "E", "F", "G", "H", "X"] as const;
export type VisemeId = (typeof VISEMES)[number];

export function asViseme(value: string): VisemeId {
  return (VISEMES as readonly string[]).includes(value) ? (value as VisemeId) : "X";
}

export interface VisemeCue {
  start: number;
  end: number;
  viseme: VisemeId | string;
}

export interface Source {
  book_id: string;
  title: string;
  page: number | null;
  locator: string;
  excerpt: string;
}

export interface Book {
  id: string;
  title: string;
  filename: string;
  kind: string;
  pages: number;
  chunks: number;
  created_at: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: Source[];
  audio_base64?: string | null;
  audio_mime?: string | null;
  audio_url?: string | null;
  visemes: VisemeCue[];
  lipsync_backend?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  visemes?: VisemeCue[];
}
