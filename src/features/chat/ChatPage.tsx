import { ChatTranscript } from "./ChatTranscript";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings2,
  Square,
  Volume2,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { api, ApiError, json } from "../../lib/api";
import {
  checkVoiceReady,
  VOICE_READY_POLL_MS,
  VOICE_READY_TIMEOUT_MS,
  waitForVoiceRetry,
} from "../../lib/voiceReady";
import { Stage } from "../../components/Stage";
import { VoiceStatusDialog } from "./VoiceStatusDialog";
import { useSettings } from "../../lib/contexts";
import type { Book, Conversation, Message, Speech } from "../../lib/types";
import { SettingsForm } from "../../pages/Common";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [speechMessage, setSpeechMessage] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [greetingHappy, setGreetingHappy] = useState(false);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [time, setTime] = useState(0);
  const [quick, setQuick] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const cancelled = useRef(false);
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<number[]>([]);
  const [voiceGate, setVoiceGate] = useState<"closed" | "waiting">("closed");
  const voiceGateRequest = useRef(0);
  const voiceGateAbort = useRef<AbortController | null>(null);
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
    if (audioRef.current) audioRef.current.muted = settings.mute;
  }, [audio, settings.mute]);
  useEffect(
    () => () => {
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      if (greetingTimer.current) clearTimeout(greetingTimer.current);
      cancelled.current = true;
      voiceGateRequest.current += 1;
      voiceGateAbort.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );
  const playSpeech = useCallback(
    (s: Speech, auto = true, messageId: number | null = null) => {
      audio?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      const bytes = Uint8Array.from(atob(s.audio_base64), (c) =>
        c.charCodeAt(0),
      );
      const url = URL.createObjectURL(new Blob([bytes], { type: s.mime }));
      audioUrl.current = url;
      const a = new Audio(url);
      a.muted = settings.mute;
      a.ontimeupdate = () => setTime(a.currentTime);
      a.onplay = () => setPlaying(true);
      a.onpause = () => setPlaying(false);
      a.onended = () => {
        setPlaying(false);
        if (messageId === null) {
          setGreetingHappy(true);
          greetingTimer.current = setTimeout(
            () => setGreetingHappy(false),
            2500,
          );
        }
      };
      setSpeech(s);
      setSpeechMessage(messageId);
      setTime(0);
      audioRef.current = a;
      setAudio(a);
      if (auto && settings.autoplay && !settings.mute)
        void a.play().catch(() => setError("Press play to hear the answer."));
    },
    [audio, settings.autoplay, settings.mute],
  );
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
  }, [book, playSpeech, settings.autoplay, settings.mute, settings.voice]);
  async function ask(question: string) {
    if (!question.trim() || busy) return;
    speechRequest.current += 1;
    setGreetingHappy(false);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
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
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - started.current) / 1000);
      setElapsed(seconds);
      if (seconds >= 60 && recorder.current?.state === "recording")
        recorder.current.stop();
    }, 200);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelRecording();
    };
    window.addEventListener("keydown", escape);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", escape);
    };
  }, [recording]);
  function cancelRecording() {
    cancelled.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }
  async function sendVoice(blob: Blob) {
    setBusy(true);
    setTranscribing(true);
    setError("");
    speechRequest.current += 1;
    audio?.pause();
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
      const form = new FormData();
      const extension = blob.type.includes("mp4")
        ? "m4a"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      form.append("file", blob, `recording.${extension}`);
      form.append("speak", String(!settings.mute));
      form.append("voice", settings.voice);
      form.append("style", settings.style);
      const result = await api<{
        user_message: Message;
        assistant_message: Message;
        speech: Speech | null;
        transcript: string;
      }>(`/api/conversations/${cid}/ask-voice`, { method: "POST", body: form });
      setTranscribing(false);
      setVoiceMessages((ids) => [...ids, result.user_message.id]);
      await client.invalidateQueries({ queryKey: ["conversation", cid] });
      await client.invalidateQueries({ queryKey: ["conversations", bookId] });
      if (result.speech)
        playSpeech(result.speech, true, result.assistant_message.id);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 422 && e.message === "no_speech"
          ? "I didn't catch that — try again"
          : e instanceof Error
            ? e.message
            : "Could not process your recording.",
      );
    } finally {
      setTranscribing(false);
      setBusy(false);
    }
  }
  const closeVoiceGate = useCallback(() => {
    voiceGateRequest.current += 1;
    voiceGateAbort.current?.abort();
    setVoiceGate("closed");
  }, []);

  async function confirmVoiceReady(
    request: number,
    controller: AbortController,
  ) {
    const delay = window.setTimeout(() => {
      if (voiceGateRequest.current === request) setVoiceGate("waiting");
    }, 280);
    try {
      const ready = await checkVoiceReady(
        VOICE_READY_TIMEOUT_MS,
        controller.signal,
      );
      if (voiceGateRequest.current !== request) return "superseded" as const;
      if (controller.signal.aborted) return "cancelled" as const;
      return ready ? ("ready" as const) : ("offline" as const);
    } finally {
      clearTimeout(delay);
    }
  }

  async function startRecording() {
    setError("");
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setError(
        "Microphone access requires a secure connection. Please type your question.",
      );
      return;
    }
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Recording is not supported in this browser. Please type your question.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      let r: MediaRecorder;
      try {
        r = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
      } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        throw e;
      }
      recorder.current = r;
      cancelled.current = false;
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        recorder.current = null;
        if (cancelled.current) return;
        if (Date.now() - started.current < 500) {
          setError("Recording was too short. Please try again.");
          return;
        }
        void sendVoice(new Blob(chunks, { type: r.mimeType || "audio/webm" }));
      };
      started.current = Date.now();
      setElapsed(0);
      r.start();
      setRecording(true);
    } catch (e) {
      const name =
        typeof e === "object" && e !== null && "name" in e
          ? String(e.name)
          : "";
      setError(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Microphone access was blocked. Allow it in your browser's site settings, or type your question."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "No microphone found. Connect one or type your question."
            : "Could not start recording. Please type your question.",
      );
    }
  }

  async function enterVoice() {
    if (recording || busy) return;
    setError("");
    const request = ++voiceGateRequest.current;
    const controller = new AbortController();
    voiceGateAbort.current = controller;
    const result = await confirmVoiceReady(request, controller);
    if (result === "superseded") return;
    if (result === "cancelled") {
      setVoiceGate("closed");
      return;
    }
    if (result === "ready") {
      setVoiceGate("closed");
      await startRecording();
      return;
    }
    setVoiceGate("waiting");
    while (voiceGateRequest.current === request && !controller.signal.aborted) {
      const keptWaiting = await waitForVoiceRetry(
        VOICE_READY_POLL_MS,
        controller.signal,
      );
      if (
        !keptWaiting ||
        voiceGateRequest.current !== request ||
        controller.signal.aborted
      )
        return;
      const ready = await checkVoiceReady(
        VOICE_READY_TIMEOUT_MS,
        controller.signal,
      );
      if (voiceGateRequest.current !== request || controller.signal.aborted)
        return;
      if (ready) {
        setVoiceGate("closed");
        await startRecording();
        return;
      }
    }
  }

  async function toggleRecording() {
    if (recording) {
      if (recorder.current?.state === "recording") recorder.current.stop();
      return;
    }
    if (busy) return;
    await enterVoice();
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
            words={speech?.words}
            expression={
              recording
                ? "listening"
                : busy
                  ? "thinking"
                  : playing
                    ? "speaking"
                    : greetingHappy
                      ? "happy"
                      : "idle"
            }
          >
            {settings.captions && playing && speech?.words.length ? (
              <div className="stage-subtitles" aria-live="off">
                {speech.words
                  .filter(
                    (word) =>
                      time >= word.start - 1.5 && time <= word.end + 1.5,
                  )
                  .map((word, index) => (
                    <span
                      className={
                        time >= word.start && time <= word.end ? "active" : ""
                      }
                      key={`${word.start}-${index}`}
                    >
                      {word.word}{" "}
                    </span>
                  ))}
              </div>
            ) : null}
          </Stage>
          <div className="playback">
            <button
              onClick={() => {
                if (audio) {
                  if (audioRef.current) audioRef.current.currentTime = 0;
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
                if (audio)
                  if (audioRef.current) audioRef.current.currentTime = 0;
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
        <ChatTranscript
          messages={messages}
          book={book}
          busy={busy}
          captions={settings.captions}
          speech={speech}
          speechMessage={speechMessage}
          playing={playing}
          time={time}
          error={error}
          recording={recording}
          elapsed={elapsed}
          transcribing={transcribing}
          voiceMessages={voiceMessages}
          cancelRecording={cancelRecording}
          text={text}
          setText={setText}
          toggleRecording={toggleRecording}
          ask={ask}
        />
      </div>
      <VoiceStatusDialog
        open={voiceGate !== "closed"}
        onClose={closeVoiceGate}
      />
    </div>
  );
}
