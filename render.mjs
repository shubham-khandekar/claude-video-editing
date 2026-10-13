// Renders index.html to out/silent.mp4 by calling window.seek(t) for every
// subframe, screenshotting #c, and piping PNGs into ffmpeg. --sub N renders N
// subframes per output frame and blends them for real motion blur.
//
// node render.mjs [--dur 15] [--fps 60] [--sub 4] [--w 1080] [--h 1920] [--from 0] [--out out/silent.mp4] [--page index.html]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from './scripts/serve.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const num = (k, d) => Number(arg(k, d));
const FPS = num('fps', 60), DUR = num('dur', 15), SUB = num('sub', 4);
const W = num('w', 1080), H = num('h', 1920), FROM = num('from', 0);
const OUT = arg('out', 'out/silent.mp4'), PAGE = arg('page', 'index.html');
mkdirSync(dirname(OUT), { recursive: true });

const server = await serve();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(`${server.url}/${PAGE}`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.ready); // optional promise, e.g. loading beats.json
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
