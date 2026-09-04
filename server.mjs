/**
 * Rate AI — static dev server
 *
 * No dependencies, because the site has none: it is plain HTML, CSS and ES
 * modules, and this only exists because ES modules need an http:// origin.
 *
 *   node server.mjs        then open http://localhost:3000
 *   node server.mjs 4000   to use another port
 *
 * Two things it does beyond serving files, both so that local browsing matches
 * what a static host does in production:
 *
 *   /explore        ->  explore.html      (extension optional)
 *   anything else   ->  404.html, styled, with the site's own navigation
 *
 * Sample-data mode needs no server at all: append ?mock=1 to any URL and the
 * pages read js/dev/mock-data.js instead of Firestore.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* No trailing separator: ROOT is compared against below, and `ROOT + sep` has
   to come out as one separator rather than two. */
const ROOT = (() => {
  let root = normalize(fileURLToPath(new URL('.', import.meta.url)));
  while (root.length > 1 && root.endsWith(sep)) root = root.slice(0, -1);
  return root;
})();
const PORT = Number(process.argv[2]) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** The file behind a request, or null if there isn't one. */
async function resolve(pathname) {
  /* Decoded first, so %2e%2e cannot smuggle a traversal past normalize(). */
  let requested;
  try {
    requested = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const target = normalize(join(ROOT, requested));

  /* startsWith(ROOT) alone would also accept a sibling directory whose name
     merely begins with ROOT's, so the separator is part of the test. */
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  /* In order: the path as asked for, then as a directory index, then with the
     extension the reader left off. */
  const candidates = requested.endsWith('/')
    ? [join(target, 'index.html')]
    : [target, join(target, 'index.html'), `${target}.html`];

  for (const candidate of candidates) {
    try {
      const stats = await stat(candidate);
      if (stats.isFile()) return candidate;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

function send(res, status, file, { head = false } = {}) {
  res.writeHead(status, {
    'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    /* Every reload should show the edit that was just made. */
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (head) return res.end();
  return createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('This server only reads files.\n');
    return;
  }

  const head = req.method === 'HEAD';
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  try {
    const isReviewRoute = /^\/(?:reviewe|review|reviews)(?:\/.*)?$/i.test(pathname);

    // If static assets were requested under /reviewe/... (fallback for relative asset requests)
    let targetPath = pathname === '/' ? '/index.html' : pathname;
    if (isReviewRoute && /\.(?:css|js|mjs|svg|png|jpg|jpeg|webp|ico|woff2|json)$/i.test(pathname)) {
      targetPath = pathname.replace(/^\/(?:reviewe|review|reviews)\/[^/]+/, '');
    }

    const file = await resolve(targetPath);
    if (file) {
      send(res, 200, file, { head });
      return;
    }

    // Review route: serve tool.html
    if (isReviewRoute) {
      const toolPage = join(ROOT, 'tool.html');
      try {
        const stats = await stat(toolPage);
        if (stats.isFile()) {
          send(res, 200, toolPage, { head });
          return;
        }
      } catch {
        /* proceed to 404 */
      }
    }

    /* The site's own 404, so a mistyped URL still lands somewhere navigable. */
    const notFound = join(ROOT, '404.html');
    try {
      await stat(notFound);
      send(res, 404, notFound, { head });
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found\n');
    }
  } catch (error) {
    process.stderr.write(`${req.method} ${pathname} — ${error.message}\n`);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error\n');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    process.stderr.write(
      `Port ${PORT} is already in use. Try: node server.mjs ${PORT + 1}\n`,
    );
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  process.stdout.write(`Rate AI — http://localhost:${PORT}\n`);
});
