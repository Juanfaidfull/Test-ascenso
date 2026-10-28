'use strict';
/* =====================================================================
   ASCENSO 4.40 · repisas que desaparecen al pisarlas. Firmes mientras nadie está encima. Al pisarlas se
   desvanecen (0,8 s, parpadeando), quedan fuera 2 s y vuelven con un fundido corto (0,3 s). Sin nadie encima
   no cambian. Solo se usa en el VS y en las oleadas (el entrenamiento deja las repisas fijas).
   ===================================================================== */
const PLAT_TIMING = { fade: 0.8, back: 7.0, appear: 0.3 };   /* al pisarla: 0,8 s desvaneciéndose; 7 s fuera; vuelve con un fundido de 0,3 s */
/* caja de cada repisa en la imagen de la isla (x0, y0, x1, y1), de izquierda a derecha; medidas de los PNG */
const PLAT_BOX = {
  cristal: [[166, 113, 300, 134], [376, 68, 510, 88]],
  playa: [[172, 127, 285, 140], [389, 96, 503, 109]],
  volcan: [[149, 114, 258, 136], [410, 84, 519, 106]],
  selva: [[274, 47, 506, 90], [472, 99, 597, 140]],
  tiempo: [[109, 96, 253, 126], [204, 30, 472, 58], [423, 96, 566, 126]],
  normal: [[139, 115, 278, 142], [390, 78, 529, 105]],
  ice: [[137, 92, 280, 113], [387, 69, 530, 93]],
  magma: [[126, 76, 264, 102], [406, 47, 544, 72]],
  candy: [[150, 114, 282, 139], [386, 61, 518, 85]],
  abyss: [[131, 93, 262, 120], [406, 93, 538, 120]],
  entrenamiento: [[113, 122, 229, 148], [276, 69, 392, 96], [439, 122, 555, 148]],
  bastion: [[156, 98, 275, 119], [393, 106, 512, 126]]
};
const Platforms = {
  cache: {},
  /* estado de cada repisa en el tiempo: plats[0] es la isla; plats[1..] son las repisas, de izquierda a derecha */
  /* quien está de pie sobre la repisa (jugador local o rival): al pisarla empieza a desaparecer */
  stands(b, q) {
    if (!b || b.death || b.x == null || b.y == null) return false;
    if (b.x < q.x - 4 || b.x > q.x + q.w + 4) return false;
    if (Math.abs(b.y - q.y) > 6) return false;
    return b.onGround === true || (b.onGround === undefined && Math.abs(b.vy || 0) < 40);
  },
  /* estado de cada repisa: firme -> desvaneciéndose (al pisarla) -> fuera -> firme otra vez. Sin nadie encima no cambia */
  step(world, dt, bodies) {
    if (!world || !world.cycle || !world.plats || world.plats.length < 2) return;
    dt = dt || 0; bodies = bodies || [];
    for (let i = 1; i < world.plats.length; i++) {
      const q = world.plats[i];
      if (!q.state) { q.state = 'solid'; q.t = 0; }
      if (q.state === 'solid' && bodies.some(b => Platforms.stands(b, q))) { q.state = 'fade'; q.t = 0; }
      q.t += dt;
      if (q.state === 'fade' && q.t >= PLAT_TIMING.fade) { q.state = 'gone'; q.t = 0; }
      else if (q.state === 'gone' && q.t >= PLAT_TIMING.back) { q.state = 'solid'; q.t = 0; q.inT = 0; }
      let alpha = 1, active = true;
      if (q.state === 'fade') {
        const k = q.t / PLAT_TIMING.fade;
        alpha = (1 - 0.8 * k) * (Math.floor(q.t * 14) % 2 ? 0.55 : 1);
      } else if (q.state === 'gone') {
        alpha = 0; active = false;
      } else if (q.inT !== undefined) {
        q.inT += dt; alpha = Math.min(1, q.inT / PLAT_TIMING.appear);
        if (q.inT >= PLAT_TIMING.appear) delete q.inT;
      }
      q.active = active; q.vis = { alpha: Math.max(0, Math.min(1, alpha)) };
    }
  },
  /* los cuerpos que pueden pisar repisas en el VS: el jugador local y los rivales (que llegan por red) */
  vsBodies() {
    const out = [];
    if (typeof G !== 'undefined' && G.player) out.push(G.player);
    if (typeof Ghosts !== 'undefined' && Ghosts.peers) for (const g of Ghosts.peers.values()) out.push({ x: g.x, y: g.y, death: g.death, onGround: g.onGround, vy: (g.s && g.s.vy) || g.vy || 0 });
    return out;
  },
  /* separa la isla de sus repisas: una imagen base sin repisas y una capa por cada repisa */
  build(id) {
    if (this.cache[id]) return this.cache[id];
    const m = VS_MAPS[id] || SOLO_MAPS[id], im = m ? Img.get(m.isla) : null;
    if (!im || !Img.ready(im) || !PLAT_BOX[id]) return null;
    const base = document.createElement('canvas'); base.width = im.width; base.height = im.height;
    const bc = base.getContext('2d'); bc.drawImage(im, 0, 0);
    /* la caja se amplía unos píxeles (sin pasar de la superficie de la isla) para llevarse también las migas sueltas */
    const PLAT_PAD = 8, topRow = (m && m.art && m.art.top ? m.art.top : im.height) - 2;
    const crops = PLAT_BOX[id].map(b0 => {
      const b = [Math.max(0, b0[0] - PLAT_PAD), Math.max(0, b0[1] - PLAT_PAD), Math.min(im.width - 1, b0[2] + PLAT_PAD), Math.min(topRow, b0[3] + PLAT_PAD)];
      const x = b[0], y = b[1], w = b[2] - b[0] + 1, h = b[3] - b[1] + 1;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(base, x, y, w, h, 0, 0, w, h);
      bc.clearRect(x, y, w, h);
      return { cv, x, y, w, h };
    });
    return (this.cache[id] = { base, crops });
  },
  /* dibuja la isla con sus repisas según su estado; false si la imagen aún no está lista */
  draw(ctx, id, ox, oy, s, w, h, plats) {
    const c = this.build(id);
    if (!c) return false;
    ctx.drawImage(c.base, ox, oy, w, h);
    for (let i = 0; i < c.crops.length; i++) {
      const cr = c.crops[i], q = plats && plats[i + 1], a = q && q.vis ? q.vis.alpha : 1;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(cr.cv, Math.round(ox + cr.x * s), Math.round(oy + cr.y * s), cr.w * s, cr.h * s);
      ctx.globalAlpha = 1;
    }
    return true;
  }
};
