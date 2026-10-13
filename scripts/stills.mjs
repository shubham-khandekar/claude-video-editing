// Cheap critique pass: one still per beat (or every --step seconds) tiled into a contact sheet.
// node scripts/stills.mjs --page films/x/index.html --dur 15 [--beats films/x/beats.json | --step 0.5] [--offset 0.25] [--cols 6] [--out out/stills.png]
// --offset shifts each sample past the beat so you see the settled state, not the cut frame.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from './serve.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PAGE = arg('page', 'index.html'), DUR = Number(arg('dur', 15)), OUT = arg('out', 'out/stills.png');
const W = Number(arg('w', 1080)), H = Number(arg('h', 1920)), COLS = Number(arg('cols', 6)), OFF = Number(arg('offset', 0.25));
const times = arg('beats')
  ? JSON.parse(readFileSync(arg('beats'))).beats.filter((b) => b < DUR)
  : Array.from({ length: Math.ceil(DUR / Number(arg('step', 0.5))) }, (_, i) => i * Number(arg('step', 0.5)));
mkdirSync(dirname(OUT), { recursive: true });

const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(`${server.url}/${PAGE}`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.ready);

const rows = Math.ceil(times.length / COLS);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-i', '-', '-vf',
  `scale=270:-1,drawtext=text='%{n}':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,tile=${COLS}x${rows}`,
  '-frames:v', '1', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
for (const t of times) {
  await page.evaluate((t) => window.seek(t), t + OFF);
  ff.stdin.write(await page.locator('#c').screenshot({ type: 'png' }));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close(); server.close();
console.log(`wrote ${OUT} (${times.length} stills, tile n = index into times; t = n*beat + ${OFF}s)`);
