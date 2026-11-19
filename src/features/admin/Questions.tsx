import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Book } from "../../lib/types";
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
