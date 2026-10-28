'use strict';
/* =====================================================================
   ASCENSO 4.1 · personajes: héroe (carrera lateral, salto doble, golpe y tirachinas con
   apuntado manual), enemigos con patrones legibles y escudos que se rompen, jefes (con
   escudo o guardia que hay que romper), proyectiles y objetos.
   Convención: x = centro horizontal, y = pies (base). El mundo crece a la derecha.
   ===================================================================== */
const ENEMY_SHEETS = {
  orco: { idle: ['enemy/orc_idle.png', 6, 68, 46], walk: ['enemy/orc_walk.png', 8, 68, 46], attack: ['enemy/orc_attack.png', 6, 68, 46], hurt: ['enemy/orc_hurt.png', 4, 68, 46], death: ['enemy/orc_death.png', 4, 68, 46] },
  arana: { idle: ['enemy/arana_walk.png', 4, 68, 40], walk: ['enemy/arana_walk.png', 4, 68, 40], attack: ['enemy/arana_attack.png', 7, 68, 40], hurt: ['enemy/arana_hurt.png', 3, 68, 40], death: ['enemy/arana_death.png', 4, 68, 40] },
  demonio_volador: { idle: ['enemy/demonio_volador_idle.png', 4, 93, 77], fly: ['enemy/demonio_volador_fly.png', 4, 93, 77], attack: ['enemy/demonio_volador_attack.png', 8, 93, 77], hurt: ['enemy/demonio_volador_hurt.png', 4, 93, 77], death: ['enemy/demonio_volador_death.png', 6, 93, 77] },
  demon: { idle: ['enemy/demon_idle.png', 6, 68, 46], walk: ['enemy/demon_walk.png', 8, 68, 46], attack: ['enemy/demon_attack.png', 7, 68, 46], hurt: ['enemy/demon_hurt.png', 4, 68, 46], death: ['enemy/demon_death.png', 4, 68, 46] },
  gordo: { walk: ['enemy/gordo_walk.png', 4, 53, 62], attack: ['enemy/gordo_attack.png', 5, 117, 62], death: ['enemy/gordo_death.png', 2, 70, 62], hurt: ['enemy/gordo_hurt.png', 1, 53, 62] },
  verde: { idle: ['enemy/verde_idle.png', 4, 56, 56], walk: ['enemy/verde_walk.png', 5, 54, 56], attack: ['enemy/verde_attack.png', 5, 74, 56], hurt: ['enemy/verde_hurt.png', 4, 55, 56], death: ['enemy/verde_death.png', 4, 68, 56] },
  arrastre: { idle: ['enemy/arrastre_idle.png', 4, 64, 38], walk: ['enemy/arrastre_walk.png', 5, 86, 38], attack: ['enemy/arrastre_attack.png', 7, 118, 38], hurt: ['enemy/arrastre_hurt.png', 4, 76, 38], death: ['enemy/arrastre_death.png', 8, 72, 38] },
  armadura: { idle: ['enemy/armadura_idle.png', 4, 65, 64], walk: ['enemy/armadura_walk.png', 6, 63, 64], attack: ['enemy/armadura_attack.png', 7, 103, 64], hurt: ['enemy/armadura_hurt.png', 5, 70, 64], death: ['enemy/armadura_death.png', 6, 107, 64] },
  slime: { idle: ['enemy/slime_idle.png', 4, 44, 31], walk: ['enemy/slime_walk.png', 4, 44, 31], attack: ['enemy/slime_attack.png', 5, 44, 31], hurt: ['enemy/slime_hurt.png', 4, 44, 31], death: ['enemy/slime_death.png', 4, 44, 31] },
  imp: { idle: ['enemy/imp_idle.png', 6, 62, 54], walk: ['enemy/imp_walk.png', 6, 62, 54], attack: ['enemy/imp_attack.png', 6, 112, 71], hurt: ['enemy/imp_hurt.png', 3, 62, 54], death: ['enemy/imp_death.png', 5, 62, 54] },
  skeleton: { idle: ['enemy/skeleton_idle.png', 3, 76, 70], walk: ['enemy/skeleton_walk.png', 12, 76, 70], attack: ['enemy/skeleton_attack.png', 13, 76, 70], hurt: ['enemy/skeleton_hurt.png', 2, 76, 70], death: ['enemy/skeleton_death.png', 7, 76, 70] },
  skullwolf: { idle: ['enemy/skullwolf_idle.png', 2, 76, 70], walk: ['enemy/skullwolf_walk.png', 6, 84, 70], attack: ['enemy/skullwolf_attack.png', 3, 76, 70], hurt: ['enemy/skullwolf_hurt.png', 4, 76, 70], death: ['enemy/skullwolf_death.png', 7, 76, 70] },
  zombie: { idle: ['enemy/zombie_idle.png', 2, 44, 38], walk: ['enemy/zombie_walk.png', 8, 44, 38], attack: ['enemy/zombie_attack.png', 3, 44, 38], hurt: ['enemy/zombie_hurt.png', 2, 44, 38], death: ['enemy/zombie_death.png', 3, 44, 38] },
  raptor: { idle: ['enemy/raptor_idle.png', 2, 136, 70], walk: ['enemy/raptor_walk.png', 6, 140, 70], attack: ['enemy/raptor_bite.png', 10, 140, 70], hurt: ['enemy/raptor_hurt.png', 1, 140, 70], death: ['enemy/raptor_death.png', 6, 140, 70] },
  arquero: { idle: ['enemy/arquero_idle.png', 5, 76, 70], walk: ['enemy/arquero_walk.png', 8, 76, 70], attack: ['enemy/arquero_attack.png', 11, 76, 70], hurt: ['enemy/arquero_hurt.png', 5, 76, 70], death: ['enemy/arquero_hurt.png', 5, 76, 70] },
  ballestero: { idle: ['enemy/ballestero_idle.png', 6, 54, 47], walk: ['enemy/ballestero_walk.png', 8, 54, 48], attack: ['enemy/ballestero_attack.png', 18, 60, 46], hurt: ['enemy/ballestero_hurt.png', 3, 54, 46], death: ['enemy/ballestero_death.png', 7, 62, 46] },
  golem: { idle: ['enemy/golem_idle.png', 8, 58, 44], walk: ['enemy/golem_walk.png', 10, 60, 46], attack: ['enemy/golem_attack.png', 11, 80, 51], hurt: ['enemy/golem_hurt.png', 4, 56, 44], death: ['enemy/golem_death.png', 13, 80, 50] },
  bee: { fly: ['mobs/bee_fly.png', 4, 64, 64], attack: ['mobs/bee_attack.png', 4, 64, 64] },
  escudero: { idle: ['enemy/escudero_idle.png', 6, 68, 46], walk: ['enemy/escudero_walk.png', 8, 68, 46], attack: ['enemy/escudero_attack.png', 6, 68, 46], hurt: ['enemy/escudero_hurt.png', 4, 68, 46], death: ['enemy/escudero_death.png', 4, 68, 46] },
  bombardero: { idle: ['enemy/bombardero_idle.png', 6, 54, 47], walk: ['enemy/bombardero_walk.png', 8, 54, 48], attack: ['enemy/bombardero_attack.png', 18, 60, 46], hurt: ['enemy/bombardero_hurt.png', 3, 54, 46], death: ['enemy/bombardero_death.png', 7, 62, 46] },
  sanador: { idle: ['enemy/sanador_idle.png', 6, 68, 46], walk: ['enemy/sanador_walk.png', 8, 68, 46], attack: ['enemy/sanador_attack.png', 6, 68, 46], hurt: ['enemy/sanador_hurt.png', 4, 68, 46], death: ['enemy/sanador_death.png', 4, 68, 46] },
  camaleon: { idle: ['enemy/camaleon_idle.png', 6, 68, 46], walk: ['enemy/camaleon_walk.png', 8, 68, 46], attack: ['enemy/camaleon_attack.png', 6, 68, 46], hurt: ['enemy/camaleon_hurt.png', 4, 68, 46], death: ['enemy/camaleon_death.png', 4, 68, 46] },
  mini_golem: { idle: ['enemy/golem_idle.png', 8, 58, 44], walk: ['enemy/golem_walk.png', 10, 60, 46], attack: ['enemy/golem_attack.png', 11, 80, 51], hurt: ['enemy/golem_hurt.png', 4, 56, 44], death: ['enemy/golem_death.png', 13, 80, 50] }
};
const ENEMY_DEF = {
  orco: { role: 'cuerpo a cuerpo: te persigue cuando estás cerca', hp: 1, pts: 30, scale: 2.0, box: [16, 30], speed: 56 },
  arana: { role: 'araña: rápida, te persigue por el suelo y muerde de cerca', hp: 1, pts: 35, scale: 1.3, box: [22, 22], speed: 66 },
  demonio_volador: { role: 'demonio volador: entra por los laterales y se lanza en picado, como la avispa', hp: 2, pts: 60, scale: 0.8, box: [26, 26], speed: 70 },
  demon: { role: 'carga: se prepara con un destello y embiste en línea recta', hp: 1, pts: 45, scale: 2, box: [18, 30], speed: 36 },
  gordo: { role: 'zombi gordo: lento y muy resistente; escupe veneno tóxico de cerca', hp: 3, pts: 90, scale: 1.0, box: [30, 46], speed: 40 },
  verde: { role: 'zombi verde: rápido y se estalla con su toxina al alcanzarte', hp: 2, pts: 55, scale: 1.1, box: [18, 36], speed: 60 },
  arrastre: { role: 'zombi arrastrado: pegado al suelo; embiste de golpe', hp: 1, pts: 50, scale: 0.9, box: [30, 12], speed: 40 },
  armadura: { role: 'zombi armado: pesado y con armadura; carga con su hacha', hp: 4, pts: 100, scale: 1.1, box: [22, 44], speed: 36 },
  slime: { role: 'slime: lento; rebota hacia ti y muerde de cerca', hp: 1, pts: 35, scale: 1.5, box: [22, 20], speed: 30 },
  imp: { role: 'imp: pequeño y rápido; ataca con su hacha', hp: 1, pts: 45, scale: 1.5, box: [18, 30], speed: 80 },
  skeleton: { role: 'esqueleto: avanza con su bastón y golpea con el arco de luz', hp: 2, pts: 60, scale: 1.33, box: [20, 40], speed: 45 },
  skullwolf: { role: 'skullwolf: lobo de huesos; se lanza en cuanto te ve', hp: 2, pts: 65, scale: 0.95, box: [28, 28], speed: 56 },
  zombie: { role: 'zombi: lento y resistente; muerde de cerca', hp: 2, pts: 40, scale: 1.4, box: [14, 28], speed: 40 },
  raptor: { role: 'dinosaurio: muy rápido; te muerde en cuanto te alcanza', hp: 2, pts: 70, scale: 1.6, box: [24, 26], speed: 96 },
  arquero: { role: 'arquero: dispara flechas desde lejos y se aparta si te acercas', hp: 2, pts: 60, scale: 1, box: [16, 30], speed: 26 },
  ballestero: { role: 'soldado con arma: dispara flechas rectas y se aparta si te acercas', hp: 2, pts: 50, scale: 1, box: [16, 30], speed: 26 },
  golem: { role: 'tanque lento y resistente', hp: 4, pts: 70, scale: 1.15, box: [26, 32], speed: 30 },
  bee: { role: 'avispa: entra por los laterales y avisa antes de lanzarse en picado', hp: 1, pts: 40, scale: 1, box: [18, 16], speed: 70 },
  escudero: { role: 'escudo: bloquea lo que llega de frente; desde arriba o por detrás sí', hp: 2, pts: 60, scale: 2, box: [18, 30], speed: 40 },
  bombardero: { role: 'lanza bombas en arco y se aparta si te acercas', hp: 1, pts: 55, scale: 1, box: [16, 30], speed: 24 },
  sanador: { role: 'sanador: cura a sus compañeros; abátelo primero', hp: 1, pts: 65, scale: 2, box: [18, 30], speed: 30 },
  camaleon: { role: 'camaleón: aparece y desaparece; sólo lo golpeas cuando se ve', hp: 2, pts: 70, scale: 2.0, box: [18, 30], speed: 60 },
  mini_golem: { role: 'mini-jefe: onda de choque por el suelo (salta por encima)', hp: 6, pts: 120, scale: 1.8, box: [30, 36], speed: 26 }
};


const BOSS_SHEETS = {
  golem_blue: { fw: 90, fh: 64, draw: 158, box: [64, 76], hp: 12, name: 'Golem de cristal', idle: 'boss/golem_blue_idle.png', walk: 'boss/golem_blue_walk.png', attack: 'boss/golem_blue_attack.png', hurt: 'boss/golem_blue_hurt.png', death: 'boss/golem_blue_die.png' },
  golem_orange: { fw: 90, fh: 64, draw: 172, box: [70, 80], hp: 14, name: 'Golem de bronce', idle: 'boss/golem_orange_idle.png', walk: 'boss/golem_orange_walk.png', attack: 'boss/golem_orange_attack.png', hurt: 'boss/golem_orange_hurt.png', death: 'boss/golem_orange_die.png' },
  hechicero: { fw: 250, fh: 167, draw: 213, box: [46, 86], hp: 10, name: 'Hechicero oscuro', idle: 'boss/hechicero_idle.png', attack: 'boss/hechicero_attack.png', hurt: 'boss/hechicero_hurt.png', death: 'boss/hechicero_die.png' },
  guardian_hielo: { fw: 192, fh: 113, draw: 219, box: [76, 98], hp: 12, name: 'Guardián de hielo', idle: 'boss/guardian_hielo_idle.png', walk: 'boss/guardian_hielo_idle.png', attack: 'boss/guardian_hielo_attack.png', hurt: 'boss/guardian_hielo_hurt.png', death: 'boss/guardian_hielo_die.png' },
  demonio_slime: { fw: 288, fh: 159, draw: 300, box: [90, 104], hp: 14, name: 'Demonio slime', idle: 'boss/demonio_slime_idle.png', walk: 'boss/demonio_slime_walk.png', attack: 'boss/demonio_slime_attack.png', hurt: 'boss/demonio_slime_hurt.png', death: 'boss/demonio_slime_die.png' },
  golem_laser: { fw: 100, fh: 70, draw: 260, box: [90, 112], hp: 16, name: 'Golem láser', idle: 'boss/mecha_golem_idle.png', walk: 'boss/mecha_golem_walk.png', attack: 'boss/mecha_golem_attack.png', hurt: 'boss/mecha_golem_hurt.png', death: 'boss/mecha_golem_die.png' },
  daddy: { fw: 176, fh: 180, draw: 128, box: [92, 116], hp: 22, name: 'Daddy', idle: 'boss/daddy_idle.png', walk: 'boss/daddy_walk.png', attack: 'boss/daddy_strike.png', charge: 'boss/daddy_charge.png', strike: 'boss/daddy_strike.png', shoot: 'boss/daddy_shoot.png', scream: 'boss/daddy_scream.png' },
  garras: { fw: 301, fh: 150, draw: 285, box: [96, 130], hp: 14, name: 'Engendro de garras', idle: 'boss/garras_idle.png', walk: 'boss/garras_walk.png', attack: 'boss/garras_attack.png' },
  cthulhu: { fw: 397, fh: 142, draw: 336, box: [120, 110], hp: 26, name: 'Cthulhu', idle: 'boss/cthulhu_idle.png', walk: 'boss/cthulhu_walk.png', attack: 'boss/cthulhu_attack.png', hurt: 'boss/cthulhu_hurt.png', death: 'boss/cthulhu_death.png' },
  bringer: { fw: 406, fh: 173, draw: 406, box: [56, 90], hp: 22, name: 'Bringer de la Muerte', idle: 'boss/bringer_idle.png', walk: 'boss/bringer_walk.png', attack: 'boss/bringer_attack.png', hurt: 'boss/bringer_hurt.png', death: 'boss/bringer_death.png' },
  cultista: { fw: 139, fh: 151, draw: 118, box: [60, 110], hp: 20, name: 'Sacerdote cultista', idle: 'boss/cultista_idle.png', walk: 'boss/cultista_walk.png', attack: 'boss/cultista_attack.png', hurt: 'boss/cultista_hurt.png', death: 'boss/cultista_death.png' },
  demonio_hacha: { fw: 249, fh: 140, draw: 274, box: [48, 80], hp: 18, name: 'Demonio de hacha', idle: 'boss/demonio_hacha_idle.png', walk: 'boss/demonio_hacha_walk.png', attack: 'boss/demonio_hacha_attack.png', hurt: 'boss/demonio_hacha_hurt.png', death: 'boss/demonio_hacha_death.png' },
  nightborne: { fw: 371, fh: 266, draw: 340, box: [60, 100], hp: 24, name: 'NightBorne', idle: 'boss/nightborne_idle.png', walk: 'boss/nightborne_walk.png', attack: 'boss/nightborne_attack.png', hurt: 'boss/nightborne_hurt.png', death: 'boss/nightborne_death.png' },
  minotauro: { fw: 288, fh: 147, draw: 300, box: [96, 112], hp: 16, name: 'Minotauro', idle: 'boss/minotauro_idle.png', walk: 'boss/minotauro_walk.png', attack: 'boss/minotauro_attack.png' },
  avispa_reina: { fw: 64, fh: 64, draw: 104, box: [34, 30], hp: 7, name: 'Avispa reina', idle: 'mobs/reina_fly.png', walk: 'mobs/reina_fly.png', attack: 'mobs/reina_attack.png', hurt: 'mobs/reina_fly.png', death: 'mobs/reina_fly.png' },
  caballero: { fw: 56, fh: 40, draw: 134, box: [40, 64], hp: 12, name: 'Caballero', idle: 'enemy/escudero_idle.png', walk: 'enemy/escudero_walk.png', attack: 'enemy/escudero_attack.png', hurt: 'enemy/escudero_hurt.png', death: 'enemy/escudero_death.png' },
  sombra: { fw: 56, fh: 40, draw: 180, box: [40, 62], hp: 10, name: 'Sombra', idle: 'enemy/sombra_idle.png', walk: 'enemy/sombra_walk.png', attack: 'enemy/sombra_attack.png', hurt: 'enemy/sombra_hurt.png', death: 'enemy/sombra_death.png' }
};

/* ---------- héroe: carrera lateral, salto doble, golpe cuerpo a cuerpo y tirachinas con apuntado manual ---------- */
class Player {
  constructor() { this.reset(); }
  reset(x = START_X, y = BASE_Y) {
    Object.assign(this, { x, y, vx: 0, vy: 0, onGround: true, plat: null, coyote: 0, jbuf: 0, jumps: 0, face: 1, death: null,
      anim: 'idle', animT: 0, atk: 0, atkDur: 0.27, atkN: 0, hitT: 0, charId: 'hero', swingDone: false, sq: 1, inv: 0, hp: 3, maxHp: 3, prevFeet: y,
      buffs: { speed: 0, strength: 0, jump: 0 }, shotCd: 0, stun: 0, parryT: 0, parryCd: 0,
      sl: { on: false, t: 0, ang: Math.PI / 5, aim: Math.PI / 5, pow: 0.5, px: 0, py: 0 } });
    this.charId = Chars.resolve();
  }
  box() { return { x: this.x - HERO.HITW / 2, y: this.y - HERO.HITH, w: HERO.HITW, h: HERO.HITH }; }
  setAnim(a) { if (a !== this.anim) { this.anim = a; this.animT = 0; } }
  /* ángulo y potencia: la bolita de la franja fija el ángulo (arriba/abajo, absoluto: no depende de hacia dónde
     mira el héroe) y la potencia (a la derecha); con el teclado, ↑/↓ fijan el ángulo y el tiempo de carga da la potencia */
  aimFromInput(pad) {
    const sl = this.sl;
    if (pad) {
      sl.aim = pad.v >= 0 ? pad.v * SL_MAX : pad.v * -SL_MIN;
      sl.ang = sl.aim;
      sl.pow = 0.25 + 0.75 * pad.u;
    } else {
      sl.aim = sl.ang; sl.pow = Math.max(0.3, sl.t);
    }
  }
  update(dt, G) {
    if (this.death) { Death.update(this, dt); return; }   /* muriendo: sólo cae y se deshace */
    const ins = (G.inputLocked || this.stun > 0) ? NO_INPUT : Input, world = G.world, half = HERO.HITW / 2, sl = this.sl;
    this.animT += dt;
    for (const k of ['speed', 'strength', 'jump']) this.buffs[k] = Math.max(0, this.buffs[k] - dt);
    this.inv = Math.max(0, this.inv - dt); this.atk = Math.max(0, this.atk - dt); this.hitT = Math.max(0, (this.hitT || 0) - dt); this.atkCd = Math.max(0, (this.atkCd || 0) - dt); this.stun = Math.max(0, this.stun - dt);
    this.shotCd = Math.max(0, this.shotCd - dt); this.coyote = Math.max(0, this.coyote - dt); this.jbuf = Math.max(0, this.jbuf - dt);
    /* tirachinas: pulsar para cargar; la bolita de la franja (móvil) o ↑/↓ (teclado) para apuntar; soltar para disparar */
    this.charId = Chars.resolve();
    if (sl.on && (ins.slingCancel || this.hp <= 0)) sl.on = false;
    /* la orientación se calcula ANTES de empezar a apuntar: si se pulsa tirachinas y la dirección en el mismo cuadro,
       el personaje mira hacia donde se mueve y la bola sale hacia ese lado (antes salía hacia el lado anterior) */
    const dir = (ins.right ? 1 : 0) - (ins.left ? 1 : 0);
    if (dir !== 0 && !sl.on) this.face = dir;
    const skKey = (typeof Craft !== 'undefined' && Craft.skillFor()) || this.charId;
    if (this._iconFor !== skKey) { this._iconFor = skKey; if (typeof setSkillIcon === 'function') setSkillIcon(skKey); const ab = document.querySelector('[data-a="attack"]'); if (ab) ab.style.display = (this.charId === 'arquero' || this.charId === 'mago_fuego') ? 'none' : ''; }
    if (Chars.usesSling(this.charId) && ins.slingPress && !sl.on && this.shotCd <= 0 && this.hp > 0) { sl.on = true; sl.t = 0; sl.ang = Math.PI / 5; }
    if (sl.on) {
      sl.t = Math.min(1, sl.t + dt / PHYS.SLING_CHARGE);
      if (!ins.pad) sl.ang = clamp(sl.ang + ins.aimY * 1.5 * dt, SL_MIN, SL_MAX);
      this.aimFromInput(ins.pad);
      if (ins.slingRelease && Chars.usesSling(this.charId)) {
        Sound.play('tirachinasLanza', 0.8); const skF = (typeof Craft !== 'undefined' && Craft.skillFor()); if (skF) G.fireCharShot(this, sl.aim, sl.pow, skF); else G.fireBall(this, sl.aim, sl.pow);
        sl.on = false; this.shotCd = PHYS.SLING_RELOAD * G.mods.reloadMul;   /* recarga en todos los modos: sin ella se disparaba sin pausa */
      }
    }
    /* movimiento horizontal con aceleración y frenado (más lento mientras apuntas) */
    /* apuntando (sl.on) el lado queda fijo: la bola no cambia de lado con el dedo */
    const slowed = sl.on || (this.atk > 0.1 && this.onGround);
    const maxRun = PHYS.RUN * (this.buffs.speed > 0 ? 1.2 : 1) * (slowed ? 0.55 : 1) * (1 + ((typeof G !== 'undefined' && G.ramas && G.ramas.runSpeed) || 0));
    const rate = dir !== 0 ? (this.onGround ? PHYS.ACC_G : PHYS.ACC_A) : (this.onGround ? PHYS.DEC_G : PHYS.DEC_A);
    this.vx += clamp(dir * maxRun - this.vx, -rate * dt, rate * dt);
    /* salto con margen (coyote) y doble salto: pulsar siempre salta igual (sin corte que deje saltos cortos) */
    if (ins.jumpPress) this.jbuf = PHYS.JBUF;
    const jm = this.buffs.jump > 0 ? 1.18 : 1;
    if (this.jbuf > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = -PHYS.JUMP * jm; this.onGround = false; this.jumps = 1; this.jbuf = 0; this.coyote = 0; this.sq = 1.25;
      G.onJump(this, false);
    } else if (this.jbuf > 0 && this.jumps < PHYS.MAX_JUMPS) {
      this.vy = -PHYS.JUMP * 0.92 * jm; this.jumps++; this.jbuf = 0; this.sq = 1.25; G.onJump(this, true);
    }
    /* horizontal: choque lateral con plataformas y muros (un escalón de 48 px se sube saltando) */
    const prevX = this.x;
    this.x += this.vx * dt;
    for (const q of world.plats) {
      if (q.oneWay || q.active === false || this.y - 2 <= q.y || this.y - HERO.HITH >= q.y + q.h) continue;
      if (this.x + half <= q.x || this.x - half >= q.x + q.w) continue;
      if (prevX + half <= q.x + 0.5) this.x = q.x - half;
      else if (prevX - half >= q.x + q.w - 0.5) this.x = q.x + q.w + half;
      else this.x = this.x < q.x + q.w / 2 ? q.x - half : q.x + q.w + half;
      this.vx = 0;
    }
    for (const wl of world.walls) {
      if (this.y < wl.y0 || this.y - HERO.HITH > wl.y1) continue;
      if (prevX + half <= wl.x && this.x + half > wl.x) { this.x = wl.x - half; this.vx = 0; }
      else if (prevX - half >= wl.x && this.x - half < wl.x) { this.x = wl.x + half; this.vx = 0; }
    }
    /* vertical: aterriza cuando los pies cruzan la superficie; si sube, choca con techos */
    this.prevFeet = this.y;
    this.vy = Math.min(PHYS.MAXFALL, this.vy + PHYS.G * dt);
    this.y += this.vy * dt;
    if (this.vy >= 0) {
      let land = null;
      for (const q of world.plats) {
        if (q.active === false || (q === world.plats[0] ? (this.x < q.x || this.x > q.x + q.w) : (this.x + half <= q.x + 2 || this.x - half >= q.x + q.w - 2))) continue;
        if (this.prevFeet <= q.y + 0.5 && this.y >= q.y) { land = q; break; }
      }
      if (land) {
        if (!this.onGround) { G.onLand(this, this.vy); this.sq = 0.78; }
        this.y = land.y; this.vy = 0; this.onGround = true; this.plat = land; this.jumps = 0;
      } else {
        if (this.onGround) this.coyote = PHYS.COYOTE;
        this.onGround = false; this.plat = null;
      }
    } else {
      for (const q of world.plats) {
        if (q.active === false || (q === world.plats[0] ? (this.x < q.x || this.x > q.x + q.w) : (this.x + half <= q.x + 2 || this.x - half >= q.x + q.w - 2))) continue;
        if (q.oneWay) continue;
        const bottom = q.y + q.h;
        if (this.prevFeet - HERO.HITH >= bottom - 0.5 && this.y - HERO.HITH < bottom) { this.y = bottom + HERO.HITH; this.vy = 0; break; }
      }
      this.onGround = false; this.plat = null;
    }
    /* animación y golpe */
    if ((this.charId || 'hero') !== 'hero' && this.hitT > 0) this.setAnim('hit');
    else if (this.atk > 0) this.setAnim('attack');
    else if (!this.onGround) this.setAnim(this.vy < -60 ? 'jump' : 'fall');
    else if (Math.abs(this.vx) > 120) this.setAnim('run');
    else if (Math.abs(this.vx) > 22) this.setAnim('walk');
    else this.setAnim('idle');
    this.sq += (1 - this.sq) * Math.min(1, dt * 10);
    if (ins.attackPress && this.atk <= 0 && (this.atkCd || 0) <= 0 && this.hp > 0 && !(this.charId === 'arquero' || this.charId === 'mago_fuego')) {
      const cid=this.charId||'hero', def=typeof CHARACTERS!=='undefined' ? CHARACTERS[cid] : null;
      { const dIn = ins.left && !ins.right ? -1 : (ins.right && !ins.left ? 1 : 0); if (dIn) this.face = dIn; }   /* el ataque sale hacia donde se presiona */
      this.atkDur=def ? def.attackDuration : 0.27; this.atk=this.atkDur; this.atkCd=(def ? def.cooldown : SWORD_RULES.cooldown) * (1 - ((typeof G !== 'undefined' && G.ramas && G.ramas.swSpeed) || 0));
      Sound.play('attack', 0.5);   /* espadazo del jugador */
      this.atkN=(this.atkN||0)+1; this.swingDone=false; G.onAttack(this);
      if(cid==='hero' || cid==='knight' || cid==='martial') Fx.sword(this.x,this.y,this.face,Craft.effectFor('sword'));
    }
  }
}

/* ---------- enemigos: cada uno tiene un patrón legible y reacciona a tiempo ---------- */
class Enemy {
  constructor(kind, plat, x, y) {
    const d = ENEMY_DEF[kind];
    if (kind === 'demonio_volador') Sound.play('bossDemonioVolador', 0.6); Object.assign(this, { kind, plat, x, y, def: d, fly: kind === 'bee' || kind === 'demonio_volador', dir: -1, face: -1, hp: d.hp, maxHp: d.hp,
      dying: 0, hurt: 0, hitFlash: 0, anim: 'idle', animT: 0, state: 'patrol', st: 0, cd: rnd(0.5, 1.4), shotT: rnd(0.9, 1.8),
      alive: true, hidden: kind === 'camaleon', hideT: kind === 'camaleon' ? 3.8 : 0, bob: rnd(0, 6), healT: rnd(2, 3),
      bandY: y, speed: d.speed, hitDone: false, tx: undefined, ty: undefined,
      shieldHp: kind === 'escudero' ? 3 : 0,
      lo: plat ? plat.x + 14 : x - 300, hi: plat ? plat.x + plat.w - 14 : x + 300 });
  }
  box() { const [w, h] = this.def.box; return { x: this.x - w / 2, y: this.y - h, w, h }; }
  setAnim(a) { if (a !== this.anim) { this.anim = a; this.animT = 0; } }
  /* las avispas sólo tocan cuando vuelan o se lanzan; avisando o retirándose son inofensivas */
  canTouch() { return this.fly ? this.state === 'fly' || this.state === 'dive' : true; }
  /* el escudero bloquea lo que llega de su frente mientras tenga escudo */
  blocksFrom(px) { return this.shieldHp > 0 && this.state !== 'strike' && Math.sign(px - this.x) === this.face && Math.abs(px - this.x) < 70; }
  /* la bolita que llega de frente y por abajo choca con el escudo */
  blocksBall(bx, by) { return this.shieldHp > 0 && Math.sign(bx - this.x) === this.face && Math.abs(bx - this.x) < 30 && by > this.y - 26; }
  /* un golpe al escudo; devuelve true si se rompe */
  breakShield() { this.shieldHp--; this.hurt = 0.12; this.hitFlash = 0.1; return this.shieldHp <= 0; }
  /* true si el golpe la derriba */
  takeHit(dmg) {
    if (this.dying > 0 || !this.alive || this.hidden) return false;
    this.hp -= dmg; this.hurt = 0.18; this.hitFlash = 0.08;
    if (this.hp <= 0) { this.dying = 0.46; return true; }
    return false;
  }
  clampPlat() { if (this.plat) this.x = clamp(this.x, this.lo, this.hi); }
  patrol(dt, sp) {
    this.x += this.dir * sp * dt;
    if (this.x <= this.lo) this.dir = 1; else if (this.x >= this.hi) this.dir = -1;
    this.clampPlat(); this.face = this.dir; this.setAnim('walk');
  }
  update(dt, G) {
    this.animT += dt; this.hurt = Math.max(0, this.hurt - dt); this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.dying > 0) { this.setAnim('death'); this.dying -= dt; if (this.dying <= 0) this.alive = false; return; }
    const p = G.player, dx = p.x - this.x, adx = Math.abs(dx), dy = p.y - this.y;
    this.cd -= dt; this.st -= dt; this.shotT -= dt; this.healT -= dt; this.bob += dt;
    if (this.kind === 'demonio_volador') return this.updDemon(dt, G, dx, adx);
    if (this.fly) return this.updBee(dt, G, dx, adx);
    switch (this.kind) {
      case 'orco': if (!this.grunio && adx < 170) { this.grunio = true; Sound.play('orcoGrunido', 0.6); } return this.melee(dt, G, dx, adx, dy, 170, 56, 28);
      case 'arana': return this.melee(dt, G, dx, adx, dy, 190, 66, 22);
      case 'golem': return this.melee(dt, G, dx, adx, dy, 160, 30, 30);
      case 'escudero': return this.melee(dt, G, dx, adx, dy, 150, 40, 26);
      case 'camaleon': return this.camaleon(dt, G, dx, adx, dy);
      case 'demon': return this.demon(dt, G, dx, adx, dy);
      case 'gordo': return this.melee(dt, G, dx, adx, dy, 170, 22, 34);
      case 'verde': return this.melee(dt, G, dx, adx, dy, 200, 60, 26);
      case 'arrastre': return this.melee(dt, G, dx, adx, dy, 180, 40, 22);
      case 'armadura': return this.melee(dt, G, dx, adx, dy, 190, 36, 34);
      case 'slime': return this.melee(dt, G, dx, adx, dy, 150, 30, 22);
      case 'imp': return this.melee(dt, G, dx, adx, dy, 200, 80, 24);
      case 'skeleton': return this.melee(dt, G, dx, adx, dy, 170, 45, 30);
      case 'skullwolf': return this.melee(dt, G, dx, adx, dy, 240, 110, 30);
      case 'zombie': return this.melee(dt, G, dx, adx, dy, 180, 40, 26);
      case 'raptor': return this.melee(dt, G, dx, adx, dy, 230, 96, 30);
      case 'arquero': return this.ranged(dt, G, dx, adx, dy, 'arrow', 120, 380, 210, 1.7);
      case 'ballestero': return this.ranged(dt, G, dx, adx, dy, 'arrow', 110, 360, 200, 1.9);
      case 'bombardero': return this.ranged(dt, G, dx, adx, dy, 'bomb', 150, 330, 0, 2.6);
      case 'mini_golem': return this.slammer(dt, G, dx, adx, dy);
      case 'sanador': return this.healer(dt, G, dx, adx);
      default: return this.patrol(dt, this.speed);
    }
  }
  /* cuerpo a cuerpo: te persigue si estás cerca; avisa con una animación antes de golpear */
  melee(dt, G, dx, adx, dy, aggro, sp, reach) {
    const p = G.player;
    if (this.state === 'windup') { this.setAnim('attack'); this.face = dx >= 0 ? 1 : -1; if (this.st <= 0) { this.state = 'strike'; this.st = 0.2; this.hitDone = false; if (this.def === ENEMY_DEF.gordo && G.addPuddle) G.addPuddle(this.x + this.face * 30, this.y); } return; }
    if (this.state === 'strike') {
      this.setAnim('attack');
      const hb = { x: this.face > 0 ? this.x : this.x - reach - 6, y: this.y - 30, w: reach + 6, h: 30 };
      if (!this.hitDone && overlap(hb, p.box())) { this.hitDone = true; G.hurtPlayer(this.x, 'golpe'); }
      if (this.st <= 0) { this.state = 'patrol'; this.cd = 1.1; }
      return;
    }
    if (adx < aggro && Math.abs(dy) < 60) {
      this.face = dx >= 0 ? 1 : -1; this.dir = this.face;
      if (adx > reach + 6) { this.x += this.face * sp * dt; this.setAnim('walk'); this.clampPlat(); }
      else if (this.cd <= 0) { this.state = 'windup'; this.st = 0.36; this.setAnim('attack'); }
      else this.setAnim('idle');
      return;
    }
    this.patrol(dt, sp * 0.6);
  }
  /* camaleón: alterna visible (ataca) y oculto (patrulla); oculto no se puede golpear */
  camaleon(dt, G, dx, adx, dy) {
    this.hideT -= dt;
    if (this.hideT <= 0) { this.hidden = !this.hidden; if (!this.hidden) Sound.play('camaleonAparece', 0.6); this.hideT = this.hidden ? 1.6 : 3.8; }
    if (this.hidden) { this.patrol(dt, 26); return; }
    this.melee(dt, G, dx, adx, dy, 190, 60, 26);
  }
  /* demonio: se prepara con un destello y embiste en línea recta hasta el borde de su plataforma */
  demon(dt, G, dx, adx, dy) {
    if (this.state === 'patrol') {
      this.patrol(dt, 36);
      if (adx < 260 && Math.abs(dy) < 42 && this.cd <= 0) { this.state = 'wind'; this.st = 0.55; this.face = dx >= 0 ? 1 : -1; this.dir = this.face; }
    } else if (this.state === 'wind') {
      this.setAnim('attack');
      if (this.st <= 0) { this.state = 'charge'; this.st = 0.85; Sound.play('demonioRojoEmbestida', 0.7); }
    } else if (this.state === 'charge') {
      this.setAnim('walk');
      this.x = clamp(this.x + this.face * 300 * dt, this.lo, this.hi);
      if (this.st <= 0 || this.x <= this.lo || this.x >= this.hi) { this.state = 'rest'; this.st = 0.5; }
    } else {
      this.setAnim('idle');
      if (this.st <= 0) { this.state = 'patrol'; this.cd = 2.0; }
    }
  }
  /* a distancia: se aparta si te acercas (no acampa) y dispara con aviso */
  ranged(dt, G, dx, adx, dy, shotKind, fleeR, maxR, vel, reload) {
    if (this.state === 'aim') {
      this.setAnim('attack'); this.face = dx >= 0 ? 1 : -1; this.dir = this.face;
      if (this.st <= 0) {
        if (shotKind === 'arrow') { Sound.play(this.kind === 'arquero' ? 'arqueroDispara' : 'ballestaDisparo', 0.6); const sh = G.spawnShot('arrow', this.x + this.face * 12, this.y - 22, this.face * vel, 0); if (this.kind === 'arquero') sh.archer = true; }
        else G.spawnShot('bomb', this.x + this.face * 8, this.y - 30, clamp(adx * 0.6, 80, 200) * this.face, -330);
        this.state = 'patrol'; this.shotT = reload;
      }
      return;
    }
    if (adx < fleeR) {
      this.face = dx >= 0 ? 1 : -1;
      this.x = clamp(this.x - this.face * 70 * dt, this.lo, this.hi);
      this.setAnim('walk');
      return;
    }
    if (adx <= maxR && Math.abs(dy) < 80 && this.shotT <= 0 && this.state === 'patrol') {
      this.state = 'aim'; this.st = shotKind === 'arrow' ? 0.55 : 0.6; this.setAnim('attack');
      return;
    }
    this.patrol(dt, shotKind === 'arrow' ? 26 : 24);
  }
  /* mini-jefe: aviso y onda de choque por el suelo en las dos direcciones (se salta) */
  slammer(dt, G, dx, adx, dy) {
    if (this.state === 'tele') {
      this.setAnim('attack');
      if (this.st <= 0) {
        for (const sx of [-190, 190]) { const s = G.spawnShot('shock', this.x, this.y, sx, 0); s.life = 1.3; }
        this.state = 'patrol'; this.cd = 3.0;
      }
      return;
    }
    if (adx < 120 && Math.abs(dy) < 50 && this.cd <= 0) { this.state = 'tele'; this.st = 0.5; this.setAnim('attack'); return; }
    this.patrol(dt, 26);
  }
  /* sanador: se mantiene a distancia y cura a un compañero herido cada pocos segundos */
  healer(dt, G, dx, adx) {
    if (adx < 120) { this.face = dx >= 0 ? 1 : -1; this.x = clamp(this.x - this.face * 60 * dt, this.lo, this.hi); this.setAnim('walk'); }
    else if (adx > 300) { this.face = dx >= 0 ? 1 : -1; this.x = clamp(this.x + this.face * 30 * dt, this.lo, this.hi); this.setAnim('walk'); }
    else this.setAnim('idle');
    if (this.healT <= 0) {
      this.healT = 4;
      const ally = G.enemies.find(e => e !== this && e.alive && e.dying <= 0 && e.hp < e.maxHp && Math.abs(e.x - this.x) < 200);
      if (ally) { ally.hp++; G.burst(ally.x, ally.y - 20, 8, ['#7dffb0', '#c9ffe0'], 60, 0.4); }
    }
  }
  /* avispa: vuela horizontalmente por su banda; avisa (zumbido y parpadeo) y luego se lanza en picado */
  /* demonio volador: patrulla hacia el jugador, se lanza persiguiéndolo y nunca sale de la isla */
  updDemon(dt, G, dx, adx) {
    const p = G.player, ar = G.world.arena;
    /* el lado de entrada decide el sentido: cruza la isla y sale por la esquina opuesta, desde cualquier lado */
    if (this.dirSet === undefined) { this.dirSet = true; this.dir = this.x < ar.x + ar.w / 2 ? 1 : -1; }
    this.face = this.dir;
    if (this.state === 'dive') {
      this.setAnim('attack'); this.tx = p.x; this.ty = p.y - 18;
      const vx = this.tx - this.x, vy = this.ty - this.y, d = Math.hypot(vx, vy) || 1;
      this.x += vx / d * 200 * dt; this.y += vy / d * 200 * dt;
      if (overlap(this.box(), p.box())) { G.hurtPlayer(this.x, 'picado'); this.state = 'back'; this.st = 2.2; return; }
      if (d < 8 || this.st <= 0) { this.state = 'back'; this.st = 2.2; }
      return;
    }
    if (this.state === 'wind') {
      this.setAnim('attack'); this.y = this.bandY + Math.sin(this.bob * 40) * 1.5;
      if (this.st <= 0) { this.state = 'dive'; this.st = 1.4; Sound.play('demonioRojoEmbestida', 0.6); }
      return;
    }
    this.setAnim('fly');
    if (this.state === 'back') {
      this.y += (this.bandY - this.y) * Math.min(1, dt * 3); this.x += this.dir * 80 * dt;
      if (this.st <= 0) this.state = 'fly';
    } else {
      this.x += this.dir * this.speed * dt; this.y = this.bandY + Math.sin(this.bob * 3) * 6;
      if (adx < 240 && Math.abs(p.y - this.y) < 140 && (p.x - this.x) * this.dir >= -20 && this.cd <= 0) { this.state = 'wind'; this.st = 0.6; this.cd = 4.5; }
    }
    if (Math.abs(this.x - p.x) > 1000) this.alive = false;
  }
  updBee(dt, G, dx, adx) {
    const p = G.player;
    if (this.state === 'dive') {
      this.setAnim('attack');
      if (this.tx === undefined) { this.tx = p.x; this.ty = p.y - 18; }
      const vx = this.tx - this.x, vy = this.ty - this.y, d = Math.hypot(vx, vy) || 1;
      this.x += vx / d * 240 * dt; this.y += vy / d * 240 * dt;
      if (overlap(this.box(), G.player.box())) { G.hurtPlayer(this.x, 'picado'); this.state = 'back'; this.st = 2.4; this.tx = undefined; return; }
      if (d < 8 || this.st <= 0) { this.state = 'back'; this.st = 2.4; this.tx = undefined; }
      return;
    }
    if (this.state === 'wind') {
      this.setAnim('attack'); this.y = this.bandY + Math.sin(this.bob * 40) * 1.5;
      if (this.st <= 0) { this.state = 'dive'; this.st = 1.3; this.tx = p.x; this.ty = p.y - 18; Sound.play('abejaVoladora', 0.5); }
      return;
    }
    if (this.state === 'back') {
      this.setAnim('fly'); this.y += (this.bandY - this.y) * Math.min(1, dt * 3); this.x += this.dir * 80 * dt;
      if (this.st <= 0) this.state = 'fly';
    } else {
      this.setAnim('fly'); this.x += this.dir * this.speed * dt; this.y = this.bandY + Math.sin(this.bob * 3) * 6;
      const ahead = dx * this.dir >= -20;
      if (adx < 240 && Math.abs(p.y - this.y) < 140 && ahead && this.cd <= 0) { this.state = 'wind'; this.st = 0.6; this.cd = 5; }
    }
    if (Math.abs(this.x - p.x) > 1000) this.alive = false;
  }
}

/* ---------- proyectiles: flechas, bombas, orbes, rocas, ondas y la bolita de la tirachinas (con estela) ---------- */
class Shot {
  constructor(kind, x, y, vx, vy = 0, life = 3) {
    Object.assign(this, { kind, x, y, vx, vy, life, prevY: y, bounces: 0, dmg: 1, tr: null,
      grav: kind === 'bomb' || kind === 'rock' ? 520 : 0 });
    this.alive = true;
    if (kind === 'ball') this.tr = [];
  }
  /* al morir por un golpe (no por tiempo), una bola con efecto hace su choque */
  get alive() { return this._alive !== false; }
  set alive(v) { if (!v && this._alive !== false && this.fx && this.life > 0 && typeof Effects !== 'undefined') Effects.impact(this); this._alive = v; }
  box() {
    if (this.kind === 'rock') return { x: this.x - 6, y: this.y - 6, w: 12, h: 12 };
    if (this.kind === 'arrow') return { x: this.x - 5, y: this.y - 5, w: 10, h: 10 };
    if (this.kind === 'shock') return { x: this.x - 10, y: this.y - 14, w: 20, h: 14 };
    return { x: this.x - 4, y: this.y - 4, w: 8, h: 8 };
  }
  update(dt) {
    this.prevY = this.y;
    if (this.tr) { this.tr.push(this.x, this.y); if (this.tr.length > 12) this.tr.splice(0, 2); }
    this.vy += this.grav * dt;
    this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
}

class Boss {
  constructor(kind, arena) {
    const d = BOSS_SHEETS[kind];
    Object.assign(this, { kind, d, arena, x: arena.x + arena.w / 2, y: arena.y, hp: d.hp, maxHp: d.hp, state: 'walk', st: 0,
      cd: kind === 'avispa_reina' ? 6 : 1.6, dir: -1, face: -1, alive: true, dying: 0, hurt: 0, t: 0, anim: 'idle', animT: 0,
      phase: 1, teleT: kind === 'sombra' ? 4.4 : 6, shotT: 2.2, ringT: 0, hitDone: false, fly: kind === 'avispa_reina',
      landed: true, shield: kind === 'golem_blue' ? 3 : 0, guard: 3, guardDown: 0, window: 0, dead: false, clones: [], summonT: 6, spinT: 0 });
    if (this.fly) { this.landed = false; this.y = arena.y - 48; }
  }
  box() { if (this.kind === 'avispa_reina') return { x: this.x - 24, y: this.y - 84, w: 48, h: 66 }; return { x: this.x - this.d.box[0] / 2, y: this.y - this.d.box[1], w: this.d.box[0], h: this.d.box[1] }; }
  /* ¿el cuerpo puede hacer daño por contacto ahora? (la reina sólo al aterrizar o al picar) */
  contactable() { return !this.fly || this.landed || this.state === 'dive'; }
  setAnim(a) { if (a !== this.anim) { this.anim = a; this.animT = 0; } }
  phaseFor() {
    const f = this.hp / this.maxHp;
    switch (this.kind) {
      case 'golem_orange': case 'caballero': return f <= 1 / 3 ? 3 : f <= 2 / 3 ? 2 : 1;
      case 'golem_blue': case 'hechicero': case 'avispa_reina': case 'sombra': return f <= 0.5 ? 2 : 1;
      default: return 1;
    }
  }
  /* el daño se calcula aquí. fromX (opcional) indica desde dónde llega el golpe de espada. */
  receiveHit(dmg, G, fromX) {
    if ((this.intro || 0) > 0) return { hit: false, msg: null };   /* durante el aviso de aparición no recibe daño */
    if (this.dying > 0 || this.hp <= 0) return { hit: false, msg: null };
    if (this.fly && !this.landed) return { hit: false, msg: 'Espera, aún vuela' };
    if (this.kind === 'golem_blue' && this.shield > 0) { this.shield--; return { hit: false, msg: this.shield > 0 ? 'Escudo ' + this.shield : '¡Escudo roto!' }; }
    if (this.kind === 'caballero' && this.state === 'walk' && fromX !== undefined && this.guard > 0) {
      this.guard--; if (this.guard === 0) this.guardDown = 3.5;
      return { hit: false, msg: this.guard > 0 ? 'Escudo ' + this.guard : '¡Guardia rota!' };
    }
    let d = dmg;
    if (this.kind === 'hechicero' && this.window > 0) d *= 2;
    this.hp -= d; this.hurt = 0.2;
    if (this.hp <= 0) { this.dying = 1.2; this.dead = true; return { hit: true, msg: 'Derrotado', dead: true }; }
    return { hit: true, msg: d > 1 ? '¡Crítico!' : null };
  }
  update(dt, G) {
    this.t += dt; this.hurt = Math.max(0, this.hurt - dt); this.animT += dt;
    this.window = Math.max(0, this.window - dt);
    if (this.guardDown > 0) { this.guardDown -= dt; if (this.guardDown <= 0) this.guard = 3; }
    /* red de seguridad: vida agotada siempre inicia la muerte (nunca un jefe "a medio morir") */
    if (this.hp <= 0 && this.dying <= 0 && this.alive) { this.dying = 1.2; this.dead = true; }
    if (this.dying > 0) { this.setAnim('death'); this.dying -= dt; if (this.dying <= 0) this.alive = false; return; }
    const ph = this.phaseFor();
    if (ph !== this.phase) { this.phase = ph; G.onBossPhase(this, ph); }
    this.updateClones(dt);
    switch (this.kind) {
      case 'hechicero': return this.updHechicero(dt, G);
      case 'avispa_reina': return this.updReina(dt, G);
      case 'caballero': return this.updCaballero(dt, G);
      case 'sombra': return this.updSombra(dt, G);
      case 'golem_laser': return this.updLaser(dt, G);
      case 'daddy': return this.updDaddy(dt, G);
      default: return this.updGolem(dt, G);
    }
  }
  /* Daddy (peso pesado): camina despacio. Según la distancia elige su ataque, siempre anunciado por su animación:
     cerca, el golpe pesado (se prepara con 'charge' y golpea con 'strike'); a media distancia, el grito ('scream')
     que sacude la isla; de lejos, lanza una bomba ('shoot'). Entre ataques hay una pausa para reaccionar. */
  updDaddy(dt, G) {
    const p = G.player, dx = p.x - this.x, adx = Math.abs(dx);
    if (this.dcd === undefined) { this.dcd = 1.2; this.dst = 0; this.hitDone = false; this.done = false; }
    this.dcd -= dt; this.dst -= dt;
    const lo = this.arena.x + 40, hi = this.arena.x + this.arena.w - 40;
    const setA = (a) => { if (this.anim !== a) { this.anim = a; this.animT = 0; } };
    if (this.state !== 'walk') {   /* cada estado (preparar, golpear, gritar, disparar) se cierra a sí mismo al acabar su tiempo */
      this.face = dx >= 0 ? 1 : -1;
      if (this.state === 'charge') { setA('charge'); if (this.dst <= 0) { this.state = 'strike'; this.dst = 0.4; this.hitDone = false; } return; }
      if (this.state === 'strike') {
        setA('strike');
        if (!this.hitDone && this.dst <= 0.28) { this.hitDone = true; if (adx < 120 && p.onGround) G.hurtPlayer(this.x, 'golpe pesado'); }
        if (this.dst <= 0) { this.state = 'walk'; this.dcd = 1.1; }
        return;
      }
      if (this.state === 'scream') {
        setA('scream');
        if (!this.done && this.dst <= 0.6) { this.done = true; Feel.shake(3, 0.3); Feel.ring(this.x, this.y - 40, 70, '#c79bff', 0.5); if (adx < 150 && p.onGround && Math.abs(p.y - this.arena.y) < 3) G.hurtPlayer(this.x, 'grito'); }
        if (this.dst <= 0) { this.state = 'walk'; this.dcd = 1.1; }
        return;
      }
      if (this.state === 'shoot') {
        setA('shoot');
        if (!this.done && this.dst <= 0.3) { this.done = true; G.spawnShot('bomb', this.x + this.face * 34, this.y - 96, Math.max(90, Math.min(190, adx * 0.5)) * this.face, -300); }
        if (this.dst <= 0) { this.state = 'walk'; this.dcd = 1.1; }
        return;
      }
    }
    if (this.state !== 'walk') { this.state = 'walk'; }
    this.face = dx >= 0 ? 1 : -1;
    const speed = this.hp <= this.maxHp * 0.5 ? 32 : 24;
    if (adx > 110) { setA('walk'); this.x = Math.max(lo, Math.min(hi, this.x + this.face * speed * dt)); }
    else setA('idle');
    if (this.dcd <= 0) {
      this.done = false; this.hitDone = false;
      if (adx < 120) { this.state = 'charge'; this.dst = 0.9; }
      else if (adx < 210) { this.state = 'scream'; this.dst = 1.1; }
      else { this.state = 'shoot'; this.dst = 0.6; }
      this.dcd = 99;   /* se vuelve a contar al terminar el ataque */
    }
  }
  /* Golem láser: camina y pega como el golem; cada pocos segundos apunta al jugador (1 s de aviso con línea
     punteada) y dispara un rayo de 0,7 s. El rayo solo hace daño si el jugador está en su trayectoria, así que
     se puede esquivar moviéndose durante el aviso. */
  updLaser(dt, G) {
    if (!this.lz) this.lz = { cd: 3.5, st: 'idle', t: 0, ex: 0, ey: 0, ang: 0, L: 360, hit: false };
    const z = this.lz;
    if (z.st === 'idle') {
      z.cd -= dt;
      if (z.cd <= 0 && G.player.hp > 0) {
        z.st = 'aim'; z.t = 1.0; z.hit = false;
        z.ex = this.x + this.face * 40; z.ey = this.y - 80;
        z.ang = Math.atan2((G.player.y - 18) - z.ey, G.player.x - z.ex);
        this.anim = 'attack';
        return;
      }
      return this.updGolem(dt, G);
    }
    z.t -= dt;
    this.anim = 'attack';
    if (z.st === 'aim') { if (z.t <= 0) { z.st = 'fire'; z.t = 0.7; Sound.play('bossHit', 0.6); } return; }
    if (!z.hit) {
      const px = G.player.x, py = G.player.y - 18, bx = z.ex + Math.cos(z.ang) * z.L, by = z.ey + Math.sin(z.ang) * z.L;
      const vx = bx - z.ex, vy = by - z.ey, k = Math.max(0, Math.min(1, ((px - z.ex) * vx + (py - z.ey) * vy) / (vx * vx + vy * vy)));
      const dx = z.ex + vx * k - px, dy = z.ey + vy * k - py;
      if (Math.hypot(dx, dy) < 12) { z.hit = true; G.hurtPlayer(z.ex, 'láser'); }
    }
    if (z.t <= 0) { z.st = 'idle'; z.cd = 4.5; this.anim = 'idle'; }
  }
  updGolem(dt, G) {
    const p = G.player, dx = p.x - this.x, adx = Math.abs(dx);
    this.cd -= dt; this.st -= dt;
    this.face = dx >= 0 ? 1 : -1;
    const lo = this.arena.x + 36, hi = this.arena.x + this.arena.w - 36;
    const ph2 = this.phase >= 2 ? 1.25 : 1, ph3 = this.phase >= 3 ? 1.4 : 1;
    if (this.state === 'slam') {
      this.setAnim('attack');
      if (this.st <= 0) { G.quake(this); this.state = 'walk'; this.cd = (this.phase >= 3 ? 1.2 : this.phase === 2 ? 1.6 : 2.3); }
      return;
    }
    this.setAnim('walk');
    this.dir = dx >= 0 ? 1 : -1;
    if (adx > 60) this.x += this.dir * (this.kind === 'golem_orange' ? 26 : 34) * ph2 * ph3 * dt;
    this.x = clamp(this.x, lo, hi);
    if (adx < 78 && this.cd <= 0) { this.state = 'slam'; this.st = 0.7; }
  }
  updHechicero(dt, G) {
    const p = G.player, lo = this.arena.x + 36, hi = this.arena.x + this.arena.w - 36;
    this.cd -= dt; this.st -= dt; this.face = p.x >= this.x ? 1 : -1;
    this.teleT -= dt;
    if (this.state === 'cast') {
      this.setAnim('attack');
      if (this.st <= 0) { G.spawnShot('orb', this.x, this.y - 10, this.face * (this.phase === 2 ? 110 : 88), 0); this.state = 'idle'; this.window = 1.0; this.cd = this.phase === 2 ? 1.05 : 1.6; }
      return;
    }
    this.setAnim('idle');
    if (this.teleT <= 0) { this.teleT = this.phase === 2 ? 4.5 : 6.5; this.x = rnd(lo, hi); G.burst(this.x, this.y - 30, 14, ['#c08cff', '#5ef2e0']); }
    if (this.cd <= 0) { this.state = 'cast'; this.st = 0.6; }
  }
  /* avispa reina: vuela sobre la arena, invoca abejas, y en picado aterriza (ahí se le puede golpear) */
  updReina(dt, G) {
    const p = G.player, lo = this.arena.x + 40, hi = this.arena.x + this.arena.w - 40;
    const hoverY = this.arena.y - 48 + Math.sin(this.t * 2.2) * 3;
    this.face = p.x >= this.x ? 1 : -1;
    this.cd -= dt; this.st -= dt;
    /* el temporizador de invocación corre siempre (también durante el picado), salvo mientras invoca */
    if (this.state === 'hover') this.summonT -= dt;
    if (this.state === 'summon') {
      this.setAnim('attack'); this.landed = false;
      this.y += (hoverY - this.y) * Math.min(1, dt * 6);
      if (this.st <= 0) {
        const n = 1;
        for (let i = 0; i < n; i++) {
          const e = G.spawnEnemy('bee', null, clamp(this.x + (i - (n - 1) / 2) * 34, lo, hi), this.y + 16);
          if (e) { e.state = 'dive'; e.st = 1.7; }
        }
        G.burst(this.x, this.y + 10, 10, ['#ffd34a', '#fff3b0'], 60, 0.5);
        Sound.play('checkpoint', 0.5);
        this.state = 'hover'; this.summonT = 6;
      }
      return;
    }
    if (this.state === 'dive') {
      this.setAnim('attack');
      /* primero vuela en horizontal hasta encima del jugador, y luego baja hasta la superficie */
      if (this.diveX === undefined) this.diveX = clamp(p.x, lo, hi);
      const dxd = this.diveX - this.x, targetY = this.arena.y - 4;
      if (Math.abs(dxd) > 30) this.x += Math.sign(dxd) * Math.min(Math.abs(dxd), dt * 260);
      else this.y += Math.sign(targetY - this.y) * Math.min(Math.abs(targetY - this.y), dt * 260);
      if (Math.abs(dxd) <= 30 && Math.abs(this.y - targetY) < 2.5) {
        this.landed = true; this.state = 'landed'; this.st = this.phase === 2 ? 1.8 : 2.4; this.diveX = undefined;
        G.quake(this);
      }
      return;
    }
    if (this.state === 'landed') {
      this.setAnim('idle'); this.landed = true;
      if (this.st <= 0) this.state = 'lift';
      return;
    }
    if (this.state === 'lift') {
      this.setAnim('walk'); this.landed = false;
      this.y += (hoverY - this.y) * Math.min(1, dt * 4);
      if (Math.abs(this.y - hoverY) < 3) this.state = 'hover';
      return;
    }
    /* vuelo */
    this.setAnim('walk'); this.landed = false;
    this.y += (hoverY - this.y) * Math.min(1, dt * 6);
    const target = lo + (hi - lo) * (0.5 + 0.5 * Math.sin(this.t * 0.7));
    this.x += (target - this.x) * Math.min(1, dt * 1.5);
    if (this.summonT <= 0) { this.state = 'summon'; this.st = 0.9; Sound.play('abejaGiganteInvoca', 0.8); return; }
    if (this.cd <= 0) { this.state = 'dive'; this.diveX = undefined; this.cd = this.phase === 2 ? 3.0 : 4.2; }
  }
  /* caballero: tres fases. Escudo arriba al caminar; al atacar baja la guardia (ahí le pegas). */
  updCaballero(dt, G) {
    const p = G.player, dx = p.x - this.x, adx = Math.abs(dx);
    const lo = this.arena.x + 30, hi = this.arena.x + this.arena.w - 30;
    this.face = dx >= 0 ? 1 : -1;
    this.cd -= dt; this.st -= dt;
    switch (this.state) {
      case 'windup':
        this.setAnim('attack');
        if (this.st <= 0) { this.state = 'strike'; this.st = 0.24; this.hitDone = false; }
        return;
      case 'strike': {
        this.setAnim('attack');
        const hb = { x: this.face > 0 ? this.x : this.x - 40, y: this.y - 40, w: 40, h: 32 };
        if (!this.hitDone && overlap(hb, p.box())) { this.hitDone = true; G.hurtPlayer(this.x, 'espada'); }
        if (this.st <= 0) { this.state = 'walk'; this.cd = this.phase === 3 ? 0.8 : 1.4; }
        return;
      }
      case 'charge': {
        this.setAnim('walk');
        this.x += this.dir * 190 * dt;
        if (overlap({ x: this.x - 26, y: this.y - 40, w: 52, h: 34 }, p.box())) G.hurtPlayer(this.x, 'carga');
        if (this.st <= 0 || this.x <= lo || this.x >= hi) { this.state = 'walk'; this.cd = 1.5; }
        return;
      }
      case 'spin': {
        this.setAnim('attack');
        this.spinT -= dt;
        if (this.spinT <= 0 && overlap({ x: this.x - 60, y: this.y - 40, w: 120, h: 40 }, p.box())) { this.spinT = 0.4; G.hurtPlayer(this.x, 'torbellino'); }
        if (this.st <= 0) { this.state = 'walk'; this.cd = 1.2; }
        return;
      }
      default: break;
    }
    this.setAnim('walk');
    this.dir = dx >= 0 ? 1 : -1;
    if (adx > 56) this.x += this.dir * (this.phase >= 2 ? 46 : 34) * dt;
    this.x = clamp(this.x, lo, hi);
    if (this.cd <= 0) {
      if (this.phase === 3 && Math.random() < 0.45) { this.state = 'spin'; this.st = 1.1; this.spinT = 0; }
      else if (this.phase >= 2 && adx > 90 && Math.random() < 0.5) { this.state = 'charge'; this.dir = dx >= 0 ? 1 : -1; this.st = 0.7; }
      else if (adx < 70) { this.state = 'windup'; this.st = 0.5; }
    }
  }
  /* sombra: se teletransporta, deja dos clones falsos y dispara orbes desde el real */
  updSombra(dt, G) {
    const p = G.player, lo = this.arena.x + 36, hi = this.arena.x + this.arena.w - 36;
    this.face = p.x >= this.x ? 1 : -1;
    this.teleT -= dt; this.shotT -= dt; this.ringT = Math.max(0, this.ringT - dt);
    if (this.state === 'cast') {
      this.setAnim('attack'); this.st -= dt;
      if (this.st <= 0) { G.spawnShot('orb', this.x, this.y - 10, this.face * (this.phase === 2 ? 120 : 96), 0); this.state = 'walk'; this.shotT = this.phase === 2 ? 1.4 : 2.2; }
      return;
    }
    this.setAnim('walk');
    this.x += Math.sign(p.x - this.x) * (this.phase === 2 ? 30 : 22) * dt;
    this.x = clamp(this.x, lo, hi);
    if (this.teleT <= 0) {
      this.teleT = this.phase === 2 ? 3.2 : 4.4;
      G.burst(this.x, this.y - 30, 12, ['#8a4cff', '#2a0a40'], 80, 0.4);
      this.x = rnd(lo, hi);
      this.ringT = 1.0;
      this.clones = [];   /* sin clones falsos: la sombra ya no se 'multiplica' */
      G.burst(this.x, this.y - 30, 12, ['#8a4cff', '#2a0a40'], 80, 0.4);
    }
    if (this.shotT <= 0) { this.state = 'cast'; this.st = 0.5; }
  }
  updateClones(dt) {
    for (const c of this.clones) { c.t += dt; c.life -= dt; c.x += Math.sin(c.t * 2 + c.ph) * 16 * dt; }
    this.clones = this.clones.filter(c => c.life > 0);
  }
}

class Pickup {
  constructor(kind, plat, x, y, opts = {}) {
    Object.assign(this, { kind, plat, x, y, t: rnd(0, 6), alive: true, value: opts.value || 1, opened: false, vx: 0, vy: 0,
      grounded: !!plat, mimic: !!opts.mimic });
  }
  box() { return { x: this.x - 7, y: this.y - 24, w: 14, h: 16 }; }
  update(dt) { this.t += dt; }
}
