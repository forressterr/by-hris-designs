// Tiny static server with SPA fallback. Serves Surge's built dist
// folder (extracted to /tmp/surge-source/...) on a fixed port so the
// Claude Preview tool can capture screens.
//
// Run via launch.json's "Surge Preview" entry.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const PORT = 5180;
const ROOT = resolve('/tmp/surge-source/Surge/surge-storefront/dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function send(res, file, status = 200) {
  try {
    const data = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(status, {
      'content-type': type,
      'cache-control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const filePath = join(ROOT, pathname === '/' ? 'index.html' : pathname);

  // Try the requested file first. If it's not a regular file and the
  // request doesn't look like an asset, fall back to index.html for
  // SPA routing.
  try {
    const s = await stat(filePath);
    if (s.isFile()) {
      await send(res, filePath);
      return;
    }
  } catch (_e) {
    // miss
  }

  // SPA fallback — but only for requests that look like routes, not
  // for missing assets (.js, .css, etc).
  const ext = extname(pathname).toLowerCase();
  if (!ext || ext === '.html') {
    await send(res, join(ROOT, 'index.html'));
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Surge dist serving at http://127.0.0.1:${PORT}`);
});
