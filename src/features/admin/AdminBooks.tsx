import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json } from "../../lib/api";
import type { Book } from "../../lib/types";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Cover } from "../library/Cover";
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
              <Badge>{b.status}</Badge>{" "}
              <span className="badge">
                {b.is_published ? "Published" : "Unpublished"}
              </span>
              {["queued", "processing"].includes(b.status) && (
                <ProgressBar value={b.progress} aria-label="Ingestion progress" />
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
