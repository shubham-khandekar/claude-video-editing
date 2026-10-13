// Export a film's SFX cues (window.CUES = [{t, kind}]) to JSON for scripts/reel_audio.py.
// node scripts/cues.mjs --page films/x/index.html --out films/x/cues.json
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { serve } from './serve.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`${server.url}/${arg('page', 'index.html')}`);
await page.evaluate(() => window.ready);
const cues = await page.evaluate(() => (window.CUES || []).slice().sort((a, b) => a.t - b.t));
writeFileSync(arg('out', 'cues.json'), JSON.stringify(cues, null, 1));
console.log(`${cues.length} cues -> ${arg('out', 'cues.json')}`);
await browser.close(); server.close();
