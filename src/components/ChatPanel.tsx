import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import type { ChatMessage } from "../types";

type ChatPanelProps = {
  messages: ChatMessage[];
  busy: boolean;
  disabled: boolean;
  error: string | null;
  onAsk: (payload: { question?: string; audio?: Blob }) => Promise<void>;
};

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((type) => MediaRecorder.isTypeSupported(type));
}

export function ChatPanel({ messages, busy, disabled, error, onAsk }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const pointerActive = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function submitText(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || busy || disabled) return;
    setDraft("");
    await onAsk({ question });
  }

  async function startRecording() {
    if (busy || disabled || recording) return;
    setRecError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecError("This browser cannot record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (blob.size > 0) {
          void onAsk({ audio: blob });
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecError("Microphone permission was denied.");
      setRecording(false);
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    pointerActive.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    void startRecording();
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!pointerActive.current) return;
    pointerActive.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stopRecording();
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <h2>Ask the book</h2>
        <p>Type a question, or hold the mic button to speak.</p>
      </div>

      <div className="message-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="empty-hint">
            {disabled
              ? "Upload a book to start the conversation."
              : "Try “What is this book about?” or ask about a chapter."}
          </p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`bubble bubble-${message.role}`}>
              <p>{message.text}</p>
              {message.sources && message.sources.length > 0 ? (
                <ul className="sources">
                  {message.sources.map((source, index) => (
                    <li key={`${message.id}-${index}`}>
                      <strong>{source.locator || source.title}</strong>
                      <span>{source.excerpt}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
        {busy ? <p className="typing-hint">Thinking…</p> : null}
      </div>

      {(error || recError) && <p className="error-text">{error || recError}</p>}

      <form className="composer" onSubmit={submitText}>
        <input
          type="text"
          value={draft}
          placeholder={disabled ? "Upload a book first" : "Ask a question about the book"}
          onChange={(event) => setDraft(event.target.value)}
          disabled={busy || disabled}
        />
        <button type="submit" className="btn primary" disabled={busy || disabled || !draft.trim()}>
          Ask
        </button>
        <button
          type="button"
          className={`btn mic${recording ? " is-recording" : ""}`}
          disabled={busy || disabled}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label={recording ? "Release to send" : "Hold to talk"}
          title="Hold to talk"
        >
          {recording ? "Release" : "Mic"}
        </button>
      </form>
    </section>
  );
}
