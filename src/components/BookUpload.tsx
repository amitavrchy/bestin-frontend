import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import type { Book } from "../types";

type BookUploadProps = {
  books: Book[];
  selectedBookId: string | null;
  busy: boolean;
  onSelect: (bookId: string) => void;
  onUpload: (file: File) => Promise<void>;
};

function formatKind(kind: string): string {
  return kind.toUpperCase();
}

export function BookUpload({
  books,
  selectedBookId,
  busy,
  onSelect,
  onUpload,
}: BookUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = ".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain";

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void handleFile(file);
  }

  return (
    <aside className="panel library-panel">
      <div className="panel-header">
        <h2>Library</h2>
        <p>Upload a PDF, EPUB, or TXT. Questions stay grounded in that book.</p>
      </div>

      <div
        className={`dropzone${dragOver ? " is-over" : ""}${busy ? " is-busy" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={onChange}
          disabled={busy}
        />
        <strong>{busy ? "Ingesting…" : "Drop a book here"}</strong>
        <span>or click to choose a file</span>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <ul className="book-list">
        {books.length === 0 ? (
          <li className="empty-hint">No books yet.</li>
        ) : (
          books.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                className={`book-item${selectedBookId === book.id ? " is-selected" : ""}`}
                onClick={() => onSelect(book.id)}
              >
                <span className="book-title">{book.title}</span>
                <span className="book-meta">
                  {formatKind(book.kind)} · {book.chunks} chunks
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
