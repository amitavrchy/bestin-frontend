import { BookOpen } from "lucide-react";

import { apiBase } from "../../lib/api";
import type { Book } from "../../lib/types";
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
