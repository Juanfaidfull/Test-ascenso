'use strict';
/* =====================================================================
   ASCENSO 4.1 · controlador. Carrera lateral infinita: la cámara sigue en horizontal
   y en vertical con una banda. Estados: menu, play, paused, shop, over. Las mejoras
   son objetos que hay que recoger en el nivel; el primer jefe llega a los 330 m y
   luego cada 300 m. El lienzo ocupa toda la pantalla horizontal.
   ===================================================================== */
const G = {
  state: 'menu', returnTo: 'menu', ctx: null, canvas: null,
  world: null, player: null, enemies: [], shots: [], pickups: [], boss: null,
  camX: 0, camY: 0,
  mods: null, shield: null, shieldCd: 20, run: null, queue: [],
  flyT: 4, t: 0, frame: 0, heroStrips: null,
  onlineMax: APP_CONFIG.roomDefaultSize, onlineCode: '', ghostT: 0, meId: '', meName: 'jugador',
  resetArmed: false, loop: null, boss_count: 0, screen: 'menu', heroCfg: null, mode: 'solo', inputLocked: false,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.fitCanvas();
    addEventListener('resize', () => this.fitCanvas());
    addEventListener('orientationchange', () => setTimeout(() => this.fitCanvas(), 150));
    if (window.visualViewport) visualViewport.addEventListener('resize', () => this.fitCanvas());
    Progress.load();
    if (!store.get('char', null)) store.set('char', 'hero');   /* el personaje elegido se conserva */
    Input.init();
    this.player = new Player();
    document.body.classList.remove('no-sling-char');
    this.world = null;   /* el mundo de las oleadas se crea al empezar cada partida */
    this.resetMods();
    this.meId = Math.random().toString(36).slice(2, 10);
    this.meName = store.get('nombre', null) || ('jugador' + rint(100, 999));
    store.set('nombre', this.meName);
    Cloud.init();
    UI.init();
    UI.act = (a, el) => this.onAct(a, el);
    document.getElementById('btnPause').innerHTML = ICON.pause;   /* icono de la pausa (pack game-icons.net) */
    document.getElementById('btnPause').addEventListener('click', () => { Sound.unlock(); this.pause(); });
    Auth.onChange(() => this.refreshAccount());
    CloudSave.onChange(() => this.refreshSync());
    Net.onChange(() => Versus.refresh());
    if (Cloud.ready()) Auth.restore().catch(() => { });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.onHide(); });
    /* pantalla completa y horizontal en el primer toque (los navegadores lo exigen) */
    const fs = () => {
      try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (e) { }
    };
    addEventListener('pointerdown', fs, { once: true, passive: true });
    addEventListener('keydown', fs, { once: true });
    this.loop = createLoop(dt => this.update(dt), dt => this.render(dt));
    this.loop.start();
    Music.bindUnlock();
    Music.preloadAudio(['menu', 'forest']);
    /* las islas de todos los mapas se empiezan a cargar al arrancar, para que no se pidan en plena partida */
    Object.values(VS_MAPS).concat(Object.values(SOLO_MAPS)).forEach(mp => Img.get(mp.isla));
    this.refreshHeroStrips();
    this.toMenu();
  },
  get me() { return { id: Auth.user ? Auth.user.id : this.meId, name: Auth.user ? Auth.user.name : this.meName, look: shareLook() }; },
  /* el ancho del lienzo sigue la proporción de la pantalla: en horizontal se ve más escenario */
  fitCanvas() {
    const vw = Math.max(320, innerWidth), vh = Math.max(240, innerHeight);
    H = 270;
    W = clamp(Math.round(H * vw / vh), 400, 1000);
    if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; }
    this.ctx.imageSmoothingEnabled = false;
  },
  /* los sprites del héroe se calculan una vez; sólo se recalculan si cambia el aspecto del personaje */
  refreshHeroStrips() { this.heroStrips = artFor(store.get('char', 'hero')).strips(store.get('hero', HERO_DEFAULT_CFG)); },
  resetMods() {
    this.mods = { attackRange: 0, crit: 0, shieldRegen: false, explosive: false, lifesteal: 0, magnet: 0, luck: 0, parryCdReduction: 0,
      multi: 1, reloadMul: 1, bounces: 1, bounceMul: 1 };
    this.shield = { charges: 0, cap: 0 };
  },
  /* metros recorridos hacia la derecha desde el inicio */

  /* ---------- partidas ---------- */
  /* ARCADE: oleadas en el bastión. Escenario cerrado, oleadas sin fin, descanso y un jefe cada 5 oleadas */
  newWaves() {
    this.mode = 'solo'; this.inputLocked = false;
    const pick = WAVE_POOL[Math.floor(Math.random() * WAVE_POOL.length)];
    this.world = new WavesWorld(pick);
    this.resetMods();
    Ramas.apply(this);
    const isl = this.world.plats[0];
    this.player.reset(ARENA.CX, isl.y); this.player.maxHp = 5; this.player.hp = 5; this.player.plat = isl;
    this.enemies = []; this.shots = []; this.pickups = []; this.boss = null;
    this.deathWait = null;
    this.run = { t: 0, extra: 0, kills: 0, bosses: 0, coins: 0, coinsEarned: 0, hearts: 0, ups: [], autoT: 0, startedAt: Date.now(), dmgCount: 0, lastDmgX: ARENA.CX };
    this.camX = ARENA.CX - W / 2; this.camY = 0;
    this.shieldCd = 20; this.ghostT = 0; this.flyT = 4;
    this.waves = null;
    Feel.reset(); this.queue = [];
    this.state = 'play';
    UI.hide(); UI.showHud(true); this.hudReset();
    this.refreshHeroStrips();
    Waves.begin(this);
    Music.play(WAVE_MUSIC, { fade: 0.6 });
  },
  hudReset() { UI.hudCache = {}; },
  toMenu() {
    Sound.stopAll(['click']);   /* volver al menú corta los efectos de la pantalla que se deja */
    this.state = 'menu'; this.screen = 'menu';
    UI.showHud(false); UI.menu(); this.refreshSync();
    Music.play('menu', { fade: 0.6 });
  },
  pause() { if (this.state !== 'play') return; this.state = 'paused'; if (this.player) this.player.sl.on = false; UI.pause(); Music.pauseMusic(); },
  resume() { if (this.state !== 'paused' || innerHeight > innerWidth) return; Input.slingRelease = Input.slingPress = false; this.state = 'play'; UI.hide(); Music.resumeMusic(); },
  onHide() { if (this.state === 'play') this.pause(); },

  /* ---------- acciones de la interfaz ---------- */
  onAct(a, el) {
    if (this.mode === 'versus' && (a === 'restart' || a === 'menu')) { Versus.quitMatch(); return; }
    switch (a) {
      case 'play': this.newWaves(); break;
      case 'pick': this.choosePick(Number(el.dataset.i)); break;
      case 'ramasMenu': this.screen = 'craft'; UI.craftTab = 'ramas'; Music.play('craft', { fade: 0.6 }); Sound.play('craftOpen', 0.6); UI.craft(); break;
      case 'craft': this.screen = 'craft'; Music.play('craft', { fade: 0.6 }); Sound.play('craftOpen', 0.6); UI.craft(); break;
      case 'craftBack': Sound.play('craftClose', 0.6); this.toMenu(); break;
      case 'craftDo': Craft.craft(el.dataset.id); UI.craft(); break;
      case 'craftEq': Craft.equip(el.dataset.id); UI.craft(); break;
      case 'craftTab': UI.craftTab = el.dataset.tab; UI.craft(); break;
      case 'craftInv': if (UI.craftTab === 'shop' || UI.craftTab === 'ramas') { UI.craftTab = 'inv'; UI.craftInvOpen = true; } else UI.craftInvOpen = !(UI.craftInvOpen !== false); UI.craft(); break;
      case 'craftShop': UI.craftTab = 'shop'; UI.craft(); break;
      case 'craftRamas': UI.craftTab = 'ramas'; UI.craft(); break;
      case 'reroll': this.rerollPick(); break;
      case 'shopBuy': Craft.buy(el.dataset.id); UI.craft(); break;
      case 'craftUpgrade': Craft.upgrade(el.dataset.skill); UI.craft(); break;
      case 'craftSkillEq': Craft.equipSkill(el.dataset.skill); UI.craft(); break;
      case 'craftSlot': UI.craftSlots[+el.dataset.i] = null; UI.craft(); break;
      case 'craftMake': UI.craftMake(); break;
      case 'playSolo': this.playSolo(); break;
      case 'resume': this.resume(); break;
      case 'restart': Sound.play('retry', 0.7); this.newWaves(); break;
      case 'menu': this.toMenu(); break;
      case 'hero': this.screen = 'hero'; this.heroCfg = Object.assign({}, HERO_DEFAULT_CFG, store.get('hero', {})); this.fixCfg(); this.heroChar = 'hero'; UI.heroChar = 'hero'; UI.hero(this.heroCfg); break;
      case 'heroPick': if ((this.heroChar || 'hero') === 'hero') { this.heroCfg[el.dataset.k] = +el.dataset.i; UI.heroRows(this.heroCfg); UI.stopHeroLoop(); UI.startHeroLoop(this.heroCfg); } break;
      case 'heroPart': UI.heroPart = el.dataset.k; UI.heroRows(this.heroCfg); break;
      case 'heroChar': { const id = el.dataset.c; if (id !== 'hero' && id !== 'chica' && !Chars.has(id)) break; store.set('char', id); this.refreshHeroStrips(); UI.heroRows(this.heroCfg); UI.stopHeroLoop(); if (CHARACTERS[id]) UI.charPreview(id, this.heroCfg); else UI.startHeroLoop(this.heroCfg); break; }
      case 'heroSave': store.set('hero', this.heroCfg); this.refreshHeroStrips(); if (this.player) this.player.charId = Chars.resolve(); document.body.classList.remove('no-sling-char'); this.toMenu(); break;
      case 'board': this.screen = 'board'; UI.board('local', [], ''); break;
      case 'boardTab': this.boardGlobal(el.dataset.tab); break;
      case 'settings': this.returnTo = this.state === 'paused' ? 'pause' : 'menu'; this.screen = 'settings'; UI.settings(''); break;
      case 'toggle': this.toggle(el.dataset.k); break;
      case 'controlsCycle': Controls.mode = Controls.mode === 'buttons' ? 'joystick' : 'buttons'; store.set('controls', Controls.mode); applyControls(); UI.settings(''); break;
      case 'layoutEdit': UI.hide(); startTouchEdit(); break;
      case 'layoutReset': resetTouchLayout(); UI.settings('Botones restablecidos.'); break;
      case 'touchCycle': Settings.touch = Settings.touch === 'auto' ? 'on' : Settings.touch === 'on' ? 'off' : 'auto'; store.set('touch', Settings.touch); UI.settings(''); break;
      case 'resetProgress': this.resetProgress(); break;
      case 'account': this.screen = 'account'; UI.account({ msg: '' }); break;
      case 'login': this.doLogin(); break;
      case 'signup': this.doSignup(); break;
      case 'logout': this.doLogout(); break;
      case 'syncNow': this.doSync(); break;
      /* MULTIJUGADOR (VS): menú, crear sala (con o sin contraseña), unirse, sala y partida */
      case 'vs': case 'online': Versus.openMenu(); break;
      case 'vsCreate': Versus.openCreate(); break;
      case 'vsPwdMode': Versus.setPwdMode(+el.dataset.m); break;
      case 'vsMode': Versus.setCreateMode(+el.dataset.m); break;
      case 'vsCreateGo': Versus.createGo(); break;
      case 'train': Versus.trainStart(); break;
      case 'map': if (Versus.phase === 'off') Versus.setCreateMap(el.dataset.id); else Versus.pickMap(el.dataset.id); break;
      case 'vsJoinScreen': Versus.openCode(); break;
      case 'vsBrowse': Versus.openBrowse(); break;
      case 'vsJoin': Versus.joinCode(); break;
      case 'vsJoinRow': Versus.rowJoin(el.dataset.code, el.dataset.pwd); break;
      case 'vsJoinPwd': Versus.joinPwd(); break;
      case 'vsRounds': Versus.setRounds(+el.dataset.n); break;
      case 'vsStart': Versus.start(); break;
      case 'vsLeave': Versus.leaveRoom(''); break;
      case 'vsQuit': Versus.quitMatch(); break;
      case 'buy': this.buyShop(+el.dataset.i); break;
      case 'shopContinue': this.closeOverlay(); break;
    }
  },
  fixCfg() {
    for (const k of Object.keys(HERO_DEFAULT_CFG)) {
      const n = HERO_OPT[k].length;
      const v = this.heroCfg[k];   /* índice de la lista o color libre #rrggbb; cualquier otro valor vuelve al básico */
      if (typeof v === 'string' ? !/^#[0-9a-f]{6}$/i.test(v) : !isNum(v, 0, n - 1)) this.heroCfg[k] = 0;
    }
  },
  toggle(k) {
    if (k === 'music') Music.setEnabled(!Music.enabled);
    if (k === 'sfx') Sound.setSfx(!Sound.sfxOn);
    UI.settings('');
  },
  resetProgress() {
    if (!this.resetArmed) { this.resetArmed = true; UI.settings('Pulsa BORRAR otra vez para confirmar. Tu cuenta en la nube no se borra.'); return; }
    this.resetArmed = false; Progress.reset(); store.del('top'); UI.settings('Progreso de este dispositivo borrado.');
  },
  async boardGlobal(tab) {
    if (tab !== 'global') { UI.board('local', [], ''); return; }
    UI.board('global', [], 'Cargando tabla global…');
    const r = await CloudSave.topGlobal();
    if (this.screen !== 'board') return;
    UI.board('global', r.rows, r.ok ? '' : r.msg);
  },
  /* jugar solo: si estabas en una sala VS, primero sales de ella */
  playSolo() { if (Versus.phase !== 'off') Versus.leaveRoom('').then(() => this.newWaves()); else this.newWaves(); },
  refreshSync() { const el = document.getElementById('syncLine') || document.getElementById('syncLine2'); if (el) el.textContent = UI.syncLine(); },
  refreshAccount() { if (this.screen === 'account') UI.account({ msg: Auth.busy ? 'Un momento…' : '' }); this.refreshSync(); },
  readAcc() { return { email: (document.getElementById('accEmail') || {}).value || '', pass: (document.getElementById('accPass') || {}).value || '', name: (document.getElementById('accName') || {}).value || '' }; },
  /* tras un error se conservan el email y el nombre; la contraseña se borra por seguridad */
  async doLogin() { const f = this.readAcc(); const r = await Auth.signIn(Auth.emailFor(f.name), f.pass); UI.account({ msg: r.msg, name: f.name }); },
  async doSignup() { const f = this.readAcc(); const r = await Auth.signUp(Auth.emailFor(f.name), f.pass, f.name.trim()); UI.account({ msg: r.msg, name: f.name }); },
  async doLogout() { const r = await Auth.signOut(); UI.account({ msg: r.msg }); },
  async doSync() { UI.account({ msg: 'Sincronizando…' }); await CloudSave.onLogin(); UI.account({ msg: CloudSave.message }); },

  /* ---------- creación de objetos ---------- */
  spawnEnemy(kind, plat, x, y) {
    if (!ENEMY_DEF[kind]) return null;
    const e = new Enemy(kind, plat, x, y);
    this.enemies.push(e); return e;
  },
  spawnPickup(kind, x, y, plat, opts) {
    const p = new Pickup(kind, plat, x, y, opts);
    this.pickups.push(p); return p;
  },
  /* botín de materiales: no todos sueltan algo. Cada enemigo tiene su probabilidad; la suerte la sube y lo raro aparece menos.
     Un jefe siempre suelta de 2 a 3 materiales */
  /* botín de materiales. Enemigos: una tirada por muerte con su probabilidad, y un tope de 4 por ronda
     (a partir del cuarto, casi no caen). Jefes: 1 material seguro y un 35 % de un segundo, nunca más de 2. */
  dropMaterial(e, boss) {
    const luck = this.mods.luck || 0;
    const wv = this.waves ? this.waves.n : 0;
    if (this.dropWave !== wv) { this.dropWave = wv; this.waveMats = 0; }
    if (boss) {
      const tries = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let i = 0; i < tries; i++) this.spawnMatDrop(e, i, Craft.rollMaterialFor(e.kind, luck));
      return;
    }
    let chance = Math.min(0.8, (MAT_DROP_CHANCE[e.kind] || 0.2) * (1 + 0.35 * luck));
    if (this.waveMats >= 4) chance *= 0.3;
    if (Math.random() >= chance) return;
    this.waveMats = (this.waveMats || 0) + 1;
    this.spawnMatDrop(e, 0, Craft.rollMaterialFor(e.kind, luck));
  },
  spawnMatDrop(e, i, mat) {
    const p = this.spawnPickup('material', e.x + rnd(-6, 6), e.y - 16 - i * 6, null, {});
    p.mat = mat;
    Stats.addMat();
  },
  spawnShot(kind, x, y, vx, vy) {
    const s = new Shot(kind, x, y, vx, vy, 3);
    this.shots.push(s); return s;
  },
  spawnBoss(arena) {
    const kinds = ['golem_blue', 'hechicero', 'golem_orange', 'avispa_reina', 'caballero', 'sombra', 'guardian_hielo', 'demonio_slime', 'garras', 'minotauro', 'golem_laser', 'daddy', 'cthulhu', 'bringer', 'cultista', 'demonio_hacha', 'nightborne'];
    const kind = kinds[this.boss_count % kinds.length];
    this.boss_count++;
    this.boss = new Boss(kind, arena);
    if (BOSS_APPEAR_SFX[kind]) Sound.play(BOSS_APPEAR_SFX[kind], 0.9);
    this.boss.intro = 5; this.boss.maxHp = Math.round(this.boss.maxHp * (1 + 0.25 * (this.boss_count - 1))); this.boss.hp = this.boss.maxHp;
    this.bossIntro = { name: BOSS_SHEETS[kind].name, t: 5 };
    Music.play('boss', { fade: 0.8 });
    Feel.shake(2, 0.2);
  },
  heal(n, x, y) {
    const p = this.player;
    if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + n); Feel.text(x, y - 8, '+' + n + ' ♥', '#ff8aa8'); Sound.play('heal', 0.7); }
    else { this.run.extra += 25; Feel.text(x, y - 8, '+25', '#ffe7a6'); }
  },

  /* ---------- combate y daño ---------- */
  /* ---------- combate y daño ---------- */
  /* ---------- combate y daño ---------- */
  addPuddle(x, y) { (this.puddles = this.puddles || []).push({ x, y, t: 5 }); },
  updatePuddles(dt) {
    if (!this.puddles || !this.puddles.length) return;
    for (const q of this.puddles) q.t -= dt;
    this.puddles = this.puddles.filter(q => q.t > 0);
    const p = this.player;
    if (!p || p.hp <= 0 || this.state !== 'play') return;
    for (const q of this.puddles) if (p.inv <= 0 && Math.abs(p.x - q.x) < 24 && Math.abs(p.y - q.y) < 14) { this.hurtPlayer(q.x, 'golpe'); break; }
  },
  hurtPlayer(srcX, why) {
    const p = this.player;
    if (p.inv > 0 || p.hp <= 0) return false;
    /* El parry sólo bloquea amenazas que llegan desde el frente; la espalda queda expuesta. */
    const fromFront = p.face >= 0 ? srcX >= p.x - 2 : srcX <= p.x + 2;
    if (p.parryT > 0 && fromFront) { Feel.ring(p.x + p.face * 22, p.y - 24, 28, '#59dfff', 0.18); this.spawnFx('golpe_hit', p.x + p.face * 22, p.y - 24, false); Feel.text(p.x, p.y - 48, '¡PARRY!', '#83eaff'); Sound.play('checkpoint', 0.35); return false; }
    if (this.shield.charges > 0) {
      this.shield.charges--; p.inv = 0.8;
      Feel.text(p.x, p.y - 50, '¡Bloqueado!', '#9ee7ff'); Feel.ring(p.x, p.y - 14, 20, '#9ee7ff');
      Sound.play('checkpoint', 0.6); return false;
    }
    p.hp -= 1; this.run.dmgCount++; this.run.lastDmgX = p.x;
    p.inv = 1.1; if ((p.charId || 'hero') !== 'hero') { p.hitT = 0.24; p.setAnim('hit'); }
    const dir = Math.sign(p.x - srcX) || 1;
    p.vx = dir * 170; p.vy = -230; p.onGround = false; p.plat = null; p.jumps = 1;
    Feel.shake(2, 0.15); Feel.burst(p.x, p.y - 20, 7, ['#ff6a6a', '#ffd1d1'], 80);
    Sound.play(/flecha/.test(String(why)) ? 'flechaImpacta' : (/bomba|orbe|onda|bola|proy|roca/.test(String(why)) ? 'ballHit' : hurtKey()), 0.8);
    if (p.hp <= 0) this.die(why === 'caída' ? 'Caíste al vacío' : 'Te derrotaron');
    return true;
  },
  /* golpe a un enemigo: true si lo derriba (suma bajas, puntos, botín y progreso del bioma) */
  hitEnemy(e, dmg = 1, src) {
    if (e.dying > 0 || !e.alive) return false;
    const dead = e.takeHit(dmg);
    if (!dead) { Feel.burst(e.x, e.y - 14, 4, ['#ffffff'], 60, 0.25); if (src !== 'ball' && src !== 'arrow' && src !== 'stomp') Sound.play('hit', 0.4); return false; }
    this.run.kills++; this.run.extra += e.def.pts;
    Loot.enemyDrop(e, this); this.dropMaterial(e); if (e.elite) this.dropMaterial(e);
    if (this.mods.lifesteal && Math.random() < this.mods.lifesteal && this.player.hp < this.player.maxHp) this.heal(1, e.x, e.y);
    Feel.burst(e.x, e.y - 14, 10, ['#ffd34a', '#ff8a5a', '#ffffff'], 90);
    if (src !== 'ball' && src !== 'arrow' && src !== 'stomp') Sound.play('hit', 0.7);
    return true;
  },
  killEnemy(e) { return this.hitEnemy(e, 1); },
  /* un golpe al escudo del enemigo: se rompe a los 3 golpes (ya no es infinito) */
  shieldHit(e) {
    const broke = e.breakShield();
    Feel.text(e.x, e.y - 40, broke ? '¡Escudo roto!' : '¡Escudo!', broke ? '#ffd34a' : '#c9d6e6');
    Feel.burst(e.x + e.dir * 8, e.y - 20, broke ? 10 : 5, ['#dfe9f7', '#9fb3c8'], 80, 0.3);
    Sound.play('hit', broke ? 0.8 : 0.35);
  },
  hitBoss(b, dmg, fromX) {
    const r = b.receiveHit(dmg, this, fromX);
    if (r.hit) { b.hurtT = 0.26; b.flashT = 0.12; }
    if (r.hit) { Sound.play('bossHit', 0.7); Feel.burst(b.x, b.y - 30, 8, ['#ffffff', '#ffd34a'], 90); if (r.msg) Feel.text(b.x, b.y - 70, r.msg, '#ffd34a'); }
    else if (r.msg) { Feel.text(b.x, b.y - 70, r.msg, '#9ee7ff'); Sound.play('hit', 0.4); }
    return r;
  },
  /* golpe cuerpo a cuerpo: el arco delante del jugador */
  fxDef(k) { if (FX_SET_FRAMES[k]) return Object.assign({ dur: 0.32, dy: -10 }, FX_SET_FRAMES[k]); return ({ slash: { p: 'fx/slash_', n: 9, dur: 0.26, size: 60, dy: -6 }, circle: { p: 'fx/circle_', n: 10, dur: 0.35, size: 56, dy: -10 }, frost: { p: 'fx/frost_', n: 9, dur: 0.3, size: 48, dy: -10 }, fire: { p: 'fx/fire_', n: 6, dur: 0.3, size: 52, dy: -10 } })[k]; },
  spawnFx(kind, x, y, flip) { (this.fx = this.fx || []).push({ kind, x, y, t: 0, flip: !!flip }); },
  updateFx(dt) { if (!this.fx || !this.fx.length) return; for (const f of this.fx) f.t += dt; this.fx = this.fx.filter(f => f.t < this.fxDef(f.kind).dur); },
  drawFx(ctx, camY) {
    if (!this.fx) return;
    for (const f of this.fx) {
      const d = this.fxDef(f.kind), idx = Math.min(d.n - 1, Math.floor(f.t / d.dur * d.n)), im = Img.get(d.p + (idx + 1) + '.png');
      if (!Img.ready(im)) continue;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(f.x), Math.round(f.y - camY)); if (f.flip) ctx.scale(-1, 1);
      ctx.drawImage(im, -d.size / 2, -d.size / 2 + d.dy, d.size, d.size); ctx.restore();
    }
  },
  swing() {
    if (this.player) this.spawnFx('slash', this.player.x + this.player.face * 34, this.player.y - 28, this.player.face < 0);
    const p = this.player, cid = p.charId || 'hero';
    if (cid === 'wizard' || cid === 'huntress') {
      if (p.rangedFired) return; p.rangedFired = true;
      const kind = cid === 'wizard' ? 'orb' : 'arrow';
      const s = this.spawnShot(kind, p.x + p.face * (cid === 'wizard' ? 15 : 18), p.y - (cid === 'wizard' ? 27 : 25), p.face * (cid === 'wizard' ? 250 : 390), 0);
      s.owner = 'hero'; s.dmg = cid === 'wizard' ? 2 : 1; s.life = cid === 'wizard' ? 2.2 : 1.5; s.charShot = cid;
      Feel.burst(p.x + p.face * 12, p.y - 24, cid === 'wizard' ? 7 : 4, cid === 'wizard' ? ['#c08cff','#f2dcff'] : ['#e9e1c4','#ffffff'], 65, .25);
      Sound.play(cid === 'wizard' ? 'buff' : 'attack', .65); return;
    }
    if (!p.swingHits) p.swingHits = [];
    const reach = SWORD_RULES.reach + (cid === 'knight' ? 6 : 0) + this.mods.attackRange;
    const hb = { x: p.face > 0 ? p.x - 4 : p.x - reach + 4, y: p.y - SWORD_RULES.top, w: reach, h: SWORD_RULES.height };
    let hit = false;
    for (const e of this.enemies) {
      if (p.swingHits.indexOf(e) >= 0) continue;                 /* cada enemigo cuenta una sola vez por golpe */
      if (e.dying > 0 || !e.alive || e.hidden || !overlap(hb, e.box())) continue;
      p.swingHits.push(e); hit = true;
      if (e.blocksFrom(p.x)) { this.shieldHit(e); continue; }
      const baseDmg = cid === 'knight' ? 2 : 1;
      { const R = this.ramas || {}; this.hitEnemy(e, (Math.random() < this.mods.crit ? 2 : baseDmg) + (Math.random() < (R.swDmg || 0) ? 1 : 0)); if (e.alive && (e.dying || 0) <= 0 && Math.random() < (R.swDouble || 0)) this.hitEnemy(e, 1); if (e.alive && Math.random() < (R.swKnock || 0)) e.x += this.player.face * 14; }
    }
    const b = this.boss;
    if (b && b.alive && b.dying <= 0 && p.swingHits.indexOf(b) < 0 && overlap(hb, b.box())) { p.swingHits.push(b); hit = true; this.hitBoss(b, Math.random() < this.mods.crit ? 2 : (cid === 'knight' ? 2 : 1), p.x); }
    if (hit) Feel.shake(cid === 'knight' ? 2 : 1, cid === 'knight' ? .1 : .06);
  },
  /* pisotón: rebota y tumba al enemigo */
  stomp(e) {
    const p = this.player;
    p.vy = -PHYS.BOUNCE * this.mods.bounceMul; p.jumps = 1; p.sq = 1.25;
    this.hitEnemy(e, 1, 'stomp');
    Feel.ring(e.x, e.y - 8, 16, '#ffd34a');
    Sound.play('stomp', 0.8);
  },
  contact(e, srcX) { if (e && e.kind === 'demonio_volador') Sound.play('demonioVoladorDano', 0.7); this.hurtPlayer(srcX, 'contacto'); },
  /* parry: 1,5 s activo en oleadas y 1,2 s en VS. El enfriamiento (6 s menos las mejoras) empieza cuando el parry se agota o se rompe */
  parryCooldown() { return Math.max(1.5, 6 - (this.mods.parryCdReduction || 0)); },
  updateParry(dt, mode) {
    const p = this.player; if (!p) return;
    const on = mode === 'vs' ? 1.2 : 1.5;
    if (p.parryT > 0) { p.parryT = Math.max(0, p.parryT - dt); if (p.parryT <= 0) p.parryCd = this.parryCooldown(); }
    else p.parryCd = Math.max(0, (p.parryCd || 0) - dt);
    if (Input.parryPress && p.parryT <= 0 && p.parryCd <= 0 && p.hp > 0) {
      p.parryT = on * (1 + ((this.ramas && this.ramas.parryDur) || 0)); Sound.play('shield', 0.7);
      Feel.ring(p.x + p.face * 20, p.y - 24, 34, '#59dfff', 0.3); Sound.play('checkpoint', 0.45);
    }
    const btn = document.getElementById('parryBtn');
    if (btn) { const enfria = p.parryT <= 0 && p.parryCd > 0; btn.classList.toggle('active', p.parryT > 0); btn.classList.toggle('cooling', enfria); btn.dataset.cd = enfria ? p.parryCd.toFixed(1) + 's' : ''; }
  },
  /* el escudo se rompe con el primer impacto frontal (VS): el enfriamiento empieza ya */
  breakParry(p) { p.parryT = 0; p.parryCd = this.parryCooldown(); },
  resolveParry() {
    const p = this.player; if (!p || p.parryT <= 0) return;
    const front = p.face >= 0 ? { x: p.x + 7, y: p.y - 48, w: 42, h: 44 } : { x: p.x - 49, y: p.y - 48, w: 42, h: 44 };
    for (const e of this.enemies) {
      if (e.kind !== 'bee' || !e.alive || e.dying > 0 || !overlap(front, e.box())) continue;
      this.hitEnemy(e, Math.max(1, e.hp)); Feel.burst(e.x, e.y - 8, 8, ['#8cecff', '#fff4a8', '#ffffff'], 75, 0.28);
    }
  },
  stompBoss() {
    const p = this.player;
    p.vy = -PHYS.BOUNCE * this.mods.bounceMul; p.jumps = 1; p.sq = 1.25;
    Feel.shake(2, 0.15); Sound.play('stomp', 0.9);
  },
  quake(b) {
    const p = this.player;
    Feel.shake(3, 0.25); Feel.ring(b.x, b.y - 4, 40, '#ffb35c', 0.4);
    Sound.play('stomp', 0.9);
    if (p.onGround && Math.abs(p.y - b.arena.y) < 3 && Math.abs(p.x - b.x) < 72) this.hurtPlayer(b.x, 'pisotón');
  },
  onBossPhase(b, ph) { Feel.shake(2, 0.2); Feel.text(b.x, b.y - 80, '¡Fase ' + ph + '!', '#ffd34a'); Sound.play('bossPhase', 0.6); },
  bossDefeated() {
    const b = this.boss;
    this.run.bosses++; this.run.extra += 300;
    Loot.bossDrop(b, this);
    Feel.shake(3, 0.3); Feel.text(b.x, b.y - 70, '¡Jefe derrotado! +300', '#ffd34a');
    const got = Chars.onBossDown(b.kind); if (got.length) Feel.text(b.x, b.y - 100, '¡Desbloqueado: ' + got.join(', ') + '!', '#9ee7ff');
    Sound.play('bossDead', 0.9);
    this.boss = null;
    /* el siguiente jefe llega 300 m más allá de donde está el jugador ahora */
    this.run.bossQueued = false;
    Music.jingle('victory', () => this.restoreBiomeMusic());
  },
  restoreBiomeMusic() {
    if (this.state !== 'play' || !this.run) return;
    Music.play(this.boss ? 'boss' : WAVE_MUSIC, { fade: 0.8 });
  },
  /* efectos de habilidades */
  onJump(p, double) {
    if (double) { Feel.burst(p.x, p.y, 6, ['#ffffff', '#9ee7ff'], 60, 0.3); Feel.ring(p.x, p.y, 10, '#9ee7ff', 0.25); }
    else Feel.burst(p.x, p.y, 3, ['#ffffff'], 40, 0.25);
    Sound.play('jump', 0.45);
    if (this.mods.explosive) {
      Feel.ring(p.x, p.y, 46, '#ffb35c', 0.3);
      for (const e of this.enemies) if (e.dying <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < 46) this.killEnemy(e);
    }
  },
  onLand(p, fallV) {
    if (fallV > 220) { Feel.burst(p.x, p.y, 4, ['#c9b48a', '#8a7a5a'], 50, 0.3); Feel.shake(1, 0.05); }
    Sound.play('land', Math.min(0.7, 0.2 + fallV / 1200));
  },
  onAttack(p) { const cid=p.charId||'hero'; Sound.play(cid==='wizard'?'buff':(p.atkN?'attack2':'attack'), 0.7); p.swingDone = false; },
  burst(x, y, n, cols) { Feel.burst(x, y, n, cols); },

  /* ---------- mejoras, tienda y bioma ---------- */
  queueOverlay(kind) { this.queue.push(kind); this.nextOverlay(); },
  nextOverlay() {
    if (this.state !== 'play' || !this.queue.length) return;
    const k = this.queue.shift();
    if (k === 'pick') this.openPick();
  },
  openPick() {
    const list = Upgrades.pick(this, 3);
    if (!list.length) return;
    this.pendingList = list; this.state = 'pick';
    UI.pick(list); Sound.play('upgradeMenu', 0.6);
  },
  rerollPick() {
    if (this.state !== 'pick' || Upgrades.rerollsLeft(this) <= 0) return;
    this.run.rerolls -= 1;
    const list = Upgrades.pick(this, 3); if (!list.length) return;
    this.pendingList = list; UI.pick(list); Sound.play('upgradeMenu', 0.5);
  },
  choosePick(i) {
    if (this.state !== 'pick') return;   /* solo se elige mientras el menú de mejoras está abierto */
    const u = this.pendingList && this.pendingList[i]; if (!u) return;
    Upgrades.apply(u.id, this);
    this.pendingList = null;
    Feel.text(this.player.x, this.player.y - 60, '¡' + u.name + '!', RARITY[u.rarity].col);
    Sound.play('buff', 0.7);
    this.closeOverlay();
  },
  closeOverlay() {
    this.state = 'play'; UI.hide(); UI.showHud(true); this.hudReset();
    this.nextOverlay();
  },
  /* cambio de bioma: fondo que se mezcla y música que hace crossfade */
  summary(reason) {
    const r = this.run, n = this.waves ? this.waves.n : 0;
    return { reason, score: n * 100 + r.kills * 10 + r.extra, height: 0, kills: r.kills, bosses: r.bosses, coinsEarned: 0,
      hearts: r.hearts, ups: r.ups.length, missionText: 'Oleadas', missionDone: false, isRecord: false, cloudMsg: '', waves: n };
  },
  die(reason) {
    if (this.state !== 'play' && this.state !== 'pick' && this.state !== 'shop') return;
    if (!this.run || this.deathWait) return;
    if (this.player && !this.player.death) { Death.start(this.player, this.world && this.world.plats); this.deathWait = reason || 'Te derrotaron'; return; }
    this.finishDie(reason);
  },
  finishDie(reason) {
    if (this.state !== 'play' && this.state !== 'pick' && this.state !== 'shop') return;
    if (!this.run) return;
    this.state = 'over';
    if (!this.run.statsDone) { this.run.statsDone = true; Stats.endRun(this.run); }
    this.queue = []; this.pendingList = null;
    const r = this.summary(reason);
    const bestBefore = Progress.totals.bestWaveScore;
    r.isRecord = r.score > 0 && r.score > bestBefore;
    r.missionDone = !!(this.run.mission && this.run.mission.done);
    Progress.recordWaves({ score: r.score, waves: r.waves });
    if (Auth.user) {
      CloudSave.saveProgress().catch(() => { });
      r.cloudMsg = '';
    } else r.cloudMsg = '';
    Net.leave().catch(() => { });
    UI.showHud(false);
    /* la música del bioma se apaga; el récord suena una sola vez */
    Music.stopMusic(0.6);
    if (r.isRecord) Music.jingle('newRecord');
    Sound.play('over', 0.8);
    UI.over(r);
  },

  /* ---------- sistemas del nivel: avispas, contactos, objetos, cámara y caídas ---------- */
  /* avispas: aparecen por los laterales, fuera de la vista. Una a la vez (dos en dificultad alta) y con una pausa larga entre ellas */
  updateEnemies(dt) {
    const p = this.player, arr = this.enemies;
    for (let i = arr.length - 1; i >= 0; i--) {
      const e = arr[i], far = Math.abs(e.x - p.x);
      if (far > 1500) { arr.splice(i, 1); continue; }
      if (far < 1000 || e.fly) e.update(dt, this);
      if (!e.alive && e.dying <= 0) arr.splice(i, 1);
    }
  },
  /* contactos: pisotón (sólo cayendo sobre la cabeza) o daño; el escudo del golem se rompe con pisotones fuertes */
  updateContacts() {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dying > 0 || !e.alive || e.hidden) continue;
      const eb = e.box();
      if (!overlap(eb, p.box())) continue;
      const stomp = p.vy > 0 && p.prevFeet <= eb.y + 10;
      if (!stomp && !e.canTouch()) continue;
      if (stomp) this.stomp(e); else this.contact(e, e.x);
    }
    const b = this.boss;
    if (b && b.alive && b.dying <= 0 && b.contactable()) {
      const bb = b.box();
      if (overlap(bb, p.box())) {
        /* un pisotón por jefe cada 2 segundos: si se repite antes, no hay rebote ni daño (ni spam) */
        if (p.vy > 0 && p.prevFeet <= bb.y + 10 && performance.now() - (b.stompAt || -1e9) >= 2000) {
          b.stompAt = performance.now();
          if (b.kind === 'golem_blue' && b.shield > 0) { b.shield = Math.max(0, b.shield - 2); Feel.text(b.x, b.y - 70, b.shield > 0 ? 'Escudo ' + b.shield : '¡Escudo roto!', '#7af0ff'); }
          else this.hitBoss(b, 1, undefined);
          this.stompBoss();
        }   /* tocar el cuerpo del jefe no hace daño: su daño son sus golpes (espada, carga, pisotón) */
      }
    }
  },
  /* objetos: monedas, corazones, cofres (algunos imitan a un orco), mejoras y bonus */
  updatePickups(dt) {
    const p = this.player, run = this.run, arr = this.pickups;
    for (let i = arr.length - 1; i >= 0; i--) {
      const k = arr[i];
      k.update(dt);
      if (!overlap({ x: k.x - 8, y: k.y - 26, w: 16, h: 28 }, p.box())) {
        if (Math.abs(k.x - p.x) > 1400) arr.splice(i, 1);
        continue;
      }
      arr.splice(i, 1);
      if (k.kind === 'heart') { this.heal(1, k.x, k.y); run.hearts++; }
      else if (k.kind === 'halfheart') this.heal(0.5, k.x, k.y);
      else if (k.kind === 'energia') { Ramas.addPool(k.value); Feel.text(k.x, k.y - 24, '+' + k.value + ' ascendencia', '#7ff0ff'); Sound.play('coin', 0.6); }
      else if (k.kind === 'upgrade') this.collectUpgrade(k);
      else if (k.kind === 'material') { Craft.addMat(k.mat, 1); Feel.text(k.x, k.y - 24, '+1 ' + MAT_DEF[k.mat].name, MAT_DEF[k.mat].color); Sound.play(k.mat === 'oro' ? 'coin' : (MAT_DEF[k.mat].tier >= 2 ? 'rareMat' : 'pickup'), 0.5); }
    }
  },
  /* mejora recogida: se aplica una al azar (por rareza) y se avisa en pantalla */
  collectUpgrade(k) {
    if (!Upgrades.available(this).length) return;
    const u = Upgrades.pick(this, 1)[0];
    Upgrades.apply(u.id, this);
    Feel.ring(k.x, k.y - 12, 26, '#ffd34a', 0.5);
    Feel.burst(k.x, k.y - 12, 14, ['#fff3b0', '#ffd34a', '#c28a2c'], 110, 0.5);
    Feel.text(k.x, k.y - 40, '¡Mejora! ' + u.name, '#ffe7a6');
    Sound.play('checkpoint', 0.8);
    UI.flash('Mejora: ' + u.name + ' · ' + RARITY[u.rarity].name, u.rarity === 'epica' ? 'epic' : '');
  },
  /* cámara: horizontal con anticipación; vertical con una banda (si sales de ella, te sigue; al caer, baja contigo) */
  safeSpot() {
    const cx = this.camX + W * 0.4, cy = this.camY + H * 0.6;
    let best = null, bd = Infinity;
    for (const q of this.world.plats) {
      if (q.active === false || q.y > this.camY + H - 30 || q.y < this.camY + 20) continue;
      const xq = clamp(cx, q.x + 16, q.x + q.w - 16);
      const d = Math.abs(xq - cx) + Math.abs(q.y - cy) * 0.5;
      if (d < bd) { bd = d; best = { x: xq, y: q.y, plat: q }; }
    }
    return best || { x: cx, y: BASE_Y, plat: null };
  },
  fall() {
    const p = this.player;
    this.hurtPlayer(p.x, 'caída');
    if (p.hp > 0) {
      const s = this.safeSpot();
      Object.assign(p, { x: s.x, y: s.y, vx: 0, vy: 0, onGround: true, plat: s.plat, jumps: 0, prevFeet: s.y, inv: 1.6 });
      Feel.text(p.x, p.y - 50, '¡De vuelta!', '#9ee7ff');
    }
  },
  /* ---------- tirachinas: la bolita sale con el ángulo y la potencia que elige el jugador ---------- */
  /* proyectil de un personaje nuevo: flecha, orbe o llama; la misma recarga que el tirachinas (la pone el jugador) */
  fireCharShot(p, ang, pow, key, sub) {
    /* en el VS en red la habilidad no se sincroniza: sólo la bola. El entrenamiento es local, así que sí usa la habilidad */
    if (this.mode === 'versus' && !(typeof Versus !== 'undefined' && Versus.training)) return this.fireBall(p, ang, pow);
    /* nivel 5: dos proyectiles en abanico (la llamada externa lanza los dos; 'sub' evita el bucle) */
    if (key && !sub && SKILLS[key] && Craft.skillStats(key).multi > 1) { const first = this.fireCharShot(p, ang + 0.12, pow, key, true); this.fireCharShot(p, ang - 0.12, pow, key, true); return first; }
    const d = key ? (SKILLS[key] && Craft.skillStats(key)) : CHARACTERS[p.charId]; if (!d) return this.fireBall(p, ang, pow);
    const speed = d.speed * (0.8 + 0.3 * pow), o = Scene.slingOrigin(p);
    const s = this.spawnShot('ball', o.x, o.y, Math.cos(ang) * speed * p.face, -Math.sin(ang) * speed);
    s.owner = 'hero'; s.dmg = d.dmg; s.life = d.life; s.ox = o.x; s.oy = o.y; s.maxD = charRange(this); s.charShot = p.charId; s.look = d.shot; s.grav = d.grav || 0; s.bounces = d.bounces || 0; s.pierce = d.pierce || 0; s.fx = null; s.safeT = 0; s.col = (Craft.effectFor(d.shot === 'arrow' ? 'arrow' : 'fire') || {}).color; s.fxSet = (Craft.effectFor(d.shot === 'arrow' ? 'arrow' : 'fire') || {}).fx || null; if (d.shot === 'arrow') s.archer = true;
    Sound.play(d.shot === 'arrow' ? 'arrowShot' : 'fireCast', 0.6);
    return s;
  },
  fireBall(p, ang, pow) {
    if (this.mode === 'versus') return Versus.fire(p, ang, pow);
    const f = p.face, speed = (250 + 380 * pow) * (1 + ((this.ramas && this.ramas.ballSpeed) || 0)), n = this.mods.multi + (Math.random() < ((this.ramas && this.ramas.multi) || 0) ? 1 : 0);
    Sound.play('ballAir', 0.6);
    for (let i = 0; i < n; i++) {
      const a = ang + (n > 1 ? (i === 0 ? 0.12 : -0.12) : 0);
      const o = Scene.slingOrigin(p), b = new Shot('ball', o.x, o.y, Math.cos(a) * speed * f, -Math.sin(a) * speed, 2.6); b.fx = Craft.effectFor('sling'); b.fxSet = (b.fx || {}).fx || null;
      b.grav = PHYS.BALL_G; b.bounces = this.mods.bounces + (Math.random() < ((this.ramas && this.ramas.ballBounce) || 0) ? 1 : 0); b.safeT = 0;
      b.dmg = ((pow > 0.92 && Math.random() < this.mods.crit + 0.15) ? 2 : 1) + (Math.random() < ((this.ramas && this.ramas.ballDmg) || 0) ? 1 : 0);
      this.shots.push(b);
    }
    Sound.play('jump', 0.3);
  },
  explode(s) {
    if (s.kind === 'bomb') Sound.play('bombaCae', 0.7);
    const p = this.player;
    Feel.burst(s.x, s.y, 10, ['#ffb35c', '#23202e'], 90, 0.4); Feel.ring(s.x, s.y, 20, '#ffb35c', 0.3);
    if (Math.hypot(p.x - s.x, p.y - 8 - s.y) < 22) this.hurtPlayer(s.x, 'bomba');
    s.alive = false;
  },
  /* proyectiles: flechas, bombas, orbes, rocas y ondas; la bolita tiene su propio paso */
  updateShots(dt) {
    const p = this.player, arr = this.shots;
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      if (!s.alive) { arr.splice(i, 1); continue; }
      s.update(dt);
      if (s.kind === 'ball') { this.ballStep(s); if (!s.alive) arr.splice(i, 1); continue; }
      if (s.owner === 'hero') {
        let struck = false;
        for (const e of this.enemies) {
          if (e.dying > 0 || !e.alive || e.hidden || !overlap(s.box(), e.box())) continue;
          if (s.seen && s.seen.indexOf(e) >= 0) continue;
          if (e.blocksFrom(p.x) && s.kind === 'arrow') { this.shieldHit(e); }
          else { this.hitEnemy(e, s.dmg || 1, s.kind === 'arrow' ? 'arrow' : undefined); if (s.kind === 'ball') Sound.play('ballImpact', 0.7); else if (s.kind === 'arrow') Sound.play('flechaImpacta', 0.7); }
          struck = true; (s.seen = s.seen || []).push(e); break;
        }
        if (!struck && this.boss && this.boss.alive && this.boss.dying <= 0 && overlap(s.box(), this.boss.box())) { this.hitBoss(this.boss, s.dmg || 1, s.x); if (s.kind === 'ball') Sound.play('ballImpact', 0.7); struck = true; }
        if (struck) { if ((s.pierce || 0) > 0) s.pierce--; else s.alive = false; }
        if (s.life <= 0 || Math.abs(s.x - p.x) > 1400) s.alive = false;
        if (!s.alive) arr.splice(i, 1);
        continue;
      }
      if (!s.deflected && overlap(s.box(), p.box())) {
        if (s.kind === 'bomb') this.explode(s);
        else if (p.parryT > 0 && (p.face >= 0 ? s.x >= p.x - 2 : s.x <= p.x + 2)) { s.vx = -s.vx * 0.7; s.vy = -Math.abs(s.vy) - 90; s.deflected = true; Feel.ring(p.x + p.face * 22, p.y - 24, 22, '#59dfff', 0.2); Sound.play('checkpoint', 0.3); }
        else { this.hurtPlayer(s.x, s.kind === 'rock' ? 'roca' : (s.kind === 'arrow' ? 'flecha' : 'proyectil')); s.alive = false; s.hit = true; }
      }
      if (s.alive && (s.kind === 'bomb' || s.kind === 'rock')) {
        for (const q of this.world.plats) {
          if (q.active === false) continue;
          if (s.x > q.x && s.x < q.x + q.w && s.y >= q.y - 2 && s.y < q.y + 6 && s.vy > 0) {
            if (s.kind === 'bomb') this.explode(s); else { Feel.burst(s.x, s.y, 4, ['#8a8290'], 40, 0.3); s.alive = false; }
            break;
          }
        }
      }
      if (s.life <= 0 || Math.abs(s.x - p.x) > 1400) s.alive = false;
      if (!s.alive && s.kind === 'arrow' && s.owner !== 'hero' && !s.hit && !s.deflected) Sound.play('flechaFalla', 0.5);
      if (!s.alive) arr.splice(i, 1);
    }
  },
  /* la bolita rebota en el suelo (según mejoras), choca con enemigos y con el jefe; el escudo la devuelve */
  ballStep(s) {
    if (s.maxD && Math.hypot(s.x - s.ox, s.y - s.oy) > s.maxD) { s.alive = false; return; }
    if (s.safeT > 0) s.safeT -= 1 / 60;
    for (const q of this.world.plats) {
      if (q.active === false) continue;
      if (s.x > q.x && s.x < q.x + q.w && s.prevY <= q.y && s.y >= q.y && s.vy > 0) {
        if (s.bounces > 0) { s.bounces--; s.y = q.y; s.vy = -Math.abs(s.vy) * 0.42; s.vx *= 0.8; Feel.burst(s.x, s.y, 3, ['#cfd8e3'], 40, 0.2); Sound.play('land', 0.25); }
        else { Feel.burst(s.x, s.y, 5, ['#cfd8e3', '#8a8f9a'], 60, 0.25); s.alive = false; }
        return;
      }
    }
    for (const w of this.world.walls) if (Math.abs(s.x - w.x) < 3 && s.y > w.y0 && s.y < w.y1) { s.alive = false; return; }
    const box = { x: s.x - 4, y: s.y - 4, w: 8, h: 8 };
    if (s.safeT <= 0) for (const e of this.enemies) {
      if (e.dying > 0 || !e.alive || e.hidden || !overlap(box, e.box())) continue;
      if (s.seen && s.seen.indexOf(e) >= 0) continue;
      if (e.blocksBall(s.x, s.y)) {
        /* el escudo devuelve la bolita: se aparta y no vuelve a contar hasta que se separe */
        this.shieldHit(e); s.vx *= -0.35; s.vy = -160; s.x += Math.sign(s.vx || 1) * 6; s.safeT = 0.15; return;
      }
      this.spawnFx(s.fxSet || (s.look === 'arrow' ? 'frost' : s.look === 'fire' ? 'fire' : 'circle'), e.x, e.y - 12, false);
      this.hitEnemy(e, s.dmg, 'ball'); Sound.play(s.look === 'arrow' ? 'flechaImpacta' : s.look === 'orb' ? 'magicHit' : s.look === 'fire' ? 'fireHit' : 'ballImpact', 0.7); (s.seen = s.seen || []).push(e); if ((s.pierce || 0) > 0) { s.pierce--; return; } s.alive = false; return;
    }
    const b = this.boss;
    if (b && b.alive && b.dying <= 0 && overlap(box, b.box())) { this.spawnFx(s.fxSet || (s.look === 'arrow' ? 'frost' : s.look === 'fire' ? 'fire' : 'circle'), b.x, b.y - 40, false); this.hitBoss(b, s.dmg, s.x); Sound.play(s.look === 'arrow' ? 'flechaImpacta' : s.look === 'orb' ? 'magicHit' : s.look === 'fire' ? 'fireHit' : 'ballImpact', 0.7); s.alive = false; }
  },

  /* ---------- paso de simulación (60 veces por segundo) ---------- */
  update(dt) {
    if (this.deathWait && this.player && this.player.death && this.player.death.gone) { const r = this.deathWait; this.deathWait = null; this.finishDie(r); }
    if (this.mode === 'versus') { Versus.frame(dt); return; }
    if (this.state !== 'play') { Input.clearPress(); Ghosts.update(dt); Versus.uiTick(dt); return; }
    if (Input.pausePress) { Input.clearPress(); this.pause(); return; }
    const p = this.player, run = this.run;
    this.t += dt; run.t += dt;
    Feel.update(dt); Effects.update(dt);
    this.updateParry(dt);
    if (this.mods.shieldRegen) {
      this.shieldCd -= dt;
      if (this.shieldCd <= 0) { this.shield.charges = Math.max(this.shield.charges, 1); this.shieldCd = 20; Feel.text(p.x, p.y - 50, '¡Escudo listo!', '#9ee7ff'); }
    }
    /* 1) jugador: física, tirachinas y golpe */
    p.update(dt, this);
    /* ventana de impacto: el golpe se revisa en toda su parte activa, no en un solo instante */
    if (p.atk > 0 && p.atk < (p.atkDur || 0.27) * 0.75 && p.atk > (p.atkDur || 0.27) * 0.12) { if (!p.swingDone) { p.swingDone = true; p.swingHits = []; p.rangedFired = false; } this.swing(); }
    if (p.x > run.maxX) run.maxX = p.x;
    /* 2) oleadas: aparición de enemigos, descanso y jefe */
    Waves.update(this, dt);
    /* 3) enemigos, jefe, proyectiles, contactos y objetos */
    this.updateEnemies(dt);
    this.resolveParry();
    if (this.boss) {
      this.boss.hurtT = Math.max(0, (this.boss.hurtT || 0) - dt); this.boss.flashT = Math.max(0, (this.boss.flashT || 0) - dt);
      if (this.boss.intro > 0) this.boss.intro -= dt;
      else { this.boss.update(dt, this); if (!this.boss.alive) this.bossDefeated(); }
    }
    if (this.bossIntro && this.bossIntro.t > 0) this.bossIntro.t -= dt;
    this.updateShots(dt);
    this.updatePuddles(dt);
    this.updateFx(dt);
    this.updateContacts();
    this.updatePickups(dt);
    /* 4) cámara fija del bastión y caídas */
    this.camX = this.world.arena.x + this.world.arena.w / 2 - W / 2; this.camY = 0;
    if (p.y > Math.min(380, this.camY + H + 40)) this.fall();
    /* 5) puntuación de oleadas y guardado automático */
    run.score = (this.waves ? this.waves.n : 0) * 100 + run.kills * 10 + run.extra;
    run.autoT += dt;
    if (run.autoT >= APP_CONFIG.autosaveSec) { run.autoT = 0; if (Auth.user) CloudSave.saveProgress().catch(() => { }); }
    Input.clearPress();
  },

  /* ---------- dibujo: mundo con desplazamiento, luego HUD en el lienzo ---------- */
  render(dt) {
    /* partida en curso (también en pausa): en vertical se muestra el aviso de girar y la partida se pausa */
    const inplay = this.state === 'play' || this.state === 'paused', vert = innerHeight > innerWidth;
    if (inplay !== this._inplay) { this._inplay = inplay; document.body.classList.toggle('inplay', inplay); }
    if (vert !== document.body.classList.contains('vertical')) document.body.classList.toggle('vertical', vert);
    if (vert && this.state === 'play') this.pause();
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.frame++;
    if (!this.heroStrips && this.frame % 20 === 0) this.refreshHeroStrips();
    if (this.mode === 'versus') { Versus.render(ctx); return; }
    if (this.state === 'menu' || !this.run) { this.renderMenuScene(); return; }
    const [ox, oy] = Feel.offset(this.t);
    const camX = this.camX, camY = this.camY;
    ctx.save();
    ctx.translate(Math.round(ox), Math.round(oy));
    Versus.drawBackdrop(ctx, this.world.map);
    ctx.translate(-Math.round(camX), 0);
    Versus.drawIsland(ctx, camY, this.world.map, this.world.plats);
    const xa = camX - 60, xb = camX + W + 60;
    for (const k of this.pickups) if (k.x > xa && k.x < xb) Scene.drawPickup(ctx, k, camY, this.t);
    for (const e of this.enemies) if (e.x > xa && e.x < xb) Scene.drawEnemy(ctx, e, camY);
    if (this.boss) Scene.drawBoss(ctx, this.boss, camY, this.t);
    for (const q of (this.puddles || [])) {
      const a = Math.min(1, q.t) * (0.75 + 0.25 * Math.sin(performance.now() / 180));
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(120,230,60,0.55)'; ctx.beginPath(); ctx.ellipse(Math.round(q.x), Math.round(q.y - camY), 24, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b8ff5a'; ctx.beginPath(); ctx.ellipse(Math.round(q.x), Math.round(q.y - camY) - 1, 16, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    this.drawFx(ctx, camY);
    for (const s of this.shots) if (s.x > xa && s.x < xb) Scene.drawShot(ctx, s, camY);
    Scene.drawPlayer(ctx, this.player, camY, this.heroStrips);
    Scene.drawParry(ctx, this.player, camY);
    Scene.drawSling(ctx, this.player, camY, this.world.plats);
    Feel.draw(ctx, camY); Effects.draw(ctx, camY);
    ctx.restore();
    Hud.draw(ctx, this);
  },
  renderMenuScene() {
    const ctx = this.ctx;
    const art = { biome: BIOMES.bosque, variant: BIOMES.bosque.variants[0] };
    this.t += 1 / 60;
    Backdrop.draw(ctx, this.t * 14, 0, this.t, art, art, 1);
    /* luciérnagas sobre el bosque (el duelo está en el panel, no hace falta un personaje en el fondo) */
    if (!this._fly) this._fly = Array.from({ length: 34 }, () => ({ x: Math.random() * 600, y: 40 + Math.random() * 200, p: Math.random() * 6.28, s: 0.6 + Math.random() * 0.8 }));
    ctx.fillStyle = '#ffe9a0';
    for (const f of this._fly) {
      const x = (f.x + this.t * 6 * f.s) % 600, y = f.y + Math.sin(this.t * 1.3 + f.p) * 8;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.t * 2.2 + f.p);
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    ctx.globalAlpha = 1;
    /* velo nocturno: los bordes se oscurecen para que el menú y el duelo destaquen */
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(4,8,18,0)'); g.addColorStop(1, 'rgba(4,8,18,0.72)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
};

/* arranque cuando el documento está listo */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => G.init());
else G.init();
