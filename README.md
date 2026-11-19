# Bestin frontend

Bestin turns a book into a conversation. Readers choose a published book, ask questions by text or voice, and hear a grounded answer from an illustrated companion. Administrators manage books, ingestion and readers. The frontend talks only to the product backend; see [the shared API contract](docs/API_CONTRACT.md).

## Architecture and decisions

React 19, TypeScript, Vite, React Router, Tailwind CSS and TanStack Query provide the application shell, routing and server state. The API client attaches a localStorage bearer token to `/api` requests. Settings are stored locally on the device. The library displays generated typographic covers where no cover has been uploaded. The chat keeps conversation history on the backend, displays citations, and plays backend-generated audio and word timings. Recording is sent to the backend STT endpoint; if it returns `stt_unavailable`, the browser's speech recognition is offered when available. Recognition support varies by browser and requires microphone permission and a secure context (localhost is supported).

The avatar is hand-authored SVG. Its Rhubarb mouth shapes follow the current time of the audio element, so pausing and resuming preserve synchronization. When a timeline is absent, Web Audio amplitude provides a fallback. Bestin and Rafi share a human illustration with different silhouettes, while Owl-sage has a separate illustration. Scene and character selections are local preferences. Visit `/avatar-lab` without signing in to inspect mouth shapes, expressions, characters and scenes, or play the bundled silent cue timeline. To add a character, extend `src/components/Avatar.tsx` (or add a separate component under `src/avatar`) and the selectors in `src/pages/Common.tsx`. To add a scene, extend the list in `src/components/Stage.tsx` and the SVG in `src/scenes/SceneArtwork.tsx`. Reduced-motion preferences disable decorative animation.

The interface uses warm editorial typography, light and dark themes, and responsive layouts. The library uses a warm, editorial layout with illustrated covers. On desktop, a persistent navigation rail sits beside the library; the conversation view places the avatar stage alongside the transcript. On mobile, the stage stacks above the transcript. The admin area provides book management, an activity overview, question log and readers list.

## Setup

Use Node 22 and npm. Run the product backend on port 8000 and its AI service on port 8001 as described in their respective repositories. No API key is required by this frontend. The backend's seeded local administrator defaults to `admin@bestin.local` / `admin12345`; change credentials in any non-local environment.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. `VITE_API_URL` is the browser-accessible product backend origin; its default is `http://localhost:8000`. Restart Vite after changing it. Never put provider secrets in a `VITE_` variable: those values are exposed to browsers.

The AI service supports keyless speech and answer fallbacks. Optional provider keys belong in the AI service environment, not this repository: [Groq](https://console.groq.com/keys), [Google AI Studio](https://aistudio.google.com/app/apikey), and [OpenAI](https://platform.openai.com/api-keys). Provider availability and free-tier limits may change.

## Project layout

`src/lib` holds the API client, shared types and local state; `src/features` holds chat and administration; `src/avatar` holds speech timing, motion and the owl illustration; `src/scenes` holds scene artwork. Shared pages, stage, and UI primitives live in `src/pages` and `src/components`. Styles and design tokens are in `src/index.css`.

The library screen presents a search field and book grid; chat places the companion beside a transcript on desktop and above it on mobile. The administration screens show ingestion status, reader activity and questions. These descriptions are intended as a guide to the interface; no screenshots are bundled.

## Scripts

- `npm run dev` — development server on port 5173.
- `npm run build` — type-check and build production assets.
- `npm run preview` — preview the production build.
- `npm run lint` — run Oxlint.
- `npm run format` — format supported files with Prettier.
- `npm test` — run Vitest and component tests.
- `python3 .github/scripts/malware-check.py` — run the repository security check.

## Troubleshooting

- **Cannot reach Bestin:** start the product backend, check `VITE_API_URL`, and allow the frontend origin in backend CORS settings.
- **No books appear:** a reader sees only published books whose ingestion is ready. An administrator can inspect status and errors under Manage books.
- **Voice input unavailable:** grant microphone access and use a supported browser. Without an STT provider key, browser speech recognition is used where supported; typing remains available.
- **No audio:** check mute and autoplay settings, device volume, and browser autoplay permissions. Use the play control after an answer if autoplay was blocked. The AI service must be reachable for generated speech.
- **Authentication fails:** verify the backend is running and credentials are correct. Sign in again if a stored token has expired.
