import demoVisemes from "../avatar/demo-visemes.json";
import { visemeAt } from "../avatar/useLipSync";
import type { Viseme } from "../types";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Library,
  Users,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, apiBase, json } from "../api";
import { useAuth, useSettings } from "../state";
import { Stage, backgrounds } from "../components/Stage";
import { VISEMES, type Book, type VisemeId, type Voice } from "../types";
import type { Expression } from "../components/Avatar";
export function Guard({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Opening your library…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
export function Layout() {
  const { user, signOut } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <BookOpen size={21} />
          </span>{" "}
          bestin<span className="brand-dot">.</span>
        </Link>
        <p className="nav-label">YOUR SPACE</p>
        <nav>
          <Link to="/">
            <Library size={18} /> Library
          </Link>
          <Link to="/settings">
            <SettingsIcon size={18} /> Settings
          </Link>
          {user?.role === "admin" && (
            <>
              <p className="nav-label">MANAGE</p>
              <Link to="/admin">
                <LayoutDashboard size={18} /> Overview
              </Link>
              <Link to="/admin/books">
                <BookOpen size={18} /> Books
              </Link>
              <Link to="/admin/qa">
                <MessageSquare size={18} /> Questions
              </Link>
              <Link to="/admin/users">
                <Users size={18} /> Readers
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-badge">
            {user?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
          <button
            className="icon-button"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
export function AuthPage({ register = false }: { register?: boolean }) {
  const { user, signIn } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await signIn(
        String(form.get("email")),
        String(form.get("password")),
        register ? String(form.get("name")) : undefined,
      );
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <Link className="brand" to="/">
          ✳ bestin.
        </Link>
        <div>
          <p className="eyebrow">A LITTLE MORE HUMAN</p>
          <h1>
            Every book has
            <br />a story to tell.
          </h1>
          <p>
            Meet your thoughtful companion for the questions that come to mind
            as you read.
          </p>
        </div>
        <Stage background="library" character="sage" expression="happy" />
      </div>
      <div className="auth-form">
        <div className="auth-inner">
          <p className="eyebrow">WELCOME TO BESTIN</p>
          <h1>{register ? "Start your story" : "Welcome back"}</h1>
          <p className="muted">
            {register
              ? "Create an account and get curious."
              : "A good conversation is waiting for you."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "One moment…" : register ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="muted">
            {register ? "Already have an account?" : "New around here?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
export function Cover({ book }: { book: Book }) {
  return book.has_cover ? (
    <img
      className="cover"
      src={`${apiBase()}/api/books/${book.id}/cover`}
      alt=""
    />
  ) : (
    <div className={`cover cover-${book.id % 4}`}>
      <BookOpen size={23} />
      <strong>{book.title}</strong>
      <small>{book.author || "A BESTIN BOOK"}</small>
    </div>
  );
}
export function LibraryPage() {
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const {
    data: books,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["books", q],
    queryFn: () => api<Book[]>(`/api/books?q=${encodeURIComponent(q)}`),
    refetchInterval: 5000,
  });
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR NEXT GOOD CONVERSATION</p>
          <h1>
            The library<span className="accent">.</span>
          </h1>
          <p className="muted">Pick a book, get comfortable, and ask away.</p>
        </div>
        {user?.role === "admin" && (
          <Link className="primary button" to="/admin/books/new">
            + Add a book
          </Link>
        )}
      </div>
      <div className="library-banner">
        <div>
          <p className="eyebrow">READ BETWEEN THE LINES</p>
          <h2>Curiosity looks good on you.</h2>
          <p>Your books are ready to become conversations.</p>
        </div>
        <BookOpen size={80} strokeWidth={1} />
      </div>
      <div className="section-heading">
        <div>
          <h2>Explore the collection</h2>
          <p className="muted">A little knowledge, a lot of wonder.</p>
        </div>
        <input
          className="search"
          aria-label="Search books"
          placeholder="Search books or authors"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading ? (
        <p>Loading your books…</p>
      ) : error ? (
        <p className="error">{error.message}</p>
      ) : books?.length ? (
        <div className="book-grid">
          {books.map((book) => (
            <Link className="book-card" key={book.id} to={`/books/${book.id}`}>
              <Cover book={book} />
              <div className="book-info">
                <h3>{book.title}</h3>
                <p>{book.author || "Unknown author"}</p>
                {user?.role === "admin" && (
                  <span className="badge">{book.status}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <BookOpen />
          <h3>No books here yet</h3>
          <p>When a book is ready, you’ll find it here.</p>
        </div>
      )}
    </div>
  );
}
export function SettingsForm() {
  const { settings, update } = useSettings();
  const { data: voices } = useQuery({
    queryKey: ["voices"],
    queryFn: () => api<Voice[]>("/api/voices"),
  });
  const [error, setError] = useState("");
  async function preview() {
    try {
      const s = await api<{ audio_base64: string; mime: string }>("/api/tts", {
        method: "POST",
        body: json({
          text: "Hello! I’m Bestin, your reading companion.",
          voice: settings.voice,
        }),
      });
      const audio = new Audio(`data:${s.mime};base64,${s.audio_base64}`);
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview unavailable");
    }
  }
  return (
    <div className="settings-grid">
      <label>
        Voice
        <div className="inline">
          <select
            value={settings.voice}
            onChange={(e) => update({ voice: e.target.value })}
          >
            {!voices?.some((v) => v.id === settings.voice) && (
              <option value={settings.voice}>{settings.voice}</option>
            )}
            {voices?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.locale}
              </option>
            ))}
          </select>
          <button onClick={preview}>Preview</button>
        </div>
      </label>
      <label>
        Speaking style
        <select
          value={settings.style}
          onChange={(e) =>
            update({ style: e.target.value as "concise" | "detailed" })
          }
        >
          <option value="concise">Concise</option>
          <option value="detailed">Detailed</option>
        </select>
      </label>
      <label>
        Character
        <select
          value={settings.character}
          onChange={(e) => update({ character: e.target.value })}
        >
          <option value="sage">Bestin</option>
          <option value="rafi">Rafi</option>
          <option value="owl">Owl-sage</option>
        </select>
      </label>
      <label>
        Scene
        <select
          value={settings.background}
          onChange={(e) => update({ background: e.target.value })}
        >
          {backgrounds.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label>
        Theme
        <select
          value={settings.theme}
          onChange={(e) =>
            update({ theme: e.target.value as "light" | "dark" })
          }
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      {(["mute", "autoplay", "captions"] as const).map((k) => (
        <label className="check" key={k}>
          <input
            type="checkbox"
            checked={settings[k]}
            onChange={(e) => update({ [k]: e.target.checked })}
          />
          {k === "mute"
            ? "Mute audio"
            : k === "autoplay"
              ? "Play answers automatically"
              : "Show captions"}
        </label>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
export function SettingsPage() {
  return (
    <div className="page narrow">
      <p className="eyebrow">MAKE YOURSELF AT HOME</p>
      <h1>
        Your settings<span className="accent">.</span>
      </h1>
      <p className="muted">A reading companion, just the way you like it.</p>
      <div className="panel">
        <SettingsForm />
      </div>
    </div>
  );
}
export function AvatarLab() {
  const [shape, setShape] = useState<VisemeId>("X");
  const [expression, setExpression] = useState<Expression>("idle");
  const [background, setBackground] = useState("library");
  const [character, setCharacter] = useState("sage");
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed >= 2) {
        setShape("X");
        setPlaying(false);
        return;
      }
      setShape(visemeAt(demoVisemes as Viseme[], elapsed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  function sample() {
    setPlaying(true);
  }
  return (
    <div className="page narrow">
      <Link to="/">← Back to Bestin</Link>
      <h1>Avatar lab</h1>
      <Stage
        background={background}
        character={character}
        expression={expression}
        manual={shape}
      />
      <div className="panel form-stack">
        <label>
          Viseme
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value as VisemeId)}
          >
            {VISEMES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Expression
          <select
            value={expression}
            onChange={(e) => setExpression(e.target.value as Expression)}
          >
            {[
              "idle",
              "listening",
              "thinking",
              "speaking",
              "happy",
              "confused",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Scene
          <select
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          >
            {backgrounds.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Character
          <select
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
          >
            {["sage", "rafi", "owl"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button onClick={sample} disabled={playing}>
          Play sample timeline
        </button>
      </div>
    </div>
  );
}
