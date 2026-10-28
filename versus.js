'use strict';
/* =====================================================================
   ASCENSO 4.7 · VS: partidas de 2 o 3 jugadores en una isla flotante, estilo Brawlhalla.
   · Salas públicas: el anfitrión elige el tamaño (1 contra 1 o 1 contra 1 contra 1) y si
     lleva contraseña. Las salas se anuncian en la lista (lobby.js) y se unen desde la lista
     o con el código.
   · El invitado manda su contraseña; el anfitrión responde con bienvenida (con su asiento y
     la lista de jugadores) o con rechazo. La contraseña nunca se anuncia.
   · Asientos: 0 = anfitrión (isla, izquierda) · 1 = invitado (isla, derecha) ·
     2 = tercer jugador (plataforma de arriba, en el centro).
   · Cada ronda empieza con una cuenta de 5 a 0. Gana la ronda quien queda en pie el último;
     si caen todos a la vez, es empate. Gana la partida quien llega antes a las victorias.
     Si alguien sale de la partida, los demás vuelven a la sala.
   · Cada cual simula su propio personaje. Quien golpea avisa al rival (espada o bola) y
     quien lo recibe aplica el daño en su pantalla.
   ===================================================================== */
const ARENA = {
  CX: 400, HALF: 222, TOP: 140, THICK: 96, PAD: 34, DOCK: 40, PLAT_W: 180, PLAT_Y: 72,   /* isla: centro, media anchura, superficie, roca, margen, esquinas, plataforma */
  HEARTS: 6,                          /* corazones por ronda: cada caída o golpe quita uno */
  DEATH_Y: 300,                       /* por debajo de esto el personaje queda fuera */
  ROUND_LEN: 6,                       /* cuenta 5, 4, 3, 2, 1, 0 (un segundo por número) */
  WIN_T: 2.4, END_T: 3.4,             /* aviso de ronda (WIN / KO / EMPATE) y de partida (GANADOR / DERROTA) */
  START_CD: 7,                        /* segundos de espera entre pulsaciones de INICIAR */
  ROUND_OPTS: [2, 3, 4, 5], DEFAULT_ROUNDS: 4,
  SEND_HZ: 8,                         /* posición al rival: sólo si cambia, como mucho 8 veces por segundo */
  KO_RESEND: 0.6, KO_TRIES: 8,        /* el resultado de un KO se reenvía hasta que el anfitrión responde */
  JOIN_WAIT: 5                        /* segundos que espera el invitado la bienvenida del anfitrión */
};
const clampRounds = n => (ARENA.ROUND_OPTS.indexOf(+n) >= 0 ? +n : ARENA.DEFAULT_ROUNDS);
const clampScore = n => (isNum(n, 0, 9) ? Math.floor(n) : 0);
const clampMode = n => (+n === 3 ? 3 : 2);
const hostIn = list => (list || []).some(x => x && x.host);
const lookOf = cfg => ['skin', 'hair', 'shirt', 'cape', 'pants'].map(k => (cfg && cfg[k]) | 0);
const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const shuffled = a => a.slice().sort(() => Math.random() - 0.5);
const TEAM_COLORS = ['verde', 'rojo', 'amarillo', 'azul'];
const TEAM_PAIRS = [['verde', 'rojo'], ['amarillo', 'azul']];
const TEAM_RAMP = { verde: ['#1d5e2a', '#3fae4e', '#c9f5a0'], rojo: ['#5c1212', '#d63a3a', '#ffc2b5'],
  amarillo: ['#6b5200', '#f2c200', '#fff6b0'], azul: ['#122f63', '#3a86e0', '#cdeaff'] };
const TEAM_LIGHT = { verde: '#9cf07a', rojo: '#ff8a7a', amarillo: '#ffe04a', azul: '#7fc4ff' };
/* la lista de asientos: de 1 a 3 jugadores con id único; si no es válida, null */
const cleanOrder = list => {
  if (!Array.isArray(list) || list.length < 1 || list.length > 3) return null;
  const out = [], seen = new Set();
  for (const x of list) {
    if (!x || typeof x.id !== 'string' || !x.id || seen.has(x.id)) return null;
    seen.add(x.id);
    out.push({ id: x.id.slice(0, 64), name: String(x.name || 'jugador').slice(0, 16) });
  }
  return out;
};

const Versus = {
  phase: 'off',           /* off · joining (espera la bienvenida) · room (sala) · arena (partida) */
  role: null,             /* 'host' (crea la sala) · 'guest' (entra) */
  code: '', pwd: '', sentPwd: '', pendingCode: '', createPwd: false, joinFrom: 'code',
  mode: 2,                /* jugadores de la sala: 2 o 3 */
  createMode: 2,          /* lo que elige el anfitrión en CREAR SALA */
  order: [],              /* asientos: [0] anfitrión y luego los invitados por orden de entrada */
  mySeat: 0,
  colors: null, myColor: '', rivalColor: '', training: false,
  mapId: 'normal', createMap: 'normal', bgCache: null,
  rounds: ARENA.DEFAULT_ROUNDS,
  sub: 'idle',            /* count · fight · ko · rend · wait · over */
  timer: 0, round: 0, score: [0, 0],
  banner: null,           /* aviso grande en pantalla: {a, b, col} */
  startUntil: 0, msg: '', uiT: 0, listT: 0, joinT: 0,
  prevAtk: 0, sendT: 0, lastSig: '', koT: 0, koTries: 0,
  alive: [],              /* (anfitrión) asientos que siguen en pie en la ronda */
  rendRound: -1, lastRend: null, bidN: 0,
  world: null, islandCv: null,

  /* el primer rival (en 1 contra 1, el único), o null */
  get rival() { return this.rivalsList()[0] || null; },

  reset() {
    clearTimeout(this.joinT);
    Object.assign(this, { phase: 'off', role: null, code: '', pwd: '', sentPwd: '', sub: 'idle', timer: 0,
      round: 0, score: [0, 0], banner: null, msg: '', prevAtk: 0, sendT: 0, lastSig: '', koT: 0, koTries: 0,
      rendRound: -1, lastRend: null, rounds: ARENA.DEFAULT_ROUNDS, joinT: 0, colors: null, myColor: '', rivalColor: '',
      mode: 2, order: [], mySeat: 0, alive: [] });
  },

  /* ---------- pantallas de entrada: menú, crear sala, unirse ---------- */
  openMenu(msg) { G.screen = 'vs'; UI.vsMenu(msg || ''); },
  openCreate(msg) { G.screen = 'vsCreate'; this.createPwd = false; UI.vsCreate(msg || ''); },
  openBrowse(msg) { G.screen = 'vsBrowse'; Lobby.open(); UI.vsBrowse(msg || ''); },
  openCode(msg) { G.screen = 'vsJoin'; Lobby.open(); UI.vsJoin(msg || ''); },
  note(text) { this.msg = text || ''; const el = document.getElementById('vsMsg'); if (el) el.textContent = this.msg; },
  setCreateMode(n) {
    this.createMode = clampMode(n);
    document.querySelectorAll('[data-act="vsMode"]').forEach(b => b.classList.toggle('primary', +b.dataset.m === this.createMode));
  },
  setPwdMode(m) {
    this.createPwd = !!m;
    document.querySelectorAll('[data-act="vsPwdMode"]').forEach(b => b.classList.toggle('primary', +b.dataset.m === (this.createPwd ? 1 : 0)));
    const inp = document.getElementById('vsNewPwd');
    if (inp) { inp.disabled = !this.createPwd; if (this.createPwd) inp.focus(); }
  },
  createGo() {
    if (this.phase !== 'off') return;
    let pwd = '';
    if (this.createPwd) {
      const el = document.getElementById('vsNewPwd');
      pwd = String((el && el.value) || '').replace(/\s/g, '');
      if (pwd.length < 4 || pwd.length > 12) { this.note('La contraseña tiene entre 4 y 12 caracteres.'); return; }
    }
    this.enter(Net.newRoomCode(), pwd);
  },

  /* ---------- crear y entrar ---------- */
  async enter(code, pwd) {
    this.note('Creando la sala ' + code + '…');
    const me = Object.assign({}, G.me, { host: true, look: lookOf(store.get('hero', HERO_DEFAULT_CFG)) });
    const mode = this.createMode;
    const res = await Net.join(Net.roomFor(code), mode, me);
    if (!res.ok) { this.note(res.msg || 'No se pudo crear la sala.'); return; }
    Object.assign(this, { phase: 'room', role: 'host', code, pwd: pwd || '', rounds: this.rounds, msg: '', mode, mapId: this.createMap,
      order: [{ id: G.me.id, name: G.me.name }], mySeat: 0 });
    G.screen = 'vsRoom';
    Lobby.open();
    Lobby.setHost(this.hostInfo());
    this.onPresence(Net.list);
    this.refresh();
  },
  joinCode() {
    const el = document.getElementById('vsCode');
    const code = normCode(el && el.value);
    if (code.length < 4) { this.note('Escribe el código de la sala (4 o 5 letras y números).'); return; }
    this.askOrJoin(code, false, 'code');
  },
  rowJoin(code, pwd) { this.askOrJoin(normCode(code), pwd === '1', 'browse'); },
  askOrJoin(code, known, from) {
    const r = Lobby.rooms.get(code);
    this.joinFrom = from || 'code';
    if (known || (r && r.pwd)) { this.pendingCode = code; G.screen = 'vsPwd'; UI.vsPwd(code, ''); return; }
    this.join(code, '');
  },
  joinPwd() { const el = document.getElementById('vsPwdIn'); this.join(this.pendingCode, String((el && el.value) || '')); },
  backScreen() { return this.joinFrom === 'browse' ? 'vsBrowse' : 'vsJoin'; },
  async join(code, pwd) {
    if (this.phase !== 'off') return;
    this.note('Entrando a la sala ' + code + '…');
    const me = Object.assign({}, G.me, { host: false, look: lookOf(store.get('hero', HERO_DEFAULT_CFG)) });
    const res = await Net.join(Net.roomFor(code), 3, me);     /* el anfitrión decide si cabe: la sala puede ser de 2 o 3 */
    if (!res.ok) { this.note(res.msg || 'No se pudo entrar a la sala.'); return; }
    if (!hostIn(Net.list)) { await Net.leave(); this.note('No hay ninguna sala abierta con ese código.'); return; }
    Object.assign(this, { phase: 'joining', role: 'guest', code, sentPwd: pwd || '', pendingCode: code, msg: '' });
    const back = this.backScreen();
    this.joinT = setTimeout(() => { if (this.phase === 'joining') this.leaveRoom('El anfitrión no respondió.', back); }, ARENA.JOIN_WAIT * 1000);
    this.send({ ev: 'hello', id: G.me.id, name: G.me.name, pwd: pwd || '' });
    this.onPresence(Net.list);
  },
  /* sale de la sala y vuelve a una pantalla de entrada (con un aviso opcional) */
  async leaveRoom(msg, screen) {
    Sound.stopAll(['click']);   /* salir de la sala corta los efectos de la sala */
    const code = this.code;
    this.restoreLook();
    if (this.role === 'host') Lobby.clearHost(code);
    this.reset();
    this.msg = msg || '';
    G.mode = 'solo'; G.inputLocked = false; G.shots = []; G.state = 'menu';
    UI.showHud(false);
    await Net.leave();
    Music.play('menu', { fade: 0.6 });
    if (screen === 'vsPwd') { this.pendingCode = code; G.screen = 'vsPwd'; UI.vsPwd(code, msg || ''); }
    else if (screen === 'vsBrowse') this.openBrowse(msg || '');
    else if (screen === 'vsJoin') this.openCode(msg || '');
    else this.openMenu(msg || '');
  },

  /* ---------- asientos y sala: quién está dentro ---------- */
  rivalsList() { return this.order.map((x, i) => ({ id: x.id, name: x.name, seat: i })).filter(x => x.id !== G.me.id); },
  seatOf(id) { return this.order.findIndex(x => x.id === id); },
  /* dónde aparece cada asiento: anfitrión a la izquierda, invitado a la derecha, el tercero en la plataforma */
  spawnPoint(seat) {
    const g = VsGeo.of(this.mapId), sp = g.spawns[seat] || g.spawns[0];
    return { x: sp.x, y: g.isl.y, face: sp.face };
  },
  hostInfo() { return { code: this.code, host: G.me.name, rounds: this.rounds, pwd: this.pwd ? 1 : 0, players: Math.max(1, this.order.length), mode: this.mode, mapId: this.mapId }; },
  view() {
    const row = Lobby.rooms.get(this.code);
    return { code: this.code, role: this.role, rounds: this.rounds, mode: this.mode, map: this.mapId,
      locked: !!this.pwd || !!(row && row.pwd),
      names: this.order.map(x => x.name), rivals: this.rivalsList().map(r => r.name),
      full: this.order.length === this.mode,
      cd: Math.max(0, Math.ceil((this.startUntil - Date.now()) / 1000)), msg: this.msg };
  },
  startLabel(v) {
    if (this.role !== 'host') return 'Esperando al anfitrión…';
    if (!v.full) return 'INICIAR · esperando ' + (v.mode - v.names.length === 1 ? 'a 1 más' : 'a ' + (v.mode - v.names.length));
    return v.cd > 0 ? 'INICIAR · ' + v.cd + ' s' : 'INICIAR';
  },
  refresh() { if (G.screen === 'vsRoom' && this.phase === 'room') UI.vsRoom(this.view()); },
  roomRows() { return [...Lobby.rooms.values()].sort((a, b) => (a.code < b.code ? -1 : 1)); },
  /* la lista de salas se refresca sin volver a dibujar la pantalla; el botón INICIAR muestra su cooldown */
  uiTick(dt) {
    if (G.screen === 'vsBrowse') { this.listT += dt; if (this.listT >= 1) { this.listT = 0; UI.vsList(this.roomRows()); } return; }
    if (G.screen !== 'vsRoom' || this.phase !== 'room') return;
    this.uiT += dt; if (this.uiT < 0.25) return; this.uiT = 0;
    const btn = document.getElementById('vsStart'); if (!btn) return;
    const v = this.view();
    btn.textContent = this.startLabel(v);
    btn.disabled = !(this.role === 'host' && v.full && v.cd === 0);
  },
  onPresence(list) {
    if (!this.role || !Array.isArray(list)) return;
    const ids = new Set(list.map(x => x.id)), meId = G.me.id;
    if (this.role === 'guest' && !hostIn(list)) {
      this.leaveRoom('El anfitrión salió de la sala.', this.phase === 'joining' ? this.backScreen() : 'vs');
      return;
    }
    if (this.role === 'host') {
      const n = this.order.length;
      this.order = this.order.filter(x => x.id === meId || ids.has(x.id));
      if (this.order.length !== n) {
        this.sendRoster();
        if (this.phase === 'arena') { this.toRoom('Un rival salió de la partida.'); return; }
      }
      Lobby.setHost(this.hostInfo());
    } else if (this.phase === 'arena' && this.order.some(x => x.id !== meId && !ids.has(x.id))) {
      this.toRoom('Un rival salió de la partida.');
      return;
    }
    this.syncGhosts();
    this.refresh();
  },
  /* en pantalla sólo aparecen los rivales que tienen asiento en la partida */
  syncGhosts() {
    if (!Net.list) return;
    Ghosts.setPresence(Net.list.filter(p => p.id !== G.me.id && this.order.some(o => o.id === p.id)));
  },
  setRounds(n) {
    if (this.role !== 'host' || this.phase !== 'room') return;
    this.rounds = clampRounds(n);
    this.send({ ev: 'cfg', id: G.me.id, rounds: this.rounds });
    Lobby.setHost(this.hostInfo());
    this.refresh();
  },
  start() {
    if (this.role !== 'host' || this.phase !== 'room') return;
    if (this.order.length < this.mode) { this.note(this.mode === 3 ? 'Espera a que entren tus dos rivales.' : 'Espera a que entre tu rival.'); return; }
    if (Date.now() < this.startUntil) return;
    this.startUntil = Date.now() + ARENA.START_CD * 1000;
    this.round = 1; this.score = this.order.map(() => 0);
    if (this.mode === 3) this.colors = shuffled(TEAM_COLORS).slice(0, 3);   /* tres equipos distintos */
    else {
      const pair = TEAM_PAIRS[Math.floor(Math.random() * TEAM_PAIRS.length)];
      this.colors = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];   /* [anfitrión, invitado] */
    }
    this.enterArena();
    this.sendRound();
    this.beginCount();
  },

  /* ---------- la isla: física, cámara y mundo propio de la partida ---------- */
  /* el mundo de la partida: la isla principal y las dos plataformas, según el mapa */
  buildWorld(id) {
    const g = VsGeo.of(id);
    const isl = { id: 'isla', x: g.isl.x0, y: g.isl.y, w: g.isl.x1 - g.isl.x0, h: 40, kind: 'grass', style: 0, active: true, decor: null };
    const plats = g.plats.map((p, i) => ({ id: 'alto' + i, x: p.x0, y: p.y, w: p.x1 - p.x0, h: 8, kind: 'grass', style: 0, active: true, decor: null, oneWay: true }));
    return { map: g.id, plats: [isl].concat(plats), walls: [], env: null, arena: null, arenaLocked: true };
  },
  /* el mapa que llega de la red: un valor no válido o una sincronización fallida cargan el mapa normal */
  applyMap(id) {
    const v = vsMapId(id);
    if (v === this.mapId) return;
    this.mapId = v; this.bgCache = null;
    if (this.phase === 'room' && G.screen === 'vsRoom') this.refresh();
  },
  /* el anfitrión elige un mapa en la sala: todos lo ven al instante */
  pickMap(id) {
    if (this.role !== 'host' || this.phase !== 'room') return;
    this.applyMap(id);
    this.send({ ev: 'map', id: G.me.id, map: this.mapId });
    Lobby.setHost(this.hostInfo());
    this.refresh();
  },
  /* antes de crear la sala: se marca la tarjeta elegida sin volver a dibujar la pantalla */
  setCreateMap(id) {
    this.createMap = vsMapId(id);
    document.querySelectorAll('.mapCard').forEach(b => { const on = b.dataset.id === this.createMap; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  },
  /* fondo del mapa: se recorta a la pantalla lógica y se guarda para no repetir el trabajo cada cuadro */
  drawBackdrop(ctx, id) {
    const g = VsGeo.of(id || this.mapId), im = Img.get(g.art.fondo), ok = Img.ready(im);
    const key = g.id + ':' + W + 'x' + H + ':' + ok;
    if (!this.bgCache || this.bgCache.key !== key) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      if (ok) { const k = Math.max(W / im.width, H / im.height), dw = im.width * k, dh = im.height * k; c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); }
      this.bgCache = { key, cv, ok };
    }
    if (this.bgCache.ok) ctx.drawImage(this.bgCache.cv, 0, 0);
    else { const art = { biome: BIOMES.cielo, variant: BIOMES.cielo.variants[0] }; Backdrop.draw(ctx, ARENA.CX - W / 2, 0, G.t, art, art, 1); }
  },
  /* miniatura de un mapa para su tarjeta: el fondo y la isla, en pequeño. Devuelve true si ya estaban cargadas */
  paintThumb(cv, id) {
    const g = VsGeo.of(id), c = cv.getContext('2d'), w = cv.width, h = cv.height;
    const fb = Img.get(g.art.fondo), ib = Img.get(g.art.isla);
    if (Img.ready(fb)) { const k = Math.max(w / fb.width, h / fb.height); c.drawImage(fb, (w - fb.width * k) / 2, (h - fb.height * k) / 2, fb.width * k, fb.height * k); }
    if (Img.ready(ib)) { const k = (w * 0.92) / ib.width, dw = ib.width * k, dh = ib.height * k; c.drawImage(ib, (w - dw) / 2, h - dh - 2, dw, dh); }
    return Img.ready(fb) && Img.ready(ib);
  },
  /* plataforma lisa encima de la isla: se atraviesa desde abajo y se pisa desde arriba */
  /* cada cual toma el uniforme de su equipo; los rivales, el de los suyos; al salir se vuelve al aspecto propio */
  applyColors() {
    if (!this.colors) return;
    this.myColor = this.colors[this.mySeat] || '';
    G.heroStrips = artFor(store.get('char', 'hero')).teamStrips(this.myColor) || G.heroStrips;
    Ghosts.forceStrips = {}; Ghosts.labelColors = {};
    for (const r of this.rivalsList()) {
      const c = this.colors[r.seat] || '';
      Ghosts.forceStrips[r.id] = HeroArt.teamStrips(c);
      Ghosts.labelColors[r.id] = TEAM_LIGHT[c] || null;
    }
    const first = this.rivalsList()[0];
    this.rivalColor = first ? (this.colors[first.seat] || '') : '';
  },
  restoreLook() { this.myColor = ''; this.rivalColor = ''; G.refreshHeroStrips(); Ghosts.forceStrips = {}; Ghosts.labelColors = {}; },
  zoom() { return Math.min(1, (W - 24) / (ARENA.HALF * 2)); },   /* en pantallas estrechas la vista se aleja para que quepa toda la isla */
  enterArena() {
    if (!this.world || this.world.map !== this.mapId) this.world = this.buildWorld(this.mapId);
    this.world.platT = 0; this.world.cycle = !this.training;   /* cada ronda empieza el ciclo de las repisas desde cero */
    this.phase = 'arena';
    G.mode = 'versus'; G.state = 'play'; G.world = this.world;
    G.enemies = []; G.shots = []; G.pickups = []; G.boss = null;
    G.camX = ARENA.CX - W / 2; G.camY = 0;
    G.screen = 'arena';
    UI.hide(); UI.showHud(true);
    Music.play('map_' + (this.mapId || 'normal'), { fade: 0.6 });
    this.prevAtk = 0; this.sendT = 1; this.lastSig = ''; this.rendRound = -1; this.lastRend = null;
  },
  /* cada ronda: cada cual a su sitio, sin entrada hasta el final de la cuenta */
  beginCount() {
    this.sub = 'count'; this.timer = 0; this.banner = null; this.prevAtk = 0; this.koT = 0; this.koTries = 0;
    G.inputLocked = true; G.shots = [];
    if (this.role === 'host') this.alive = this.order.map((_, i) => i);
    const p = G.player, sp = this.spawnPoint(this.mySeat);
    p.reset(sp.x, sp.y);
    p.face = sp.face; p.hp = ARENA.HEARTS; p.maxHp = ARENA.HEARTS;
    for (const r of this.rivalsList()) { const q = this.spawnPoint(r.seat); Ghosts.snap(r.id, q.x, q.y, q.face); }
    this.applyColors();
  },
  sendRound() { this.send({ ev: 'round', id: G.me.id, round: this.round, sc: this.score.slice(), rounds: this.rounds, colors: this.colors || [], map: this.mapId }); },
  onRound(m) {
    if (this.role !== 'guest' || !isNum(m.round, 1, 99) || !Array.isArray(m.sc)) return;
    if (m.map) this.applyMap(m.map);
    this.rounds = clampRounds(m.rounds);
    const cols = Array.isArray(m.colors) ? m.colors.map(String) : [];
    if (cols.length >= 2 && cols.length === this.order.length) this.colors = cols;
    if (this.phase === 'arena' && m.round === this.round && (this.sub === 'count' || this.sub === 'fight')) return;
    if (this.phase !== 'arena') this.enterArena();
    this.round = m.round; this.score = this.order.map((_, i) => clampScore(m.sc[i]));
    this.beginCount();
  },

  /* ---------- bucle de la partida (60 veces por segundo) ---------- */
  frame(dt) {
    Ghosts.update(dt);
    if (this.world) Platforms.step(this.world, G.state === 'play' ? dt : 0, Platforms.vsBodies());
    if (G.state === 'play') this.step(dt);
    Input.clearPress();
  },
  step(dt) {
    if (Input.pausePress) { Input.clearPress(); G.pause(); return; }
    const p = G.player;
    G.t += dt; this.timer += dt;
    Feel.update(dt); Effects.update(dt);
    p.update(dt, G);
    G.updateParry(dt, 'vs');
    if (p.atk > 0 && this.prevAtk <= 0) this.send({ ev: 'swing', id: G.me.id, fx: (Craft.effectFor('sword') || {}).id || '' });
    /* ventana de impacto: el golpe se revisa en toda su parte activa, no en un solo instante */
    if (p.atk > 0 && p.atk < (p.atkDur || 0.27) * 0.75 && p.atk > (p.atkDur || 0.27) * 0.12) { if (!p.swingDone) { p.swingDone = true; p.swingHits = []; p.rangedFired = false; } this.swing(); }
    this.prevAtk = p.atk;
    this.updateShots(dt);
    if (this.training) Trainer.tick(dt);   /* el bot del entrenamiento actúa como un rival de red */
    this.roundTick(dt);
    this.sendState(dt);
  },
  roundTick(dt) {
    const p = G.player;
    switch (this.sub) {
      case 'count':
        if (this.timer >= ARENA.ROUND_LEN) { this.sub = 'fight'; this.timer = 0; G.inputLocked = false; }
        break;
      case 'fight':
        if (p.hp <= 0) this.localKo();
        else if (p.y > ARENA.DEATH_Y) this.localFall();
        break;
      case 'ko':
        if (this.role === 'guest' && this.koTries < ARENA.KO_TRIES) {
          this.koT += dt;
          if (this.koT >= ARENA.KO_RESEND) { this.koT = 0; this.sendKo(); }
        }
        break;
      case 'rend':
        if (this.timer >= ARENA.WIN_T) {
          if (this.role === 'host') { this.round++; this.sendRound(); this.beginCount(); }
          else { this.sub = 'wait'; this.timer = 0; }
        }
        break;
      case 'over':
        if (this.timer >= ARENA.END_T) this.toRoom('');
        break;
    }
  },
  /* vuelta a la sala: al terminar la partida, o cuando un rival sale */
  toRoom(msg) {
    if (this.phase === 'off') return;
    this.phase = 'room'; this.sub = 'idle'; this.banner = null;
    G.mode = 'solo'; G.inputLocked = false; G.shots = []; G.state = 'menu'; G.screen = 'vsRoom';
    this.restoreLook();
    UI.showHud(false);
    Music.play('menu', { fade: 0.6 });
    this.note(msg || '');
    this.refresh();
  },
  /* el que sale de la partida avisa a los demás: todos vuelven a la sala */
  quitMatch() {
    Sound.stopAll(['click']);   /* abandonar la partida corta sus efectos */
    if (this.phase !== 'arena') return;
    if (this.training) { this.trainEnd(); return; }
    this.send({ ev: 'quit', id: G.me.id });
    this.toRoom('');
  },
  /* los mensajes de la partida: en el entrenamiento van al bot; en una sala, a la red */
  send(m) { if (this.training) { Trainer.onPlayerMsg(m); return; } Net.send(m); },
  /* ENTRENAMIENTO: una partida sin fin contra el bot, sin conexión ni ranking */
  trainStart() {
    if (this.phase !== 'off' || this.training) return;
    this.training = true; this.role = 'host'; this.code = 'ENTRENO'; this.pwd = ''; this.mode = 2; this.rounds = 999;
    this.order = [{ id: G.me.id, name: G.me.name }, { id: TRAIN_ID, name: 'Entrenador' }]; this.mySeat = 0;
    this.round = 1; this.score = [0, 0];
    const pair = TEAM_PAIRS[Math.floor(Math.random() * TEAM_PAIRS.length)];
    this.colors = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
    this.mapId = 'entrenamiento'; this.bgCache = null;   /* el entrenamiento tiene su propia isla */
    Trainer.start();
    this.enterArena();
    this.sendRound();
    this.beginCount();
  },
  trainEnd() {
    Trainer.stop();
    this.training = false;
    this.restoreLook();
    this.reset();
    G.mode = 'solo'; G.inputLocked = false; G.shots = []; G.state = 'menu';
    UI.showHud(false);
    Music.play('menu', { fade: 0.6 });
    this.openMenu('');
  },

  /* ---------- KO y resultado de la ronda ---------- */
  localKo() {
    if (this.sub !== 'fight') return;
    this.sub = 'ko'; this.timer = 0; this.koT = 0; this.koTries = 0; G.inputLocked = true;
    this.banner = { a: 'KO', b: '', col: '#ff6b7a' };
    Death.start(G.player, this.world && this.world.plats);
    Sound.play(hurtKey(), 0.9);
    if (this.role === 'host') this.killSeat(this.mySeat);
    this.sendKo();   /* el anfitrión también avisa: los invitados ven caer su personaje */
  },
  /* caer fuera de la isla quita un corazón; con el doble salto se puede volver antes de caer del todo */
  localFall() {
    if (this.sub !== 'fight') return;
    const p = G.player;
    p.hp = Math.max(0, p.hp - 1);
    Sound.play(hurtKey(), 0.7);
    Feel.text(p.x, ARENA.TOP - 40, '-1', '#ff8a96');
    if (p.hp <= 0) { this.localKo(); return; }
    this.respawn();
  },
  respawn() {
    const p = G.player, sp = this.spawnPoint(this.mySeat);
    p.x = sp.x; p.y = sp.y - 30; p.vx = 0; p.vy = 0; p.onGround = false; p.plat = null; p.jumps = 0;
    p.stun = 0; p.inv = 1.5; p.sl.on = false; p.shotCd = 0;
  },
  sendKo() { this.send({ ev: 'ko', id: G.me.id, round: this.round }); this.koTries++; },
  /* el anfitrión lleva la cuenta de quién sigue en pie */
  onRivalKo(m) {
    if (this.role !== 'host' || m.round !== this.round) return;
    const seat = this.seatOf(m.id);
    if (seat < 0) return;
    if (this.sub === 'fight' || this.sub === 'ko') this.killSeat(seat);
    else if (this.lastRend && (this.sub === 'rend' || this.sub === 'over')) this.send(this.lastRend);
  },
  killSeat(seat) {
    if (this.role !== 'host' || (this.sub !== 'fight' && this.sub !== 'ko')) return;
    this.alive = this.alive.filter(s => s !== seat);
    if (this.alive.length <= 1) this.decide(this.alive.length === 1 ? this.alive[0] : -1);
  },
  /* el anfitrión decide la ronda: w es el asiento ganador, o -1 si todos cayeron a la vez */
  decide(w) {
    if (this.role !== 'host' || (this.sub !== 'fight' && this.sub !== 'ko')) return;
    if (w >= 0) this.score[w]++;
    const over = this.score.some(s => s >= this.rounds);
    this.lastRend = { ev: 'rend', id: G.me.id, round: this.round, w, sc: this.score.slice(), over: over ? 1 : 0 };
    this.send(this.lastRend);
    this.applyRend(w, this.score, over);
  },
  onRend(m) {
    if (this.role !== 'guest' || this.phase !== 'arena' || m.round !== this.round) return;
    if (!Array.isArray(m.sc) || !isNum(m.w, -1, 2)) return;
    this.applyRend(+m.w, m.sc, !!m.over);
  },
  applyRend(w, sc, over) {
    if (this.rendRound === this.round) return;
    this.rendRound = this.round;
    this.score = this.order.map((_, i) => clampScore(sc[i]));
    const mine = w === this.mySeat, draw = w < 0;
    this.sub = over ? 'over' : 'rend'; this.timer = 0; G.inputLocked = true;
    const line = this.scoreLine();
    if (over) this.banner = { a: draw ? 'EMPATE' : (mine ? 'GANADOR' : 'DERROTA'), b: line, col: mine ? '#ffd34a' : '#ff6b7a' };
    else if (draw) this.banner = { a: 'EMPATE', b: line, col: '#ffe7a6' };
    else this.banner = { a: mine ? 'WIN' : 'KO', b: line, col: mine ? '#ffd34a' : '#ff6b7a' };
    if (mine) { Sound.play('checkpoint', 0.7); if (over) Music.jingle('victory', () => { }); }
    else Sound.play(hurtKey(), 0.5);
  },
  /* el marcador: primero el tuyo, luego el de los rivales por asiento */
  scoreLine() { return [this.score[this.mySeat] | 0].concat(this.rivalsList().map(r => this.score[r.seat] | 0)).join(' — '); },
  myScore() { return this.score[this.mySeat] | 0; },

  /* ---------- golpes: la espada y la bola se avisan al rival; el que recibe, aplica ---------- */
  swing() {
    if (this.sub !== 'fight') return;
    const p=G.player, cid=p.charId||'hero';
    const reach=cid==='wizard'?230:cid==='huntress'?155:SWORD_RULES.reach+(cid==='knight'?6:0);
    const ranged=cid==='wizard'||cid==='huntress';
    const hb={x:p.face>0?p.x-4:p.x-reach+4,y:p.y-(ranged?52:SWORD_RULES.top),w:reach,h:ranged?48:SWORD_RULES.height};
    if(ranged && p.rangedFired) return;
    if(ranged) p.rangedFired=true;
    if(!p.swingHits) p.swingHits=[];
    let best=null, bestDist=Infinity;
    for(const r of this.rivalsList()){
      if(p.swingHits.indexOf(r.id)>=0) continue;                 /* cada rival cuenta una sola vez por golpe */
      const box=this.rivalBox(r.id); if(!box||!overlap(hb,box)) continue;
      const dx=Math.abs((box.x+box.w/2)-p.x); if(dx<bestDist){best=r;bestDist=dx;}
    }
    if(best){
      p.swingHits.push(best.id);
      const dmg=cid==='wizard'||cid==='knight'?2:1;
      this.sendHit(dmg, ranged?p.face*35:0, ranged?-12:0, '', ranged?0.15:SWORD_RULES.stun, best.id);
      if(ranged) Feel.burst(p.x+p.face*Math.min(reach*.65,bestDist),p.y-28,7,cid==='wizard'?['#c08cff','#f2dcff']:['#eee3c6','#ffffff'],90,.3);
      else Feel.shake(cid==='knight'?2:1,cid==='knight'?.1:.06);
      Sound.play(cid==='wizard'?'buff':(cid==='knight'?'attack2':'attack'),.7);
    }
  },
  rivalBox(id) {
    const g = id && Ghosts.peers.get(id);
    if (!g) return null;
    return { x: g.x - HERO.HITW / 2, y: g.y - HERO.HITH, w: HERO.HITW, h: HERO.HITH };
  },
  sendHit(dmg, kx, ky, bid, hold, to) {
    if (!to) return;
    this.send({ ev: 'hit', id: G.me.id, to, dmg, kx: Math.round(kx), ky: Math.round(ky), bid: bid || '', hold: hold || 0 });
  },
  /* parry en VS: un golpe que viene del frente se bloquea, la bola se desvía y el escudo se rompe con ese primer impacto */
  parryBlocks(m, bs) {
    const p = G.player, peer = (typeof Ghosts !== 'undefined' && Ghosts.peers && Ghosts.peers.get) ? Ghosts.peers.get(m.id) : null;
    const bot = (typeof Trainer !== 'undefined' && Trainer.bot && !m.id) ? Trainer.bot : null;   /* el bot del entrenamiento no manda su id: se usa su posición */
    const srcX = bs ? bs.x : (peer && peer.x != null ? peer.x : (bot ? bot.x : p.x + p.face * 200));
    const front = p.face >= 0 ? srcX >= p.x - 2 : srcX <= p.x + 2;
    if (!front) return false;
    if (bs) { bs.vx = -bs.vx * 0.7; bs.vy = -Math.abs(bs.vy) - 90; bs.deflected = true; bs.mine = false; }
    G.breakParry(p);
    Feel.ring(p.x + p.face * 22, p.y - 24, 28, '#59dfff', 0.2); Feel.text(p.x, p.y - 48, '¡PARRY!', '#83eaff'); Sound.play('checkpoint', 0.4);
    return true;
  },
  /* ¿la bola (vista desde tu pantalla) toca tu cuerpo? el golpe que llega con retraso solo cuenta si también la ves tocarte */
  shotNearPlayer(s, p) { const b = p.box(), g = 18; return s.x > b.x - g && s.x < b.x + b.w + g && s.y > b.y - g && s.y < b.y + b.h + g; },
  onHit(m) {
    if (m.to !== G.me.id) return;
    const p0 = G.player, bs = m.bid ? G.shots.find(s => s.bid === m.bid) : null;
    if (bs && bs.deflected) return;   /* esta bola ya fue desviada: no puede volver a golpear */
    if (this.sub === 'fight' && p0.parryT > 0 && p0.inv <= 0 && p0.hp > 0 && this.parryBlocks(m, bs)) return;
    if (bs && this.sub === 'fight' && !this.shotNearPlayer(bs, p0)) { this.dropShot(m.bid); return; }
    if (m.bid) this.dropShot(m.bid);
    if (this.sub !== 'fight') return;
    const p = G.player;
    if (p.inv > 0 || p.hp <= 0) return;
    const dmg = clamp(Math.round(+m.dmg || 1), 1, 2);
    p.hp = Math.max(0, p.hp - dmg); p.inv = 0.7; if ((p.charId || 'hero') !== 'hero') { p.hitT = 0.24; p.setAnim('hit'); }
    if (+m.hold > 0) { p.stun = Math.max(p.stun, clamp(+m.hold, 0, 3)); p.vx = 0; }   /* agarrado: no sale volando */
    else { p.onGround = false; p.plat = null; p.vx = clamp(+m.kx || 0, -460, 460); p.vy = clamp(+m.ky || 0, -420, 0); }
    Sound.play('hit', 0.8);
    Feel.burst(p.x, p.y - 14, 8, ['#ff6b7a', '#ffd0d6'], 120, 0.35);
    Feel.text(p.x, p.y - 44, (+m.hold > 0 ? 'AGARRADO -' : '-') + dmg, '#ff8a96');
    if (p.hp <= 0) this.localKo();
  },

  /* ---------- tirachinas: la bola propia hace daño y agarra; la del rival sólo se ve ---------- */
  fire(p, ang, pow) {
    if (this.sub !== 'fight') return;
    const f = p.face, speed = 250 + 380 * pow;
    const o = Scene.slingOrigin(p), x = o.x, y = o.y;
    Sound.play('ballAir', 0.6);
    const vx = Math.cos(ang) * speed * f, vy = -Math.sin(ang) * speed;
    const bid = String(G.me.id).slice(0, 8) + ':' + (++this.bidN);
    const s = new Shot('ball', x, y, vx, vy, 2.6); s.fx = Craft.effectFor('sling');
    Object.assign(s, { grav: PHYS.BALL_G, bounces: 1, safeT: 0, dmg: 1, mine: true, bid });
    G.shots.push(s);
    this.send({ ev: 'shot', id: G.me.id, bid, x: Math.round(x), y: Math.round(y), vx: Math.round(vx), vy: Math.round(vy), fx: (Craft.effectFor('sling') || {}).id || '' });
    Sound.play('jump', 0.3);
  },
  onRivalShot(m) {
    if (!isNum(m.x, -2000, 3000) || !isNum(m.y, -2000, 3000) || !isNum(m.vx, -3000, 3000) || !isNum(m.vy, -3000, 3000)) return;
    if (typeof m.bid !== 'string' || !m.bid) return;
    const s = new Shot('ball', m.x, m.y, m.vx, m.vy, 2.6); s.fx = craftRecipeFor(m.fx, 'sling');
    Object.assign(s, { grav: PHYS.BALL_G, bounces: 1, safeT: 0, dmg: 1, mine: false, bid: m.bid.slice(0, 40) });
    G.shots.push(s);
    Sound.play('jump', 0.2);
  },
  /* al quitarla, la bola se marca muerta: su impacto se dibuja una vez y su estela se apaga (antes quedaba pegada en el suelo) */
  dropShot(bid) { const i = G.shots.findIndex(s => s.bid === bid); if (i >= 0) { const s = G.shots[i]; s.alive = false; G.shots.splice(i, 1); } },
  updateShots(dt) {
    const arr = G.shots;
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      s.update(dt);
      G.ballStep(s);
      if (s.alive && s.mine) this.shotHitsRival(s);
      if (s.life <= 0 || s.y > 420 || s.x < -400 || s.x > 1300) s.alive = false;
      if (!s.alive) arr.splice(i, 1);
    }
  },
  /* la bola propia avisa al rival que toca (cualquiera de los dos) */
  shotHitsRival(s) {
    for (const r of this.rivalsList()) {
      const box = this.rivalBox(r.id);
      if (!box || !overlap({ x: s.x - 4, y: s.y - 4, w: 8, h: 8 }, box)) continue;
      s.alive = false;
      this.sendHit(s.dmg || 1, 0, 0, s.bid, 1.0, r.id);   /* la bola agarra 1 s, como la espada: no empuja fuera de la isla */
      Feel.burst(s.x, s.y, 6, ['#ffe7a6', '#ffffff'], 90, 0.25);
      return;
    }
  },

  /* ---------- lo que ve el rival: posición, animación, vida y la goma del tirachinas ---------- */
  sendState(dt) {
    this.sendT += dt;
    const p = G.player;
    const sl = p.sl.on ? [Math.round(p.sl.aim * 100), Math.round(p.sl.pow * 100)] : null;
    const sig = [Math.round(p.x), Math.round(p.y), p.face, p.anim, p.hp, sl ? sl.join('/') : ''].join(',');
    if ((sig !== this.lastSig && this.sendT >= 1 / ARENA.SEND_HZ) || this.sendT >= 1) {
      this.sendT = 0; this.lastSig = sig;
      this.send({ id: G.me.id, name: G.me.name, x: Math.round(p.x), y: Math.round(p.y), face: p.face, anim: p.anim, char: p.charId || 'hero',
        hp: p.hp, vy: Math.round(p.vy), sl, pr: p.parryT > 0 ? 1 : 0 });   /* pr: el rival ve tu escudo */
    }
  },

  /* ---------- mensajes de la sala y de la partida ---------- */
  onNet(m) {
    if (!this.role || !m || typeof m.id !== 'string' || m.id === G.me.id) return;
    switch (m.ev) {
      case 'hello': this.onHello(m); break;
      case 'welcome': this.onWelcome(m); break;
      case 'roster': this.onRoster(m); break;
      case 'map': this.applyMap(m.map); break;
      case 'deny':
        if (this.role !== 'guest' || m.to !== G.me.id) return;
        if (m.why === 'full') this.leaveRoom('La sala está llena.', this.backScreen());
        else if (this.sentPwd) this.leaveRoom('Contraseña incorrecta.', 'vsPwd');
        else this.leaveRoom('La sala pide contraseña.', 'vsPwd');
        break;
      case 'quit':
        if (this.phase === 'arena') this.toRoom('Un rival salió de la partida.');
        break;
      case 'cfg': if (this.role === 'guest') { this.rounds = clampRounds(m.rounds); this.refresh(); } break;
      case 'round': this.onRound(m); break;
      case 'swing': Ghosts.swing(m.id, m.fx); Sound.play('attack', 0.25); break;
      case 'shot': this.onRivalShot(m); break;
      case 'hit': this.onHit(m); break;
      case 'ko': if (this.phase === 'arena' && m.round === this.round) Ghosts.die(m.id, this.world && this.world.plats); this.onRivalKo(m); break;
      case 'rend': this.onRend(m); break;
    }
  },
  /* un invitado pide entrar: el anfitrión comprueba la contraseña y que haya asiento libre */
  onHello(m) {
    if (this.role !== 'host' || this.phase !== 'room') return;
    if (this.pwd && String(m.pwd || '') !== this.pwd) { this.send({ ev: 'deny', id: G.me.id, to: m.id, why: 'pwd' }); return; }
    const known = this.order.some(x => x.id === m.id);
    if (!known && this.order.length >= this.mode) { this.send({ ev: 'deny', id: G.me.id, to: m.id, why: 'full' }); return; }
    if (!known) this.order.push({ id: m.id, name: String(m.name || 'rival').slice(0, 16) });
    this.send({ ev: 'welcome', id: G.me.id, to: m.id, rounds: this.rounds, mode: this.mode, order: this.order, map: this.mapId });
    this.sendRoster();
    Lobby.setHost(this.hostInfo());
    this.syncGhosts();
    this.refresh();
  },
  onWelcome(m) {
    if (this.role !== 'guest' || this.phase !== 'joining' || m.to !== G.me.id) return;
    const order = cleanOrder(m.order);
    if (!order || !order.some(x => x.id === G.me.id)) return;
    clearTimeout(this.joinT);
    this.phase = 'room'; this.rounds = clampRounds(m.rounds); this.mode = clampMode(m.mode); this.msg = '';
    if (m.map) this.applyMap(m.map);
    this.order = order; this.mySeat = this.seatOf(G.me.id);
    G.screen = 'vsRoom';
    this.syncGhosts(); this.refresh();
  },
  /* el anfitrión avisa a todos cada vez que cambia la lista de asientos */
  sendRoster() {
    if (this.role !== 'host') return;
    this.send({ ev: 'roster', id: G.me.id, mode: this.mode, order: this.order, map: this.mapId });
    this.syncGhosts();
    this.refresh();
  },
  onRoster(m) {
    if (this.role !== 'guest' || (this.phase !== 'room' && this.phase !== 'arena')) return;
    const order = cleanOrder(m.order);
    if (!order || !order.some(x => x.id === G.me.id)) return;
    this.mode = clampMode(m.mode); this.order = order; this.mySeat = this.seatOf(G.me.id);
    if (m.map) this.applyMap(m.map);
    this.syncGhosts(); this.refresh();
  },

  /* ---------- dibujo: fondo, isla, personajes y marcador ---------- */
  art() { const b = BIOMES.cielo || BIOMES.bosque; return { biome: b, variant: b.variants[0] }; },
  bakePlat() {
    const PW = ARENA.PLAT_W, ox = 14, top = 12, w = PW + ox * 2, h = top + 24;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    let seed = 777;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cx = ox + PW / 2, half = PW / 2;
    g.fillStyle = '#5b4330'; g.beginPath();
    g.moveTo(ox, top); g.lineTo(ox + PW, top); g.lineTo(cx + half * 0.6, top + 14); g.lineTo(cx, top + 22); g.lineTo(cx - half * 0.6, top + 14);
    g.closePath(); g.fill();
    for (let i = 0; i < 30; i++) { g.fillStyle = rnd() < 0.5 ? '#3a281c' : '#8a6a4c'; g.fillRect(Math.round(cx + (rnd() * 2 - 1) * half * 0.7), Math.round(top + 3 + rnd() * 12), 2, 1); }
    const greens = ['#2f6e1c', '#4f9a2c', '#72c44a'];
    g.fillStyle = '#3f8a22'; g.fillRect(ox - 1, top - 3, PW + 2, 4);
    for (let x = ox - 1; x < ox + PW + 1; x += 2) {
      const hgt = 2 + Math.floor(rnd() * 4);
      g.fillStyle = greens[Math.floor(rnd() * greens.length)];
      g.fillRect(x, top - 3 - hgt, 2, hgt + 1);
    }
    const flowers = ['#ff7fb0', '#fff1a8', '#ffffff'];
    for (let i = 0; i < 6; i++) { g.fillStyle = flowers[Math.floor(rnd() * flowers.length)]; g.fillRect(Math.round(ox + 6 + rnd() * (PW - 12)), top - 5, 2, 2); }
    return cv;
  },
  drawPlatform() {},   /* la plataforma viene dibujada en la imagen de la isla */
  drawIsland(ctx, camY, id, plats) {
    const g = VsGeo.of(id || this.mapId), im = Img.get(g.art.isla);
    if (Img.ready(im)) {
      const ox = Math.round(g.art.x), oy = Math.round(g.art.y - camY);
      if (Platforms.draw(ctx, g.id, ox, oy, g.art.scale, g.art.w, g.art.h, plats)) return;
      ctx.drawImage(im, ox, oy, g.art.w, g.art.h); return;
    }
    ctx.fillStyle = '#4a3b2e'; ctx.fillRect(g.isl.x0, g.isl.y - camY, g.isl.x1 - g.isl.x0, 40);   /* mientras carga la imagen */
  },
  render(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const [ox, oy] = Feel.offset(G.t);
    const art = this.art();
    ctx.save();
    ctx.translate(Math.round(ox), Math.round(oy));
    this.drawBackdrop(ctx);
    const z = this.zoom();
    ctx.translate(W / 2, ARENA.TOP);
    ctx.scale(z, z);
    ctx.translate(-ARENA.CX, -ARENA.TOP);
    this.drawIsland(ctx, 0, this.mapId, this.world && this.world.plats);
    this.drawPlatform(ctx);
    for (const s of G.shots) Scene.drawShot(ctx, s, 0);
    Ghosts.draw(ctx, 0, G.t, this.world.plats);
    Scene.drawPlayer(ctx, G.player, 0, G.heroStrips);
    Scene.drawSling(ctx, G.player, 0, this.world.plats);
    Feel.draw(ctx, 0); Effects.draw(ctx, 0);
    if (typeof Scene !== 'undefined' && G.player) Scene.drawParry(ctx, G.player, 0);   /* escudo del parry también en el VS y el entrenamiento */
    ctx.restore();
    this.hud(ctx);
  },
  /* corazón que gira (6 cuadros de la hoja, en bucle) con el número de vidas al lado: X6 */
  heartBlock(ctx, x, y, hp, right, name, col, wins) {
    const im = Img.get('hud/corazon.png'), S = 2, dw = 16 * S;
    const f = Math.floor(G.t * 10) % 6, sx = (f % 3) * 16, sy = Math.floor(f / 3) * 16;
    const dx = right ? x - dw : x;
    if (Img.ready(im)) ctx.drawImage(im, sx, sy, 16, 16, dx, y, dw, dw);
    else ctx.drawImage(Sprites.heart(true), dx, y, 24, 22);
    Hud.txt(ctx, 'X' + hp, right ? dx - 6 : dx + dw + 6, y + dw / 2, '700 16px Pixelify Sans, monospace', '#ffffff', right ? 'right' : 'left');
    Hud.txt(ctx, name + '  ·  ' + (wins | 0), x, y + dw + 12, '700 11px Pixelify Sans, monospace', col, right ? 'right' : 'left');
  },
  hud(ctx) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    this.heartBlock(ctx, 10, 6, G.player.hp, false, G.me.name, TEAM_LIGHT[this.myColor] || '#e6f6ff', this.myScore());
    let ry = 6;                                  /* los rivales, uno debajo de otro a la derecha */
    for (const r of this.rivalsList()) {
      const g = Ghosts.peers.get(r.id), hp = g ? g.s.hp : ARENA.HEARTS;
      this.heartBlock(ctx, W - 10, ry, hp, true, r.name, TEAM_LIGHT[this.colors ? this.colors[r.seat] : ''] || '#e6f6ff', this.score[r.seat]);
      ry += 62;
    }
    Hud.txt(ctx, this.training ? 'Entrenamiento · sin fin' : 'Gana el primero a ' + this.rounds, W / 2, H - 9, '600 10px Pixelify Sans, monospace', 'rgba(214,240,255,0.7)', 'center');
    if (this.sub === 'count') {                  /* cuenta 5, 4, 3, 2, 1, 0 */
      const d = 5 - Math.floor(this.timer), f = this.timer - Math.floor(this.timer);
      if (d >= 0) {
        const k = 1 + 0.35 * (1 - f) * (1 - f);
        ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.scale(k, k);
        Hud.txt(ctx, String(d), 0, 0, '700 76px Pixelify Sans, monospace', d === 0 ? '#7cf06a' : '#fff3c4', 'center');
        ctx.restore();
      }
    }
    if (this.banner !== this._bannerRef) { this._bannerRef = this.banner; this._bannerT = G.t; }
    if (this.banner) {
      const pop = 1 + 0.3 * Math.max(0, 1 - (G.t - (this._bannerT || 0)) / 0.35);   /* el aviso entra con un golpe de escala */
      ctx.save(); ctx.translate(W / 2, H * 0.36); ctx.scale(pop, pop); ctx.translate(-W / 2, -H * 0.36);
      Hud.txt(ctx, this.banner.a, W / 2, H * 0.36, '700 34px Pixelify Sans, monospace', this.banner.col, 'center');
      if (this.banner.b) Hud.txt(ctx, this.banner.b, W / 2, H * 0.36 + 26, '700 13px Pixelify Sans, monospace', '#e6f6ff', 'center');
      ctx.restore();
    }
    ctx.restore();
  }
};
