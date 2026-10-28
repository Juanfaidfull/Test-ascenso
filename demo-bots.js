'use strict';
/* =====================================================================
   ASCENSO 4.11 · duelo de práctica del menú principal: dos bots 1 contra 1 en la isla del VS,
   sin fin. Cada bot tiene una personalidad (cuerpo a cuerpo, tirador, astuto o estratega) y
   decide por utilidad: compara acercarse, mantener la distancia, disparar, retirarse, subir a
   la plataforma, bajar sobre el rival, fintar o reposicionarse, según la situación. Lee al
   rival con un retraso de reacción humano: si carga el tirachinas o prepara un espadazo, se
   aparta o salta. Calcula el tiro anticipando hacia dónde irá el rival. Usa la física, la vida
   y las reglas del VS (la espada deja inmóvil 0,2 s, la bola 1 s), pero su simulación es propia.
   ===================================================================== */
const Demo = {
  W: 600, H: 270,
  cv: null, ctx: null, running: false, raf: 0, last: 0, t: 0,
  bots: [], balls: [], surf: [], plats: [], platBox: null, ballSeq: 0,
  round: 1, score: [0, 0], phase: 'count', phaseT: 0, winner: -1,
  stats: { parry: 0, sword: 0, ball: 0, shots: 0, aims: 0, swings: 0, reads: 0, dodges: 0, falls: 0, kos: 0, rounds: 0,
    still: 0, frames: 0, plat: 0, act: {} },
  NAMES: ['Mira', 'Kael', 'Nox', 'Iru', 'Tano', 'Vex', 'Oda', 'Rin', 'Sol', 'Bram'],
  ARCH: {
    bruiser:   { label: 'Cuerpo a cuerpo', aggr: 0.9,  space: 22,  sling: 0.35, climb: 0.35, feint: 0.25, caution: 0.2 },
    sniper:    { label: 'Tirador',         aggr: 0.25, space: 150, sling: 1.0,  climb: 0.7,  feint: 0.1,  caution: 0.5 },
    trickster: { label: 'Astuto',          aggr: 0.6,  space: 60,  sling: 0.6,  climb: 0.85, feint: 0.6,  caution: 0.3 },
    tactician: { label: 'Estratega',       aggr: 0.55, space: 80,  sling: 0.75, climb: 0.6,  feint: 0.3,  caution: 0.4 }
  },
  COUNT_T: 2.4, REND_T: 2.6,

  attach(canvas) {
    this.cv = canvas; canvas.width = this.W; canvas.height = this.H;
    this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    const g = VsGeo.of('normal');
    this.isl = { x0: g.isl.x0, x1: g.isl.x1 };
    this.plats = Versus.buildWorld('normal').plats;
    this.surf = g.plats.map(p => ({ y: p.y, x0: p.x0, x1: p.x1 })).concat([{ y: g.isl.y, x0: g.isl.x0, x1: g.isl.x1 }]);
    this.platBox = this.surf[0];
    Death.parts = [];
    this.newMatch();
  },
  start() {
    if (this.running || !this.ctx) return;
    this.running = true; this.last = 0;
    const tick = ts => {
      if (!this.running) return;
      const dt = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 1 / 60;
      this.last = ts;
      this.step(dt); this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  },
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; },

  /* ---------- creación ---------- */
  looks() { return ['skin', 'hair', 'shirt', 'cape', 'pants'].map(k => Math.floor(Math.random() * HERO_OPT[k].length)); },
  spritesOf(b) { if (!b.strips) b.strips = HeroArt.teamStrips(b.team) || (b.look && Ghosts.stripsFor(b.look)) || G.heroStrips || null; return b.strips; },
  mkBot(seat, name, team, archKey) {
    const sp = Versus.spawnPoint(seat);
    const skill = 0.84 + Math.random() * 0.12;
    return { name, seat, team, arch: archKey, A: this.ARCH[archKey], label: this.ARCH[archKey].label,
      skill, reactT: 0.3 - skill * 0.1 + (Math.random() - 0.5) * 0.04,
      look: this.looks(), strips: null, hist: [], commit: null, lastAct: '', rolled: '',
      solT: -9, solOk: false, relAimT: 0, chargeT: 0, chargeId: 0, atkId: 0,
      x: sp.x, y: sp.y, face: sp.face, vx: 0, vy: 0, onGround: true, jumps: 0, hp: 6, invT: 0, stunT: 0,
      atk: 0, atkHit: false, atkCd: 0, slCd: 0, dodgeT: 0,
      sl: { on: false, aim: 0, pow: 0, t: 0 }, anim: 'idle', animT: 0, sq: 1, inv: 0, moveDir: 0, death: null };
  },
  newMatch() {
    this.round = 1; this.score = [0, 0];
    const names = this.NAMES.slice().sort(() => Math.random() - 0.5);
    const keys = Object.keys(this.ARCH).sort(() => Math.random() - 0.5);
    this.bots = [this.mkBot(0, names[0], 'verde', keys[0]), this.mkBot(1, names[1], 'rojo', keys[1])];
    this.startRound();
  },
  startRound() {
    this.balls = []; this.phase = 'count'; this.phaseT = 0; this.winner = -1;
    for (const b of this.bots) {
      const sp = Versus.spawnPoint(b.seat);
      Object.assign(b, { x: sp.x, y: sp.y, face: sp.face, vx: 0, vy: 0, onGround: true, jumps: 0, hp: 6, invT: 0, stunT: 0,
        atk: 0, atkHit: false, atkCd: 0.5, slCd: 0.6, dodgeT: 0, sl: { on: false, aim: 0, pow: 0, t: 0 }, moveDir: 0,
        commit: null, lastAct: '', rolled: '', hist: [], death: null, anim: 'idle', animT: 0 });
    }
  },

  /* ---------- tiempo ---------- */
  step(dt) {
    this.t += dt;
    let rem = dt;
    while (rem > 1e-6) { const h = Math.min(rem, 1 / 120); this.sim(h); rem -= h; }
    Death.updateParts(dt);
  },
  sim(dt) {
    if (this.phase === 'count') {
      this.phaseT += dt;
      for (const b of this.bots) this.body(b, dt, true);
      if (this.phaseT >= this.COUNT_T) { this.phase = 'fight'; this.phaseT = 0; }
      return;
    }
    if (this.phase === 'rend') {
      this.phaseT += dt;
      for (const b of this.bots) this.body(b, dt, true);
      this.flyBalls(dt, false);
      if (this.phaseT >= this.REND_T) { this.round++; this.startRound(); }
      return;
    }
    for (const b of this.bots) this.record(b);
    for (const b of this.bots) this.think(b, dt);
    for (const b of this.bots) this.body(b, dt, false);
    for (const b of this.bots) this.swing(b, dt);
    this.flyBalls(dt, true);
    this.measure();
    this.checkKO();
  },

  /* ---------- memoria de lo que hace cada bot (para leer al rival con retraso) ---------- */
  record(b) {
    const h = b.hist;
    h.push({ t: this.t, x: b.x, y: b.y, vx: b.vx, vy: b.vy, onGround: b.onGround, face: b.face, atk: b.atk,
      atkHit: b.atkHit, atkCd: b.atkCd, slOn: b.sl.on, aim: b.sl.aim, pow: b.sl.pow, hp: b.hp, stunT: b.stunT,
      ev: b.chargeId + '/' + b.atkId });
    if (h.length > 120) h.shift();
  },
  see(b, delay) {
    const o = this.foe(b), h = o.hist, target = this.t - (delay === undefined ? b.reactT : delay);
    for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= target) return h[i];
    if (h.length) return h[0];
    return { t: this.t, x: o.x, y: o.y, vx: o.vx, vy: o.vy, onGround: o.onGround, face: o.face, atk: o.atk, atkHit: o.atkHit,
      atkCd: o.atkCd, slOn: o.sl.on, aim: o.sl.aim, pow: o.sl.pow, hp: o.hp, stunT: o.stunT, ev: '0/0' };
  },
  foe(b) { return this.bots[b.seat === 0 ? 1 : 0]; },

  /* ---------- cuerpo: física, suelo, caídas y animación (las mismas reglas que el jugador) ---------- */
  body(b, dt, frozen) {
    if (b.death) { Death.update(b, dt); this.anim(b); return; }
    b.animT += dt;
    b.plT = b.y < ARENA.TOP - 40 ? (b.plT || 0) + dt : 0;
    b.invT = Math.max(0, b.invT - dt); b.stunT = Math.max(0, b.stunT - dt);
    b.atkCd = Math.max(0, b.atkCd - dt); b.slCd = Math.max(0, b.slCd - dt);
    let dir = frozen || b.stunT > 0 ? 0 : b.moveDir;
    const eL = this.isl.x0 + 14, eR = this.isl.x1 - 14;
    if (b.x < eL) dir = Math.max(dir, 0); else if (b.x > eR) dir = Math.min(dir, 0);   /* nunca hacia el vacío */
    if (dir !== 0 && !b.sl.on && b.atk <= 0) b.face = dir > 0 ? 1 : -1;
    const maxRun = PHYS.RUN * (b.sl.on || b.atk > 0 ? 0.55 : 1);
    const rate = dir !== 0 ? (b.onGround ? PHYS.ACC_G : PHYS.ACC_A) : (b.onGround ? PHYS.DEC_G : PHYS.DEC_A);
    const target = (b.stunT > 0 || frozen) ? 0 : dir * maxRun;
    b.vx += clamp(target - b.vx, -rate * dt, rate * dt);
    const eL2 = this.isl.x0 + 30, eR2 = this.isl.x1 - 30;
    if (b.x < eL2 && b.vx < 0) b.vx *= Math.max(0, 1 - 9 * dt);
    else if (b.x > eR2 && b.vx > 0) b.vx *= Math.max(0, 1 - 9 * dt);
    const prevY = b.y;
    b.x += b.vx * dt;
    b.vy = Math.min(PHYS.MAXFALL, b.vy + PHYS.G * dt);
    b.y += b.vy * dt;
    if (b.y >= ARENA.TOP - 30) {                                  /* sobre la isla: el borde es un límite firme */
      const lim = { l: this.isl.x0 + 6, r: this.isl.x1 - 6 };
      if (b.x < lim.l) { b.x = lim.l; if (b.vx < 0) b.vx = 0; }
      else if (b.x > lim.r) { b.x = lim.r; if (b.vx > 0) b.vx = 0; }
    }
    b.onGround = false;
    for (const s of this.surf) {
      if (b.x < s.x0 || b.x > s.x1) continue;
      if (b.vy >= 0 && prevY <= s.y + 2 && b.y >= s.y) { b.y = s.y; b.vy = 0; b.onGround = true; b.jumps = 0; break; }
    }
    if (b.y > ARENA.DEATH_Y) {                                    /* cae fuera: pierde un corazón y vuelve a su esquina */
      b.hp -= 1; this.stats.falls++;
      if (b.hp > 0) {
        const sp = Versus.spawnPoint(b.seat);
        Object.assign(b, { x: sp.x, y: sp.y - 30, vx: 0, vy: 0, onGround: false, invT: 1.5, stunT: 0, atk: 0, commit: null });
        b.sl.on = false;
      }
    }
    this.anim(b);
  },
  anim(b) {
    let a = 'idle';
    if (b.atk > 0) a = 'attack';
    else if (!b.onGround) a = b.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(b.vx) > 100) a = 'run';
    else if (Math.abs(b.vx) > 5) a = 'walk';
    if (a !== b.anim) { b.anim = a; b.animT = 0; }
  },
  jump(b) {
    if (b.onGround) { b.vy = -PHYS.JUMP; b.onGround = false; b.jumps = 1; }
    else if (b.jumps < 2) { b.vy = -PHYS.JUMP * 0.92; b.jumps = 2; }
  },

  /* ---------- pensar: reaccionar, decidir por utilidad y ejecutar ---------- */
  think(b, dt) {
    this.parryTick(b, dt);
    if (b.death || b.stunT > 0) { b.moveDir = 0; return; }
    const p = this.see(b);
    if (b.dodgeT > 0) b.dodgeT -= dt;
    if (this.threatRead(b, p)) return;
    if (b.dodgeT > 0) return;                                   /* esquivando: sigue el movimiento de la reacción */
    if (b.sl.on) {                                              /* cargando el tiro: se corrige y sigue moviéndose despacio */
      b.sl.t += dt; b.relAimT -= dt;
      if (b.relAimT <= 0) { b.relAimT = 0.22; const sol = this.bestShot(b, p, b.face); if (sol) { b.sl.aim = sol.aim; b.sl.pow = sol.pow; } }
      const d = p.x - b.x;
      b.moveDir = (b.A.aggr > 0.5 ? 1 : -1) * (d >= 0 ? 1 : -1) * 0.3;
      if (b.sl.t >= b.chargeT) this.release(b);
      return;
    }
    if (b.atk > 0) { b.moveDir = 0; return; }
    if (!b.commit || this.t >= b.commit.until) this.decide(b, p);
    this.run(b, p);
  },
  /* lectura del rival: un disparo cargado que pasa por mí, un espadazo que se prepara o una bola que viene */
  threatRead(b, p) {
    if (p.slOn && Math.abs(p.x - b.x) < 340 && this.lineHits(p, b)) return this.react(b, p, 'shot' + p.ev);
    const q = this.see(b, 0.08);   /* el escudo es un reflejo: el espadazo se ve casi al instante */
    if (q.atk > 0 && !q.atkHit && Math.abs(q.x - b.x) < 60 && Math.sign(b.x - q.x) === q.face) return this.react(b, q, 'sword' + q.ev);
    const k = this.ballIncoming(b, this.foe(b));
    if (k) return this.react(b, p, 'ball' + k.id);
    return false;
  },
  react(b, p, key) {
    if (b.rolled === key) return false;                         /* cada amenaza se evalúa una sola vez */
    b.rolled = key;
    const pr = key.startsWith('sword') ? 1 : 0.85;   /* un golpe de frente se bloquea casi siempre; bolas y disparos, un poco menos */
    if ((key.startsWith('sword') || key.startsWith('shot') || key.startsWith('ball')) && this.canParry(b) && Math.random() < pr) { b.commit = null; b.sl.on = false; this.raise(b); return true; }
    if (Math.random() > 0.45 + 0.5 * b.skill) return false;     /* a veces no reacciona, como una persona */
    b.commit = null; b.sl.on = false; b.dodgeT = 0.5;
    b.moveDir = p.x >= b.x ? -1 : 1;
    if (b.onGround) this.jump(b);
    this.stats.reads++; this.stats.dodges++;
    return true;
  },
  lineHits(p, b) {
    const sp = 250 + 380 * p.pow, ox = p.x + p.face * 8, oy = p.y - 22;
    return this.trace(ox, oy, Math.cos(p.aim) * sp * p.face, -Math.sin(p.aim) * sp, b.x, b.y - 14, 16, 22) >= 0;
  },
  ballIncoming(b, o) {
    for (const k of this.balls) {
      if (k.owner !== o || !k.alive || this.t - k.t0 < b.reactT) continue;
      const dx = b.x - k.x;
      if (Math.sign(k.vx) !== Math.sign(dx) || Math.abs(dx) > 170) continue;
      const t = Math.abs(dx) / Math.max(1, Math.abs(k.vx));
      if (t > 0.8) continue;
      const yAt = k.y + k.vy * t + 0.5 * PHYS.BALL_G * t * t;
      if (Math.abs(yAt - (b.y - 14)) < 24) return k;
    }
    return null;
  },

  /* decidir por utilidad: cada acción recibe una puntuación según la situación; se elige la mejor con un poco de azar */
  decide(b, p) {
    const d = p.x - b.x, ad = Math.abs(d), s = d >= 0 ? 1 : -1, A = b.A;
    const onPlat = b.y < ARENA.TOP - 40, oppPlat = p.y < ARENA.TOP - 40, dy = p.y - b.y, lead = b.hp - p.hp;
    const opts = [];
    const fo = this.foe(b), shieldUp = (fo.parryT || 0) > 0, shieldDown = !shieldUp && (fo.parryCd || 0) > 0.5;   /* el rival tiene el escudo arriba o recargando */
    if (ad < 26 && b.atkCd <= 0) opts.push(['melee', 0.2 + A.aggr * 0.5 + (p.atk <= 0 && p.atkCd > 0.3 ? 1.0 : 0) + (p.stunT > 0 ? 1.0 : 0) + (p.hp <= 2 ? 0.3 : 0) - (shieldUp ? 0.9 : 0) + (shieldDown ? 0.35 : 0), 0.3]);
    if (ad >= 26 && ad < 150) opts.push(['approach', 0.1 + A.aggr * 0.45 + Math.max(0, lead) * 0.08 + (p.hp <= 2 ? 0.25 : 0) - (ad > 110 ? 0.15 : 0) - (shieldUp ? 0.5 : 0) + (shieldDown ? 0.3 : 0), 0.5]);
    opts.push(['spacing', 0.45 + (Math.abs(ad - A.space) < 30 ? 0.35 : 0), 0.7]);
    if (b.slCd <= 0 && ad > 40 && ad < 340 && A.sling > 0 && this.canShoot(b, p)) opts.push(['shoot', A.sling * 1.1 + (p.stunT > 0 ? 0.6 : 0) + (oppPlat || dy > 30 ? 0.2 : 0) + Math.max(0, lead) * 0.1 + (shieldUp ? 0.5 : 0) + (ad > 90 ? 0.25 : 0), 1.0]);
    const room = s > 0 ? b.x - (this.isl.x0) : (this.isl.x1) - b.x;   /* espacio detrás de mí */
    if ((ad < 70 || b.hp <= 2) && room > 45) opts.push(['retreat', 0.2 + (b.hp <= 2 ? 0.35 : 0) + A.caution * 0.5 + ((p.atk > 0 || p.slOn) && ad < 70 ? 0.35 : 0), 0.5]);
    if (!onPlat && A.climb > 0 && (oppPlat || ad < 60)) opts.push(['climb', A.climb * 0.45 + (oppPlat ? 0.25 : 0) + Math.max(0, lead) * 0.05, 1.2]);
    if (onPlat) opts.push(['dive', 0.1 + A.aggr * 0.4 + (dy > 40 && ad < 160 ? 0.45 : 0) + ((b.plT || 0) > 2.5 ? 0.9 : 0), 1.0]);
    if (ad < 130) opts.push(['feint', A.feint * 0.8 + (ad < 60 ? 0.1 : 0), 0.5]);
    opts.push(['reposition', 0.1, 0.5]);
    let best = null, bv = -1;
    for (const [name, sc, dur] of opts) {
      const v = sc * (0.85 + Math.random() * 0.3) * (name === b.lastAct ? 0.8 : 1);
      if (v > bv) { bv = v; best = [name, dur]; }
    }
    b.lastAct = best[0];
    b.commit = { act: best[0], until: this.t + best[1], t0: this.t };
    this.stats.act[best[0]] = (this.stats.act[best[0]] || 0) + 1;
  },
  /* ejecuta la acción elegida: siempre hay movimiento con propósito, nunca quieto sin razón */
  run(b, p) {
    const c = b.commit; if (!c) return;
    const d = p.x - b.x, ad = Math.abs(d), s = d >= 0 ? 1 : -1, A = b.A;
    switch (c.act) {
      case 'melee':
        if (ad <= 22 && b.atkCd <= 0) { this.attack(b, s); b.commit = null; b.moveDir = 0; }
        else b.moveDir = ad > 20 ? s : 0;
        break;
      case 'approach':
        if (ad <= 24) { b.commit = null; b.moveDir = 0; } else b.moveDir = s;
        break;
      case 'spacing': {
        const tg = A.space;
        if (ad > tg + 14) b.moveDir = s;
        else if (ad < tg - 14) b.moveDir = -s;
        else b.moveDir = (Math.random() < 0.5 ? -1 : 1) * 0.5;
        break;
      }
      case 'shoot':
        if (!this.startCharge(b, p)) { b.moveDir = s * 0.5; b.commit = null; }
        break;
      case 'retreat':
        b.moveDir = -s;
        break;
      case 'climb': {
        const pb = this.platBox, lo = pb.x0 + 8, hi = pb.x1 - 8;
        if (b.y < ARENA.TOP - 40) { b.commit = null; b.moveDir = 0; break; }
        if (b.x < lo) b.moveDir = 1;
        else if (b.x > hi) b.moveDir = -1;
        else { b.moveDir = 0; if (b.onGround) this.jump(b); }
        break;
      }
      case 'dive': {
        /* bajar sobre el rival: se camina hasta el borde de la plataforma del lado del rival y se cae sobre él */
        if (b.y >= ARENA.TOP - 40) { b.commit = null; break; }
        if (ad <= 22 && b.atkCd <= 0 && b.atk <= 0) { this.attack(b, s); b.commit = null; b.moveDir = 0; break; }
        const pb = this.platBox, edge = p.x < ARENA.CX ? pb.x0 - 4 : pb.x1 + 4;
        b.moveDir = Math.sign(edge - b.x) || s;
        break;
      }
      case 'feint': {
        const e = this.t - c.t0;
        if (e < 0.2) b.moveDir = s;
        else { b.moveDir = -s; if (e > 0.25 && b.onGround && Math.random() < 0.02) this.jump(b); }
        if (e > 0.5) b.commit = null;
        break;
      }
      case 'reposition':
        b.moveDir = (ad > A.space ? s : -s) * 0.6;
        break;
    }
  },
  /* escudo de los bots: 1,2 s activo y 6 s de enfriamiento que empieza al terminar (igual que el del jugador en el VS) */
  parryTick(b, dt) {
    if ((b.parryT || 0) > 0) { b.parryT -= dt; if (b.parryT <= 0) { b.parryT = 0; b.parryCd = 6; } }
    else b.parryCd = Math.max(0, (b.parryCd || 0) - dt);
  },
  canParry(b) { return !b.death && (b.parryT || 0) <= 0 && (b.parryCd || 0) <= 0; },
  raise(b) { b.parryT = 1.2; this.stats.parry++; },
  attack(b, s) {
    b.atk = 0.27; b.atkHit = false; b.face = s; b.atkId++;
    b.atkCd = SWORD_RULES.cooldown + Math.random() * 0.4 + (1 - b.skill) * 0.3;   /* mismo cooldown de espada que el jugador */
    this.stats.swings++;
  },
  swing(b, dt) {
    if (b.death || b.atk <= 0) return;
    b.atk = Math.max(0, b.atk - dt);
    if (!b.atkHit && b.atk <= 0.07) {
      b.atkHit = true;
      const o = this.foe(b);
      const hb = { x: b.face > 0 ? b.x : b.x - 22, y: b.y - 30, w: 22, h: 30 };
      const ob = { x: o.x - 7, y: o.y - 26, w: 14, h: 26 };
      if (!o.death && o.hp > 0 && o.invT <= 0 && overlap(hb, ob)) { this.src = b; this.hit(o, 'sword'); }
    }
  },

  /* ---------- tirachinas: el tiro se calcula con la misma física de la bola y con anticipación ---------- */
  trace(ox, oy, vx, vy, tx, ty, hw, hh) {
    let x = ox, y = oy, v = vy; const dt = 1 / 60;
    for (let i = 0; i < 200; i++) {
      const py = y;
      v += PHYS.BALL_G * dt; x += vx * dt; y += v * dt;
      if (Math.abs(x - tx) < hw && Math.abs(y - ty) < hh) return i * dt;
      for (const s of this.surf) {                              /* una plataforma o la isla que se cruza antes: la bola rebota o se pierde */
        if (v > 0 && x >= s.x0 && x <= s.x1 && py <= s.y && y >= s.y) return -1;
      }
      if (y > 320 || x < 0 || x > 800) return -1;
    }
    return -1;
  },
  collect(b, ox, oy, f, tx, ty) {
    const out = [];
    for (const pow of [0.5, 0.65, 0.8, 0.95]) {
      const sp = 250 + 380 * pow;
      for (let i = 0; i <= 36; i++) {
        const a = SL_MIN + (SL_MAX - SL_MIN) * i / 36, vx = Math.cos(a) * sp * f, vy = -Math.sin(a) * sp;
        const t = this.trace(ox, oy, vx, vy, tx, ty, 11, 17);
        if (t < 0) continue;
        const margin = 1 + (this.trace(ox, oy, vx, vy, tx - 14, ty, 11, 17) >= 0 ? 1 : 0) + (this.trace(ox, oy, vx, vy, tx + 14, ty, 11, 17) >= 0 ? 1 : 0);
        out.push({ aim: a, pow, t, margin });
      }
    }
    return out;
  },
  solutions(b, p, f) {
    const ox = b.x + f * 8, oy = b.y - 22;
    let out = this.collect(b, ox, oy, f, p.x, p.y - 14);
    if (out.length) {                                            /* el rival se mueve mientras vuela la bola: se adelanta la mira */
      const t = out.reduce((u, v) => u + v.t, 0) / out.length;
      const tx = p.x + p.vx * t * 0.8;
      const ty = p.onGround ? p.y - 14 : p.y - 14 + p.vy * t + 0.5 * PHYS.G * t * t;
      out = this.collect(b, ox, oy, f, tx, ty);
    }
    return out;
  },
  bestShot(b, p, f) {
    const sols = this.solutions(b, p, f);
    if (!sols.length) return null;
    sols.sort((u, v) => v.margin - u.margin || u.t - v.t);
    const top = sols.filter(x => x.margin === sols[0].margin);
    const pick = top[Math.floor(Math.random() * Math.min(top.length, 6))];
    const err = (1 - b.skill) * 0.16 + 0.015 + (Math.random() < 0.07 ? 0.1 : 0);   /* error humano; a veces una mala lectura */
    return { aim: pick.aim + (Math.random() - 0.5) * err, pow: pick.pow };
  },
  canShoot(b, p) {
    if (this.t - b.solT > 0.4) { b.solT = this.t; b.solOk = this.solutions(b, p, p.x >= b.x ? 1 : -1).length > 0; }
    return b.solOk;
  },
  startCharge(b, p) {
    const f = p.x >= b.x ? 1 : -1;
    const sol = this.bestShot(b, p, f);
    if (!sol) return false;
    b.face = f; b.sl.on = true; b.sl.t = 0; b.sl.aim = sol.aim; b.sl.pow = sol.pow;
    b.chargeT = 0.35 + Math.random() * 0.5 + (1 - b.skill) * 0.3;
    b.relAimT = 0.22; b.chargeId++;
    this.stats.aims++;
    return true;
  },
  release(b) {
    if (!b.sl.on) return;
    const sp = 250 + 380 * b.sl.pow, f = b.face;
    this.balls.push({ id: ++this.ballSeq, x: b.x + f * 8, y: b.y - 22, vx: Math.cos(b.sl.aim) * sp * f, vy: -Math.sin(b.sl.aim) * sp,
      life: 2.6, bounces: 1, owner: b, alive: true, t0: this.t });
    this.stats.shots++; b.sl.on = false; b.commit = null; b.slCd = 0.9 + Math.random() * 0.6;
  },
  flyBalls(dt, live) {
    for (const k of this.balls) {
      if (!k.alive) continue;
      const py = k.y;
      k.vy += PHYS.BALL_G * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.life -= dt;
      for (const s of this.surf) {
        if (k.vy > 0 && k.x >= s.x0 && k.x <= s.x1 && py <= s.y && k.y >= s.y) {
          if (k.bounces > 0) { k.y = s.y; k.vy *= -0.5; k.vx *= 0.85; k.bounces--; } else k.alive = false;
          break;
        }
      }
      if (k.life <= 0 || k.y > 320 || k.x < 0 || k.x > 800) k.alive = false;
      if (live && k.alive) {
        for (const o of this.bots) {
          if (o === k.owner || o.death || o.hp <= 0 || o.invT > 0) continue;
          if (Math.abs(k.x - o.x) < 11 && Math.abs(k.y - (o.y - 14)) < 17) { k.alive = false; this.src = k.owner; this.hit(o, 'ball'); break; }
        }
      }
    }
    this.balls = this.balls.filter(k => k.alive);
  },
  /* como en el VS: la espada deja inmóvil 0,2 s y la bola 1 s; ninguna empuja */
  hit(o, kind) {
    /* el escudo bloquea el golpe que llega de frente y se rompe con él; el de la espalda sí daña */
    const src = this.src || null; this.src = null;
    if ((o.parryT || 0) > 0 && o.invT <= 0 && src && (o.face >= 0 ? src.x >= o.x - 2 : src.x <= o.x + 2)) {
      o.parryT = 0; o.parryCd = 6; this.stats.parry++;
      for (let i = 0; i < 6; i++) Death.add(o.x + o.face * 10, o.y - 22, (Math.random() - 0.5) * 90, -30 - Math.random() * 60, 0.4, '#83eaff', 2);
      return;
    }
    o.hp -= 1; o.invT = 0.7; o.vx = 0; o.sl.on = false;
    if (kind === 'sword') { o.stunT = SWORD_RULES.stun; this.stats.sword++; }
    else { o.stunT = 1.0; this.stats.ball++; }
    for (let i = 0; i < 7; i++) Death.add(o.x + (Math.random() - 0.5) * 10, o.y - 16 + (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 120, -40 - Math.random() * 80, 0.45, '#ff8a96', 2);
  },
  measure() {
    for (const b of this.bots) {
      this.stats.frames++;
      if (b.onGround && Math.abs(b.vx) < 8 && b.atk <= 0 && !b.sl.on && b.stunT <= 0 && !b.death) this.stats.still++;
      if (b.y < ARENA.TOP - 40) this.stats.plat++;
    }
  },
  checkKO() {
    for (const b of this.bots) if (b.hp <= 0 && !b.death) { Death.start(b, this.plats, true); this.stats.kos++; }
    if (this.bots.some(b => b.death)) {
      const alive = this.bots.filter(b => !b.death);
      const w = alive.length === 1 ? this.bots.indexOf(alive[0]) : -1;
      this.phase = 'rend'; this.phaseT = 0; this.winner = w;
      if (w >= 0) { this.score[w]++; this.stats.rounds++; }
    }
  },

  /* ---------- dibujo: el duelo en la isla del VS, con la misma escena y los mismos personajes ---------- */
  draw() {
    const c = this.ctx, W = this.W, H = this.H;
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    Versus.drawBackdrop(c, 'normal');
    const z = Math.min(1, (W - 20) / (ARENA.HALF * 2));
    c.save(); c.translate(W / 2, ARENA.TOP); c.scale(z, z); c.translate(-ARENA.CX, -ARENA.TOP);
    Versus.drawIsland(c, 0, 'normal');
    for (const k of this.balls) c.drawImage(Sprites.ball(), Math.round(k.x - 4.5), Math.round(k.y - 4.5));
    for (const b of this.bots) {
      Scene.drawPlayer(c, b, 0, this.spritesOf(b));
      if (typeof Scene !== 'undefined' && Scene.drawParry) Scene.drawParry(c, b, 0);
      if (!b.death) Scene.drawSling(c, b, 0, this.plats);
    }
    Death.drawParts(c, 0);
    c.restore();
    this.bots.forEach((b, i) => {
      for (let h = 0; h < 6; h++) {
        const x = i === 0 ? 8 + h * 22 : W - 8 - (6 - h) * 22;
        c.drawImage(Sprites.heart(h < b.hp), x, 6, 20, 18);
      }
      const col = b.team === 'verde' ? '#9cf07a' : '#ff8a7a', al = i === 0 ? 'left' : 'right', x = i === 0 ? 8 : W - 8;
      Hud.txt(c, b.name, x, 36, '700 14px Pixelify Sans, monospace', col, al);
      Hud.txt(c, b.label, x, 52, '600 10px Pixelify Sans, monospace', 'rgba(214,240,255,0.8)', al);
    });
    Hud.txt(c, this.score[0] + '  —  ' + this.score[1], W / 2, 16, '700 22px Pixelify Sans, monospace', '#ffd34a', 'center');
    Hud.txt(c, 'RONDA ' + this.round, W / 2, 38, '600 12px Pixelify Sans, monospace', 'rgba(214,240,255,0.85)', 'center');
    if (this.phase === 'count') {
      const d = Math.ceil(this.COUNT_T - this.phaseT);
      Hud.txt(c, d > 0 ? String(d) : '¡YA!', W / 2, H * 0.42, '700 58px Pixelify Sans, monospace', '#fff3c4', 'center');
    }
    if (this.phase === 'rend') {
      const w = this.winner;
      Hud.txt(c, w < 0 ? 'EMPATE' : this.bots[w].name + ' GANA', W / 2, H * 0.4, '700 26px Pixelify Sans, monospace', w < 0 ? '#ffe7a6' : '#ffd34a', 'center');
    }
  }
};
