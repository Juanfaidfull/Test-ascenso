'use strict';
/* =====================================================================
   ASCENSO 3.0 · dibujo: héroe personalizable (por tonos), sprites con
   squash, plataformas por tipo, objetos y proyectiles. Sin imágenes
   faltantes: cada dibujo se salta en silencio si no hay sprite.
   ===================================================================== */
const TILE_NAMES = ['g_l','g_m','g_r','g_m2','g_m3','b_l','b_m1','b_m2','b_m3','b_r','b_l2','b_m4','b_m5','b_m6','b_r2','rk_l','rk_m','rk_r','st_l','st_m','st_r','sb_m','pk_l','pk_m','pk_r','trunk','trunk2'];
const TI = {}; TILE_NAMES.forEach((n, i) => { TI[n] = i; });

/* ---------- personalización: cada parte se pinta con una rampa de 3 tonos (oscuro, medio, claro) ---------- */
const HERO_OPT = {
  skin: [
    { name: 'Natural', ramp: null, chip: '#d2947f' },
    { name: 'Bronce', ramp: ['#7a4a2f', '#b97a4c', '#e0a574'], chip: '#b97a4c' },
    { name: 'Clara', ramp: ['#c79b8b', '#f0c6b4', '#fff0e6'], chip: '#f0c6b4' },
    { name: 'Oscura', ramp: ['#4a2b20', '#7d4a36', '#a86a4f'], chip: '#7d4a36' },
    { name: 'Pálida', ramp: ['#b59aa0', '#e5d0d4', '#fff7f5'], chip: '#e5d0d4' },
    { name: 'Olivácea', ramp: ['#6b6b3c', '#9ba36b', '#cfd49c'], chip: '#9ba36b' }
  ],
  hair: [
    { name: 'Castaño', ramp: null, chip: '#7d5556' },
    { name: 'Negro', ramp: ['#0c0a10', '#2a2430', '#4c4459'], chip: '#2a2430' },
    { name: 'Rubio', ramp: ['#9a6a2a', '#e0b35a', '#fff0b3'], chip: '#e0b35a' },
    { name: 'Pelirrojo', ramp: ['#5a1f10', '#b5482a', '#f08a5a'], chip: '#b5482a' },
    { name: 'Blanco', ramp: ['#7a7a8a', '#c9cbd6', '#f5f6fa'], chip: '#c9cbd6' },
    { name: 'Azul', ramp: ['#1d2c6b', '#3c5fc2', '#8fb4ff'], chip: '#3c5fc2' }
  ],
  shirt: [
    { name: 'Blanca', ramp: null, chip: '#eef4f7' },
    { name: 'Gris', ramp: ['#4a4f5c', '#9aa0ad', '#e4e8ef'], chip: '#9aa0ad' },
    { name: 'Azul claro', ramp: ['#4d7fb8', '#8fc2ec', '#e3f4ff'], chip: '#8fc2ec' },
    { name: 'Menta', ramp: ['#2f7a6a', '#7fd6bf', '#dcfff4'], chip: '#7fd6bf' },
    { name: 'Naranja', ramp: ['#a0431a', '#f08a3c', '#ffd2a6'], chip: '#f08a3c' },
    { name: 'Púrpura', ramp: ['#3d2166', '#8c5fd0', '#e2d2ff'], chip: '#8c5fd0' }
  ],
  cape: [
    { name: 'Magenta', ramp: null, chip: '#cd3073' },
    { name: 'Carmesí', ramp: ['#4a0a14', '#c42b3a', '#ff7a6b'], chip: '#c42b3a' },
    { name: 'Turquesa', ramp: ['#0f4a4a', '#2fb6a8', '#9af2e0'], chip: '#2fb6a8' },
    { name: 'Dorada', ramp: ['#6b4212', '#d99a2b', '#ffe08a'], chip: '#d99a2b' },
    { name: 'Violeta', ramp: ['#2b1450', '#7a3fd0', '#c9a6ff'], chip: '#7a3fd0' }
  ],
  shoes: [
    { name: 'Natural', ramp: null, chip: '#7a4a2c' },
    { name: 'Marrón', ramp: ['#3b2415', '#7a4a2c', '#b57a4a'], chip: '#7a4a2c' },
    { name: 'Negro', ramp: ['#0c0c10', '#2a2a33', '#4f4f5c'], chip: '#2a2a33' },
    { name: 'Blanco', ramp: ['#8a8f9c', '#d6dae3', '#f7f8fb'], chip: '#d6dae3' },
    { name: 'Azul', ramp: ['#1a2a6b', '#2f56c4', '#7fa8ff'], chip: '#2f56c4' },
    { name: 'Verde', ramp: ['#1d4d2a', '#3f9c57', '#9ce0a8'], chip: '#3f9c57' },
    { name: 'Rojo', ramp: ['#5a1212', '#b82a2a', '#f58a7a'], chip: '#b82a2a' }
  ],
  pants: [
    { name: 'Azul', ramp: null, chip: '#1c548e' },
    { name: 'Grafito', ramp: ['#15161c', '#3a3f4d', '#7a8294'], chip: '#3a3f4d' },
    { name: 'Verde', ramp: ['#123a22', '#2f7a45', '#8fd08a'], chip: '#2f7a45' },
    { name: 'Granate', ramp: ['#3a0a12', '#8a1f2c', '#d4606a'], chip: '#8a1f2c' },
    { name: 'Negro', ramp: ['#050508', '#1a1b22', '#3d4150'], chip: '#1a1b22' }
  ]
};
/* tamaño con que se dibuja el héroe en partida (1 = tamaño original). La caja de colisión no cambia. */
const HERO_VIEW = 1.25;
const LABEL_NAMES = ['', 'skin', 'shirt', 'hair', 'cape', 'pants', 'shoes'];
/* aspecto que se comparte con los demás: solo claves válidas; índice de la lista o color #rrggbb; lo demás vuelve al básico */
function shareLook() {
  const raw = (typeof store !== 'undefined' && store.get('hero', HERO_DEFAULT_CFG)) || {}, out = {};
  for (const k of Object.keys(HERO_DEFAULT_CFG)) {
    const v = raw[k];
    if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) out[k] = v.toLowerCase();
    else if (typeof v === 'number' && HERO_OPT[k] && v >= 0 && v < HERO_OPT[k].length) out[k] = Math.floor(v);
    else out[k] = 0;
  }
  out.char = (typeof store !== 'undefined' && store.get('char', 'hero') === 'chica') ? 'chica' : ((typeof Chars !== 'undefined' && Chars.resolve()) || 'hero');   /* qué personaje es (para los demás jugadores) */
  return out;
}
const HERO_DEFAULT_CFG = { skin: 0, hair: 0, shirt: 0, cape: 0, pants: 0, shoes: 0 };
const SET_TEST = {
  skin: (h, s, l) => (h <= 35 || h >= 350) && s > 0.22 && l > 0.58,
  shirt: (h, s, l) => s < 0.3 && l > 0.7,
  hair: (h, s, l) => (h >= 345 || h <= 45) && s < 0.45 && l > 0.14 && l < 0.6,
  cape: (h, s, l) => h >= 270 && h < 340 && s > 0.2 && l > 0.12 && l < 0.85,
  pants: (h, s, l) => h >= 190 && h < 240 && s > 0.2 && l > 0.08 && l < 0.8,
  shoes: (h, s, l) => h >= 12 && h < 48 && s > 0.16 && l > 0.14 && l < 0.7
};
function rampColor(ramp, t) {
  const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const [a, b, c] = ramp.map(hx);
  const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  return t < 0.5 ? mix(a, b, t * 2) : mix(b, c, (t - 0.5) * 2);
}
/* conversión de color: el jugador elige cualquier tono y la rampa de sombras sale de ese mismo color */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = 60 * ((((g - b) / d) % 6) + 6) % 360;
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, s, l];
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = v => Math.max(0, Math.min(255, Math.round((v + m) * 255))).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}
function customRamp(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex(h, s * 0.85, Math.max(0.06, l - 0.2)), hex, hslToHex(h, s * 0.8, Math.min(0.97, l + 0.2))];
}
const HeroArt = {
  cache: {}, base: null, range: null,
  anims: { idle: 10, walk: 10, run: 10, jump: 6, fall: 4, fall_loop: 3, combo_1: 3, combo_1_end: 4 },
  loadBase() {
    if (this.base) return true;
    const base = {};
    for (const a of Object.keys(this.anims)) {
      const im = Img.get((this.folder || 'hero') + '/' + a + '.png');
      if (!Img.ready(im)) return false;
      base[a] = toCanvas(im);
    }
    this.base = base;
    this.range = { skin: [1, 0], shirt: [1, 0], hair: [1, 0], cape: [1, 0], pants: [1, 0], shoes: [1, 0] };
    for (const a of ['idle', 'walk']) {
      const c = this.base[a]; let d = new Uint8ClampedArray(0);   /* sin permiso para leer píxeles (archivos sueltos): se usan los valores por defecto */
      try { d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; } catch (e) { }
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const idx = i / 4, y = Math.floor(idx / c.width);
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        const set = this.setOf(h, s, l, y);
        if (set) { this.range[set][0] = Math.min(this.range[set][0], l); this.range[set][1] = Math.max(this.range[set][1], l); }
      }
    }
    return true;
  },
  setOf(h, s, l, y) {
    if (SET_TEST.skin(h, s, l)) return 'skin';
    if (SET_TEST.shirt(h, s, l)) return 'shirt';
    if (y < HERO.FH * 0.55 && SET_TEST.hair(h, s, l)) return 'hair';
    if (SET_TEST.cape(h, s, l)) return 'cape';
    if (y >= HERO.FH * 0.5 && SET_TEST.pants(h, s, l)) return 'pants';
    if (y >= HERO.FH * 0.72 && SET_TEST.shoes(h, s, l)) return 'shoes';
    return null;
  },
  /* uniforme de equipo (VS): todo el personaje en el color del equipo, menos la cara */
  teamStrips(team) { try { return this.teamStripsRaw(team); } catch (e) { return null; } },   /* sin colores de equipo si el navegador no deja leer píxeles */
  teamStripsRaw(team) {
    const key = 'team:' + team;
    if (this.cache[key]) return this.cache[key];
    if (!this.loadBase()) return null;
    const ramp = TEAM_RAMP[team] || TEAM_RAMP.verde, out = {};
    for (const a of Object.keys(this.anims)) {
      const src = this.base[a], c = document.createElement('canvas');
      c.width = src.width; c.height = src.height;
      const g = c.getContext('2d'); g.drawImage(src, 0, 0);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data, w = c.width;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const y = Math.floor(i / 4 / w);
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        const set = this.setOf(h, s, l, y);
        if (!set || set === 'skin') continue;
        const col = rampColor(ramp, clamp(l, 0, 1));
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2];
      }
      g.putImageData(id, 0, 0); out[a] = c;
    }
    this.cache[key] = out;
    return out;
  },
  strips(cfg) {
    const key = JSON.stringify(cfg);
    if (this.cache[key]) return this.cache[key];
    if (Object.keys(this.cache).length > 30) this.cache = {};   /* con el deslizador se generan muchos tonos: no crecer sin fin */
    if (!this.loadBase()) return null;
    const out = {};
    for (const a of Object.keys(this.anims)) out[a] = this.recolor(this.base[a], cfg);
    this.cache[key] = out; return out;
  },
  /* rampa de una parte: una opción de la lista o un color libre elegido por el jugador (#rrggbb) */
  rampFor(set, v) {
    if (typeof v === 'string') { if (!this.rampCache) this.rampCache = {}; const k = set + v; return this.rampCache[k] || (this.rampCache[k] = customRamp(v)); }
    const opt = HERO_OPT[set][v]; return opt && opt.ramp ? opt.ramp : null;
  },
  recolor(src, cfg) { try { return this.recolorRaw(src, cfg); } catch (e) { return src; } },   /* sin personalización: se ve el héroe normal */
  /* parte de cada píxel: la clasificación por color y, para los píxeles sin parte con color (reflejos y bordes
     claros), la parte que tienen la mayoría de sus vecinos; así no quedan zonas con el color original */
  labelsOf(src) {
    if (!this.labelCache) this.labelCache = new Map();
    if (this.labelCache.has(src)) return this.labelCache.get(src);
    const w = src.width, hh = src.height, d = src.getContext('2d').getImageData(0, 0, w, hh).data, n = w * hh;
    const lab = new Uint8Array(n), sat = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (d[i * 4 + 3] < 8) continue;
      const [h, s, l] = rgb2hsl(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      sat[i] = s;
      const k = LABEL_NAMES.indexOf(this.setOf(h, s, l, Math.floor(i / w)) || '');
      if (k > 0) lab[i] = k;
    }
    const out = lab.slice();
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (lab[i] || d[i * 4 + 3] < 200 || sat[i] < 0.12) continue;   /* sin parte, visible y con color (no contorno negro) */
      const cnt = [0, 0, 0, 0, 0, 0, 0];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= hh) continue;
        cnt[lab[ny * w + nx]]++;
      }
      let best = 1; for (let k = 2; k < cnt.length; k++) if (cnt[k] > cnt[best]) best = k;
      if (cnt[best] >= 4) out[i] = best;
    }
    this.labelCache.set(src, out); return out;
  },
  recolorRaw(src, cfg) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data, w = c.width, lab = this.labelsOf(src);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const idx = i / 4, k = lab[idx];
      if (!k) continue;
      const set = LABEL_NAMES[k], [, , l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      const ramp = this.rampFor(set, cfg[set] || 0);
      if (!ramp) continue;
      const [lo, hi] = this.range[set];
      const t = clamp((l - lo) / ((hi - lo) || 1), 0, 1);
      const col = rampColor(ramp, t);
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2];
    }
    g.putImageData(id, 0, 0); return c;
  }
};

/* dibuja un cuadro de una tira horizontal con los pies en (x, y) y el centro en x.
   sqY: aplastamiento vertical (squash) manteniendo el volumen aproximado. */
/* enemigos cuyo dibujo mira a la izquierda por defecto (la araña): se voltean al revés */
const FACE_LEFT_ART = { arana: true };
/* jefes cuyo arte mira a la izquierda: se giran al revés para que caminen de frente hacia donde van */
/* pies de cada jefe: el arte deja unos píxeles de aire bajo los pies; se bajan para que pisen el piso */
const BOSS_FOOT_PAD = {};
const BOSS_ART_LEFT = { demonio_slime: true, guardian_hielo: true, minotauro: true, daddy: true };
function bossFlipped(b) { return BOSS_ART_LEFT[b.kind] ? b.face > 0 : b.face < 0; }
function drawStrip(ctx, strip, idx, fw, fh, x, y, flip, scale = 1, alpha = 1, sqY = 1) {
  if (!strip) return;
  const n = Math.max(1, Math.floor(strip.width / fw));
  const i = ((idx % n) + n) % n;
  const sx = scale / Math.sqrt(sqY), sy = scale * sqY;
  const dw = fw * sx, dh = fh * sy;
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
  ctx.drawImage(strip, i * fw, 0, fw, fh, Math.round(x - dw / 2), Math.round(y - dh), dw, dh);
  ctx.restore();
}
/* Normaliza el tamaño VISIBLE de cada personaje. Las hojas nuevas contienen mucho
   margen transparente; recortamos el alfa por cuadro para que todos tengan la misma
   altura en pantalla y los pies queden sobre la misma línea que el héroe original. */
const CHAR_BOUNDS_CACHE = new WeakMap();
function drawCharacterFrame(ctx, strip, idx, fw, fh, x, y, flip, targetH, alpha = 1, sqY = 1) {
  if (!strip || !strip.width || !strip.height) return;
  const count = Math.max(1, Math.floor(strip.width / fw));
  const frame = ((idx % count) + count) % count;
  let cache = CHAR_BOUNDS_CACHE.get(strip);
  if (!cache) { cache = new Map(); CHAR_BOUNDS_CACHE.set(strip, cache); }
  let b = cache.get(frame);
  if (!b) {
    try {
      const cv = document.createElement('canvas'); cv.width = fw; cv.height = fh;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(strip, frame * fw, 0, fw, fh, 0, 0, fw, fh);
      const data = g.getImageData(0, 0, fw, fh).data;
      let minX = fw, minY = fh, maxX = -1, maxY = -1;
      for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) {
        if (data[(yy * fw + xx) * 4 + 3] > 8) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
      }
      b = maxX >= minX && maxY >= minY ? { x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1 } : null;
    } catch (_) { b = null; }
    cache.set(frame, b);
  }
  if (!b) { drawStrip(ctx, strip, frame, fw, fh, x, y, flip, targetH / fh, alpha, sqY); return; }
  const dh = targetH * sqY, dw = b.w * (dh / b.h), dx = Math.round(x - dw / 2), dy = Math.round(y - dh);
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
  ctx.drawImage(strip, frame * fw + b.x, b.y, b.w, b.h, dx, dy, dw, dh);
  ctx.restore();
}

function frameFromAnim(time, fps, n, loop) {
  const f = Math.floor(time * fps);
  return loop ? f % n : Math.min(f, n - 1);
}

/* ---------- dibujo de objetos y escenario (el fondo está en backgrounds.js) ---------- */
/* ---------- sprites precalculados: cada elemento fijo se dibuja en canvas una sola vez ---------- */
const Sprites = {
  c: {},
  make(key, w, h, fn) {
    if (this.c[key]) return this.c[key];
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, w, h);
    return (this.c[key] = cv);
  },
  heart(full) { const im = Img.get('ui/corazon.png'); if (Img.ready(im)) return this.make(full ? 'hfI' : 'heI', 14, 14, g => { g.imageSmoothingEnabled = false; g.filter = full ? 'none' : 'grayscale(1) brightness(.5)'; g.drawImage(im, 0, 0, 14, 14); g.filter = 'none'; }); return this.make(full ? 'hf' : 'he', 12, 11, g => {
    g.fillStyle = full ? '#ff4f7a' : 'rgba(255,255,255,0.22)';
    g.fillRect(1, 2, 4, 3); g.fillRect(7, 2, 4, 3); g.fillRect(0, 3, 12, 4); g.fillRect(2, 7, 8, 2); g.fillRect(4, 9, 4, 1);
    if (full) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(2, 3, 2, 1); }
  }); },
  ball() { return this.make('ball', 9, 9, g => {
    g.fillStyle = '#7d8590'; g.beginPath(); g.arc(4.5, 4.5, 4.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e6edf5'; g.beginPath(); g.arc(3.4, 3.4, 1.6, 0, Math.PI * 2); g.fill();
  }); },
  shield() { return this.make('shield', 12, 12, g => {
    g.fillStyle = '#9ee7ff';
    g.beginPath(); g.moveTo(6, 1); g.lineTo(11, 3); g.lineTo(11, 7); g.lineTo(6, 11); g.lineTo(1, 7); g.lineTo(1, 3); g.closePath(); g.fill();
  }); },
  upgrade() { return this.make('upg', 22, 22, g => {
    const r = g.createRadialGradient(11, 11, 2, 11, 11, 11); r.addColorStop(0, 'rgba(255,240,180,0.9)'); r.addColorStop(1, 'rgba(255,211,74,0)');
    g.fillStyle = r; g.fillRect(0, 0, 22, 22);
    g.fillStyle = '#fff3b0'; g.beginPath(); g.moveTo(11, 3); g.lineTo(18, 11); g.lineTo(11, 19); g.lineTo(4, 11); g.closePath(); g.fill();
    g.fillStyle = '#c28a2c'; g.beginPath(); g.moveTo(11, 11); g.lineTo(18, 11); g.lineTo(11, 19); g.closePath(); g.fill();
  }); },
  glow(col) { return this.make('glow' + col, 32, 32, g => {
    const r = g.createRadialGradient(16, 16, 1, 16, 16, 16); r.addColorStop(0, col + 'cc'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  }); },
  shieldPlate() { return this.make('plate', 6, 14, g => {
    g.fillStyle = 'rgba(190,206,224,0.9)'; g.fillRect(0, 0, 6, 14);
    g.fillStyle = 'rgba(70,90,120,0.9)'; g.fillRect(2, 3, 2, 8);
  }); },
  bush() { return this.make('bush', 22, 14, g => {
    g.fillStyle = '#2f6b2a'; g.beginPath(); g.arc(7, 9, 6, 0, Math.PI * 2); g.arc(14, 8, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5fa844'; g.fillRect(4, 5, 4, 2); g.fillRect(12, 3, 4, 2);
  }); },
  rock() { return this.make('rock', 14, 9, g => {
    g.fillStyle = '#5b5566'; g.beginPath(); g.moveTo(1, 8); g.lineTo(4, 2); g.lineTo(10, 1); g.lineTo(13, 8); g.closePath(); g.fill();
    g.fillStyle = '#8e879a'; g.fillRect(5, 3, 3, 2);
  }); },
  lamp() { return this.make('lamp', 10, 22, g => {
    g.fillStyle = 'rgba(255,211,74,0.22)'; g.beginPath(); g.arc(5, 6, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3d3247'; g.fillRect(4, 8, 2, 14);
    g.fillStyle = '#ffd34a'; g.fillRect(3, 4, 4, 4);
  }); }
};
/* las plataformas se dibujan en un canvas propio la primera vez: después, una sola copia por plataforma */
const PlatBake = new WeakMap();
function bakePlat(p) {
  let c = PlatBake.get(p); if (c) return c;
  const tiles = Img.get('tiles/tiles.png'); if (!Img.ready(tiles)) return null;
  const cols = Math.max(1, Math.round(p.w / TILE)), rows = Math.max(2, Math.ceil(p.h / TILE));
  c = document.createElement('canvas'); c.width = cols * TILE; c.height = rows * TILE;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const T = (name, x, y) => g.drawImage(tiles, TI[name] * 16, 0, 16, 16, x, y, 16, 16);
  const hash = (id, k) => { const v = Math.sin((id || 1) * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const BODY = ['b_m1', 'b_m2', 'b_m3', 'b_m4', 'b_m5', 'b_m6'];
  for (let k = 0; k < cols; k++) {
    const x = k * TILE, first = k === 0, last = k === cols - 1, r = hash(p.id, k);
    if (p.kind === 'bridge') {
      T(first ? 'pk_l' : last ? 'pk_r' : 'pk_m', x, 0);
      T(first ? 'b_l' : last ? 'b_r' : 'b_m2', x, TILE);
    } else if (p.style === 1) {
      T(first ? 'st_l' : last ? 'st_r' : 'st_m', x, 0);
      for (let rr = 1; rr < rows; rr++) T(first ? 'rk_l' : last ? 'rk_r' : (r < 0.35 ? 'sb_m' : 'rk_m'), x, rr * TILE);
    } else {
      T(first ? 'g_l' : last ? 'g_r' : (r < 0.33 ? 'g_m2' : r < 0.66 ? 'g_m' : 'g_m3'), x, 0);
      for (let rr = 1; rr < rows; rr++) T(first ? 'b_l' : last ? 'b_r' : BODY[Math.floor(hash(p.id, k + rr * 7) * BODY.length) % BODY.length], x, rr * TILE);
    }
  }
  PlatBake.set(p, c); return c;
}
const Scene = {
  /* plataformas visibles (culling en x e y); la decoración va encima */
  drawEnemy(ctx, e, camY) {
    const y = e.y - camY, def = ENEMY_SHEETS[e.kind], sc = ENEMY_DEF[e.kind].scale;
    let a = e.dying > 0 ? 'death' : (e.hurt > 0 ? 'hurt' : e.anim);
    if (!def[a]) a = e.fly ? 'fly' : 'walk';
    if (!def[a]) return;
    const [file, n, fw, fh] = def[a];
    const im = Img.get(file); if (!Img.ready(im)) return;
    const loop = a !== 'death' && a !== 'attack';
    const fps = a === 'death' ? 12 : a === 'attack' ? 14 : 9;
    const idx = e.dying > 0 ? Math.min(n - 1, Math.floor((0.46 - e.dying) * 12)) : frameFromAnim(e.animT, fps, n, loop);
    const alpha = e.dying > 0 ? 0.55 : (e.kind === 'camaleon' && e.hidden ? 0.13 : 1);
    if (e.kind === 'sanador' && e.dying <= 0) ctx.drawImage(Sprites.glow('#7dffb0'), Math.round(e.x - 16), Math.round(y - 34));
    drawStrip(ctx, im, idx, fw, fh, e.x, y, FACE_LEFT_ART[e.kind] ? e.face > 0 : e.face < 0, sc, alpha);
    if (e.kind === 'escudero' && e.shieldHp > 0 && e.dying <= 0) ctx.drawImage(Sprites.shieldPlate(), Math.round(e.x + e.dir * 9 - 3), Math.round(y - 24));
    if (e.hitFlash > 0 && e.dying <= 0) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(Math.round(e.x - 8), Math.round(y - 22), 16, 22); }
  },
  /* el rayo del golem láser: el cuadro del rayo se gira hacia el jugador desde el emisor (fila 30, columna 30 del cuadro) */
  drawLaser(ctx, b, camY, t) {
    const z = b.lz, img = Img.get('boss/mecha_laser.png'); if (!Img.ready(img)) return;
    const BEAM_ROW = 30, EMIT_X = 30;
    ctx.save(); ctx.translate(z.ex, z.ey - camY); ctx.rotate(z.ang);
    if (z.st === 'aim') {
      ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(122,240,255,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(z.L * 0.85, 0); ctx.stroke(); ctx.setLineDash([]);
      const fi = z.t > 0.35 ? 1 + (Math.floor(t * 10) % 2) : 2;
      ctx.drawImage(img, 0, fi * 300, 300, 300, -EMIT_X, -BEAM_ROW, 300, 300);
    } else {
      const s = z.L / 269, fi = 3 + (Math.floor(t * 14) % 2);
      ctx.drawImage(img, 0, fi * 300, 300, 300, -EMIT_X * s, -BEAM_ROW * s, 300 * s, 300 * s);
    }
    ctx.restore();
  },
  /* barra de vida del jefe sobre su cabeza (no en el marcador) */
  /* fila donde empieza el contenido del jefe (su cabeza), medida una vez por ficha sobre su primer cuadro */
  headRow(d) {
    d._head = d._head || {};
    if (d._head[d.idle] !== undefined) return d._head[d.idle];
    const im = Img.get(d.idle); if (!im || !Img.ready(im)) return null;
    const w = Math.min(im.naturalWidth, d.fw), cv = document.createElement('canvas'); cv.width = w; cv.height = d.fh;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0, w, d.fh, 0, 0, w, d.fh);
    const data = c.getImageData(0, 0, w, d.fh).data;
    let row = d.fh;
    for (let yy = 0; yy < d.fh && row === d.fh; yy++) for (let xx = 0; xx < w; xx++) if (data[(yy * w + xx) * 4 + 3] > 40) { row = yy; break; }
    d._head[d.idle] = row; return row;
  },
  bossBar(ctx, b, y, d) {
    const top = this.headRow(d);
    const hh = (top == null ? d.fh : d.fh - top) * d.draw / d.fw, bw = 80, bx = Math.round(b.x - bw / 2), by = Math.max(8, Math.round(y - hh - 9));
    const pct = clamp(b.hp / b.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(4,10,24,0.94)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 1, by - 1, bw + 2, 6);
    ctx.fillStyle = '#ff4fa3'; ctx.fillRect(bx, by, Math.round(bw * pct), 4);
  },
  drawBoss(ctx, b, camY, t) {
    const d = BOSS_SHEETS[b.kind], y = b.y - camY + (BOSS_FOOT_PAD[b.kind] || 0) * (BOSS_SHEETS[b.kind].draw / BOSS_SHEETS[b.kind].fw);
    if (b.kind === 'hechicero') {
      /* cuadros según la ficha (250 × 167): el número de cuadros sale del ancho de cada hoja */
      const key = b.dying > 0 && d.death ? 'death' : (b.hurtT > 0 && d.hurt ? 'hurt' : (b.anim === 'attack' ? 'attack' : 'idle'));
      const im = Img.get(d[key]); if (!Img.ready(im)) return;
      const n = Math.max(1, Math.floor(im.naturalWidth / d.fw));
      const idx = key === 'death' ? Math.min(n - 1, Math.floor((1.2 - b.dying) / 1.2 * n))
        : key === 'attack' ? frameFromAnim(b.animT, 10, n, false)
        : key === 'hurt' ? frameFromAnim(0.26 - b.hurtT, 12, n, false)
        : frameFromAnim(b.t, 8, n, true);
      drawStrip(ctx, im, idx, d.fw, d.fh, b.x, y, bossFlipped(b), d.draw / d.fw, 1);
      if (b.window > 0) { ctx.strokeStyle = 'rgba(255,230,120,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, y - 60, 46, 0, Math.PI * 2); ctx.stroke(); }
      if (b.dying <= 0) this.bossBar(ctx, b, y, d);
      return;
    }
    /* halo suave: el jefe se lee aunque el escenario sea oscuro (bosque de noche, cuevas) */
    if (b.dying <= 0) ctx.drawImage(Sprites.glow(b.kind === 'golem_orange' ? '#ffb35c' : '#7af0ff'), Math.round(b.x - 22), Math.round(y - 52), 44, 44);
    const map = { idle: d.idle, walk: d.walk, attack: d.attack, hurt: d.hurt, death: d.death, charge: d.charge, strike: d.strike, shoot: d.shoot, scream: d.scream };
    /* animación que toca: muerte y golpe si el jefe las tiene; si no, la que pida su comportamiento */
    const ak = b.dying > 0 && d.death ? 'death' : (b.hurtT > 0 && d.hurt && b.dying <= 0 ? 'hurt' : b.anim);
    /* sin animación de muerte propia, el jefe se desvanece con su reposo mientras cae */
    /* el guardián de hielo: si existe su hoja de caminar (assets/img/boss/guardian_hielo_walk.png, cuadros de 192 px) se usa al andar;
       si no existe, sigue la de reposo con un balanceo para no verse paralizado */
    const gWalk = b.kind === 'guardian_hielo' && ak === 'walk' && Img.ready(Img.get('boss/guardian_hielo_walk.png')) ? 'boss/guardian_hielo_walk.png' : null;
    const im = Img.get(gWalk || map[ak] || (b.dying > 0 ? d.idle : d.walk)); if (!Img.ready(im)) return;
    const balanceo = b.kind === 'guardian_hielo' && ak === 'walk' && !gWalk ? Math.sin(t * 14) * 3 : 0;
    /* cada cuadro mide d.fw px de ancho: el número de cuadros sale de ahí (no de un tamaño fijo) */
    const n = Math.max(1, Math.floor(im.naturalWidth / d.fw));
    const loop = ak === 'idle' || ak === 'walk';
    /* la velocidad hace que cada animación acabe justo cuando acaba su ataque (Daddy: 0,9 s, 0,4 s, 1,1 s, 0,6 s) */
    const fps = ak === 'death' ? 11 : ak === 'attack' ? 14 : ak === 'strike' ? 20 : ak === 'scream' ? 22 : ak === 'charge' ? 9 : ak === 'shoot' ? 13 : ak === 'hurt' ? 12 : 9;
    const idx = b.dying > 0 ? Math.min(n - 1, Math.floor((1.2 - b.dying) * 11)) : frameFromAnim(b.animT, fps, n, loop);
    if (b.kind === 'sombra') {
      const wi = Img.get(d.walk);
      if (Img.ready(wi)) for (const c of b.clones) drawStrip(ctx, wi, frameFromAnim(b.t, 8, Math.max(1, Math.floor(wi.naturalWidth / d.fw)), true), d.fw, d.fh, c.x, y, c.x < b.x, d.draw / d.fw, 0.42);
    }
    const fadeOut = b.dying > 0 && !d.death;
    if (fadeOut) {
      /* sin animación de muerte propia: el jefe se inclina sobre sus pies, suelta polvo y se desvanece */
      const prog = 1 - b.dying / 1.2, dir = bossFlipped(b) ? -1 : 1;
      if (prog < 0.02 && !b.dustDone) { b.dustDone = true; Feel.burst(b.x, y - 20, 14, ['#ffffff', '#c9b79a', '#8a7a66'], 90, 0.5); }
      ctx.save(); ctx.translate(b.x, y); ctx.rotate(dir * prog * 1.1); ctx.globalAlpha = Math.max(0.05, b.dying / 1.2);
      drawStrip(ctx, im, idx, d.fw, d.fh || d.fw, 0, 0, bossFlipped(b), d.draw / d.fw, 1);
      ctx.restore();
    } else {
      drawStrip(ctx, im, idx, d.fw, d.fh || d.fw, b.x, y, bossFlipped(b), d.draw / d.fw, 1);
      if (b.flashT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.85, b.flashT / 0.12 * 0.8); drawStrip(ctx, im, idx, d.fw, d.fh || d.fw, b.x, y, bossFlipped(b), d.draw / d.fw, 1); ctx.restore(); }
      if (b.dying <= 0) this.bossBar(ctx, b, y, d);
    }
    if (b.kind === 'golem_laser' && b.lz && b.lz.st !== 'idle') this.drawLaser(ctx, b, camY, t);
    if (b.kind === 'sombra' && b.ringT > 0) { ctx.strokeStyle = 'rgba(190,130,255,' + (0.5 + 0.4 * Math.sin(t * 14)).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, y - 26, 34, 44, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (b.kind === 'avispa_reina' && b.landed) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x, b.arena.y - 2 - camY, 36, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    if (b.kind === 'caballero' && b.guard > 0 && b.state === 'walk') { ctx.fillStyle = 'rgba(190,206,224,0.9)'; ctx.fillRect(Math.round(b.x + b.face * 26 - 3), Math.round(y - 44), 6, 22); }
    if (b.kind === 'golem_blue' && b.shield > 0) { ctx.strokeStyle = 'rgba(122,240,255,' + (0.5 + 0.2 * Math.sin(t * 6)).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, y - 26, 44, 36, 0, 0, Math.PI * 2); ctx.stroke(); }
  },
  drawPickup(ctx, p, camY, t) {
    const bob = Math.sin(p.t * 3) * 2.5, x = Math.round(p.x), y = Math.round(p.y - camY);
    if (p.kind === 'heart') { ctx.drawImage(Sprites.heart(true), x - 6, y - 16 - bob); return; }
    if (p.kind === 'halfheart') { const im = Img.get('ui/medio_corazon.png'); if (Img.ready(im)) ctx.drawImage(im, x - 8, y - 22 - bob, 16, 16); return; }
    if (p.kind === 'energia') { const im = Img.get('ui/ascendencia/' + Ramas.orbSprite(p.value) + '.png'); if (Img.ready(im)) ctx.drawImage(im, x - 10, y - 26 - bob, 20, 20); return; }
    if (p.kind === 'material') {
      const yy = y - 22 - bob, im = MAT_DEF[p.mat] ? Img.get(MAT_DEF[p.mat].file) : null;
      if (im && Img.ready(im)) { ctx.globalAlpha = 1; ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(yy - im.height / 2)); return; }
      const c = MAT_DEF[p.mat] ? MAT_DEF[p.mat].color : '#ffffff';
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 6 + p.x);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, yy - 7); ctx.lineTo(x + 5, yy); ctx.lineTo(x, yy + 7); ctx.lineTo(x - 5, yy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#0b1430'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; return;
    }
    if (p.kind === 'upgrade') {
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5 + p.x);
      ctx.drawImage(Sprites.upgrade(), x - 11, y - 34 - bob);
      ctx.globalAlpha = 1; return;
    }
  },
  drawShot(ctx, s, camY) {
    const y = Math.round(s.y - camY);
    if (s.look === 'arrow') { ctx.save(); ctx.translate(Math.round(s.x), y); ctx.rotate(Math.atan2(s.vy || 0, s.vx || 1)); ctx.fillStyle = s.col || '#e8f7ff'; ctx.fillRect(-9, -1, 15, 2); ctx.fillStyle = s.col || '#7fe9ff'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -3.5); ctx.lineTo(4, 3.5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#59dfff'; ctx.fillRect(-12, -2, 4, 4); ctx.restore(); return; }
    if (s.look === 'orb') { ctx.drawImage(Sprites.glow('#c08cff'), Math.round(s.x - 16), y - 16); return; }
    if (s.look === 'fire') {
      const dset = FX_SET_FRAMES[s.fxSet || 'fuego'] || FX_SET_FRAMES.fuego;
      const ff = Img.get(dset.p + (Math.floor(performance.now() / 70) % dset.n + 1) + '.png');
      ctx.drawImage(Sprites.glow(s.col || '#ff7a2a'), Math.round(s.x - 22), y - 22, 44, 44);
      if (Img.ready(ff)) { ctx.imageSmoothingEnabled = false; ctx.drawImage(ff, Math.round(s.x - 24), y - 24, 48, 48); }
      return;
    }
    if (!s.look && s.fxSet && FX_SET_FRAMES[s.fxSet]) {
      const dset = FX_SET_FRAMES[s.fxSet], ff = Img.get(dset.p + (Math.floor(performance.now() / 70) % dset.n + 1) + '.png');
      ctx.save(); ctx.imageSmoothingEnabled = false;
      if (Img.ready(ff)) ctx.drawImage(ff, Math.round(s.x - dset.size / 2), Math.round(y - dset.size / 2), dset.size, dset.size);
      ctx.restore(); return;
    }
    if (s.kind === 'ball' && s.fx && typeof Effects !== 'undefined' && Effects.STYLE_BALL[s.fx.id]) { Effects.drawBall(ctx, s, camY); return; }
    if (s.kind === 'ball') {
      if (s.tr) for (let i = 0; i < s.tr.length; i += 2) {
        ctx.globalAlpha = 0.06 + 0.3 * i / s.tr.length; ctx.fillStyle = s.fx ? s.fx.color : '#e6edf5';
        ctx.fillRect(Math.round(s.tr[i]) - 1, Math.round(s.tr[i + 1] - camY) - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
      if (s.fx) { ctx.globalAlpha = 0.4; ctx.fillStyle = s.fx.color; ctx.beginPath(); ctx.arc(s.x, s.y - camY, 4 + 2 * (RECIPE_TIER[s.fx.id] || 1), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.drawImage(Sprites.ball(), Math.round(s.x - 4.5), y - 4);
      return;
    }
    if (s.kind === 'arrow') {
      const im = Img.get(s.archer ? 'enemy/flecha_arquero.png' : 'enemy/arrow.png'); if (!Img.ready(im)) return;
      ctx.save(); ctx.imageSmoothingEnabled = false; const aw = s.archer ? 24 : 13, ah = s.archer ? 4 : 5;
      ctx.translate(Math.round(s.x), y); ctx.rotate(Math.atan2(s.vy || 0, s.vx || 1)); ctx.drawImage(im, -aw / 2, -ah / 2, aw, ah); ctx.restore();
      return;
    }
    if (s.kind === 'shock') {
      ctx.fillStyle = 'rgba(180,140,100,0.85)'; ctx.fillRect(Math.round(s.x - 9), y - 10, 18, 10);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(Math.round(s.x - 9), y - 2, 18, 2);
      return;
    }
    if (s.kind === 'orb') { ctx.drawImage(Sprites.glow('#c08cff'), Math.round(s.x - 16), y - 16); return; }
    if (s.kind === 'fire') { ctx.drawImage(Sprites.glow('#ff7a2a'), Math.round(s.x - 16), y - 16); return; }
    if (s.kind === 'bomb') {
      ctx.fillStyle = '#23202e'; ctx.beginPath(); ctx.arc(s.x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb35c'; ctx.fillRect(Math.round(s.x + 2), y - 7, 2, 2);
      return;
    }
    if (s.kind === 'rock') {
      ctx.fillStyle = '#6a6470'; ctx.beginPath(); ctx.moveTo(s.x - 6, y - 2); ctx.lineTo(s.x - 2, y - 6); ctx.lineTo(s.x + 5, y - 4);
      ctx.lineTo(s.x + 6, y + 3); ctx.lineTo(s.x - 1, y + 6); ctx.closePath(); ctx.fill();
    }
  },
  drawPlayer(ctx, p, camY, strips) {
    const cid=p.charId||'hero';
    if (cid !== 'hero' && typeof CHARACTERS !== 'undefined' && CHARACTERS[cid]) {
      if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) return;
      const d=CHARACTERS[cid], x=p.x, y=p.y-camY; if(p.onGround){ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y+1,10,3,0,0,Math.PI*2);ctx.fill();}
      let key='idle',fps=7,loop=true,n=d.frames.idle||1,idx=0;
      if(p.death){ key='death'; n=d.frames.death||d.frames.hit||1; fps=8; idx=Math.min(n-1,Math.floor((p.death.t||p.animT||0)*fps)); loop=false; }
      else if(p.anim==='hit'){key='hit';n=d.frames.hit||1;fps=10;idx=Math.min(n-1,Math.floor(p.animT*fps));loop=false;}
      else if(p.anim==='attack'){
        if(cid==='wizard') key='attack'; else { const variants=cid==='huntress'?['attack1','attack2','attack3']:['attack1','attack2']; key=variants[(Math.max(1,p.atkN||1)-1)%variants.length]; }
        n=d.frames[key]||1; const prog=clamp(1-(p.atk/(p.atkDur||.4)),0,1); idx=Math.min(n-1,Math.floor(prog*n)); loop=false;
      } else if(p.anim==='jump'){key='jump';n=d.frames.jump||1;idx=Math.min(n-1,Math.floor((p.animT||0)*12));loop=false;}
      else if(p.anim==='fall'){key='fall';n=d.frames.fall||1;idx=Math.min(n-1,Math.floor(p.animT*8));loop=false;}
      else if(p.anim==='run'){key='run';n=d.frames.run||1;fps=14;}
      else if(p.anim==='walk'){key=d.frames.walk?'walk':'run';n=d.frames[key]||d.frames.run||1;fps=13;}
      else {key='idle';n=d.frames.idle||1;fps=6;}
      if(loop) idx=frameFromAnim(p.animT,fps,n,true);
      const file=d.files[key]||d.files.idle, im=Img.get(charSheet(cid,file));
      const sqv = p.anim==='attack' ? 1 : p.anim==='jump' ? 1.12 : p.anim==='fall' ? 0.94 : (p.sq || 1);
      if(Img.ready(im)){ drawStrip(ctx,im,idx,d.fw,d.fh,x,y,p.face<0,d.scale||1,1,sqv); }
      return;
    }
    if (!strips) return;
    if (p.death) { Death.draw(ctx, p, camY, strips); return; }
    if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) return;
    const x = p.x, y = p.y - camY;
    if (p.onGround) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 10, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    let key, idx, fps = 6, n, loop = true;
    if (p.anim === 'attack') {
      const prog = 1 - p.atk / (p.atkDur || 0.27);
      if (prog < 0.5) { key = 'combo_1'; n = frameCount(strips, 'combo_1'); idx = Math.floor(prog * 2 * n); }
      else { key = 'combo_1_end'; n = frameCount(strips, 'combo_1_end'); idx = Math.min(n - 1, Math.floor((prog - 0.5) * 2 * n)); }
      loop = false;
    } else if (p.anim === 'fall') { key = 'fall'; n = frameCount(strips, 'fall'); idx = Math.min(n - 1, Math.floor(p.animT * 10)); loop = false; }
    else if (p.anim === 'jump') { key = 'jump'; n = frameCount(strips, 'jump'); idx = Math.min(n - 1, p.vy < -120 ? 1 : 2); loop = false; }
    else if (p.anim === 'run') { key = 'run'; n = frameCount(strips, 'run'); fps = 15; }
    else if (p.anim === 'walk') { key = 'walk'; n = frameCount(strips, 'walk'); fps = 11; }
    else { key = 'idle'; n = frameCount(strips, 'idle'); fps = 6; }
    if (p.anim !== 'fall' && p.anim !== 'jump') idx = frameFromAnim(p.animT, fps, n, loop);
    drawStrip(ctx, strips[key], idx, HERO.FW, HERO.FH, x, y, p.face < 0, HERO_VIEW, 1, p.sq);
  },
  /* tirachinas: la horquilla en la mano; al apuntar, la goma tensada, la bolita y una trayectoria suave con marca de aterrizaje */
  /* origen único del tirachinas: de aquí sale la bola y aquí se dibuja la banda y la trayectoria (mismo punto, ambos lados).
     Vale para el personaje y para los rivales (que son datos, no clase Player) */
  slingOrigin(p) { return { x: p.x + p.face * 8, y: p.y - 22 }; },
  drawParry(ctx, p, camY) {
    /* escudo HEX: aparece (0-8), se sostiene (9-13) mientras dura, y se disuelve al terminar (14-19) */
    if (!p) return;
    const now = performance.now();
    if (!(p.parryT > 0)) { p._hexT0 = undefined; return; }
    if (p._hexT0 === undefined) p._hexT0 = now;
    const age = (now - p._hexT0) / 1000;
    let idx;
    if (age < 0.35) idx = Math.min(8, Math.floor(age / 0.35 * 9));
    else if (p.parryT > 0.25) idx = 9 + Math.floor(now / 90) % 5;
    else idx = 14 + Math.min(5, Math.floor((0.25 - p.parryT) / 0.25 * 6));
    const im = Img.get('fx/escudo_' + (idx + 1) + '.png');
    if (!Img.ready(im)) return;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    /* escudo frontal: sólo el lado hacia donde mira el jugador, más grande y sin rodear el cuerpo */
    const f = p.face >= 0 ? 1 : -1;
    ctx.beginPath(); ctx.rect(f > 0 ? p.x - 6 : p.x - 120, p.y - camY - 150, 126, 170); ctx.clip();
    const cx = Math.round(p.x + f * 20), cy = Math.round(p.y - camY - 34);
    ctx.translate(cx, cy); ctx.scale(f, 1); ctx.drawImage(im, -50, -50, 100, 100);
    ctx.restore();
  },
  drawSling(ctx, p, camY, plats) {
    if (!p.sl.on) return;   /* sin la horquilla fija (tapaba la cara): sólo la goma y la bola al apuntar y tirar */
    const f = p.face, o = Scene.slingOrigin(p), hx = Math.round(o.x), hy = Math.round(o.y - camY);
    ctx.save(); ctx.lineCap = 'round';
    if (p.sl.on) {
      const sl = p.sl, dx = Math.cos(sl.aim) * f, dy = -Math.sin(sl.aim);
      const pull = 4 + sl.pow * 24, bx = hx - dx * pull, by = hy - dy * pull;
      ctx.strokeStyle = 'rgba(232,214,168,0.95)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 3 * f, hy - 4); ctx.lineTo(bx, by); ctx.moveTo(hx + 3 * f, hy - 4); ctx.lineTo(bx, by); ctx.stroke();
      ctx.drawImage(Sprites.ball(), Math.round(bx - 4.5), Math.round(by - 4.5));
      const cd = (p.charId && p.charId !== 'hero' && typeof CHARACTERS !== 'undefined') ? CHARACTERS[p.charId] : null;
      const v = cd ? cd.speed * (0.8 + 0.3 * sl.pow) : 250 + 380 * sl.pow, GRAV = cd ? (cd.grav || 0) : PHYS.BALL_G;
      const N = cd ? Math.round(cd.life * 60) : 76, dtS = 1 / 60;
      let wx = o.x, wy = o.y, vx = dx * v, vy = dy * v, land = null;
      for (let i = 1; i <= N && !land; i++) {
        const py = wy;
        vy += GRAV * dtS; wx += vx * dtS; wy += vy * dtS;
        if (cd && Math.hypot(wx - o.x, wy - o.y) > charRange(G)) break;
        if (i % 4 === 0) { ctx.fillStyle = 'rgba(255,240,200,' + ((1 - i / N) * 0.85).toFixed(2) + ')'; ctx.fillRect(Math.round(wx) - 1, Math.round(wy - camY) - 1, 2, 2); }
        for (const q of plats) if (q.active !== false && wx > q.x && wx < q.x + q.w && py < q.y && wy >= q.y) { land = { x: wx, y: q.y }; break; }
      }
      if (land) { ctx.strokeStyle = 'rgba(255,231,166,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(Math.round(land.x), Math.round(land.y - camY), 4, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }
};

/* HUD en el lienzo (no en HTML): se dibuja al final de cada cuadro, sin tocar el DOM */
/* marco de 9 trozos (esquinas fijas, lados y centro estirados): el marco redondo del pack, en el HUD */
const Ui9 = {
  draw(ctx, name, x, y, w, h, slice, alpha) {
    const im = Img.get('ui/' + name); if (!Img.ready(im)) return false;
    const sl = slice, iw = im.width, ih = im.height;
    const sx = [0, sl, iw - sl, iw], sy = [0, sl, ih - sl, ih];
    const dx = [x, x + sl, x + w - sl, x + w], dy = [y, y + sl, y + h - sl, y + h];
    ctx.save(); ctx.globalAlpha *= (alpha == null ? 1 : alpha); ctx.imageSmoothingEnabled = false;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const sw = sx[i + 1] - sx[i], sh = sy[j + 1] - sy[j], dw = dx[i + 1] - dx[i], dh = dy[j + 1] - dy[j];
      if (sw > 0 && sh > 0 && dw > 0 && dh > 0) ctx.drawImage(im, sx[i], sy[j], sw, sh, dx[i], dy[j], dw, dh);
    }
    ctx.restore(); return true;
  }
};
/* HUD en el lienzo (no en HTML): se dibuja al final de cada cuadro, sin tocar el DOM */
const Hud = {
  fx: { run: null, hp: null, shake: 0, hurt: 0, heal: 0, buffMax: {}, bestSeed: 0, recShown: false, recT: 0, lastT: 0 },
  txt(ctx, s, x, y, font, col, align = 'left') {
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(6,8,16,0.9)'; ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col; ctx.fillText(s, x, y);
  },
  draw(ctx, G) {
    const r = G.run, p = G.player; if (!r || !p) return;
    const fx = this.fx, dt = clamp(G.t - fx.lastT, 0, 0.1); fx.lastT = G.t;
    /* partida nueva: se recuerda el récord de antes para avisar cuando se supera */
    if (fx.run !== r) { fx.run = r; fx.bestSeed = Progress.totals.bestScore | 0; fx.recShown = false; fx.recT = 0; fx.hp = p.hp; fx.buffMax = {}; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    /* monedas: el contador sube hasta la cifra real y pulsa al ganar */
    /* corazones: sacudida y rojo al recibir daño; pulso al curarse */
    if (fx.hp !== null) { if (p.hp < fx.hp) { fx.shake = 0.35; fx.hurt = 0.3; } else if (p.hp > fx.hp) fx.heal = 0.4; }
    fx.hp = p.hp;
    fx.shake = Math.max(0, fx.shake - dt); fx.hurt = Math.max(0, fx.hurt - dt); fx.heal = Math.max(0, fx.heal - dt);
    const ox = fx.shake > 0 ? Math.round(Math.sin(fx.shake * 70) * 2.5) : 0;
    const ss = fx.heal > 0 ? 1 + 0.22 * Math.sin((fx.heal / 0.4) * Math.PI) : 1;
    /* tamaño de la placa de la izquierda: según el texto de la misión */
    ctx.font = '600 11px Nunito, sans-serif';
    const hasShield = G.shield.charges > 0;
    /* vida */
    if (fx.hurt > 0) { ctx.fillStyle = 'rgba(255,70,100,' + (0.3 * fx.hurt / 0.3).toFixed(3) + ')'; ctx.fillRect(6 + ox, 6, p.maxHp * 15, 18); }
    for (let i = 0; i < p.maxHp; i++) {
      const frac = p.hp - i, h = Sprites.heart(frac >= 1), x = 10 + i * 15 + ox, y = 10;
      const half = frac > 0 && frac < 1 ? Img.get('ui/medio_corazon.png') : null;
      if (half && Img.ready(half)) ctx.drawImage(half, x - 1, y - 1, h.width + 2, h.height + 2);
      else ctx.drawImage(h, x - (h.width * ss - h.width) / 2, y - (h.height * ss - h.height) / 2, h.width * ss, h.height * ss);
    }
    /* buffs: insignia con anillo de progreso (lo que queda del tiempo) */
    let bx = 10 + p.maxHp * 15 + 10;
    /* habilidad equipada: su ícono junto a los corazones (flecha o llama) */
    { const sk = Craft.skillFor(); if (sk) { const im = Img.get(sk === 'arrow' ? 'crafteo/btn_flecha.png' : 'crafteo/btn_hechizo.png'); if (Img.ready(im)) { ctx.drawImage(im, bx, 6, 20, 20); bx += 24; } } }
    for (const [k, letter, col] of [['speed', 'V', '#7cf0ff'], ['strength', 'F', '#ff8ad8'], ['jump', 'S', '#ffd34a']]) {
      const left = p.buffs[k] || 0;
      if (left <= 0) continue;
      fx.buffMax[k] = Math.max(fx.buffMax[k] || 0, left);
      const f = clamp(left / fx.buffMax[k], 0, 1), cx2 = bx + 8, cy2 = 18;
      ctx.beginPath(); ctx.arc(cx2, cy2, 7.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(6,8,16,0.85)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx2, cy2, 7.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.lineWidth = 2.2; ctx.strokeStyle = col; ctx.stroke();
      this.txt(ctx, letter, cx2, cy2 + 0.5, '700 9px Pixelify Sans, monospace', col, 'center');
      bx += 20;
    }
    let y = 29;
    if (hasShield) { ctx.drawImage(Sprites.shield(), 10, y); this.txt(ctx, 'x' + G.shield.charges, 26, y + 6, '700 12px Pixelify Sans, monospace', '#9ee7ff'); y += 16; }
    const cool = PHYS.SLING_RELOAD * G.mods.reloadMul;
    const f = p.sl.on ? p.sl.t : clamp(1 - p.shotCd / cool, 0, 1);
    ctx.drawImage(Sprites.ball(), 10, y + 1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(22, y + 4, 46, 4);
    ctx.fillStyle = p.sl.on ? '#ffd34a' : '#9ee7ff'; ctx.fillRect(22, y + 4, Math.round(46 * f), 4);
    y += 16;
    /* centro arriba: distancia, puntos, bioma y jefe (sobre una placa oscura) */
    const cx = Math.round(W / 2);
    /* marcador de oleada: solo al empezar cada ronda, con animación de aparecer y desvanecerse */
    if (G.waveBanner && G.waveBanner.t > 0) {
      const wb = G.waveBanner, el = 2.4 - wb.t;
      const al = Math.max(0, Math.min(1, el / 0.35, wb.t / 0.5)), sc = 1 + 0.18 * Math.max(0, 1 - el / 0.35);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, 57); ctx.scale(sc, sc);
      this.txt(ctx, 'Oleada ' + wb.n, 0, 0, '700 24px Pixelify Sans, monospace', '#ffe7a6', 'center');
      { const im = Img.get('crafteo/oleada.png'); if (Img.ready(im)) ctx.drawImage(im, -104, -22, 26, 26); }
      if (wb.elite) this.txt(ctx, '¡Élite!', 0, 24, '700 14px Pixelify Sans, monospace', '#ff6a72', 'center');
      ctx.restore();
    }
    this.txt(ctx, r.score + ' puntos', cx, 77, '600 12px Nunito, sans-serif', '#7ef0e0', 'center');
    /* récord: aviso dorado breve la primera vez que la partida supera el mejor resultado anterior */
    if (!fx.recShown && fx.bestSeed > 0 && r.score > fx.bestSeed) { fx.recShown = true; fx.recT = 1.8; Sound.play('checkpoint', 0.6); }
    if (fx.recT > 0) {
      fx.recT -= dt;
      ctx.globalAlpha = Math.min(1, fx.recT / 0.4);
      this.txt(ctx, '¡NUEVO RÉCORD!', cx, 150, '700 15px Pixelify Sans, monospace', '#ffd34a', 'center');
      ctx.globalAlpha = 1;
    }
    /* aviso de aparición de jefe: 5 s con solo su nombre (no tapa nada más) */
    if (G.bossIntro && G.bossIntro.t > 0) {
      const k = G.bossIntro.t, al = Math.max(0, Math.min(1, (5 - k) / 0.4, k / 0.6));
      ctx.globalAlpha = al;
      this.txt(ctx, G.bossIntro.name, cx, 100, '700 16px Pixelify Sans, monospace', '#ffd34a', 'center');
      { const im = Img.get('crafteo/aviso_jefe.png'); if (Img.ready(im)) { ctx.drawImage(im, cx - 156, 82, 28, 28); ctx.drawImage(im, cx + 128, 82, 28, 28); } }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
};

/* la chica guerrera: mismas reglas de pintado y de animación que el héroe, con sus propias hojas (assets/img/chica/) */
const ChicaArt = Object.create(HeroArt);
Object.assign(ChicaArt, {
  folder: 'chica',
  anims: { idle: 6, walk: 8, run: 8, jump: 3, fall: 3, fall_loop: 2, combo_1: 3, combo_1_end: 4 },
  base: null, range: null, cache: {}, labelCache: null, rampCache: null,
  /* lectura de partes de su pintura: piel, pelo, armadura, botas y falda (no tiene bufanda) */
  setOf(h, s, l, y) {
    if (y >= 36 && h >= 28 && h < 52 && s > 0.45 && l > 0.3 && l < 0.78) return 'shoes';
    if (y < 30 && h >= 8 && h < 38 && s > 0.42 && l > 0.2 && l < 0.56) return 'hair';
    if (h >= 12 && h < 46 && s >= 0.15 && l >= 0.6) return 'skin';   /* piel cálida y clara (la cara de la guerrera) */
    if (l < 0.82 && ((s < 0.22 && l > 0.28) || (h >= 165 && h < 215 && s >= 0.1 && s < 0.5 && l > 0.25))) return 'shirt';
    if (h >= 255 && h < 350 && s >= 0.18 && l > 0.07 && l < 0.42) return 'pants';
    return null;
  }
});
/* qué set de pintado usa cada personaje */
function artFor(who) { return who === 'chica' ? ChicaArt : HeroArt; }
/* número de cuadros de una animación, leído de su hoja */
function frameCount(strips, k) { const im = strips && strips[k]; return Math.max(1, Math.floor((im ? im.width : HERO.FW) / HERO.FW)); }
