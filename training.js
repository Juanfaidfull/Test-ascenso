'use strict';
/* =====================================================================
   ASCENSO 4.13 · entrenamiento: un bot infinito contra el jugador en la isla del VS, sin conexión
   ni ranking. El bot usa la IA del duelo del menú (personalidad, lectura del rival con retraso,
   tiro con anticipación) y se comunica con la partida como un rival de red: sus golpes, disparos
   y KO llegan por los mismos caminos que en el VS. La partida no cambia por ser entrenamiento.
   ===================================================================== */
const TRAIN_ID = 'entrenador';
const Trainer = Object.assign(Object.create(Demo), {
  on: false, bot: null, peer: null, pl: null, seq: 0, firstSeen: null,
  start() {
    const keys = Object.keys(this.ARCH);
    this.bot = this.mkBot(1, 'Entrenador', 'rojo', keys[Math.floor(Math.random() * keys.length)]);
    this.bots = [this.bot];
    const g = VsGeo.of(Versus.mapId);
    this.isl = { x0: g.isl.x0, x1: g.isl.x1 };
    this.plats = Versus.buildWorld(Versus.mapId).plats;
    this.surf = g.plats.map(p => ({ y: p.y, x0: p.x0, x1: p.x1 })).concat([{ y: g.isl.y, x0: g.isl.x0, x1: g.isl.x1 }]);
    this.platBox = this.surf[0];
    /* el jugador visto desde el bot: sus datos reales, con memoria para leerlo con retraso */
    this.pl = { x: 0, y: 0, vx: 0, vy: 0, onGround: true, face: 1, atk: 0, atkHit: false, atkCd: 0, sl: null, hp: 6, stunT: 0,
      death: null, invT: 0, hist: [], chargeId: 0, atkId: 0, wasAtk: false, wasSl: false, lastSwingT: -9 };
    this.balls = []; this.seq = 0; this.firstSeen = new Map(); this.on = true; this.t = G.t;
    Ghosts.setPresence([{ id: TRAIN_ID, name: 'Entrenador', look: this.bot.look }]);
    this.peer = Ghosts.peers.get(TRAIN_ID);
    this.peer.s = { face: 1, anim: 'idle', hp: 6, vy: 0, sl: null };
  },
  stop() { this.on = false; this.bot = null; this.peer = null; this.balls = []; Ghosts.setPresence([]); },
  foe(b) { return this.pl; },
  /* mensajes del jugador hacia el rival: al bot le llegan igual que en una partida de red */
  onPlayerMsg(m) {
    if (!this.on || !this.bot) return;
    if (m.ev === 'round') this.resetBot();
    else if (m.ev === 'hit' && m.to === TRAIN_ID) {
      const b = this.bot;
      if (!b || b.death || b.hp <= 0 || b.invT > 0) return;
      this.hit(b, m.hold > 0.7 ? 'ball' : 'sword');
    }
  },
  resetBot() {
    const b = this.bot; if (!b) return;
    const sp = Versus.spawnPoint(1);
    Object.assign(b, { x: sp.x, y: sp.y, face: sp.face, vx: 0, vy: 0, onGround: true, jumps: 0, hp: 6, invT: 0, stunT: 0,
      atk: 0, atkHit: false, atkCd: 0.5, slCd: 0.6, dodgeT: 0, sl: { on: false, aim: 0, pow: 0, t: 0 }, moveDir: 0,
      commit: null, lastAct: '', rolled: '', hist: [], death: null, anim: 'idle', animT: 0 });
    this.firstSeen = new Map();
    if (this.peer) this.peer.death = null;
  },
  tick(dt) {
    if (!this.on || !this.bot) return;
    this.t = G.t;
    this.syncPlayer();
    this.syncBalls();
    const b = this.bot;
    if (Versus.sub === 'fight') {
      this.record(b);
      this.think(b, dt);
      this.body(b, dt, false);
      this.swing(b, dt);
      this.checkHits();
      this.checkKO();
    } else {
      this.body(b, dt, true);          /* cuenta, KO y fin de ronda: el bot se queda quieto */
    }
    this.syncPeer();
  },
  syncPlayer() {
    const p = G.player, pl = this.pl;
    if (p.atk > 0 && !pl.wasAtk) { pl.atkId++; pl.lastSwingT = this.t; }
    pl.wasAtk = p.atk > 0;
    if (p.sl.on && !pl.wasSl) pl.chargeId++;
    pl.wasSl = p.sl.on;
    pl.x = p.x; pl.y = p.y; pl.vx = p.vx; pl.vy = p.vy; pl.onGround = p.onGround; pl.face = p.face;
    pl.atk = p.atk; pl.atkHit = !!p.swingDone; pl.atkCd = (this.t - pl.lastSwingT) < 0.8 ? 0.6 : 0;
    pl.hp = p.hp; pl.stunT = p.stun; pl.death = p.death; pl.invT = p.inv; pl.sl = p.sl; pl.parryT = p.parryT || 0; pl.parryCd = p.parryCd || 0;
    pl.hist.push({ t: this.t, x: pl.x, y: pl.y, vx: pl.vx, vy: pl.vy, onGround: pl.onGround, face: pl.face, atk: pl.atk,
      atkHit: pl.atkHit, atkCd: pl.atkCd, slOn: p.sl.on, aim: p.sl.aim, pow: p.sl.pow, hp: pl.hp, stunT: pl.stunT,
      ev: pl.chargeId + '/' + pl.atkId });
    if (pl.hist.length > 120) pl.hist.shift();
  },
  /* las bolas del jugador, vistas desde el bot (con la hora en que aparecieron, para reaccionar con retraso) */
  syncBalls() {
    this.balls = [];
    for (const s of G.shots) {
      if (!s.mine || !s.alive) continue;
      if (!this.firstSeen.has(s.bid)) this.firstSeen.set(s.bid, this.t);
      this.balls.push({ id: s.bid, owner: this.pl, alive: true, x: s.x, y: s.y, vx: s.vx, vy: s.vy, t0: this.firstSeen.get(s.bid) });
    }
  },
  /* el bot muestra en pantalla lo que hace: posición, animación, espada, tirachinas y vida */
  syncPeer() {
    const b = this.bot, pe = this.peer; if (!pe) return;
    if (!b.death) { pe.x = b.x; pe.y = b.y; pe.tx = b.x; pe.ty = b.y; }
    pe.face = b.face; pe.atk = b.atk; pe.animT = b.animT; pe.death = b.death || null;
    pe.s.face = b.face; pe.s.anim = b.anim; pe.s.hp = Math.max(0, b.hp); pe.s.vy = b.vy;
    pe.s.sl = b.sl.on ? [Math.round(b.sl.aim * 100), Math.round(b.sl.pow * 100)] : null;
  },
  body(b, dt, frozen) {
    if (b.death) { this.anim(b); return; }   /* la animación de muerte la lleva el peer (Ghosts.update) */
    return Demo.body.call(this, b, dt, frozen);
  },
  /* el jugador recibe los golpes del bot por el mismo camino que un rival de red */
  hit(o, kind) {
    if (o === this.pl) { Versus.onHit({ to: G.me.id, dmg: 1, kx: 0, ky: 0, bid: '', hold: kind === 'sword' ? SWORD_RULES.stun : 1.0 }); return; }
    Demo.hit.call(this, o, kind);
  },
  /* bolas del bot: vuelan como las del jugador y golpean al jugador por la red del VS */
  checkHits() {
    const p = G.player;
    for (const s of G.shots.slice()) {
      if (s.mine || !s.alive || s.deflected) continue;   /* una bola ya desviada por el parry no vuelve a golpear */
      if (Math.abs(s.x - p.x) < 11 && Math.abs(s.y - (p.y - 14)) < 17) Versus.onHit({ to: G.me.id, dmg: 1, kx: 0, ky: 0, bid: s.bid, hold: 1.0 });
    }
  },
  release(b) {
    if (!b.sl.on) return;
    const sp = 250 + 380 * b.sl.pow, f = b.face;
    const s = new Shot('ball', b.x + f * 8, b.y - 22, Math.cos(b.sl.aim) * sp * f, -Math.sin(b.sl.aim) * sp, 2.6);
    Object.assign(s, { grav: PHYS.BALL_G, bounces: 1, safeT: 0, dmg: 1, mine: false, bid: 'entrenador:' + (++this.seq) });
    G.shots.push(s);
    this.stats.shots++; b.sl.on = false; b.commit = null; b.slCd = 0.9 + Math.random() * 0.6;
  },
  /* el bot cae: la ronda la decide la partida (como en red); se avisa con el mensaje ko */
  checkKO() {
    const b = this.bot;
    if (b.hp > 0 || b.death) return;
    Death.start(b, this.plats);
    this.stats.kos++;
    if (this.peer) this.peer.death = b.death;
    Versus.onNet({ ev: 'ko', id: TRAIN_ID, round: Versus.round });
  }
});
