import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json, upload } from "../../lib/api";
import type { Book } from "../../lib/types";
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
    if (!String(form.get("title") || "").trim()) {
      setError("Enter a title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        if (!file) throw new Error("Choose a book file first.");
        if (!/\.(pdf|epub|txt|md)$/i.test(file.name))
          throw new Error("Choose a PDF, EPUB, TXT or Markdown file.");
        if (!file.size) throw new Error("The book file is empty.");
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
    const reader = new FileReader();
    reader.onload = () => setUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [file]);
  return (
    <img className="cover-preview" src={url} alt="Selected cover preview" />
  );
}
