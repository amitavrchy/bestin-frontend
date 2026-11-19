import type { AskResponse, Book } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export function apiBase(): string {
  return API_BASE.replace(/\/$/, "");
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || "Request failed";
  }
}

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${apiBase()}/books`);
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { books: Book[] };
  return data.books;
}

export async function uploadBook(file: File): Promise<Book> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${apiBase()}/books`, { method: "POST", body });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as Book;
}

export async function askQuestion(opts: {
  question?: string;
  audio?: Blob;
  bookId?: string | null;
}): Promise<AskResponse> {
  const body = new FormData();
  if (opts.question && opts.question.trim()) {
    body.append("question", opts.question.trim());
  }
  if (opts.bookId) {
    body.append("book_id", opts.bookId);
  }
  if (opts.audio) {
    const name = opts.audio.type.includes("mp4") ? "question.mp4" : "question.webm";
    body.append("audio", opts.audio, name);
  }
  const response = await fetch(`${apiBase()}/ask`, { method: "POST", body });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AskResponse;
}
