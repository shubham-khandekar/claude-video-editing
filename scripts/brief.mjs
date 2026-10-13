// Storyboard brief PDF for approval before the final render: cover with a timeline bar and scene
// index, then two scene cards per page (frame, timing, layout, voice, captions, on-screen, animations, SFX).
// node scripts/brief.mjs --page films/x/index.html --brief films/x/brief.json --out exports/x_brief.pdf
//
// brief.json: { title, style, audio, notes, scenes: [{ id, start, end, layout, title, voice, captions: [],
//   onscreen, animations: [{ t, dur, what, ease }], sfx: [], frames: [t, ...]? }] }
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from './serve.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const brief = JSON.parse(readFileSync(arg('brief')));
const OUT = arg('out', 'exports/brief.pdf');
mkdirSync(dirname(OUT), { recursive: true });

const server = await serve();
const browser = await chromium.launch();
const film = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await film.goto(`${server.url}/${arg('page')}`);
await film.evaluate(() => window.ready);
for (const s of brief.scenes) {
  s.shots = [];
  for (const t of s.frames || [(s.start + s.end) / 2]) {
    await film.evaluate((t) => window.seek(t), t);
    const jpg = await film.locator('#c').screenshot({ type: 'jpeg', quality: 70, scale: 'css' });
    s.shots.push({ t, src: 'data:image/jpeg;base64,' + jpg.toString('base64') });
  }
}
const dur = Math.max(...brief.scenes.map((s) => s.end));
const esc = (x) => String(x ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const LAYOUT = { A: 'Split', B: 'Full graphic', C: 'Full-bleed scene', D: 'Full face', E: 'PiP bubble', F: 'Side strip', G: 'Hook stack' };
const hue = { A: '#22C55E', B: '#22D3EE', C: '#E8743B', D: '#0B0B0F', E: '#1D9BF0', F: '#A855F7', G: '#FFE600' };
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

const sceneCard = (s) => `
<section class="scene">
  <div class="frames">${s.shots.map((f) => `<figure><img src="${f.src}"><figcaption>${fmt(f.t)}</figcaption></figure>`).join('')}</div>
  <div class="info">
    <h2><span class="id">${esc(s.id)}</span> ${esc(s.title)}</h2>
    <p class="meta">${fmt(s.start)}–${fmt(s.end)} · ${(s.end - s.start).toFixed(1)}s · <b style="color:${hue[s.layout] || '#000'}">${esc(s.layout)} ${esc(LAYOUT[s.layout] || '')}</b></p>
    <h3>Voice</h3><p class="voice">“${esc(s.voice)}”</p>
    <h3>Captions</h3><p class="caps">${(s.captions || []).map((c) => `<span>${esc(c)}</span>`).join(' ')}</p>
    <h3>On screen</h3><p>${esc(s.onscreen)}</p>
    <h3>Animations</h3><ul>${(s.animations || []).map((a) => `<li><b>${fmt(a.t)}</b> ${esc(a.what)} <i>${a.dur ?? ''}s ${esc(a.ease || '')}</i></li>`).join('')}</ul>
    <h3>SFX</h3><p>${esc((s.sfx || []).join(' · ') || 'none')}</p>
    <div class="changes">CHANGES?</div>
  </div>
</section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${server.url}/"><link rel="stylesheet" href="${server.url}/assets/fonts/fonts.css"><style>
@page { size: A4; margin: 14mm; }
body { font: 10.5pt/1.45 Inter, sans-serif; color: #0B0B0F; margin: 0; }
h1 { font: italic 40pt/1 "Instrument Serif", serif; margin: 0 0 4mm; }
.sub { font: 9pt "JetBrains Mono", monospace; color: #5E5D58; margin: 0 0 8mm; }
.timeline { display: flex; height: 12mm; border-radius: 3mm; overflow: hidden; margin-bottom: 2mm; }
.timeline div { color: #fff; font: 700 8pt "JetBrains Mono"; display: flex; align-items: center; justify-content: center; border-right: 1px solid #fff; }
.axis { display: flex; justify-content: space-between; font: 8pt "JetBrains Mono"; color: #5E5D58; margin-bottom: 8mm; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 8mm; }
td, th { text-align: left; padding: 1.6mm 2mm; border-bottom: 1px solid #E2E1DC; vertical-align: top; }
th { font: 700 8pt "JetBrains Mono"; text-transform: uppercase; letter-spacing: .08em; color: #5E5D58; }
.box { background: #F2F1ED; border-radius: 3mm; padding: 4mm 5mm; margin-bottom: 4mm; }
.box h3 { margin-top: 0; }
h3 { font: 700 7.5pt "JetBrains Mono"; letter-spacing: .1em; text-transform: uppercase; color: #5E5D58; margin: 3mm 0 1mm; }
.scene { display: flex; gap: 6mm; break-inside: avoid; height: 120mm; padding-bottom: 5mm; margin-bottom: 5mm; border-bottom: 1px solid #E2E1DC; }
.scene:nth-of-type(2n) { break-after: page; }
.frames { display: flex; gap: 2mm; flex: none; }
figure { margin: 0; } figure img { height: 104mm; border-radius: 2mm; display: block; border: 1px solid #E2E1DC; }
figcaption { font: 8pt "JetBrains Mono"; color: #5E5D58; margin-top: 1mm; }
.info { min-width: 0; flex: 1; font-size: 9.5pt; }
.info h2 { font: 700 13pt Inter; margin: 0; } .id { font: 700 9pt "JetBrains Mono"; background: #FFE600; padding: .5mm 2mm; border-radius: 1.5mm; vertical-align: middle; }
.meta { font: 8.5pt "JetBrains Mono"; color: #5E5D58; margin: 1mm 0 0; }
.info p, .info ul { margin: 0; } .info ul { padding-left: 4mm; }
.voice { font: italic 12pt "Instrument Serif", serif; }
.caps span { font: 700 7.5pt "JetBrains Mono"; background: #2E2B2C; color: #fff; padding: .4mm 1.5mm; border-radius: 1mm; display: inline-block; margin: 0 .5mm .8mm 0; }
.changes { margin-top: 3mm; border: 1.5px dashed #EF4444; color: #EF4444; border-radius: 2mm; height: 14mm; padding: 1.5mm 2.5mm; font: 700 8pt "JetBrains Mono"; }
.cover { break-after: page; }
</style></head><body>
<div class="cover">
  <h1>${esc(brief.title)}</h1>
  <p class="sub">${esc(brief.style || '')} · 1080×1920 · 30 fps · ${dur.toFixed(1)}s · ${brief.scenes.length} scenes</p>
  <div class="timeline">${brief.scenes.map((s) => `<div style="flex:${s.end - s.start};background:${hue[s.layout] || '#555'}">${esc(s.id)}</div>`).join('')}</div>
  <div class="axis"><span>0:00</span><span>${fmt(dur / 2)}</span><span>${fmt(dur)}</span></div>
  <table><tr><th>#</th><th>Time</th><th>Layout</th><th>Scene</th></tr>
  ${brief.scenes.map((s) => `<tr><td>${esc(s.id)}</td><td>${fmt(s.start)}–${fmt(s.end)}</td><td>${esc(s.layout)} ${esc(LAYOUT[s.layout] || '')}</td><td>${esc(s.title)}</td></tr>`).join('')}</table>
  <div class="box"><h3>Audio plan</h3><p>${esc(brief.audio || '')}</p></div>
  ${brief.notes ? `<div class="box"><h3>Notes</h3><p>${esc(brief.notes)}</p></div>` : ''}
</div>
${brief.scenes.map(sceneCard).join('')}
</body></html>`;

const doc = await browser.newPage();
await doc.setContent(html, { waitUntil: 'networkidle' });
await doc.evaluate(async () => { await Promise.all(['700 10px "JetBrains Mono"', '400 10px "JetBrains Mono"', 'italic 10px "Instrument Serif"', '700 10px Inter'].map((f) => document.fonts.load(f))); await document.fonts.ready; });
console.log(await doc.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.status}`).join(", ")));
await doc.pdf({ path: OUT, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
await browser.close(); server.close();
console.log(`wrote ${OUT} (${brief.scenes.length} scenes)`);
