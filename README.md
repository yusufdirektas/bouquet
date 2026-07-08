# Virtual Bouquet

An interactive **3D digital bouquet** experience crafted for a special occasion.
The project features an envelope/photo intro flow, followed by a Three.js-rendered bouquet and a personal message card.

## Live Demo

[project-s4pva.vercel.app](https://project-s4pva.vercel.app/)

## Features

- Three.js-based 3D bouquet scene
- Envelope → photo → gift flow
- Message card with a "view the flowers" button for a clean look
- Visual optimizations for iPhone/mobile devices
- Customize panel: personal title, message, signature, and photo
- **Shareable gift links** — create a `/?g=<id>` link that opens your personalized gift on any device
- Simple, production-ready Express API (`/api/health`, `/api/message`)

## Tech Stack

- Vite
- Three.js
- Express.js
- Helmet, CORS, Compression, Morgan, Rate Limit

## Installation

```bash
npm install
```

## Development

Frontend only:

```bash
npm run dev
```

Frontend + API together:

```bash
npm run dev:full
```

## Build

```bash
npm run build
```

## Running the API

```bash
npm run start:api
```

## Shareable Gift Links

The Customize panel can turn a gift into a permanent link (`/?g=<id>`) that opens
the personalized gift for anyone who receives it.

- **Local dev** (`npm run dev:full`): backed by an in-memory mock in the Express
  server. Links work until the server restarts.
- **Production** (Vercel): backed by the serverless function `api/gift.js`, which
  stores both the photo and the message metadata in **Vercel Blob** (the metadata
  as a `gifts/<id>.json` blob). No separate database is needed.

### Deploying with sharing enabled

1. Import the project into Vercel (it auto-detects Vite + the `api/` function).
2. In the project's **Storage** tab, connect a **Blob** store. Vercel auto-injects
   `BLOB_READ_WRITE_TOKEN`.
3. Redeploy.

Until the store is connected, `/api/gift` returns `503` and the app tells the
user that sharing is not configured — the rest of the experience still works.

## Project Structure

```text
.
├─ api/               # Vercel serverless functions (gift sharing)
├─ public/            # Static assets (images, 3D model, etc.)
├─ server/            # Express backend (local dev API + mock)
├─ src/               # Application source code (JS/CSS)
├─ index.html
├─ vercel.json
└─ vite.config.js
```
