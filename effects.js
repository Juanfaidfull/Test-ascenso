'use strict';
/* =====================================================================
   ASCENSO 4.36 · efectos de crafteo.
   Espada: arco de corte con varias capas y partículas propias de cada efecto (chispa, escarcha, brasa).
   Tirachinas: bola con color propio, estela que dura mientras la bola viaja y choque al impactar (rayo, lava, hielo).
   ===================================================================== */
const Effects = {
  parts: [], arcs: [], rings: [], balls: [],
  MAXP: 380,
  rnd(a, b) { return a + Math.random() * (b - a); },
  pick(a) { return a[Math.random() * a.length | 0]; },
  add(p) { if (this.parts.length >= this.MAXP) this.parts.shift(); this.parts.push(p); },
  burst(x, y, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = sp.spd * this.rnd(0.35, 1);
      this.add({ t: sp.t, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (sp.up || 0), life: sp.life * this.rnd(0.75, 1.15), max: sp.life,
        col: this.pick(sp.cols), sz: sp.sz * this.rnd(0.7, 1.5), g: sp.g, rot: Math.random() * 6, vr: this.rnd(-9, 9) });
    }
  },
  STYLE_SWORD: {
    chispa: { arc: ['#ffd23c', '#fff8c8'], n: 28, sp: { t: 'spark', cols: ['#ffd23c', '#fff3a0', '#ff9d1a'], spd: 170, life: 0.55, sz: 2.4, g: 340 } },
    escarcha: { arc: ['#5fe0ff', '#eaffff'], n: 22, sp: { t: 'shard', cols: ['#bff4ff', '#7fe6ff', '#ffffff'], spd: 120, life: 0.85, sz: 3.2, g: 180 } },
    brasa: { arc: ['#9a4dff', '#f4dcff'], n: 20, sp: { t: 'ember', cols: ['#c79bff', '#ff8af0', '#ffb3ff'], spd: 95, life: 1.0, sz: 2.6, g: -70, up: -40 } },
    hoja_hueso: { arc: ['#b9a6ff', '#f4efff'], n: 22, sp: { t: 'ember', cols: ['#e0d4ff', '#b9a6ff', '#ffffff'], spd: 110, life: 0.8, sz: 2.4, g: 60, up: -20 } }
  },
  STYLE_BALL: {
    rayo: { core: '#ffffff', halo: '#fff04a', trail: '#fff27a', imp: ['#fff04a', '#ffffff'], cols: ['#fff27a', '#ffffff', '#ffe600'] },
    lava: { core: '#fff6b8', halo: '#ff5a1a', trail: '#ff7a2a', imp: ['#ff7a2a', '#ffd27a', '#ff3a10'], cols: ['#ffb020', '#ff5a1a', '#9a2a0a'] },
    hielo: { core: '#ffffff', halo: '#7fe6ff', trail: '#bff4ff', imp: ['#bff4ff', '#7fe6ff', '#ffffff'], cols: ['#bff4ff', '#7fe6ff', '#ffffff'] }
  },
  /* golpe de espada: arco que crece y se desvanece, más las partículas del efecto */
  sword(x, y, face, rec) {
    const st = rec && this.STYLE_SWORD[rec.id]; if (!st) return;
    const f = face >= 0 ? 1 : -1, cx = x + f * 18, cy = y - 22;
    this.arcs.push({ x: cx, y: cy, f, t: 0, life: 0.36, cols: st.arc });
    this.burst(cx + f * 16, cy, st.n, st.sp);
    if (rec.id === 'brasa') for (let i = 0; i < 4; i++) this.add({ t: 'smoke', x: cx + f * this.rnd(4, 24), y: cy + this.rnd(-10, 10), vx: f * this.rnd(12, 34), vy: this.rnd(-34, -8), life: 0.7, max: 0.7, col: '#7a4dd6', sz: this.rnd(6, 10), g: 0 });
    if (rec.id === 'escarcha') for (let i = 0; i < 4; i++) this.add({ t: 'mist', x: cx + f * this.rnd(4, 24), y: cy + this.rnd(-10, 10), vx: f * this.rnd(14, 36), vy: this.rnd(-22, 4), life: 0.75, max: 0.75, col: '#cdf6ff', sz: this.rnd(6, 11), g: 0 });
  },
  ring(x, y, r, col, life) { this.rings.push({ x, y, r0: 4, r1: r, t: 0, life, col }); },
  /* choque de la bola al impactar: lo llama Shot cuando muere por golpe (no por tiempo) */
  impact(s) {
    const st = this.STYLE_BALL[s.fx && s.fx.id]; if (!st) return;
    this.ring(s.x, s.y, 28, st.imp[0], 0.38);
    this.burst(s.x, s.y, 16, { t: s.fx.id === 'hielo' ? 'shard' : 'spark', cols: st.imp, spd: 190, life: 0.6, sz: 2.8, g: 260 });
    if (s.fx.id === 'lava') for (let i = 0; i < 4; i++) this.add({ t: 'smoke', x: s.x, y: s.y, vx: this.rnd(-30, 30), vy: this.rnd(-40, -10), life: 0.8, max: 0.8, col: '#4a1a0a', sz: this.rnd(7, 12), g: 0 });
  },
  update(dt) {
    for (const a of this.arcs) a.t += dt;
    this.arcs = this.arcs.filter(a => a.t < a.life);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter(r => r.t < r.life);
    for (const p of this.parts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt;
      p.vx *= Math.max(0, 1 - 1.6 * dt); p.life -= dt; p.rot = (p.rot || 0) + (p.vr || 0) * dt;
    }
    this.parts = this.parts.filter(p => p.life > 0);
    /* las bolas con efecto llevan su estela; la estela se alimenta mientras la bola viva y se apaga sola al morir */
    if (typeof G !== 'undefined' && G.shots) for (const s of G.shots) if (s.fx && this.STYLE_BALL[s.fx.id] && !this.balls.some(b => b.s === s)) this.balls.push({ s, tr: [] });
    for (const b of this.balls) {
      for (const q of b.tr) q.age += dt;
      const enJuego = typeof G !== 'undefined' && G.shots && G.shots.includes(b.s);   /* una bola que ya no está en juego no sigue soltando chispas */
      if (b.s.alive && enJuego) {
        b.tr.push({ x: b.s.x, y: b.s.y, age: 0, j: this.rnd(-4, 4) });
        if (b.tr.length > 46) b.tr.shift();
        const id = b.s.fx.id, st = this.STYLE_BALL[id];
        for (let k = 0; k < 2; k++) this.add({ t: id === 'hielo' ? 'shard' : (id === 'lava' ? 'ember' : 'spark'), x: b.s.x + this.rnd(-3, 3), y: b.s.y + this.rnd(-3, 3),
          vx: this.rnd(-22, 22), vy: this.rnd(-30, 10), life: 0.5, max: 0.5, col: this.pick(st.cols), sz: this.rnd(1.5, 3), g: id === 'hielo' ? 120 : (id === 'lava' ? -50 : 60), rot: 0, vr: this.rnd(-8, 8) });
      } else b.tr = b.tr.filter(q => q.age < 0.55);
    }
    this.balls = this.balls.filter(b => b.s.alive || b.tr.length > 0);
  },
  /* la bola: color propio, halo, núcleo y adornos de cada efecto; la estela sigue la trayectoria */
  drawBall(ctx, s, camY) {
    const b = this.balls.find(q => q.s === s), st = this.STYLE_BALL[s.fx.id];
    const tr = b ? b.tr : [], id = s.fx.id;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < tr.length; i++) {
      const p0 = tr[i - 1], p1 = tr[i], k = i / tr.length;
      const fade = s.alive ? 1 : Math.max(0, 1 - p1.age / 0.55);
      const jag = id === 'rayo' ? p1.j : 0;
      ctx.strokeStyle = st.halo; ctx.globalAlpha = 0.28 * k * fade; ctx.lineWidth = 2 + 8 * k;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y - camY); ctx.lineTo(p1.x + jag, p1.y - camY + jag * 0.5); ctx.stroke();
      ctx.strokeStyle = st.trail; ctx.globalAlpha = 0.9 * k * fade; ctx.lineWidth = 1 + 2.5 * k;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y - camY); ctx.lineTo(p1.x + jag, p1.y - camY + jag * 0.5); ctx.stroke();
    }
    const hx = s.x, hy = s.y - camY, alpha = s.alive ? 1 : 0.5;
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 22);
    g.addColorStop(0, st.core); g.addColorStop(0.3, st.halo); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.core; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = st.halo; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.stroke();
    if (id === 'rayo') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); const a = this.rnd(0, 6.28); ctx.moveTo(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6); ctx.lineTo(hx + Math.cos(a + 0.8) * 13, hy + Math.sin(a + 0.8) * 13); ctx.lineTo(hx + Math.cos(a + 1.4) * 9, hy + Math.sin(a + 1.4) * 9); ctx.stroke(); }
    if (id === 'hielo') { ctx.strokeStyle = '#eaffff'; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + s.x * 0.05; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8); ctx.lineTo(hx + Math.cos(a) * 13, hy + Math.sin(a) * 13); ctx.stroke(); } }
    if (id === 'lava') { ctx.fillStyle = '#ff9a2a'; for (let k = 0; k < 3; k++) { const x = hx - 6 - k * 4, y = hy + this.rnd(-3, 3); ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 5, y); ctx.lineTo(x, y + 3); ctx.fill(); } }
    ctx.restore();
  },
  /* lo que se ve del efecto (arcos, anillos y partículas) encima de la escena */
  draw(ctx, camY) {
    ctx.save();
    for (const a of this.arcs) {
      const p = Math.min(1, a.t / 0.12), fade = Math.max(0, 1 - a.t / a.life);
      const b0 = a.f > 0 ? -1.15 : Math.PI - 1.15, b1 = a.f > 0 ? 1.15 : Math.PI + 1.15, end = b0 + (b1 - b0) * p;
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      ctx.strokeStyle = a.cols[0]; ctx.globalAlpha = 0.28 * fade; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.arc(a.x, a.y - camY, 34, b0, end); ctx.stroke();
      ctx.globalAlpha = 0.75 * fade; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(a.x, a.y - camY, 34, b0, end); ctx.stroke();
      ctx.strokeStyle = a.cols[1]; ctx.globalAlpha = fade; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(a.x, a.y - camY, 34, b0, end); ctx.stroke();
    }
    for (const r of this.rings) {
      const k = r.t / r.life, rad = r.r0 + (r.r1 - r.r0) * k;
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = r.col; ctx.globalAlpha = 0.85 * (1 - k); ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y - camY, rad, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of this.parts) {
      const a = Math.max(0, Math.min(1, p.life / p.max)), y = p.y - camY;
      if (p.t === 'smoke' || p.t === 'mist') {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.32 * a; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, y, p.sz * (1.6 - a * 0.6), 0, Math.PI * 2); ctx.fill(); continue;
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.strokeStyle = p.col;
      if (p.t === 'spark') {
        ctx.lineWidth = Math.max(1, p.sz * 0.9); ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x - p.vx * 0.04, y - p.vy * 0.04); ctx.stroke();
      } else if (p.t === 'shard') {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(0, -p.sz * 1.6); ctx.lineTo(p.sz, p.sz); ctx.lineTo(-p.sz, p.sz); ctx.closePath(); ctx.fill(); ctx.restore();
      } else {
        ctx.fillRect(p.x - p.sz * 0.7, y - p.sz * 0.7, p.sz * 1.4, p.sz * 1.4);
      }
    }
    ctx.restore();
  }
};
