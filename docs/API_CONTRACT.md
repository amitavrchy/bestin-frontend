# Bestin — Architecture & API Contract (v1)

This contract is shared by the three repos. All three MUST implement exactly these endpoints/shapes.
If you need to extend it, ADD optional fields only (never rename/remove), and update docs/API_CONTRACT.md in your repo.

## Services & ports (local dev)
| Service | Repo | Port | Talks to |
|---|---|---|---|
| AI service (FastAPI) | bestin-ai | 8001 | LLM/STT providers, local embeddings, Chroma, edge-tts, Rhubarb |
| Product backend (FastAPI) | bestin-backend | 8000 | Postgres (SQLite fallback), bestin-ai |
| Web app (Vite React TS) | bestin-frontend | 5173 | bestin-backend only (never calls bestin-ai directly) |

Browser -> bestin-backend `/api/*` (JWT) -> bestin-ai `/v1/*` (shared secret header `X-Internal-Token`, env `AI_INTERNAL_TOKEN`, default `dev-internal-token`).

## Free-by-default AI stack (bestin-ai)
- LLM: provider `groq` (OpenAI-compatible, base https://api.groq.com/openai/v1, model `openai/gpt-oss-120b`, needs GROQ_API_KEY),
  `gemini` (Google AI Studio key GEMINI_API_KEY, model `gemini-3.1-flash-lite` via OpenAI-compatible endpoint https://generativelanguage.googleapis.com/v1beta/openai/),
  `pollinations` (KEYLESS, https://text.pollinations.ai/openai, model `openai-fast`, ~1 req / 30-45 s per IP — testing only),
  `openai` (optional, OPENAI_API_KEY). `LLM_PROVIDER=auto` picks groq if key set, else gemini if key, else openai if key, else pollinations.
  If the chosen provider fails (429/402/5xx) fall back along the chain. If none works, return an "extractive" answer built from the top retrieved chunks (so the product never hard-fails).
- Embeddings: local `fastembed` (`BAAI/bge-small-en-v1.5`, no key). Optional `openai` / `gemini` embeddings. Store which embedding model built a collection; re-ingest needed if changed.
- Vector store: Chroma persistent client, one collection per book (`book_<id>`), cosine.
- STT: `groq` whisper-large-v3-turbo (GROQ_API_KEY) or `openai`. If no key: endpoint returns 503 `{"detail":"stt_unavailable"}`; the frontend then uses browser Web Speech API.
- TTS: `edge-tts` (KEYLESS, Microsoft neural voices) with `boundary="WordBoundary"` for word timings (offsets are 100-ns ticks). Optional `openai` TTS.
- Lip sync: visemes in Rhubarb shape set A,B,C,D,E,F,G,H,X. Backends: `rhubarb` (binary in tools/bin, downloaded by a script, uses audio converted to WAV via imageio-ffmpeg), `words` (word timings + grapheme->phoneme-ish heuristic -> visemes), `heuristic` (text-only, evenly spaced). `LIPSYNC_BACKEND=auto` = rhubarb if available else words else heuristic.

## Common types
```
Viseme   = { "start": float_seconds, "end": float_seconds, "value": "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"X" }
WordTime = { "word": str, "start": float_seconds, "end": float_seconds }
Citation = { "chunk_id": str, "text": str (<= 600 chars snippet), "page": int|null, "chapter": str|null, "score": float }
Speech   = { "audio_base64": str, "mime": "audio/mpeg", "duration": float, "visemes": [Viseme], "words": [WordTime], "voice": str, "lipsync_backend": str }
Errors   = FastAPI style { "detail": str | [...] } with proper HTTP codes.
```

## bestin-ai (internal) — every /v1 route requires header `X-Internal-Token`
- `GET /health` -> `{status:"ok", service:"bestin-ai", version, providers:{llm, embeddings, stt, tts, lipsync}}` (no auth)
- `GET /v1/voices` -> `[{id:"en-US-AriaNeural", name:"Aria", gender:"Female", locale:"en-US", provider:"edge"}...]` (curated list of ~8–12 nice English voices + a few others; cache)
- `POST /v1/books/{book_id}/ingest` multipart: `file` (pdf|epub|txt|md), `title` (str, optional) -> 202 `{book_id, status:"queued"}`. Runs in a background thread; replaces existing collection.
- `GET /v1/books/{book_id}/status` -> `{book_id, status:"queued"|"processing"|"ready"|"failed"|"not_found", progress:0..1, chunks:int, pages:int|null, error:str|null, embedding_model:str}`
- `DELETE /v1/books/{book_id}` -> 204
- `POST /v1/ask` JSON `{book_id, question, history:[{role:"user"|"assistant", content}], top_k?:int, speak?:bool=true, voice?:str, style?:"concise"|"detailed"}`
   -> `{answer:str, citations:[Citation], provider:str, model:str, speech: Speech|null}`
   409 if book not ready, 404 if unknown. Answer must be grounded in retrieved chunks, cite like [1],[2] matching citations order, and say it does not know when not in the book. Keep spoken answers reasonably short (concise default ~120 words).
- `POST /v1/tts` JSON `{text, voice?}` -> `Speech`
- `POST /v1/stt` multipart `file` (webm/ogg/wav/mp3/m4a) -> `{text, language|null, provider}`; 503 `stt_unavailable` if no provider.

## bestin-backend (public) — prefix `/api`, JSON, JWT bearer (`Authorization: Bearer <token>`)
Roles: `admin`, `user`. Seeded admin from env `ADMIN_EMAIL` (default `admin@bestin.local`) / `ADMIN_PASSWORD` (default `admin12345`) on startup if missing.
- `GET /health` -> `{status:"ok", service:"bestin-backend", db:"postgresql"|"sqlite", ai:"ok"|"unreachable"}` (no auth)
- Auth:
  - `POST /api/auth/register` `{email, password(min 8), name}` -> `{access_token, token_type:"bearer", user:User}` (role user)
  - `POST /api/auth/login` `{email, password}` -> same
  - `GET /api/auth/me` -> `User`
  - `User = {id:int, email, name, role:"admin"|"user", created_at}`
- Books (any logged-in user):
  - `GET /api/books` -> `[Book]` (users: only `status=="ready" && is_published`; admins: all) ; optional `?q=` search title/author
  - `GET /api/books/{id}` -> `Book`
  - `GET /api/books/{id}/cover` -> image (no auth needed so <img> works) or 404
  - `Book = {id:int, title, author|null, description|null, language|null, status:"uploaded"|"queued"|"processing"|"ready"|"failed", progress:float, chunks:int, pages:int|null, error|null, is_published:bool, has_cover:bool, file_name, file_size, created_at, updated_at, suggested_questions:[str]}`
- Admin (role admin, else 403):
  - `POST /api/admin/books` multipart `file`, `title`, `author?`, `description?`, `cover?`(image), `is_published?`(bool, default true) -> 201 `Book` (stores file under STORAGE_DIR, then calls ai ingest; status follows ai)
  - `PATCH /api/admin/books/{id}` JSON `{title?, author?, description?, is_published?, suggested_questions?}` -> `Book`
  - `PUT /api/admin/books/{id}/cover` multipart `cover` -> `Book`
  - `POST /api/admin/books/{id}/reingest` -> `Book`
  - `DELETE /api/admin/books/{id}` -> 204 (also deletes ai collection + files)
  - `GET /api/admin/stats` -> `{books:int, ready_books:int, users:int, conversations:int, questions:int, questions_last_7d:[{date, count}]}`
  - `GET /api/admin/qa?book_id=&limit=50&offset=0` -> `{items:[{id, question, answer, book_id, book_title, user_email, created_at, provider}], total}`
  - `GET /api/admin/users` -> `[User]`
  Status sync: whenever books are listed/fetched and status in (queued, processing), backend refreshes from ai `/v1/books/{id}/status` (and a background poller every few seconds is fine).
- Conversations (owner only):
  - `POST /api/conversations` `{book_id}` -> `Conversation`
  - `GET /api/conversations?book_id=` -> `[Conversation]` (newest first)
  - `GET /api/conversations/{id}` -> `Conversation & {messages:[Message]}`
  - `DELETE /api/conversations/{id}` -> 204
  - `POST /api/conversations/{id}/ask` `{question, speak?:bool=true, voice?:str, style?}` -> `{user_message:Message, assistant_message:Message, speech: Speech|null}`
     (backend sends the last ~6 messages as history to ai; stores both messages; Q&A log reads from this)
  - `Conversation = {id, book_id, book_title, title (first question truncated), created_at, updated_at, message_count}`
  - `Message = {id, role:"user"|"assistant", content, citations:[Citation], provider|null, created_at}`
- Voice helpers (logged in):
  - `GET /api/voices` -> proxy of ai voices
  - `POST /api/tts` `{text, voice?}` -> `Speech` (used for greeting / replay)
  - `POST /api/stt` multipart `file` -> `{text, language, provider}`; 503 passthrough when unavailable
- CORS: `CORS_ORIGINS` env (default `http://localhost:5173,http://127.0.0.1:5173`).
- If ai is unreachable, return 502 `{"detail":"ai_unavailable"}`.

## bestin-frontend
- Env: `VITE_API_URL` (default `http://localhost:8000`).
- Routes: `/login`, `/register`, `/` (library / book picker), `/books/:id` (chat with avatar), `/admin` (dashboard), `/admin/books`, `/admin/books/new`, `/admin/books/:id`, `/admin/qa`, `/admin/users`, `/settings`.
- Token stored in localStorage; route guards for auth and admin role.
