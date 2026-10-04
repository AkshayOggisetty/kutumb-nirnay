/* Dependency free dev server. Node 18+. Usage: node server.mjs [port]
 *
 * Serves the static app, and runs the serverless chat handler in process at
 * /api/chat so local behaviour matches the deployment, including the round
 * robin across keys and the failover between them.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 8081);

/* Load .env.local so the assistant can be exercised locally. The file is
   gitignored, and the request handler below refuses to serve any dotfile. */
const NEWLINE = /\r?\n/;
for (const name of ['.env.local', '.env']) {
  const path = join(ROOT, name);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(NEWLINE)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
const keyCount = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',').map(s => s.trim()).filter(Boolean).length;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.webmanifest': 'application/manifest+json'
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (p === '/api/chat') {
      const { default: handler } = await import('./api/chat.js');
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString('utf8');
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { /* handler reports it */ }
      const shim = {
        statusCode: 200,
        setHeader: (k, v) => res.setHeader(k, v),
        status(code) { this.statusCode = code; return this; },
        json(obj) {
          res.writeHead(this.statusCode, { 'content-type': 'application/json' });
          res.end(JSON.stringify(obj));
          return this;
        },
        end() { res.writeHead(this.statusCode); res.end(); return this; }
      };
      await handler({ method: req.method, body }, shim);
      return;
    }

    /* no dotfile is ever served, which keeps the env files out of reach */
    if (p.split('/').some(seg => seg.startsWith('.'))) {
      res.writeHead(404).end('Not found');
      return;
    }

    if (p === '/') p = '/index.html';
    const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

    const s = await stat(file).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end('Not found'); return; }

    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
}).listen(PORT, () => {
  console.log(`Kutumb Nirnay -> http://localhost:${PORT}`);
  console.log(keyCount
    ? `assistant: ${keyCount} key${keyCount > 1 ? 's' : ''} loaded, rotating round robin`
    : 'assistant: no key in .env.local, the app runs fully without it');
});
