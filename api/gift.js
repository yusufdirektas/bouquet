// Vercel serverless function: create and fetch shareable gifts.
// Photo is stored in Vercel Blob, the message metadata in Vercel KV.
//
// Required environment variables (auto-injected when you connect a Blob store
// and a KV store to the project in the Vercel dashboard):
//   BLOB_READ_WRITE_TOKEN
//   KV_REST_API_URL, KV_REST_API_TOKEN
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

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

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const id = req.query.id;
            if (!id) {
                return res.status(400).json({ error: 'Missing id' });
            }
            const gift = await kv.get(`gift:${id}`);
            if (!gift) {
                return res.status(404).json({ error: 'Not found' });
            }
            return res.status(200).json(gift);
        }

        if (req.method === 'POST') {
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
            await kv.set(`gift:${id}`, gift);
            return res.status(200).json({ id });
        }

        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('gift handler error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
