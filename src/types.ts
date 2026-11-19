export const VISEMES = ["A", "B", "C", "D", "E", "F", "G", "H", "X"] as const;
export type VisemeId = (typeof VISEMES)[number];
export interface Viseme {
  start: number;
  end: number;
  value: VisemeId;
}
export interface WordTime {
  word: string;
  start: number;
  end: number;
}
export interface Citation {
  chunk_id: string;
  text: string;
  page: number | null;
  chapter: string | null;
  score: number;
}
export interface Speech {
  audio_base64: string;
  mime: string;
  duration: number;
  visemes: Viseme[];
  words: WordTime[];
  voice: string;
  lipsync_backend: string;
}
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at: string;
}
export interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  language: string | null;
  status: "uploaded" | "queued" | "processing" | "ready" | "failed";
  progress: number;
  chunks: number;
  pages: number | null;
  error: string | null;
  is_published: boolean;
  has_cover: boolean;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  suggested_questions: string[];
}
export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  provider: string | null;
  created_at: string;
}
export interface Conversation {
  id: number;
  book_id: number;
  book_title: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: Message[];
}
export interface Voice {
  id: string;
  name: string;
  gender: string;
  locale: string;
  provider: string;
}
