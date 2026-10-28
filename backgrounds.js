'use strict';
/* =====================================================================
   ASCENSO 4.1 · fondos con parallax horizontal. El cielo y la niebla se precalculan
   en canvas (una vez por bioma y ancho); las capas se tilean a su tamaño natural
   (480×270) con copia espejada, sin costuras, y se adaptan a cualquier ancho.
   ===================================================================== */
const IMG_W = 480, IMG_H = 270;
const Backdrop = {
  cache: {}, flipCache: {}, skyCache: {}, fogCache: {},
  rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
  /* elementos fijos por clave (estrellas, luciérnagas, lluvia…): se calculan una vez */
  items(key, n, make) {
    if (!this.cache[key]) { const r = this.rng(key.length * 7919 + n); this.cache[key] = Array.from({ length: n }, (_, i) => make(r, i)); }
    return this.cache[key];
  },
  /* copia espejada de una capa: al unirla con la original no se ve el corte */
  flipped(file) {
    if (this.flipCache[file] !== undefined) return this.flipCache[file];
    const im = Img.get(file);
    if (!Img.ready(im)) return null;
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(im, 0, 0);
    return (this.flipCache[file] = c);
  },
  sky(b) {
    const k = b.id + ':' + W;
    if (this.skyCache[k]) return this.skyCache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, b.sky[0]); gr.addColorStop(0.5, b.sky[1]); gr.addColorStop(0.82, b.sky[2]); gr.addColorStop(1, b.sky[3]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return (this.skyCache[k] = c);
  },
  fog(b) {
    const k = b.id + ':' + W;
    if (this.fogCache[k]) return this.fogCache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const f = g.createLinearGradient(0, H * 0.62, 0, H);
    f.addColorStop(0, `rgba(${b.fog},0)`); f.addColorStop(1, `rgba(${b.fog},0.22)`);
    g.fillStyle = f; g.fillRect(0, H * 0.62, W, H * 0.38);
    return (this.fogCache[k] = c);
  },
  /* cur y next son { biome, variant }. Sin cambio se pinta el actual; en un cambio, el
     anterior queda debajo y el nuevo se funde encima con blend (0→1). */
  draw(ctx, camX, camY, t, cur, next, blend) {
    ctx.save();
    const same = !next || (next.biome.id === cur.biome.id && next.variant === cur.variant);
    if (same || blend >= 1) this.paint(ctx, next || cur, camX, camY, t, 1);
    else { this.paint(ctx, cur, camX, camY, t, 1); this.paint(ctx, next, camX, camY, t, blend); }
    ctx.restore();
  },
  paint(ctx, art, camX, camY, t, alpha) {
    if (!art || alpha <= 0.001) return;
    const b = art.biome, v = art.variant;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.sky(b), 0, 0);
    const set = BG_SETS[v.set];
    if (set) for (let i = 0; i < set.layers.length; i++) {
      const L = set.layers[i], im = Img.get(L.file);
      if (!Img.ready(im)) continue;
      const span = 2 * IMG_W;
      const off = L.base ? 0 : ((camX * (0.05 + 0.05 * i) + t * L.drift) % span + span) % span;
      const dy = L.base ? 0 : clamp((150 - camY) * 0.03, -18, 18);
      const fl = this.flipped(L.file);
      for (let x = -off; x < W; x += span) {
        ctx.drawImage(im, x, dy, IMG_W, IMG_H);
        if (fl) ctx.drawImage(fl, x + IMG_W, dy, IMG_W, IMG_H);
      }
    }
    if (v.tint) {
      ctx.save(); ctx.globalCompositeOperation = v.blend || 'multiply';
      ctx.fillStyle = v.tint; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    for (const o of b.overlays) this.overlay(ctx, o, camX, camY, t);
    ctx.drawImage(this.fog(b), 0, 0);
    ctx.globalAlpha = 1;
  },
  overlay(ctx, name, camX, camY, t) {
    switch (name) {
      case 'stars': return this.stars(ctx, camX, camY, t);
      case 'fireflies': return this.fireflies(ctx, camX, camY, t);
      case 'rain': return this.rain(ctx, t);
      case 'lightning': return this.lightning(ctx, t);
      case 'stalactites': return this.stalactites(ctx, camX);
      case 'dust': return this.dust(ctx, camX, camY, t);
    }
  },
  wrap(v, m) { return ((v % m) + m) % m; },
  stars(ctx, camX, camY, t) {
    for (const [x, y, p] of this.items('st', 60, r => [r() * IMG_W, r() * H * 0.8, 0.5 + r() * 1.2])) {
      const xx = this.wrap(x - camX * 0.04, W), yy = this.wrap(y - camY * 0.04, H);
      ctx.fillStyle = 'rgba(255,246,220,' + (0.35 + 0.3 * Math.sin(t * 1.7 * p + x)).toFixed(3) + ')';
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  },
  fireflies(ctx, camX, camY, t) {
    for (const [x, y, p] of this.items('ff', 14, r => [r() * IMG_W, r() * 600, r()])) {
      const xx = this.wrap(x - camX * 0.1 + Math.sin(t + p * 6) * 6, W), yy = this.wrap(y - camY * 0.12, H);
      ctx.fillStyle = 'rgba(190,255,160,' + (0.4 + 0.5 * Math.sin(t * 2 + p * 9)).toFixed(3) + ')';
      ctx.fillRect(Math.round(xx), Math.round(yy), 2, 2);
    }
  },
  rain(ctx, t) {
    ctx.strokeStyle = 'rgba(190,220,255,0.32)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [x, y] of this.items('rain', 40, r => [r() * IMG_W, r() * H])) {
      const yy = (y + t * 260) % H, xx = this.wrap(x - t * 40, W);
      ctx.moveTo(xx, yy); ctx.lineTo(xx - 4, yy + 9);
    }
    ctx.stroke();
  },
  lightning(ctx, t) {
    if (Math.sin(t * 0.7) > 0.992) { ctx.fillStyle = 'rgba(255,240,220,0.22)'; ctx.fillRect(0, 0, W, H); }
  },
  /* cavernas: techo con estalactitas en parallax suave */
  stalactites(ctx, camX) {
    ctx.fillStyle = 'rgba(18,12,28,0.85)';
    for (const [x, w, h] of this.items('stal', 9, r => [r() * IMG_W, 10 + r() * 16, 30 + r() * 46])) {
      const xx = this.wrap(x - camX * 0.16, W), y0 = -6;
      ctx.beginPath(); ctx.moveTo(xx - w / 2, y0); ctx.lineTo(xx + w / 2, y0); ctx.lineTo(xx, y0 + h); ctx.closePath(); ctx.fill();
    }
  },
  dust(ctx, camX, camY, t) {
    for (const [x, y, p] of this.items('dust', 16, r => [r() * IMG_W, r() * H, r()])) {
      const xx = this.wrap(x - camX * 0.08 + Math.sin(t + p * 5) * 4, W), yy = this.wrap(y + t * (8 + p * 10) - camY * 0.05, H);
      ctx.fillStyle = 'rgba(230,220,200,' + (0.25 + 0.2 * Math.sin(t * 2 + p * 7)).toFixed(3) + ')';
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  }
};
