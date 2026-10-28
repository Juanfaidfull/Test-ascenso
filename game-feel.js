'use strict';
/* =====================================================================
   ASCENSO 3.0 · sensación de juego: sacudidas de cámara, partículas,
   anillos y textos flotantes. Todo se limpia al empezar una partida.
   ===================================================================== */
const Feel = {
  fx: [], texts: [], shakeT: 0, shakeM: 0,
  reset() { this.fx.length = 0; this.texts.length = 0; this.shakeT = 0; this.shakeM = 0; },
  /* sólo para impactos importantes: la sacudida no se acumula */
  shake(mag, dur) { if (mag >= this.shakeM || this.shakeT <= 0) { this.shakeM = mag; this.shakeT = dur; } },
  offset(t) {
    if (this.shakeT <= 0) return [0, 0];
    const k = this.shakeM * Math.min(1, this.shakeT / 0.12);
    return [Math.sin(t * 91) * k, Math.cos(t * 67) * k];
  },
  burst(x, y, n, cols, spd = 70, life = 0.45) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = spd * (0.3 + Math.random() * 0.7);
      this.fx.push({ kind: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life, max: life,
        size: 1 + (Math.random() * 2 | 0), col: pick(cols) });
    }
  },
  ring(x, y, r, col, life = 0.35) { this.fx.push({ kind: 'ring', x, y, r0: 4, r1: r, life, max: life, col }); },
  text(x, y, str, col = '#ffe7a6') { this.texts.push({ x, y, str, col, life: 0.9, max: 0.9 }); },
  update(dt) {
    if (typeof Death !== 'undefined') Death.updateParts(dt);
    if (this.shakeT > 0) this.shakeT -= dt;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.life -= dt;
      if (f.kind === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 260 * dt; }
      if (f.life <= 0) this.fx.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.life -= dt; t.y -= 26 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  },
  draw(ctx, camY) {
    if (typeof Death !== 'undefined') Death.drawParts(ctx, camY);
    for (const f of this.fx) {
      const a = Math.max(0, f.life / f.max);
      ctx.globalAlpha = a;
      if (f.kind === 'p') { ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y - camY), f.size, f.size); }
      else {
        const r = f.r0 + (f.r1 - f.r0) * (1 - a);
        ctx.strokeStyle = f.col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(f.x, f.y - camY, r, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 11px Pixelify Sans, monospace'; ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.max);
      ctx.fillStyle = t.col; ctx.fillText(t.str, Math.round(t.x), Math.round(t.y - camY));
    }
    ctx.globalAlpha = 1;
  }
};
