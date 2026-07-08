import crypto from 'node:crypto';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: isProduction ? false : true,
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'virtual-bouquet-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/message', (req, res) => {
  res.status(200).json({
    title: 'Happy Birthday,',
    body: 'To make our yearly tradition more meaningful and lasting, I decided to bring it into the virtual world and crafted a bouquet for you with my own hands — one that will never wilt. Wishing you a wonderful day filled with joy and love.',
    signature: '- With love',
  });
});

// --- Shareable gifts (LOCAL DEV MOCK) ---
// Production uses the Vercel serverless function at /api/gift.js backed by
// Vercel Blob + KV. This in-memory version only exists so the flow can be
// developed and tested with `npm run dev:full`; it resets when the server restarts.
const devGifts = new Map();
const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function makeId(length = 10) {
  const bytes = crypto.randomBytes(length);
  let id = '';
  for (const byte of bytes) {
    id += ID_ALPHABET[byte % ID_ALPHABET.length];
  }
  return id;
}

function clean(value, max) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

app.post('/api/gift', (req, res) => {
  const { title, body, signature, photo } = req.body || {};
  const gift = {
    title: clean(title, 200),
    body: clean(body, 2000),
    signature: clean(signature, 200),
    // In dev the photo data URL is kept inline and returned as photoUrl.
    photoUrl: typeof photo === 'string' && photo ? photo : null,
    createdAt: Date.now(),
  };
  const id = makeId();
  devGifts.set(id, gift);
  res.status(200).json({ id });
});

app.get('/api/gift', (req, res) => {
  const gift = devGifts.get(req.query.id);
  if (!gift) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(200).json(gift);
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
