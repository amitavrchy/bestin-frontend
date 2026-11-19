import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json, upload } from "../api";
import type { Book, User } from "../types";
import { Cover } from "./Common";
type Stats = {
  books: number;
  ready_books: number;
  users: number;
  conversations: number;
  questions: number;
  questions_last_7d: { date: string; count: number }[];
};
export function Dashboard() {
  const { data, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/admin/stats"),
  });
  return (
    <div className="page">
      <p className="eyebrow">THE BIG PICTURE</p>
      <h1>
        Overview<span className="accent">.</span>
      </h1>
      <p className="muted">A little look at your growing library.</p>
      {error && <p className="error">{error.message}</p>}
      <div className="stats">
        {[
          ["Books", data?.books],
          ["Ready to read", data?.ready_books],
          ["Readers", data?.users],
          ["Conversations", data?.conversations],
          ["Questions", data?.questions],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Questions this week</h2>
        <div className="chart">
          {data?.questions_last_7d.map((d) => (
            <div key={d.date}>
              <span>{d.count}</span>
              <div
                style={{
                  height: `${Math.max(4, (d.count / Math.max(1, ...data.questions_last_7d.map((x) => x.count))) * 130)}px`,
                }}
              />
              <small>{d.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function AdminBooks() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const { data: books = [] } = useQuery({
    queryKey: ["admin-books"],
    queryFn: () => api<Book[]>("/api/books"),
    refetchInterval: 5000,
  });
  async function action(book: Book, kind: "publish" | "reingest" | "delete") {
    if (
      kind === "delete" &&
      !window.confirm(`Delete “${book.title}” and its files?`)
    )
      return;
    try {
      await api(
        `/api/admin/books/${book.id}${kind === "reingest" ? "/reingest" : ""}`,
        kind === "publish"
          ? {
              method: "PATCH",
              body: json({ is_published: !book.is_published }),
            }
          : { method: kind === "delete" ? "DELETE" : "POST" },
      );
      void client.invalidateQueries({ queryKey: ["admin-books"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CURATE THE COLLECTION</p>
          <h1>
            Manage books<span className="accent">.</span>
          </h1>
        </div>
        <Link className="primary button" to="/admin/books/new">
          + Add a book
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="admin-books">
        {books.map((b) => (
          <div className="admin-book panel" key={b.id}>
            <Cover book={b} />
            <div className="admin-book-main">
              <Link to={`/admin/books/${b.id}`}>
                <h3>{b.title}</h3>
              </Link>
              <p className="muted">
                {b.author || "Unknown author"} · {b.file_name}
              </p>
              <span className="badge">{b.status}</span>{" "}
              <span className="badge">
                {b.is_published ? "Published" : "Unpublished"}
              </span>
              {["queued", "processing"].includes(b.status) && (
                <progress value={b.progress} max={1} />
              )}{" "}
              {b.error && <p className="error">{b.error}</p>}
            </div>
            <div className="actions">
              <button onClick={() => void action(b, "publish")}>
                {b.is_published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => void action(b, "reingest")}>
                Re-ingest
              </button>
              <button onClick={() => void action(b, "delete")}>Delete</button>
            </div>
          </div>
        ))}
        {!books.length && (
          <div className="empty">
            No books yet. Add the first one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
export function BookEditor({ isNew = false }: { isNew?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: book } = useQuery({
    queryKey: ["admin-book", id],
    queryFn: () => api<Book>(`/api/books/${id}`),
    enabled: !isNew,
  });
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        if (!file) throw new Error("Choose a book file first.");
        form.set("file", file);
        if (cover) form.set("cover", cover);
        await upload("/api/admin/books", form, setProgress);
      } else {
        await api(`/api/admin/books/${id}`, {
          method: "PATCH",
          body: json({
            title: form.get("title"),
            author: form.get("author"),
            description: form.get("description"),
            suggested_questions: String(form.get("suggested_questions") || "")
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
          }),
        });
        if (cover) {
          const data = new FormData();
          data.set("cover", cover);
          await api(`/api/admin/books/${id}/cover`, {
            method: "PUT",
            body: data,
          });
        }
      }
      void client.invalidateQueries({ queryKey: ["admin-books"] });
      navigate("/admin/books");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save book");
    } finally {
      setBusy(false);
    }
  }
  if (!isNew && !book) return <div className="page">Loading book…</div>;
  return (
    <div className="page narrow">
      <Link to="/admin/books">← All books</Link>
      <p className="eyebrow">{isNew ? "A NEW ADDITION" : "BOOK DETAILS"}</p>
      <h1>
        {isNew ? "Add a book" : "Edit book"}
        <span className="accent">.</span>
      </h1>
      <form className="panel form-stack" onSubmit={submit}>
        {isNew && (
          <label
            className={`dropzone ${drag ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              setFile(e.dataTransfer.files[0] || null);
            }}
          >
            <strong>{file ? file.name : "Drop your book here"}</strong>
            <span>or click to choose a PDF, EPUB, TXT or Markdown file</span>
            <input
              type="file"
              accept=".pdf,.epub,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        )}
        <label>
          Title
          <input name="title" required defaultValue={book?.title} />
        </label>
        <label>
          Author
          <input name="author" defaultValue={book?.author || ""} />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={4}
            defaultValue={book?.description || ""}
          />
        </label>
        {!isNew && (
          <label>
            Suggested questions <small>One per line</small>
            <textarea
              name="suggested_questions"
              rows={4}
              defaultValue={book?.suggested_questions.join("\n")}
            />
          </label>
        )}
        <label>
          Cover image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </label>
        {cover && <CoverPreview file={cover} />}{" "}
        {book && (
          <p className="muted">
            Ingestion: {book.status} · {book.chunks} chunks ·{" "}
            {book.pages ?? "unknown"} pages {book.error && `· ${book.error}`}
          </p>
        )}
        {progress > 0 && <progress value={progress} max={1} />}{" "}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : isNew ? "Upload book" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
function CoverPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <img className="cover-preview" src={url} alt="Selected cover preview" />
  );
}
type QA = {
  id: number;
  question: string;
  answer: string;
  book_id: number;
  book_title: string;
  user_email: string;
  created_at: string;
  provider: string;
};
export function Questions() {
  const [book, setBook] = useState("");
  const [offset, setOffset] = useState(0);
  const { data: books = [] } = useQuery({
    queryKey: ["admin-books"],
    queryFn: () => api<Book[]>("/api/books"),
  });
  const { data } = useQuery({
    queryKey: ["qa", book, offset],
    queryFn: () =>
      api<{ items: QA[]; total: number }>(
        `/api/admin/qa?limit=50&offset=${offset}${book ? `&book_id=${book}` : ""}`,
      ),
  });
  return (
    <div className="page">
      <p className="eyebrow">WHAT READERS ARE ASKING</p>
      <h1>
        Questions<span className="accent">.</span>
      </h1>
      <select
        value={book}
        onChange={(e) => {
          setBook(e.target.value);
          setOffset(0);
        }}
      >
        <option value="">All books</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
      <div className="panel list">
        {data?.items.map((q) => (
          <details key={q.id}>
            <summary>
              <strong>{q.question}</strong>
              <small>
                {q.book_title} · {q.user_email} ·{" "}
                {new Date(q.created_at).toLocaleDateString()}
              </small>
            </summary>
            <p>{q.answer}</p>
            <small>Provider: {q.provider}</small>
          </details>
        ))}
        {data?.items.length === 0 && <p>No questions yet.</p>}
      </div>
      <div className="inline">
        <button
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous
        </button>
        <span>
          {offset + 1}–{Math.min(offset + 50, data?.total || 0)} of{" "}
          {data?.total || 0}
        </span>
        <button
          disabled={offset + 50 >= (data?.total || 0)}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function UsersPage() {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/api/admin/users"),
  });
  return (
    <div className="page">
      <p className="eyebrow">THE PEOPLE BEHIND THE QUESTIONS</p>
      <h1>
        Readers<span className="accent">.</span>
      </h1>
      <div className="panel list">
        {users.map((u) => (
          <div className="user-row" key={u.id}>
            <div className="user-badge">{u.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{u.name}</strong>
              <small>{u.email}</small>
            </div>
            <span className="badge">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
