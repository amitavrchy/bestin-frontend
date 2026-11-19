import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/contexts";
import type { Book } from "../../lib/types";
import { Cover } from "./Cover";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
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
        <Skeleton label="Loading your books" />
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
        <EmptyState icon={<BookOpen />} title="No books here yet">
          When a book is ready, you’ll find it here.
        </EmptyState>
      )}
    </div>
  );
}
