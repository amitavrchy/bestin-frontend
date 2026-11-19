import { useEffect, useRef, useState } from "react";
import { askQuestion, fetchBooks, uploadBook } from "./api";
import { Avatar } from "./components/Avatar";
import { BookUpload } from "./components/BookUpload";
import { ChatPanel } from "./components/ChatPanel";
import type { Book, ChatMessage, VisemeCue } from "./types";
import { asViseme } from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function decodeAudio(base64: string, mime: string): HTMLAudioElement {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: mime || "audio/mpeg" }));
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  return audio;
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visemes, setVisemes] = useState<VisemeCue[]>([]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void fetchBooks()
      .then((list) => {
        setBooks(list);
        setSelectedBookId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {
        // Backend may not be up yet; the next upload or ask will surface a clearer error.
      });
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const book = await uploadBook(file);
      setBooks((current) => [book, ...current.filter((item) => item.id !== book.id)]);
      setSelectedBookId(book.id);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(payload: { question?: string; audio?: Blob }) {
    setBusy(true);
    setError(null);
    if (payload.question) {
      setMessages((current) => [
        ...current,
        { id: newId(), role: "user", text: payload.question as string },
      ]);
    } else if (payload.audio) {
      setMessages((current) => [
        ...current,
        { id: newId(), role: "user", text: "Listening…" },
      ]);
    }
    try {
      const result = await askQuestion({
        question: payload.question,
        audio: payload.audio,
        bookId: selectedBookId,
      });
      const cues = (result.visemes ?? []).map((cue) => ({
        ...cue,
        viseme: asViseme(String(cue.viseme)),
      }));
      setMessages((current) => {
        const next = [...current];
        if (payload.audio) {
          const lastUser = [...next].reverse().find((item) => item.role === "user");
          if (lastUser) lastUser.text = result.question;
        }
        next.push({
          id: newId(),
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          visemes: cues,
        });
        return next;
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (result.audio_base64) {
        const nextAudio = decodeAudio(result.audio_base64, result.audio_mime || "audio/mpeg");
        audioRef.current = nextAudio;
        setAudio(nextAudio);
        setVisemes(cues);
        void nextAudio.play().catch(() => {
          setError("The answer is ready, but the browser blocked autoplay. Press play in the page if needed.");
        });
      } else {
        setAudio(null);
        setVisemes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get an answer.");
      if (payload.audio) {
        setMessages((current) => current.filter((item) => item.text !== "Listening…"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Illustrated voice RAG</p>
          <h1>Bestin</h1>
        </div>
        <p className="lede">
          Ask a book out loud. Bestin answers from the text, then speaks with a lip-synced 2D avatar.
        </p>
      </header>

      <main className="layout">
        <BookUpload
          books={books}
          selectedBookId={selectedBookId}
          busy={uploading}
          onSelect={setSelectedBookId}
          onUpload={handleUpload}
        />

        <section className="stage-panel">
          <Avatar visemes={visemes} audio={audio} />
        </section>

        <ChatPanel
          messages={messages}
          busy={busy || uploading}
          disabled={books.length === 0}
          error={error}
          onAsk={handleAsk}
        />
      </main>
    </div>
  );
}
