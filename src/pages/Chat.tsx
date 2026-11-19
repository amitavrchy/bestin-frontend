import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mic,
  Send,
  Settings2,
  Square,
  Volume2,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { api, ApiError, json } from "../api";
import { Stage } from "../components/Stage";
import { useSettings } from "../state";
import type { Book, Conversation, Message, Speech } from "../types";
import { SettingsForm } from "./Common";
type Recognition = {
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
export function ChatPage() {
  const { id } = useParams();
  const bookId = Number(id);
  const { settings } = useSettings();
  const client = useQueryClient();
  const [conversation, setConversation] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [speechMessage, setSpeechMessage] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [quick, setQuick] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const audioUrl = useRef<string | null>(null);
  const greeted = useRef(false);
  const speechRequest = useRef(0);
  const { data: book } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => api<Book>(`/api/books/${bookId}`),
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", bookId],
    queryFn: () => api<Conversation[]>(`/api/conversations?book_id=${bookId}`),
  });
  const { data: current } = useQuery({
    queryKey: ["conversation", conversation],
    queryFn: () => api<Conversation>(`/api/conversations/${conversation}`),
    enabled: conversation !== null,
  });
  useEffect(
    () => () => {
      audio?.pause();
    },
    [audio],
  );
  useEffect(() => {
    if (audio) audio.muted = settings.mute;
  }, [audio, settings.mute]);
  useEffect(
    () => () => {
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      recognitionRef.current?.stop();
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );
  function playSpeech(s: Speech, auto = true, messageId: number | null = null) {
    audio?.pause();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    const bytes = Uint8Array.from(atob(s.audio_base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: s.mime }));
    audioUrl.current = url;
    const a = new Audio(url);
    a.muted = settings.mute;
    a.ontimeupdate = () => setTime(a.currentTime);
    a.onplay = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    setSpeech(s);
    setSpeechMessage(messageId);
    setTime(0);
    setAudio(a);
    if (auto && settings.autoplay && !settings.mute)
      void a.play().catch(() => setError("Press play to hear the answer."));
  }
  useEffect(() => {
    if (book && !greeted.current) {
      greeted.current = true;
      const request = ++speechRequest.current;
      if (settings.autoplay && !settings.mute)
        api<Speech>("/api/tts", {
          method: "POST",
          body: json({
            text: `Hello! I'm Bestin. What would you like to explore in ${book.title}?`,
            voice: settings.voice,
          }),
        })
          .then((s) => {
            if (speechRequest.current === request) playSpeech(s);
          })
          .catch(() => {});
    }
  }, [book]);
  async function ask(question: string) {
    if (!question.trim() || busy) return;
    speechRequest.current += 1;
    audio?.pause();
    setText("");
    setError("");
    setBusy(true);
    try {
      let cid = conversation;
      if (!cid) {
        const c = await api<Conversation>("/api/conversations", {
          method: "POST",
          body: json({ book_id: bookId }),
        });
        cid = c.id;
        setConversation(cid);
      }
      const result = await api<{
        user_message: Message;
        assistant_message: Message;
        speech: Speech | null;
      }>(`/api/conversations/${cid}/ask`, {
        method: "POST",
        body: json({
          question,
          speak: !settings.mute,
          voice: settings.voice,
          style: settings.style,
        }),
      });
      await client.invalidateQueries({ queryKey: ["conversation", cid] });
      await client.invalidateQueries({ queryKey: ["conversations", bookId] });
      if (result.speech)
        playSpeech(result.speech, true, result.assistant_message.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not ask your question");
      setText(question);
    } finally {
      setBusy(false);
    }
  }
  function browserRecognition() {
    const Constructor =
      (
        window as unknown as {
          SpeechRecognition?: new () => Recognition;
          webkitSpeechRecognition?: new () => Recognition;
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => Recognition })
        .webkitSpeechRecognition;
    if (!Constructor) {
      setError(
        "Speech recognition is unavailable in this browser. Please type your question.",
      );
      return;
    }
    const recognition = new Constructor();
    recognitionRef.current = recognition;
    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript);
    };
    recognition.onerror = () =>
      setError("Could not recognize speech. Please try typing.");
    recognition.onend = () => {
      recognitionRef.current = null;
      setRecording(false);
    };
    setRecording(true);
    recognition.start();
  }
  async function toggleRecording() {
    if (recording) {
      if (recorder.current) recorder.current.stop();
      else recognitionRef.current?.stop();
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      browserRecognition();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      recorder.current = r;
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        recorder.current = null;
        const form = new FormData();
        form.append(
          "file",
          new Blob(chunks, { type: r.mimeType || "audio/webm" }),
          "recording.webm",
        );
        api<{ text: string }>("/api/stt", { method: "POST", body: form })
          .then((result) => setText(result.text))
          .catch((e) => {
            if (
              e instanceof ApiError &&
              e.status === 503 &&
              e.message === "stt_unavailable"
            )
              browserRecognition();
            else
              setError(e instanceof Error ? e.message : "Transcription failed");
          });
      };
      r.start();
      setRecording(true);
    } catch {
      browserRecognition();
    }
  }
  async function removeConversation(cid: number) {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api(`/api/conversations/${cid}`, { method: "DELETE" });
      if (conversation === cid) setConversation(null);
      void client.invalidateQueries({ queryKey: ["conversations", bookId] });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete conversation",
      );
    }
  }
  const messages = current?.messages || [];
  return (
    <div className="chat-page">
      <div className="chat-top">
        <Link to="/" className="back">
          <ArrowLeft size={17} /> Library
        </Link>
        <div>
          <strong>{book?.title || "Your book"}</strong>
          <small>{book?.author || "A conversation with Bestin"}</small>
        </div>
        <button
          className="icon-button"
          aria-label="Quick settings"
          onClick={() => setQuick(!quick)}
        >
          <Settings2 size={19} />
        </button>
        {quick && (
          <div className="popover">
            <h3>Quick settings</h3>
            <SettingsForm />
          </div>
        )}
      </div>
      <div className="chat-layout">
        <div className="chat-stage">
          <Stage
            background={settings.background}
            character={settings.character}
            audio={audio}
            visemes={speech?.visemes}
            expression={
              recording
                ? "listening"
                : busy
                  ? "thinking"
                  : playing
                    ? "speaking"
                    : "idle"
            }
          />
          <div className="playback">
            <button
              onClick={() => {
                if (audio) {
                  audio.currentTime = 0;
                  void audio.play();
                }
              }}
              disabled={!audio}
              aria-label="Replay"
            >
              <RotateCcw size={17} />
            </button>
            <button
              onClick={() => {
                if (audio) {
                  if (audio.paused) void audio.play();
                  else audio.pause();
                }
              }}
              disabled={!audio}
            >
              {playing ? (
                <>
                  <Square size={15} /> Pause
                </>
              ) : (
                <>
                  <Volume2 size={17} /> Play audio
                </>
              )}
            </button>
            <button
              onClick={() => {
                audio?.pause();
                if (audio) audio.currentTime = 0;
              }}
              disabled={!audio}
            >
              Stop
            </button>
          </div>
          <div className="history">
            <div className="section-heading">
              <h3>Conversations</h3>
              <button
                onClick={() => setConversation(null)}
                aria-label="New conversation"
              >
                <Plus size={17} />
              </button>
            </div>
            {conversations.map((c) => (
              <div
                className={`history-row ${conversation === c.id ? "selected" : ""}`}
                key={c.id}
              >
                <button onClick={() => setConversation(c.id)}>
                  {c.title || "New conversation"}
                </button>
                <button
                  aria-label="Delete conversation"
                  onClick={() => removeConversation(c.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
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
                  {settings.captions || m.role === "user" ? (
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
      </div>
    </div>
  );
}
