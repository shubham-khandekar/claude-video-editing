// Split-card reel kit: talking head + UI cards, for window.seek(t) films (1080x1920, 30 fps).
// Calm default: hard cuts between shots, gentle build-ins (power2.out, 0.3-0.6s), mono pill captions on the seam.
// Every draw call is a pure function of time. Face frames come from cut_silence.py (face/%05d.jpg).

export const W = 1080, H = 1920, SEAM = 768;
export const C = {
  paper: '#F2F1ED', grid: '#E7E6E1', ink: '#0B0B0F', sub: '#5E5D58', line: '#E2E1DC', card: '#FFFFFF',
  yellow: '#FFE600', yellowSoft: '#FFF6B3', green: '#22C55E', red: '#EF4444', cyan: '#22D3EE', orange: '#E8743B',
  blue: '#1D9BF0', dark: '#0A0C12', darkCard: '#111620', pill: 'rgba(46,43,44,0.92)',
};
export const F = { sans: 'Inter', mono: '"JetBrains Mono"', serif: '"Instrument Serif"' };

// ---------- time helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (x) => 1 - (1 - clamp(x)) ** 2;                     // power2.out
export const easeIO = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };
export const inn = (t, t0, d = 0.35) => ease((t - t0) / d);               // 0 -> 1 from t0 over d
export const lerp = (a, b, p) => a + (b - a) * p;
export function rng(seed = 1) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
// Time a word is spoken: at(words, 'dashboard') or at(words, 'dashboard', 2) for the 2nd occurrence.
export function at(words, needle, nth = 1, after = 0) {
  const n = needle.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  let k = 0;
  for (const w of words) {
    if (w.s < after) continue;
    if (w.w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === n && ++k === nth) return w.s;
  }
  throw new Error(`word "${needle}" #${nth} not found after ${after}s`);
}

// ---------- frame + face ----------
export class Reel {
  constructor({ canvas, words, face, fps = 30, handle = '', faceCrop = {} }) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.words = words; this.face = face; this.fps = fps;
    this.handle = handle; this.crop = { cx: 0.5, cy: 0.4, zoom: 1, ...faceCrop };
    this.shots = []; this.cache = new Map(); this.captions = chunk(words);
  }
  shot(t0, t1, opts) { this.shots.push({ t0, t1, layout: 'A', bg: 'paper', caption: true, watermark: true, ...opts }); return this; }
  async frame(t) {
    const n = Math.max(1, Math.round(t * this.fps) + 1), src = `${this.face}${String(n).padStart(5, '0')}.jpg`;
    if (!this.cache.has(src)) {
      if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(src, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
    }
    return this.cache.get(src);
  }
  // Draw the face filling box (x,y,w,h), cropped around crop.cx/cy, optional zoom.
  async drawFace(t, x, y, w, h, { zoom = this.crop.zoom, cx = this.crop.cx, cy = this.crop.cy, circle = false } = {}) {
    const im = await this.frame(t); if (!im) return;
    const s = Math.max(w / im.width, h / im.height) * zoom, sw = w / s, sh = h / s;
    const sx = clamp(cx * im.width - sw / 2, 0, im.width - sw), sy = clamp(cy * im.height - sh / 2, 0, im.height - sh);
    const g = this.g; g.save(); g.beginPath();
    circle ? g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2) : g.rect(x, y, w, h); g.clip();
    g.drawImage(im, sx, sy, sw, sh, x, y, w, h); g.restore();
  }
  async seek(t) {
    const g = this.g, s = this.shots.find((s) => t >= s.t0 && t < s.t1) || this.shots[this.shots.length - 1];
    const lt = t - s.t0;
    g.save(); g.clearRect(0, 0, W, H);
    background(g, s.layout === 'D' ? 'none' : s.bg);
    if (s.layout === 'A') await this.drawFace(t, 0, SEAM, W, H - SEAM, s.face);
    if (s.layout === 'D') await this.drawFace(t, 0, 0, W, H, s.face);
    if (s.draw) await s.draw(g, lt, t, s);
    if (s.layout === 'E') {
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 30; g.beginPath(); g.arc(40 + 115, 1500 + 115, 121, 0, 7);
      g.fillStyle = '#fff'; g.fill(); g.restore();
      await this.drawFace(t, 40, 1500, 230, 230, { ...s.face, circle: true });
    }
    if (s.layout === 'A') { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, SEAM, W, 2); }
    if (s.watermark && this.handle) watermark(g, this.handle, s.layout === 'D' || s.bg === 'dark');
    if (s.caption) caption(g, this.captions, t, s.captionY ?? (s.layout === 'A' ? SEAM : s.layout === 'D' ? 1480 : 1380));
    g.restore();
  }
}

// ---------- backgrounds, captions, watermark ----------
export function background(g, kind) {
  if (kind === 'none') { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
  if (kind === 'dark') {
    g.fillStyle = C.dark; g.fillRect(0, 0, W, H);
    const r = g.createRadialGradient(W / 2, 520, 0, W / 2, 520, 900);
    r.addColorStop(0, 'rgba(34,211,238,.16)'); r.addColorStop(1, 'rgba(34,211,238,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H); return;
  }
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  g.fillStyle = C.grid;
  for (let x = 0; x < W; x += 80) g.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 80) g.fillRect(0, y, W, 1);
}
// 2-3 word chunks; a chunk holds until the next one starts (or 0.4s after its last word).
export function chunk(words, max = 3) {
  const out = []; let cur = [];
  const flush = () => { if (cur.length) out.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((w) => w.w).join(' ') }); cur = []; };
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1], end = /[.,!?;:]$/.test(w.w);
    if (cur.length >= max || end || !next || next.s - w.e > 0.25) flush();
  });
  out.forEach((c, i) => { c.until = out[i + 1] ? Math.min(out[i + 1].s, c.e + 0.4) : c.e + 0.4; });
  return out;
}
export function caption(g, chunks, t, y) {
  const c = chunks.find((c) => t >= c.s && t < c.until); if (!c) return;
  const text = c.text.toUpperCase().replace(/[.,!?;:]+$/, '');
  g.save(); g.font = `700 44px ${F.mono}`; g.letterSpacing = '5px';
  const w = g.measureText(text).width + 64, x = (W - w) / 2;
  rr(g, x, y - 45, w, 90, 12, C.pill);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, y + 2);
  g.restore();
}
export function watermark(g, handle, light) {
  g.save(); g.globalAlpha = light ? 0.7 : 0.5; g.fillStyle = light ? '#fff' : '#000'; g.strokeStyle = g.fillStyle;
  g.font = `500 18px ${F.mono}`; g.textAlign = 'right'; g.textBaseline = 'middle';
  const y = H * 0.35, tw = g.measureText(handle).width;
  g.fillText(handle, W - 24, y);
  g.lineWidth = 2; const ix = W - 24 - tw - 34; rr(g, ix, y - 11, 22, 22, 6); g.stroke();
  g.beginPath(); g.arc(ix + 11, y, 5, 0, 7); g.stroke(); g.fillRect(ix + 16, y - 7, 2.5, 2.5);
  g.restore();
}

// ---------- drawing primitives ----------
export function rr(g, x, y, w, h, r, fill, stroke, lw = 1) {
  g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function text(g, s, x, y, { size = 32, weight = 600, font = F.sans, color = C.ink, align = 'left', base = 'alphabetic', italic = false, spacing = 0 } = {}) {
  g.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.letterSpacing = `${spacing}px`; g.fillText(s, x, y); g.letterSpacing = '0px';
  return g.measureText(s).width;
}
// Build-in wrapper: fade + slide up 14px (parts) or scale 0.96 -> 1 (cards). p = 0..1.
export function enter(g, p, fn, { dy = 14, scale = false, ox = W / 2, oy = 0 } = {}) {
  if (p <= 0) return;
  g.save(); g.globalAlpha *= clamp(p);
  if (scale) { const s = lerp(0.96, 1, p); g.translate(ox, oy); g.scale(s, s); g.translate(-ox, -oy); }
  else g.translate(0, (1 - p) * dy);
  fn(); g.restore();
}
export function card(g, x, y, w, h, p, fn, { dark = false, r = 26 } = {}) {
  enter(g, p, () => {
    g.save(); g.shadowColor = dark ? 'rgba(34,211,238,.25)' : 'rgba(0,0,0,.12)'; g.shadowBlur = 30; g.shadowOffsetY = dark ? 0 : 12;
    rr(g, x, y, w, h, r, dark ? C.darkCard : C.card); g.restore();
    rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r, null, dark ? 'rgba(34,211,238,.35)' : C.line, dark ? 1.5 : 1);
    g.save(); g.beginPath(); g.roundRect(x, y, w, h, r); g.clip(); fn(); g.restore();
  }, { scale: true, ox: x + w / 2, oy: y + h / 2 });
}
export function chrome(g, x, y, w, url, { chip } = {}) {
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { g.beginPath(); g.arc(x + 28 + i * 24, y + 30, 7, 0, 7); g.fillStyle = c; g.fill(); });
  rr(g, x + 110, y + 14, w - 220, 34, 17, '#F1F0EC');
  text(g, url, x + 132, y + 37, { size: 18, weight: 500, font: F.mono, color: C.sub });
  if (chip) chipEl(g, x + w - 24, y + 31, chip.text, chip.color || C.green, { align: 'right' });
  g.fillStyle = C.line; g.fillRect(x, y + 60, w, 1);
}
export function chipEl(g, x, y, s, color = C.green, { align = 'left', filled = false, dashed = false, size = 18 } = {}) {
  g.font = `700 ${size}px ${F.mono}`; const w = g.measureText(s).width + 24, h = size + 16, x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  g.save(); if (dashed) g.setLineDash([6, 5]);
  rr(g, x0, y - h / 2, w, h, h / 2, filled ? color : hexA(color, 0.12), color, 1.5); g.restore();
  text(g, s, x0 + 12, y + 1, { size, weight: 700, font: F.mono, color: filled ? '#fff' : color, base: 'middle' });
  return w;
}
export function button(g, x, y, w, h, label, { fill = C.ink, color = '#fff', press = 0 } = {}) {
  g.save(); const s = 1 - 0.08 * press; g.translate(x + w / 2, y + h / 2); g.scale(s, s); g.translate(-x - w / 2, -y - h / 2);
  rr(g, x, y, w, h, h / 2, fill); text(g, label, x + w / 2, y + h / 2 + 1, { size: h * 0.38, weight: 700, color, align: 'center', base: 'middle' });
  g.restore();
}
export function bar(g, x, y, w, h, p, color = C.green, track = '#EEEDE8') { rr(g, x, y, w, h, h / 2, track); if (p > 0) rr(g, x, y, Math.max(h, w * clamp(p)), h, h / 2, color); }
export function avatar(g, x, y, r, initials, color = C.orange) {
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = color; g.fill();
  text(g, initials, x, y + 1, { size: r * 0.8, weight: 800, color: '#fff', align: 'center', base: 'middle' });
}
export function check(g, x, y, r, p, color = C.green) {
  if (p <= 0) return;
  g.beginPath(); g.arc(x, y, r * ease(p * 1.6), 0, 7); g.fillStyle = color; g.fill();
  const q = clamp((p - 0.3) / 0.7); if (q <= 0) return;
  const pts = [[x - r * 0.42, y + r * 0.02], [x - r * 0.1, y + r * 0.34], [x + r * 0.45, y - r * 0.3]];
  g.save(); g.strokeStyle = '#fff'; g.lineWidth = r * 0.22; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
  const seg = q * 2; for (let i = 0; i < 2; i++) { const k = clamp(seg - i); if (k <= 0) break; g.lineTo(lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)); }
  g.stroke(); g.restore();
}
export function cursor(g, x, y, press = 0) {
  g.save(); g.translate(x, y); const s = 1.4 * (1 - 0.08 * press); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.lineTo(8, 23); g.lineTo(14, 36); g.lineTo(19, 34); g.lineTo(13, 21); g.lineTo(23, 21); g.closePath();
  g.fillStyle = '#111'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke(); g.restore();
}
// Cursor path: keys [[t, x, y], ...] glide with power2.inOut over 0.4s; clicks: [t, ...].
export function cursorAt(t, keys, clicks = []) {
  let x = keys[0][1], y = keys[0][2];
  for (let i = 1; i < keys.length; i++) { const p = easeIO((t - keys[i][0]) / 0.4); x = lerp(x, keys[i][1], p); y = lerp(y, keys[i][2], p); }
  const press = Math.max(0, ...clicks.map((c) => 1 - Math.abs(t - c) / 0.1));
  return { x, y, press };
}
export function counter(t, t0, to, d = 1.2, from = 0) { return from + (to - from) * ease((t - t0) / d); }
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
// Line chart in box; values 0..1; p = draw progress 0..1.
export function lineChart(g, x, y, w, h, values, p, { color = C.ink, labels = [], fill = true } = {}) {
  g.save(); g.setLineDash([4, 6]); g.strokeStyle = C.line; g.lineWidth = 1;
  for (let i = 0; i <= 3; i++) { g.beginPath(); g.moveTo(x, y + (h * i) / 3); g.lineTo(x + w, y + (h * i) / 3); g.stroke(); }
  g.restore();
  labels.forEach((l, i) => text(g, l, x + (w * i) / (labels.length - 1), y + h + 30, { size: 16, weight: 500, font: F.mono, color: C.sub, align: 'center' }));
  const pts = values.map((v, i) => [x + (w * i) / (values.length - 1), y + h - v * h]);
  const n = (pts.length - 1) * clamp(p), k = Math.floor(n), f = n - k;
  const path = pts.slice(0, k + 1); if (k < pts.length - 1) path.push([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]);
  if (path.length < 2) return pts;
  if (fill) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, hexA(color, 0.18)); gr.addColorStop(1, hexA(color, 0));
    g.beginPath(); g.moveTo(path[0][0], y + h); path.forEach((q) => g.lineTo(...q)); g.lineTo(path[path.length - 1][0], y + h); g.fillStyle = gr; g.fill(); }
  g.beginPath(); path.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q))); g.strokeStyle = color; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
  const end = path[path.length - 1]; g.beginPath(); g.arc(end[0], end[1], 9, 0, 7); g.fillStyle = color; g.fill();
  return pts;
}
export function bars(g, x, y, w, h, values, t, t0, { color = C.ink, stagger = 0.08, labels = [] } = {}) {
  const bw = w / values.length;
  values.forEach((v, i) => { const p = inn(t, t0 + i * stagger, 0.45), bh = h * v * p; rr(g, x + i * bw + bw * 0.18, y + h - bh, bw * 0.64, bh, 8, i === values.length - 1 ? C.yellow : color);
    if (labels[i]) text(g, labels[i], x + i * bw + bw / 2, y + h + 30, { size: 16, weight: 500, font: F.mono, color: C.sub, align: 'center' }); });
}
export function toast(g, x, y, w, s, p, color = C.green) {
  enter(g, p, () => { g.save(); g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(g, x, y, w, 76, 20, C.ink); g.restore();
    check(g, x + 40, y + 38, 16, p, color); text(g, s, x + 72, y + 47, { size: 26, weight: 600, color: '#fff' }); });
}
export function terminal(g, x, y, w, h, lines, t, { t0 = 0, cps = 28, title = 'zsh' } = {}) {
  rr(g, x, y, w, h, 20, '#1E1E1E');
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { g.beginPath(); g.arc(x + 26 + i * 22, y + 26, 6.5, 0, 7); g.fillStyle = c; g.fill(); });
  text(g, title, x + w / 2, y + 32, { size: 16, weight: 500, font: F.mono, color: '#8A8A8A', align: 'center' });
  let budget = Math.max(0, (t - t0) * cps);
  lines.forEach((ln, i) => { const s = ln.text.slice(0, Math.floor(budget)); budget -= ln.text.length;
    if (s) text(g, (ln.prompt ? '$ ' : '') + s, x + 28, y + 90 + i * 44, { size: 24, weight: 500, font: F.mono, color: ln.color || '#E6E6E6' }); });
}
export function stamp(g, x, y, s, p, color = C.red) {
  if (p <= 0) return; g.save(); g.globalAlpha = clamp(p); g.translate(x, y); g.rotate(-6 * Math.PI / 180); const k = lerp(1.3, 1, ease(p)); g.scale(k, k);
  g.font = `800 54px ${F.sans}`; const w = g.measureText(s).width + 48; rr(g, -w / 2, -42, w, 84, 12, null, color, 5);
  text(g, s, 0, 2, { size: 54, weight: 800, color, align: 'center', base: 'middle' }); g.restore();
}
export function circleMark(g, x, y, rx, ry, p, color = C.red) {
  if (p <= 0) return; g.save(); g.strokeStyle = color; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
  g.ellipse(x, y, rx, ry, -0.08, -Math.PI * 0.6, -Math.PI * 0.6 + Math.PI * 2.1 * ease(p)); g.stroke(); g.restore();
}
export function note(g, s, x, y, p, { color = C.red, size = 54 } = {}) { enter(g, p, () => text(g, s, x, y, { size, weight: 400, font: F.serif, italic: true, color })); }
export function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- three.js ----------
// const s3 = await three3d(THREE, 908, 520, (scene, camera) => ({ update(t) { ... } }));
// then inside a shot: s3.draw(g, x, y, t)
export async function three3d(THREE, w, h, setup) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  const api = await setup(scene, camera, renderer);
  return { draw(g, x, y, t) { api.update(t); renderer.render(scene, camera); g.drawImage(cv, x, y); } };
}

// ---------- audio cues ----------
// Films push {t, kind} into window.CUES; scripts/cues.mjs exports them for reel_audio.py.
export function cue(list, t, kind) { list.push({ t: Math.round(t * 1000) / 1000, kind }); return t; }
