'use strict';
/* =====================================================================
   ASCENSO 4.8.2 · muerte del personaje. El golpe suelta chispas y sacude la pantalla; el
   personaje sale despedido hacia atrás, cae, rebota una vez y queda tendido girando hacia
   atrás. Después se deshace en píxeles que suben como brasas y queda un destello que se
   aleja. Sirve para el jugador (la carrera y el VS) y para los rivales del VS.
   El cuerpo guarda su estado en body.death; body.x / body.y se mueven con la física propia.
   ===================================================================== */
const Death = {
  DISSOLVE_T: 1.0,            /* segundos desde el golpe hasta que empieza a deshacerse */
  DISSOLVE_D: 0.9,            /* duración del deshacerse */
  DUR: 2.05,                  /* al terminar, el cuerpo ya no se dibuja */
  GRAV: 900,
  BLOCK: { w: 5, h: 4 },      /* el sprite se deshace por bloques de este tamaño */
  parts: [],                  /* brasas y destellos: {x, y, vx, vy, life, max, col, s} */
  COLS: ['#ff8ad8', '#c084fc', '#9cf0ff', '#ffe7a6'],

  /* altura del suelo bajo (x, y): el borde superior de la plataforma más alta que está debajo, o null */
  groundAt(x, y, plats) {
    let g = null;
    for (const q of plats || []) {
      if (q.active === false || x < q.x || x > q.x + q.w) continue;
      if (q.y >= y - 6 && (g === null || q.y < g)) g = q.y;
    }
    return g;
  },
  /* quiet: sin efectos de la partida (lo usa el duelo del menú, que no pasa por Feel) */
  start(body, plats, quiet) {
    if (!body || body.death) return;
    if (body.sl) body.sl.on = false;
    body.death = { t: 0, vx: -body.face * 95, vy: -250, rot: 0, bounced: false, landed: false, wisp: false,
      ground: Death.groundAt(body.x, body.y, plats), q: 0, gone: false, quiet: !!quiet };
    if (quiet) { for (let i = 0; i < 12; i++) Death.add(body.x + (Math.random() - 0.5) * 12, body.y - 16 + (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 140, -40 - Math.random() * 90, 0.5, '#ff8a96', 2); return; }
    Feel.burst(body.x, body.y - 18, 14, ['#ff6b7a', '#ffd0d6', '#ffe7a6'], 170, 0.5);
    Feel.shakeT = Math.max(Feel.shakeT || 0, 0.2);
  },
  update(body, dt) {
    const d = body.death; if (!d || d.gone) return;
    d.t += dt;
    d.vy += Death.GRAV * dt;
    body.x += d.vx * dt; body.y += d.vy * dt;
    d.vx *= Math.max(0, 1 - 3 * dt);
    if (d.ground !== null && body.y >= d.ground && d.vy >= 0) {
      body.y = d.ground;
      if (!d.bounced && d.vy > 140) {
        d.vy = -d.vy * 0.28; d.bounced = true; d.vx *= 0.4;
        if (!d.quiet) Feel.burst(body.x, body.y, 8, ['#c9b48a', '#8a7a5a', '#ffe7a6'], 90, 0.35);
      } else { d.vy = 0; d.landed = true; }
    }
    /* gira hacia atrás mientras cae y se queda tendido */
    const target = -body.face * Math.PI / 2;
    d.rot += (target - d.rot) * (1 - Math.exp(-dt * (d.landed ? 5 : 8)));
    /* se deshace por bloques al azar */
    const q0 = d.q;
    d.q = clamp((d.t - Death.DISSOLVE_T) / Death.DISSOLVE_D, 0, 1);
    if (d.q > q0) Death.spawnDust(body, q0, d.q);
    if (d.q >= 1 && !d.wisp) { d.wisp = true; Death.wisp(body); }
    if (d.t >= Death.DUR) d.gone = true;
  },
  /* número pseudoaleatorio fijo por bloque (en [0, 1)): cada bloque se deshace siempre en el mismo orden */
  blockR(bx, by) { const h = Math.sin(bx * 12.9898 + by * 78.233) * 43758.5453; return h - Math.floor(h); },
  /* posición de un bloque en el mundo, con el volteo y el giro del cuerpo */
  blockAt(body, bx, by) {
    const B = Death.BLOCK, d = body.death;
    let lx = bx + B.w / 2 - HERO.FW / 2; const ly = by + B.h / 2 - HERO.FH;
    if (body.face < 0) lx = -lx;
    const c = Math.cos(d.rot), s = Math.sin(d.rot);
    return { x: body.x + lx * c - ly * s, y: body.y + lx * s + ly * c };
  },
  spawnDust(body, q0, q1) {
    const B = Death.BLOCK; let n = 0;
    for (let by = 0; by < HERO.FH; by += B.h) for (let bx = 0; bx < HERO.FW; bx += B.w) {
      const r = Death.blockR(bx, by);
      if (r <= q0 || r > q1 || Math.random() > 0.45) continue;
      const p = Death.blockAt(body, bx, by);
      Death.add(p.x, p.y, (Math.random() - 0.5) * 18, -(28 + Math.random() * 50), 0.9 + Math.random() * 0.5, Death.pick(), 2);
      if (++n > 40) return;
    }
  },
  /* al desvanecerse, un destello dorado y azul sube despacio */
  wisp(body) {
    for (let i = 0; i < 14; i++) {
      Death.add(body.x + (Math.random() - 0.5) * 16, body.y - 20 + (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16, -(20 + Math.random() * 26), 1.3 + Math.random() * 0.6,
        i % 2 ? '#ffd34a' : '#9cf0ff', 3);
    }
  },
  pick() { return Death.COLS[Math.floor(Math.random() * Death.COLS.length)]; },
  add(x, y, vx, vy, life, col, s) {
    if (Death.parts.length >= 500) return;
    Death.parts.push({ x, y, vx, vy, life, max: life, col, s });
  },
  updateParts(dt) {
    for (let i = Death.parts.length - 1; i >= 0; i--) {
      const p = Death.parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= Math.max(0, 1 - 0.8 * dt);
      p.vx += Math.sin(p.y * 0.05) * 6 * dt;
      p.life -= dt;
      if (p.life <= 0) Death.parts.splice(i, 1);
    }
  },
  drawParts(ctx, camY) {
    if (!Death.parts.length) return;
    for (const p of Death.parts) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y - camY), p.s, p.s);
    }
    ctx.globalAlpha = 1;
  },
  /* el cuerpo: tendido y girando al caer; luego deshecho en bloques (los que faltan no se dibujan) */
  draw(ctx, body, camY, strips) {
    const d = body.death; if (!d || d.gone || !strips) return;
    const im = d.landed ? strips.idle : strips.fall; if (!im) return;
    const fx = Math.round(body.x), fy = Math.round(body.y - camY), idx = d.landed ? 0 : 2;
    const n = Math.max(1, Math.floor(im.width / HERO.FW)), i = ((idx % n) + n) % n;
    const x0 = fx - HERO.FW / 2, y0 = fy - HERO.FH, B = Death.BLOCK;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.translate(fx, fy); ctx.rotate(d.rot); ctx.translate(-fx, -fy);
    if (body.face < 0) { ctx.translate(fx, 0); ctx.scale(-1, 1); ctx.translate(-fx, 0); }
    if (d.q <= 0) ctx.drawImage(im, i * HERO.FW, 0, HERO.FW, HERO.FH, x0, y0, HERO.FW, HERO.FH);
    else for (let by = 0; by < HERO.FH; by += B.h) for (let bx = 0; bx < HERO.FW; bx += B.w) {
      if (Death.blockR(bx, by) <= d.q) continue;
      ctx.drawImage(im, i * HERO.FW + bx, by, B.w, B.h, x0 + bx, y0 + by, B.w, B.h);
    }
    ctx.restore();
  }
};
