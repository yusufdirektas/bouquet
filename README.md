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

## Project Structure

```text
.
├─ public/            # Static assets (images, 3D model, etc.)
├─ server/            # Express backend
├─ src/               # Application source code (JS/CSS)
├─ index.html
└─ vite.config.js
```
