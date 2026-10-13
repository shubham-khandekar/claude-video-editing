// Renders index.html to out/silent.mp4 by calling window.seek(t) for every
// subframe, screenshotting #c, and piping PNGs into ffmpeg. --sub N renders N
// subframes per output frame and blends them for real motion blur.
//
// node render.mjs [--dur 15] [--fps 60] [--sub 4] [--w 1080] [--h 1920] [--from 0] [--out out/silent.mp4] [--page index.html]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFile } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const num = (k, d) => Number(arg(k, d));
const FPS = num('fps', 60), DUR = num('dur', 15), SUB = num('sub', 4);
const W = num('w', 1080), H = num('h', 1920), FROM = num('from', 0);
const OUT = arg('out', 'out/silent.mp4'), PAGE = arg('page', 'index.html');
mkdirSync(dirname(OUT), { recursive: true });

// Serve the project over http so index.html can import lib/motion.js
// (Chromium blocks ES module imports from file://).
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const path = join(process.cwd(), normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, ''));
  readFile(path, (err, body) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${server.address().port}/${PAGE}`);
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => typeof window.seek === 'function'))) throw new Error(`${PAGE} must define window.seek(t)`);

const vf = SUB > 1
  ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`
  : 'null';
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-',
  '-vf', vf, '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', OUT],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(DUR * FPS * SUB);
for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.seek(t), FROM + i / (FPS * SUB));
  const png = await page.locator('#c').screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % (FPS * SUB) === 0) console.log(`rendered ${i / (FPS * SUB)}s / ${DUR}s`);
}
ff.stdin.end();
const code = await new Promise((r) => ff.on('close', r));
await browser.close();
server.close();
if (code !== 0) { console.error(`ffmpeg exited with ${code}`); process.exit(code); }
console.log(`wrote ${OUT}`);
