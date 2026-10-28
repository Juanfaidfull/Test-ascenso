'use strict';
/* =====================================================================
   ASCENSO 4.18 · modo oleadas (ARCADE). Un escenario cerrado (el bastión), oleadas sin fin, un descanso
   entre oleadas y un jefe cada 5 oleadas. Tras cada jefe, 3 mejoras para elegir. Sin monedas.
   Justicia: los enemigos aparecen por el borde de la isla más lejano al jugador (nunca a menos de 150 px),
   avisan con un destello de 0,6 s y nunca hay más de 4 vivos a la vez.
   ===================================================================== */
const WAVE_POOL = ['bastion', 'selva', 'tiempo'];   /* al empezar cada partida sale uno al azar */
const WAVE_MUSIC = 'map_bastion';   /* música del mapa Bastión de oleadas */
const WAVE_RULES = { introS: 1.6, restS: 4, telegraphS: 0.6, maxAlive: 4, minDist: 150, bossEvery: 5, edgeInset: 26, healOnRest: 1 };

/* el mundo del modo oleadas: la misma interfaz que el mundo de la carrera, pero con una sola isla cerrada */
class WavesWorld {
  constructor(mapId) {
    this.map = mapId;
    this.plats = Versus.buildWorld(mapId).plats;   /* plats[0] es la isla; las demás son repisas */
    const isl = this.plats[0];
    this.arena = { x: isl.x, y: isl.y, w: isl.w, h: isl.h };
    this.walls = []; this.env = null;
    this.arenaPending = false; this.arenaLocked = true; this.bossSpawned = true; this.blocked = true;
    this.platT = 0; this.cycle = true;   /* las repisas desaparecen al pisarlas y vuelven (ver js/platforms.js) */
  }
}

const Waves = {
  /* los enemigos de cada tramo: primero los ligeros, luego los que disparan, luego los tanques */
  kinds(n) {
    if (n >= 9) return ['orco', 'ballestero', 'arquero', 'zombie', 'slime', 'gordo', 'demon', 'arana', 'escudero', 'bombardero', 'golem', 'sanador', 'camaleon', 'demonio_volador'];
    if (n >= 6) return ['orco', 'ballestero', 'arquero', 'zombie', 'slime', 'gordo', 'demon', 'arana', 'escudero', 'bombardero', 'demonio_volador', 'raptor', 'skeleton', 'skullwolf', 'imp', 'verde', 'arrastre', 'armadura'];
    if (n >= 3) return ['orco', 'ballestero', 'arquero', 'zombie', 'slime', 'gordo', 'demon', 'arana'];
    return ['orco'];
  },
  begin(G) {
    G.waves = { n: 0, phase: 'intro', t: 0, queue: [], pending: null, nextT: 0, kind: 'fight' };
    this.nextWave(G);
  },
  nextWave(G) {
    const w = G.waves;
    w.n += 1; w.queue = []; w.pending = null; w.nextT = 0;
    w.kind = w.n % WAVE_RULES.bossEvery === 0 ? 'boss' : 'fight';
    /* oleada élite: cada 3 oleadas desde la 3.ª (no en las de jefe) */
    w.elite = w.kind === 'fight' && w.n >= 3 && w.n % 3 === 0;
    if (w.kind === 'fight') {
      const total = Math.min(2 + Math.floor(w.n * 0.7), 9), list = this.kinds(w.n);
      for (let i = 0; i < total; i++) w.queue.push(list[Math.floor(Math.random() * list.length)]);
    }
    w.phase = 'intro'; w.t = WAVE_RULES.introS;
    G.waveBanner = { n: w.n, t: 2.4, elite: !!w.elite };   /* aviso de la nueva ronda (ver el marcador) */
  },
  /* el borde de la isla más lejano al jugador: así el enemigo nunca aparece encima de él */
  edgeX(isl, px) {
    const L = isl.x + WAVE_RULES.edgeInset, R = isl.x + isl.w - WAVE_RULES.edgeInset;
    const dl = Math.abs(px - L), dr = Math.abs(px - R);
    if (dl === dr) return Math.random() < 0.5 ? L : R;
    return dl > dr ? L : R;
  },
  /* descanso: se cura un corazón (si falta) y no hay enemigos */
  rest(G) {
    const w = G.waves, p = G.player;
    w.phase = 'rest'; w.t = WAVE_RULES.restS;
    if (p.hp > 0 && p.hp < p.maxHp) G.heal(WAVE_RULES.healOnRest, p.x, p.y - 20);
    if (p.hp > 0 && p.hp < p.maxHp && Math.random() < ((G.ramas && G.ramas.restHeal) || 0)) G.heal(1, p.x, p.y - 36);
    Feel.text(p.x, p.y - 60, 'Descanso', '#9ee7ff');
  },
  /* se llama en cada cuadro de la partida; el tiempo se detiene en pausa y mientras eliges una mejora */
  update(G, dt) {
    const w = G.waves, p = G.player, isl = G.world.arena;
    if (!w || !p || G.state !== 'play') return;
    if (G.waveBanner && G.waveBanner.t > 0) G.waveBanner.t -= dt;
    Platforms.step(G.world, dt, [G.player]);
    if (w.phase === 'intro') {
      w.t -= dt;
      if (w.t <= 0) {
        if (w.kind === 'boss') {
          /* el jefe nace en el borde más lejano del jugador, nunca encima de él, y mira hacia él */
          w.phase = 'boss'; G.spawnBoss(isl);
          if (G.boss) { G.boss.x = this.edgeX(isl, p.x); G.boss.face = G.boss.dir = p.x < G.boss.x ? -1 : 1; }
        }
        else { w.phase = 'fight'; w.nextT = 0.8; }
      }
      return;
    }
    if (w.phase === 'fight') {
      let alive = 0;
      for (const e of G.enemies) if (e.alive && e.dying <= 0) alive++;
      w.nextT -= dt;
      if (!w.pending && w.queue.length && w.nextT <= 0) {
        const x = this.edgeX(isl, p.x);
        w.pending = { kind: w.queue.shift(), x, t: WAVE_RULES.telegraphS };
        Feel.ring(x, isl.y - 10, 16, '#ffd34a', WAVE_RULES.telegraphS);
        w.nextT = Math.max(1.4, 2.4 - w.n * 0.05);
      }
      if (w.pending) {
        w.pending.t -= dt;
        /* tope de vivos que sube despacio (2 al principio, 4 después) y tope de arqueros (1, luego 2) */
        const cap = Math.min(WAVE_RULES.maxAlive, 2 + Math.floor(w.n / 4)), ballCap = w.n >= 8 ? 2 : 1;
        const ballAlive = G.enemies.filter(e => e.alive && e.dying <= 0 && e.kind === 'ballestero').length;
        if (w.pending.t <= 0 && alive < cap && !(w.pending.kind === 'ballestero' && ballAlive >= ballCap)) {
          let x = w.pending.x;
          if (Math.abs(x - p.x) < WAVE_RULES.minDist) x = this.edgeX(isl, p.x);
          const nBefore = G.enemies.length; G.spawnEnemy(w.pending.kind, isl, x, isl.y);
          /* la dificultad sube poco a poco: cada 3 oleadas, los enemigos se mueven un 3 % más rápido */
          const ne = G.enemies[G.enemies.length - 1]; if (ne && G.enemies.length > nBefore) ne.speed = (ne.speed || 40) * (1 + 0.03 * Math.floor((w.n - 1) / 3));
          /* enemigo élite: 60 % más de vida y aviso */
          if (ne && G.enemies.length > nBefore && w.elite) { ne.hp = Math.ceil((ne.hp || 1) * 1.6); ne.elite = true; Feel.ring(x, isl.y - 10, 22, '#ff6a72', 0.5); }
          Feel.burst(x, isl.y - 14, 6, ['#ffd34a', '#ffffff'], 60, 0.35);
          w.pending = null;
        }
      }
      if (!w.queue.length && !w.pending && alive === 0) this.rest(G);
      return;
    }
    if (w.phase === 'boss') {
      if (!G.boss) { G.queueOverlay('pick'); this.rest(G); }
      return;
    }
    if (w.phase === 'rest') { w.t -= dt; if (w.t <= 0) this.nextWave(G); }
  }
};
