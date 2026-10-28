'use strict';
/* =====================================================================
   ASCENSO 4.2 · el rival en el VS. Se ve con sus animaciones reales (caminar, correr,
   saltar, caer, espada y tirachinas con la goma al apuntar), dibujadas con las mismas
   tiras del héroe. Su posición se interpola; los golpes, las bolas y las rondas llegan
   como eventos y cada cual los aplica en su pantalla.
   ===================================================================== */
const Ghosts = {
  peers: new Map(), cache: {}, forceStrips: {}, labelColors: {},
  clean(m) {
    if (!m || typeof m !== 'object') return null;
    if (!isNum(m.x, -2000, 3000) || !isNum(m.y, -2000, 3000)) return null;
    return {
      x: m.x, y: m.y,
      face: m.face < 0 ? -1 : 1,
      anim: typeof m.anim === 'string' && m.anim.length <= 12 ? m.anim : 'idle',
      char: typeof CHARACTERS !== 'undefined' && CHARACTERS[m.char] ? m.char : 'hero',
      hp: isNum(m.hp, 0, 10) ? m.hp : 3,
      vy: isNum(m.vy, -3000, 3000) ? m.vy : 0,
      sl: Array.isArray(m.sl) && m.sl.length === 2 && isNum(m.sl[0], -200, 200) && isNum(m.sl[1], 0, 100) ? m.sl : null,
      pr: m.pr ? 1 : 0   /* escudo levantado del rival */
    };
  },
  /* el aspecto del rival: sus propias tiras de sprites (se calculan una vez por aspecto) */
  stripsFor(look) {
    const who = look && look.char === 'chica' ? 'chica' : 'hero';   /* el rival puede ser la guerrera */
    let cfg = {};
    if (look && typeof look === 'object' && !Array.isArray(look)) {   /* formato nuevo: por parte, índice o color libre #rrggbb */
      for (const k of Object.keys(HERO_DEFAULT_CFG)) {
        const v = look[k];
        cfg[k] = (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v.toLowerCase() : clamp(Math.floor(+v || 0), 0, HERO_OPT[k].length - 1);
      }
    } else {
      if (!Array.isArray(look) || look.length < 5) return G.heroStrips;
      ['skin', 'hair', 'shirt', 'cape', 'pants'].forEach((k, i) => { cfg[k] = clamp(Math.floor(+look[i] || 0), 0, HERO_OPT[k].length - 1); });
    }
    const key = who + JSON.stringify(cfg);
    if (!this.cache[key]) { const s = artFor(who).strips(cfg); if (!s) return G.heroStrips; this.cache[key] = s; }
    return this.cache[key];
  },
  /* un mensaje de estado por jugador; si llegan demasiados de golpe se descartan */
  onState(m) {
    const id = typeof m.id === 'string' ? m.id.slice(0, 64) : null;
    const s = this.clean(m); if (!id || !s) return;
    const now = performance.now();
    let p = this.peers.get(id);
    if (!p) { p = this.blank(id, 'rival', now); this.peers.set(id, p); p.x = p.tx = s.x; p.y = p.ty = s.y; }
    p.rate = p.rate.filter(t => now - t < 1000); p.rate.push(now);
    if (p.rate.length > 40) return;
    if (p.s.anim !== s.anim) p.animT = 0;
    Object.assign(p, { tx: s.x, ty: s.y, s, seen: now });
  },
  blank(id, name, now) {
    return { id, name, x: ARENA.CX, y: ARENA.TOP, tx: ARENA.CX, ty: ARENA.TOP, seen: now, rate: [],
      s: { face: 1, anim: 'idle', char: 'hero', hp: 3, vy: 0, sl: null }, animT: 0, atk: 0, look: null, strips: null };
  },
  /* la presencia manda: un rival sale de la lista sólo cuando la sala lo quita */
  setPresence(list) {
    const want = new Map(list.map(x => [x.id, x]));
    for (const id of [...this.peers.keys()]) if (!want.has(id)) this.peers.delete(id);
    const now = performance.now();
    for (const x of list) {
      let p = this.peers.get(x.id);
      if (!p) { p = this.blank(x.id, x.name || 'rival', now); this.peers.set(x.id, p); }
      p.name = x.name || 'rival'; p.seen = now; p.look = x.look || null;
      p.strips = this.stripsFor(p.look);
    }
  },
  /* el golpe con espada: el rival empieza a girar la espada en el mismo instante */
  swing(id, fx) { const p = this.peers.get(id); if (p) { const cid=p.s && p.s.char || 'hero'; p.atkDur=CHARACTERS[cid] ? CHARACTERS[cid].attackDuration : .27; p.atkN=(p.atkN||0)+1; p.atk=p.atkDur; p.animT=0; if(cid==='hero'||cid==='knight'||cid==='martial') Fx.sword(p.x,p.y,p.s?p.s.face:1,craftRecipeFor(fx,'sword')); } },
  update(dt) {
    const k = 1 - Math.exp(-dt * 12);
    for (const p of this.peers.values()) {
      if (p.death) { Death.update(p, dt); p.animT += dt; continue; }   /* muriendo: la física es la suya, no la de la red */
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
      p.animT += dt;
      if (p.atk > 0) p.atk = Math.max(0, p.atk - dt);
    }
  },
  /* al empezar una ronda, el rival aparece en su esquina sin deslizarse desde la anterior */
  snap(id, x, y, face) {
    const p = id && this.peers.get(id); if (!p) return;
    Object.assign(p, { x, tx: x, y, ty: y, atk: 0, animT: 0, death: null });
    p.s.face = face; p.s.hp = 6; p.s.anim = 'idle'; p.s.sl = null;
  },
  /* el rival pierde: cae y se deshace en su pantalla (lo avisa el mensaje ko de la ronda) */
  die(id, plats) { const p = id && this.peers.get(id); if (!p || p.death) return; p.face = p.s.face; Death.start(p, plats); },
  clear() { this.peers.clear(); },
  /* dibujo en coordenadas del mundo (el lienzo ya está desplazado en x) */
  draw(ctx, camY, t, plats) {
    for (const p of this.peers.values()) {
      if (!p.strips || p.strips === G.heroStrips) p.strips = this.stripsFor(p.look);
      if (p.death) { Death.draw(ctx, p, camY, this.forceStrips[p.id] || p.strips || G.heroStrips); continue; }
      const strips = this.forceStrips[p.id] || p.strips;
      if (!strips || !strips.idle) continue;
      const s = p.s;
      const v = { x: p.x, y: p.y, face: s.face, charId: s.char || 'hero', anim: p.atk > 0 ? 'attack' : s.anim, animT: p.animT, atk: p.atk, atkDur: p.atkDur || (CHARACTERS[s.char] ? CHARACTERS[s.char].attackDuration : .27), atkN: p.atkN || 1,
        vy: s.vy || 0, sq: 1, inv: 0,
        sl: s.sl ? { on: true, aim: s.sl[0] / 100, pow: s.sl[1] / 100 } : { on: false, aim: 0, pow: 0 } };
      Scene.drawPlayer(ctx, v, camY, strips);
      Scene.drawSling(ctx, v, camY, plats);
      v.parryT = s.pr ? 1 : 0; Scene.drawParry(ctx, v, camY);   /* el escudo del rival se ve también en tu pantalla */
      const x = Math.round(p.x), y = Math.round(p.y - camY);
      ctx.font = '9px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = this.labelColors[p.id] || 'rgba(214,240,255,0.9)';
      /* el nombre va sobre la cabeza; en la plataforma de arriba, a un lado para no tapar la pausa */
      const up = p.y < ARENA.TOP - 30;
      ctx.textAlign = up ? 'left' : 'center';
      ctx.fillText(p.name || 'rival', up ? x + 14 : x, up ? y - 22 : y - 56);
    }
  }
};
