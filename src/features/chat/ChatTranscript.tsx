import type { FormEvent } from "react";
import { Mic, Send } from "lucide-react";
import type { Book, Message, Speech } from "../../lib/types";

type Props = {
  messages: Message[]; book?: Book; busy: boolean; captions: boolean;
  speech: Speech | null; speechMessage: number | null; playing: boolean; time: number;
  error: string; recording: boolean; text: string;
  setText: (text: string) => void; toggleRecording: () => Promise<void>; ask: (question: string) => Promise<void>;
};
export function ChatTranscript({ messages, book, busy, captions, speech, speechMessage, playing, time, error, recording, text, setText, toggleRecording, ask }: Props) {
  return (
        <div className="transcript">
          <div className="transcript-header">
            <span className="online-dot" /> BESTIN IS HERE TO HELP{" "}
            <span>✳</span>
          </div>
          <div className="messages">
            {!messages.length && !busy && (
              <div className="chat-welcome">
                <div className="welcome-icon">✳</div>
                <h2>Let’s get into it.</h2>
                <p>
                  Ask me anything about{" "}
                  <strong>{book?.title || "this book"}</strong>. I’ll find the
                  answers in its pages.
                </p>
                <div className="suggestions">
                  {(book?.suggested_questions?.length
                    ? book.suggested_questions
                    : [
                        "What is this book about?",
                        "What are the key ideas?",
                        "What should I remember?",
                      ]
                  ).map((q) => (
                    <button key={q} onClick={() => void ask(q)}>
                      {q} ↗
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div className={`message ${m.role}`} key={m.id}>
                <div className="message-label">
                  {m.role === "assistant" ? "✳  BESTIN" : "YOU"}
                </div>
                <div className="bubble">
                  {captions || m.role === "user" ? (
                    m.role === "assistant" &&
                    m.id === speechMessage &&
                    speech?.words?.length &&
                    playing ? (
                      <>
                        {speech.words.map((w, j) => (
                          <span
                            className={
                              time >= w.start && time < w.end
                                ? "word-active"
                                : ""
                            }
                            key={j}
                          >
                            {w.word}{" "}
                          </span>
                        ))}
                      </>
                    ) : (
                      m.content
                    )
                  ) : (
                    "Captions are off."
                  )}
                </div>
                {m.citations?.length > 0 && (
                  <div className="citations">
                    {m.citations.map((c, j) => (
                      <details key={`${c.chunk_id}-${j}`}>
                        <summary>
                          Source {j + 1}
                          {c.page ? ` · p. ${c.page}` : ""}
                        </summary>
                        <p>
                          {c.chapter && <strong>{c.chapter}: </strong>}
                          {c.text}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="message assistant">
                <div className="message-label">✳ BESTIN</div>
                <div className="bubble">
                  Looking through the pages<span className="dots">...</span>
                </div>
              </div>
            )}
          </div>
          <form
            className="composer"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void ask(text);
            }}
          >
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="composer-input">
              <button
                type="button"
                className={recording ? "recording" : ""}
                onClick={() => void toggleRecording()}
                aria-label={recording ? "Stop recording" : "Record question"}
              >
                <Mic size={20} />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  recording ? "Listening…" : "Ask a question about this book…"
                }
                aria-label="Your question"
              />
              <button
                className="send"
                disabled={busy || !text.trim()}
                aria-label="Send question"
              >
                <Send size={18} />
              </button>
            </div>
            <small>
              Bestin answers from your book. Check sources for context.
            </small>
          </form>
        </div>
  );
}
