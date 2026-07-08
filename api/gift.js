// Vercel serverless function: create and fetch shareable gifts.
// Everything lives in Vercel Blob — the photo as an image blob and the gift
// metadata as a JSON blob at the deterministic path gifts/<id>.json. No KV /
// database is required, so a single connected Blob store is enough.
//
// Required environment variable (auto-injected when you connect a Blob store
// to the project):
//   BLOB_READ_WRITE_TOKEN
import { put, list } from '@vercel/blob';

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// True only when a Blob store is connected to the project.
function isConfigured() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function makeId(length = 10) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
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

// Only accept gift creation from a browser on our own site: the request's
// Origin host must match the host it was served from. Blocks other sites'
// scripts and casual scripted abuse (curl with no Origin). Not a hard wall
// against a forged Origin, but stops the easy 99%.
function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) {
        return false;
    }
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
}

// Best-effort per-IP rate limit for POST. Serverless is stateless so this
// only holds within a warm instance, but it still adds friction to bursts.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_CREATES = 12;
const hits = new Map();

function rateLimited(req) {
    const fwd = req.headers['x-forwarded-for'] || '';
    const ip = fwd.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) {
        // Keep the map from growing without bound on a long-lived instance.
        for (const [key, times] of hits) {
            if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
        }
    }
    return recent.length > MAX_CREATES;
}

export default async function handler(req, res) {
    try {
        if (!isConfigured()) {
            return res.status(503).json({
                error: 'Sharing is not configured. Connect a Vercel Blob store to enable it.',
            });
        }

        if (req.method === 'GET') {
            const id = req.query.id;
            if (!id || !/^[a-z0-9]+$/.test(id)) {
                return res.status(400).json({ error: 'Missing or invalid id' });
            }
            // Find the metadata blob for this id and read it back.
            const { blobs } = await list({ prefix: `gifts/${id}.json`, limit: 1 });
            if (!blobs.length) {
                return res.status(404).json({ error: 'Not found' });
            }
            const gift = await fetch(blobs[0].url).then((r) => r.json());
            return res.status(200).json(gift);
        }

        if (req.method === 'POST') {
            if (!isSameOrigin(req)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            if (rateLimited(req)) {
                return res.status(429).json({ error: 'Too many links created. Try again in a few minutes.' });
            }

            const { title, body, signature, photo } = req.body || {};

            let photoUrl = null;
            if (typeof photo === 'string' && photo.startsWith('data:')) {
                const match = photo.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
                if (!match) {
                    return res.status(400).json({ error: 'Invalid photo format' });
                }
                const buffer = Buffer.from(match[2], 'base64');
                if (buffer.length > MAX_PHOTO_BYTES) {
                    return res.status(413).json({ error: 'Photo too large' });
                }
                const blob = await put(`gifts/${makeId()}.jpg`, buffer, {
                    access: 'public',
                    contentType: match[1],
                });
                photoUrl = blob.url;
            } else if (typeof photo === 'string' && /^https?:\/\//.test(photo)) {
                // Re-sharing a gift that was opened from a link: keep the existing URL.
                photoUrl = photo;
            }

            const gift = {
                title: clean(title, 200),
                body: clean(body, 2000),
                signature: clean(signature, 200),
                photoUrl,
                createdAt: Date.now(),
            };

            const id = makeId();
            await put(`gifts/${id}.json`, JSON.stringify(gift), {
                access: 'public',
                addRandomSuffix: false,
                contentType: 'application/json',
            });
            return res.status(200).json({ id });
        }

        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('gift handler error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
