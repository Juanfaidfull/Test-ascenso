'use strict';
/* =====================================================================
   ASCENSO 3.0 · base: constantes, utilidades, almacenamiento seguro,
   imágenes con respaldo, audio que reutiliza objetos y entrada.
   ===================================================================== */
let W = 480, H = 270;                       /* el ancho se ajusta a la pantalla (horizontal) */
const TILE = 16, BASE_Y = 216, START_X = 120;
const PHYS = { G: 980, RUN: 165, ACC_G: 1400, ACC_A: 700, DEC_G: 1600, DEC_A: 320, JUMP: 430, MAXFALL: 640,
  COYOTE: 0.12, JBUF: 0.14, BOUNCE: 320, MAX_JUMPS: 2, BALL_G: 760, SLING_CHARGE: 0.9, SLING_RELOAD: 1.5,
  SLING_MAX_PULL: 110 };
const SL_MIN = -Math.PI * 0.42, SL_MAX = Math.PI * 0.47;   /* límites del apuntado: abajo / arriba */
const HERO = { FW: 90, FH: 52, FEET: 51, CX: 45, HITW: 14, HITH: 26 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const pad2 = n => String(n).padStart(2, '0');
const isNum = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function toCanvas(im) {
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  c.getContext('2d').drawImage(im, 0, 0); return c;
}

/* ---------- almacenamiento: nunca rompe el juego ----------
   Si localStorage está bloqueado (modo privado, política del navegador), usa memoria. */
const store = {
  blocked: false, mem: {},
  raw(k) {
    try { return localStorage.getItem('ascenso_' + k); }
    catch (e) { this.blocked = true; return this.mem[k] == null ? null : this.mem[k]; }
  },
  get(k, d) {
    const s = this.raw(k);
    if (s == null) return d;
    try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; }
  },
  set(k, v) {
    const s = JSON.stringify(v);
    try { localStorage.setItem('ascenso_' + k, s); }
    catch (e) { this.blocked = true; this.mem[k] = s; }
  },
  del(k) { try { localStorage.removeItem('ascenso_' + k); } catch (e) { } delete this.mem[k]; }
};

/* ---------- imágenes: embebidas (build) o en assets/img; si faltan, se ignoran sin error ---------- */
const Img = {
  cache: {},
  tries: {},
  get(name) {
    if (!name) return null;
    if (this.cache[name] !== undefined) return this.cache[name];
    this.load(name); return this.cache[name];
  },
  /* si el navegador no puede cargar una imagen (por ejemplo, si le falta memoria un momento), se vuelve a intentar
     con una pausa que va creciendo; así una imagen nunca se queda rota para siempre hasta reiniciar la app */
  load(name) {
    const n = (this.tries[name] || 0) + 1; this.tries[name] = n;
    const src0 = (window.ASSETS || {})[name] || ('assets/img/' + name);
    /* en cada reintento se pide una dirección distinta: el navegador no une la nueva petición a una colgada */
    const src = n > 1 && !src0.startsWith('data:') ? src0 + (src0.includes('?') ? '&' : '?') + 'r=' + n : src0;
    const im = new Image();
    const again = () => { if (this.cache[name] === im && n < 40) setTimeout(() => this.load(name), Math.min(2000, 300 * n)); };
    im.onerror = again;
    im.src = src; this.cache[name] = im;
    /* vigilancia: si la carga se queda colgada (ni termina ni falla), también se vuelve a pedir */
    setTimeout(() => { if (this.cache[name] === im && !this.ready(im)) again(); }, 2500);
  },
  /* lista = cargada del todo. Con solo naturalWidth > 0 ya vale a mitad de carga, y dibujar entonces no pinta nada;
     si ese dibujo se guarda en caché (las repisas de un mapa), queda roto para siempre hasta recargar la página */
  ready(im) { return !!(im && im.complete && im.naturalWidth > 0); }
};

/* ---------- audio: nombres exactos de tus archivos ---------- */
const AUDIO = {
  sfx: {
    ballImpact: 'golpe_bola.ogg',
    arqueroDispara: 'arquero_dispara.ogg', flechaFalla: 'flecha_falla.ogg', flechaImpacta: 'flecha_impacta.ogg', tirachinasLanza: 'tirachinas_lanza.ogg',
    click: '(efecto de tocar cualquier botón de las interfaces)Clean Crystal Pop.ogg',
    upgradeMenu: 'sonido al activarse el menú de mejoras.ogg',
    craftClose: 'sonido al cerrar el menú de crafteo.ogg',
    ballAir: 'sonido que hace la bola mientras está en el aire.ogg',
    heal: 'tomar-poción-de-vida.ogg',
    checkpoint: '(efecto de tomar un objeto importante o valioso)Crystal Chime.ogg',
    hit: 'hit 1 espada.ogg',
    hurtHero: 'efecto de daño recibido del jugador.ogg',
    bossDemonio: 'aparicion_jefe_demonio.ogg', bossDemonioVolador: 'aparicion_demonio_boss.ogg', bossMaga: 'aparicion_maga.ogg',
    bossDaddy: 'aparicion_daddy.ogg', bossPiedra: 'jefe_piedra_aparece.ogg', bossGolemAzul: 'boss_golem_azul.ogg',
    bossVozGigante: 'boss_voz_gigante.ogg', bossToro: 'toro_gigante.ogg', abejaGiganteInvoca: 'abeja_gigante_invoca.ogg',
    abejaVoladora: 'abeja_voladora.ogg', camaleonAparece: 'camaleon_aparece.ogg', orcoGrunido: 'orco_grunido.ogg',
    demonioRojoEmbestida: 'demonio_rojo_embestida.ogg', ballestaDisparo: 'ballesta_disparo.ogg', bombaCae: 'bomba_cae.ogg',
    demonioVoladorDano: 'demonio_volador_dano.ogg',
    attack: 'hit 1 espada.ogg',
    hurt: 'grito_chica.ogg',
    buff: '(efecto de tomar un objeto importante o valioso)Crystal Chime.ogg',
    arrowShot: 'arquero_dispara.ogg', fireCast: 'sonido que hace la bola mientras está en el aire.ogg', magicCast: 'aparicion_maga.ogg', magicHit: '(efecto de tocar cualquier botón de las interfaces)Clean Crystal Pop.ogg', fireHit: 'golpe_bola.ogg',
    pickup: 'recolectar objetos.ogg',
    arrow: 'sonido-de-error-2.ogg',
    bossDead: '(sonido de victoria)Victory Fanfare.ogg',
    bossPhase: 'boss_voz_gigante.ogg', stomp: 'pisoton.ogg',
    over: '(pantalla de muerte)Rewind to Retry.ogg',
    record: '(sonido de victoria)Victory Fanfare.ogg',
    shield: '(escudo activado).ogg',
    craftOpen: 'sonido al abrir el menu de crafteo.ogg',
    error1: 'sonido-de-error-1.ogg',
    error2: 'sonido-de-error-2.ogg',
    rareMat: 'recolectar materiales raros.ogg',
    coin: 'recolectar-moneda.ogg',
    ballHit: 'sonido que hace el jugador al ser tocado por una bola.ogg',
    retry: '(pantalla de muerte 2)Time Rewind.ogg',
    potion: 'tomar cualquier otro tipo de pociones.ogg',
  }
};

/* Efectos de sonido: hasta 4 elementos reutilizados por efecto (la música está en music.js). */
const Sound = {
  sfxOn: store.get('sfx', true),
  pool: {}, CAP: 48,
  LONG: ['ballAir', 'over', 'retry', 'bossDead', 'record'],   /* efectos largos: se pueden cortar si hace falta */
  URGENT: ['hurt', 'hurtHero', 'ballHit', 'hit', 'bossHit'],   /* un golpe corta los efectos largos que estén sonando */   /* voces a la vez en total; un efecto nunca se corta por otro ni por un cambio de pantalla */
  file(kind, name) { return (window.AUDIO_FILES || {})[kind + '/' + name] || ('assets/audio/' + kind + '/' + name); },
  /* una sola URL de blob por sonido: las copias de la piscina comparten el mismo audio, sin repetir el base64 */
  blobUrl(kind, name) {
    const key = kind + '/' + name; this._blobs = this._blobs || {};
    if (this._blobs[key]) return this._blobs[key];
    const data = (window.AUDIO_FILES || {})[key];
    if (!data) return this.file(kind, name);
    const bin = atob(data.split(',')[1]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return (this._blobs[key] = URL.createObjectURL(new Blob([u8], { type: data.slice(5, data.indexOf(';')) })));
  },
  /* móviles y navegadores exigen un gesto del usuario para sonar: se desbloquea al primer toque o tecla */
  unlock() {
    if (window.Music) Music.unlockAudio();
  },
  play(key, vol = 0.8) {
    if (!this.sfxOn) return;
    const name = AUDIO.sfx[key]; if (!name) return;
    let list = this.pool[key]; if (!list) list = this.pool[key] = [];
    /* un golpe corta los efectos largos que estén sonando */
    if (this.URGENT.includes(key)) for (const k of this.LONG) for (const x of (this.pool[k] || [])) if (!x.paused && !x.ended) x.pause();
    let a = list.find(x => x.paused || x.ended);
    /* un efecto largo que vuelve a empezar corta su propia copia y arranca de nuevo */
    if (!a && this.LONG.includes(key) && list.length) { a = list.find(x => !x.paused && !x.ended) || list[0]; a.pause(); }
    if (!a) {
      /* una copia nueva si hace falta; nunca se reutiliza una que siga sonando */
      if (this.voices() >= this.CAP && key !== 'over') return;
      a = new Audio(); list.push(a); a.src = this.blobUrl('sfx', name);
      /* si el nombre exacto no está, prueba la versión con guiones bajos */
      a.addEventListener('error', () => { if (!a._alt) { a._alt = 1; a.src = this.file('sfx', name.replace(/ /g, '_')); } });
    }
    a.volume = vol;
    try { a.currentTime = 0; } catch (e) { }
    a.play().catch(() => { });
  },
  /* para los efectos que están sonando (salvo los de 'keep'): se usa al pulsar un botón que cambia de pantalla */
  stopAll(keep = []) {
    for (const k in this.pool) {
      if (keep.includes(k)) continue;
      for (const a of this.pool[k]) if (!a.paused && !a.ended) a.pause();
    }
  },
  voices() { let n = 0; for (const k in this.pool) n += this.pool[k].length; return n; },
  setSfx(on) { this.sfxOn = on; store.set('sfx', on); if (!on) for (const k in this.pool) this.pool[k].forEach(a => a.pause()); }
};

const ICON = {
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" fill="currentColor"/></svg>',
  upgrade: '<svg viewBox="0 0 24 24"><path d="M12 3l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L12 15.6 7 18.2l1.2-5.6L4 8.8l5.6-.6z" fill="currentColor"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  jump: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".55"/></svg>',
  attack: '<svg viewBox="0 0 24 24"><path d="M4 20 15 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13 5l6 6-2 2-6-6z" fill="currentColor"/><path d="M4 16l4 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  sling: '<svg viewBox="0 0 24 24"><path d="M6 4l6 8 6-8M12 12v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="21" r="2" fill="currentColor"/></svg>',
  parry: '<svg viewBox="0 0 24 24"><path d="M12 2.8 20 6v5.1c0 5-3.4 8.4-8 10.8-4.6-2.4-8-5.8-8-10.8V6z" fill="rgba(80,205,255,.22)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 12.2l2.5 2.5 5.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.5 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
  coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/><circle cx="12" cy="12" r="5" fill="none" stroke="#7a4b00" stroke-width="1.6" opacity=".6"/></svg>'
};

/* ---------- entrada: teclado, táctil y eventos del navegador ---------- */
const AIM_KEYS = { ArrowUp: 1, KeyW: 1, ArrowDown: -1, KeyS: -1 };
const Input = {
  left: false, right: false, jump: false, attack: false, sling: false, parry: false,
  jumpPress: false, attackPress: false, slingPress: false, parryPress: false, slingRelease: false, slingCancel: false, pausePress: false,
  aimY: 0, aimKeys: {}, pad: null, padId: null, padEl: null, padBox: null, cancelNext: false,
  keys: {}, touch: {}, inited: false,
  MAP: { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    KeyJ: 'attack', KeyZ: 'attack', KeyK: 'attack', KeyX: 'attack', KeyL: 'sling', ShiftLeft: 'sling', ShiftRight: 'sling', KeyI: 'parry' },
  init() {
    if (this.inited) return; this.inited = true;
    setTimeout(() => { this.initStick && this.initStick(); if (typeof applyTouchLayout === 'function') applyTouchLayout(); }, 0);
    addEventListener('keydown', e => {
      Sound.unlock();
      if (e.code === 'Escape' || e.code === 'KeyP') { this.pausePress = true; e.preventDefault(); return; }
      /* con el tirachinas sostenido, ↑/↓ (o W/S) apuntan y no saltan */
      if (this.sling && AIM_KEYS[e.code] !== undefined) { this.aimKeys[e.code] = true; this.updAim(); e.preventDefault(); return; }
      const a = this.MAP[e.code]; if (!a) return; e.preventDefault();
      if (!this.keys[e.code]) this.press(a);
      this.keys[e.code] = true; this.sync();
    });
    addEventListener('keyup', e => {
      if (this.aimKeys[e.code]) { delete this.aimKeys[e.code]; this.updAim(); }
      if (this.MAP[e.code]) { delete this.keys[e.code]; this.sync(); }
    });
    addEventListener('blur', () => this.clearAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearAll(); });
    addEventListener('pointerdown', () => Sound.unlock(), { passive: true });
    const touchControls = document.getElementById('touch');
    if (touchControls) {
      ['contextmenu','dragstart','selectstart'].forEach(type => touchControls.addEventListener(type, e => { e.preventDefault(); e.stopPropagation(); }, true));
      touchControls.querySelectorAll('img,svg,image').forEach(node => { node.setAttribute('draggable','false'); node.style.webkitTouchCallout='none'; node.style.pointerEvents='none'; });
    }
    document.querySelectorAll('#touch .tb').forEach(b => {
      const a = b.dataset.a;
      if (a === 'sling') { this.initPad(b); return; }
      const down = e => {
        e.preventDefault(); Sound.unlock();
        try { b.setPointerCapture(e.pointerId); } catch (_) { }
        b.classList.add('on'); this.touch[a] = true;
        this.press(a); this.sync();
      };
      const up = () => { b.classList.remove('on'); this.touch[a] = false; this.sync(); };
      /* botones con arte propio (espada y escudo); si falta el arte, queda el ícono de siempre */
      const art = (window.ASSETS || {})['ui/botones/' + 'ninguno' + '.png'];
      if (art) { b.innerHTML = '<img alt="" draggable="false" src="' + art + '" style="width:100%;height:100%;display:block;pointer-events:none">'; b.style.background = 'none'; b.style.border = 'none'; b.style.boxShadow = 'none'; }
      else if (ICON[a]) b.innerHTML = ICON[a];
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });
  },
  /* tirachinas táctil: una franja vertical con una bolita (con el icono del tirachinas). Arriba/abajo fija el ángulo
     (absoluto: no depende de hacia dónde mira el héroe); a la derecha, más potencia. Al soltar, dispara */
  /* el puck cambia según la habilidad equipada: honda, flecha o llama */
  refreshPuck() {
    const puck = this.padEl && this.padEl.querySelector('.sp-puck'); if (!puck) return;
    const sk = (typeof Craft !== 'undefined' && Craft.skillFor()) || null;
    const key = sk === 'arrow' ? 'puck_flecha' : sk === 'fire' ? 'puck_llama' : 'puck_tirachinas';
    if (puck.dataset.art === key) return;
    const src = (window.ASSETS || {})['ui/botones/' + key + '.png'];
    puck.dataset.art = key;
    puck.innerHTML = src ? '<img alt="" draggable="false" src="' + src + '" style="width:100%;height:100%;display:block;pointer-events:none">' : (ICON.sling || '');
  },
  initPad(el) {
    this.padEl = el;
    const puck = el.querySelector('.sp-puck'), P = 40;
    this.refreshPuck(); setInterval(() => this.refreshPuck(), 400);
    const place = (x, y) => {
      const r = this.padBox;
      const u = clamp((x - r.left) / r.width, 0, 1), t = clamp((y - r.top) / r.height, 0, 1);
      this.pad = { u, v: 1 - 2 * t };
      if (puck) { puck.style.left = (P / 2 + u * (r.width - P)) + 'px'; puck.style.top = (P / 2 + t * (r.height - P)) + 'px'; }
    };
    el.addEventListener('pointerdown', e => {
      if (this.padId !== null) return;
      e.preventDefault(); Sound.unlock();
      this.padId = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
      this.padBox = el.getBoundingClientRect();
      el.classList.add('on'); this.touch.sling = true;
      place(e.clientX, e.clientY); this.press('sling'); this.sync();
    });
    el.addEventListener('pointermove', e => { if (e.pointerId === this.padId) place(e.clientX, e.clientY); });
    const up = e => {
      if (this.padId === null || (e && e.pointerId !== this.padId)) return;
      this.padId = null; this.touch.sling = false; this.sync(); this.resetPad();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    this.resetPad();
  },
  /* la bolita vuelve al centro de la franja (sin dedo) */
  resetPad() {
    if (this.padEl) this.padEl.classList.remove('on');
    const puck = this.padEl && this.padEl.querySelector('.sp-puck');
    if (puck) { puck.style.left = '50%'; puck.style.top = '50%'; }
  },
  updAim() { const k = this.aimKeys; this.aimY = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0); },
  press(a) {
    if (a === 'jump') this.jumpPress = true;
    else if (a === 'attack') this.attackPress = true;
    else if (a === 'sling') this.slingPress = true;
    else if (a === 'parry') this.parryPress = true;
  },
  sync() {
    const held = a => Object.keys(this.keys).some(c => this.MAP[c] === a) || !!this.touch[a];
    this.left = held('left'); this.right = held('right'); this.jump = held('jump'); this.attack = held('attack'); this.parry = held('parry');
    const was = this.sling;
    this.sling = held('sling');
    if (was && !this.sling) {
      if (this.cancelNext) { this.slingCancel = true; this.cancelNext = false; } else this.slingRelease = true;
    }
    if (!this.sling) { this.aimY = 0; this.aimKeys = {}; }
  },
  /* al perder el foco se cancela la carga (no se dispara solo) */
  clearAll() {
    if (this.sling) this.cancelNext = true;
    this.keys = {}; this.touch = {}; this.aimKeys = {};
    this.jumpPress = this.attackPress = this.slingPress = this.parryPress = this.slingRelease = this.pausePress = false;
    this.padId = null; this.pad = null; this.sync(); this.resetPad();
    document.querySelectorAll('#touch .tb.on').forEach(b => b.classList.remove('on'));
  },
  /* una vez por paso de simulación; la bolita se conserva mientras se sostiene el dedo en la franja */
  clearPress() {
    this.jumpPress = this.attackPress = this.slingPress = this.parryPress = this.slingRelease = this.slingCancel = this.pausePress = false;
    if (!this.sling) this.pad = null;
  }
};

/* entrada anulada: el personaje no responde a nada (cuenta atrás, KO y fin de ronda en VS) */
const NO_INPUT = { left: false, right: false, jump: false, attack: false, sling: false, parry: false,
  jumpPress: false, attackPress: false, slingPress: false, parryPress: false, slingRelease: false, slingCancel: false, pausePress: false,
  aimY: 0, aimKeys: {}, pad: null };

/* la espada: 0,8 s entre golpes y 0,2 s de inmovilidad al rival (sin empujarlo). Jugador, entrenador y multijugador */
/* espada: alcance y altura de golpe, iguales en todos los modos y personajes */
const SWORD_RULES = { cooldown: 0.8, stun: 0.2, reach: 64, height: 56, top: 50 };

/* controles: botones de siempre o joystick circular (se elige en Ajustes) */
const Controls = { mode: store.get('controls', 'buttons') === 'joystick' ? 'joystick' : 'buttons' };
function applyControls() {
  document.body.classList.toggle('joy', Controls.mode === 'joystick');
  Input.touch.left = false; Input.touch.right = false; Input.sync();
}
Input.joyMove = function (dx) { this.touch.left = dx < -0.3; this.touch.right = dx > 0.3; this.sync(); const st = document.getElementById('stick'); if (st) { st.classList.toggle('pushL', dx < -0.3); st.classList.toggle('pushR', dx > 0.3); } };
Input.initStick = function () {
  const el = document.getElementById('stick'); if (!el) return;
  const knob = el.querySelector('.knob'); let id = null;
  const set = e => {
    const r = el.getBoundingClientRect(), R = r.width / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + R)) / R));
    if (knob) knob.style.transform = 'translateX(' + (dx * R * 0.55) + 'px)';
    this.joyMove(dx);
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlock(); id = e.pointerId; try { el.setPointerCapture(id); } catch (_) { } set(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; if (knob) knob.style.transform = ''; this.joyMove(0); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  const full = Img.get('ui/joy_full.png');
  if (full && full.src) el.style.setProperty('background-image', 'url("' + full.src + '")', 'important');
  applyControls();
};

/* sonido de daño: el chico suena su efecto; la guerrera, su grito */
function hurtKey() { return store.get('char', 'hero') === 'chica' ? 'hurt' : 'hurtHero'; }

/* diseño de botones (versión 2): se arrastra y cambia de tamaño; nunca sale de la pantalla */
const TOUCH_IDS = { jump: '[data-a="jump"]', attack: '[data-a="attack"]', parry: '#parryBtn', sling: '.slingpad', left: '[data-a="left"]', right: '[data-a="right"]', stick: '#stick' };
const TOUCH_NAMES = { jump: 'Saltar', attack: 'Atacar', parry: 'Escudo', sling: 'Tirachinas', left: 'Izquierda', right: 'Derecha', stick: 'Joystick' };
const TOUCH_KEY = 'touchLayout2';
/* posición y tamaño de respaldo para los controles que están ocultos en el modo actual */
const TOUCH_FALLBACK = { jump: { x: 86, y: 74, bw: 68, bh: 68 }, attack: { x: 80, y: 82, bw: 68, bh: 68 }, parry: { x: 92, y: 52, bw: 68, bh: 68 }, sling: { x: 88, y: 28, bw: 100, bh: 180 }, left: { x: 2, y: 74, bw: 68, bh: 68 }, right: { x: 11, y: 74, bw: 68, bh: 68 }, stick: { x: 2, y: 52, bw: 150, bh: 150 } };
function validTouchData(d) {
  if (!d || typeof d !== 'object') return null;
  for (const k of Object.keys(TOUCH_IDS)) {
    const p = d[k];
    if (!p || !isFinite(p.x) || !isFinite(p.y) || !(p.s > 0) || !(p.bw > 0) || !(p.bh > 0)) return null;
  }
  return d;
}
const TouchLayout = { data: validTouchData(store.get(TOUCH_KEY, null)), cleanup: [], draft: null, base: null };
function touchElOf(k) { return document.querySelector(TOUCH_IDS[k]); }
function placeTouchEl(el, p) {
  if (!el) return;
  el.style.setProperty('position', 'fixed', 'important');
  el.style.setProperty('left', p.x + 'vw', 'important');
  el.style.setProperty('top', p.y + 'vh', 'important');
  el.style.setProperty('right', 'auto', 'important');
  el.style.setProperty('bottom', 'auto', 'important');
  el.style.setProperty('width', (p.bw * p.s) + 'px', 'important');
  el.style.setProperty('height', (p.bh * p.s) + 'px', 'important');
}
function clearTouchStyles() {
  for (const k of Object.keys(TOUCH_IDS)) {
    const el = touchElOf(k); if (!el) continue;
    for (const pr of ['position', 'left', 'top', 'right', 'bottom', 'width', 'height']) el.style.removeProperty(pr);
  }
}
function applyTouchLayout() {
  const L = TouchLayout.data; if (!L) return;
  for (const k of Object.keys(TOUCH_IDS)) placeTouchEl(touchElOf(k), L[k]);
}
function resetTouchLayout() { clearTouchStyles(); TouchLayout.data = null; store.set(TOUCH_KEY, null); }
function clampTouch(k) {
  const p = TouchLayout.draft[k];
  const maxX = Math.max(0, innerWidth - p.bw * p.s), maxY = Math.max(0, innerHeight - p.bh * p.s);
  const left = Math.min(Math.max(0, p.x / 100 * innerWidth), maxX), top = Math.min(Math.max(0, p.y / 100 * innerHeight), maxY);
  p.x = +(left / innerWidth * 100).toFixed(2); p.y = +(top / innerHeight * 100).toFixed(2);
}
/* un botón no puede tapar a otro: si choca, se desliza por el borde libre o se queda donde estaba */
function touchRectOf(k) {
  const p = TouchLayout.draft[k], l = p.x / 100 * innerWidth, t = p.y / 100 * innerHeight;
  return { l, t, r: l + p.bw * p.s, b: t + p.bh * p.s };
}
function touchOverlaps(k, keys) {
  const a = touchRectOf(k), M = 6;
  return keys.some(o => { if (o === k) return false; const c = touchRectOf(o);
    return a.l < c.r + M && c.l < a.r + M && a.t < c.b + M && c.t < a.b + M; });
}
function endTouchEdit() {
  for (const f of TouchLayout.cleanup) f();
  TouchLayout.cleanup = [];
  document.body.classList.remove('editingLayout');
  const bar = document.getElementById('layoutBar'); if (bar) bar.remove();
  for (const k of Object.keys(TOUCH_IDS)) { const el = touchElOf(k); if (el) { el.classList.remove('editSel'); el.style.removeProperty('touch-action'); } }
  TouchLayout.draft = null; TouchLayout.base = null;
  if (typeof applyControls === 'function') applyControls();
}
function startTouchEdit() {
  const touch = document.getElementById('touch'); if (!touch) return;
  endTouchEdit();
  touch.classList.remove('hidden');
  document.body.classList.add('editingLayout');          /* muestra solo los controles del modo activo (joystick o botones) */
  clearTouchStyles();                                    /* medir con la posición por defecto */
  const base = {}, vis = {};
  for (const k of Object.keys(TOUCH_IDS)) {
    const el = touchElOf(k); if (!el) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el), fb = TOUCH_FALLBACK[k];
    const shown = r.width > 0 && r.height > 0; vis[k] = shown;
    base[k] = {
      x: shown ? +(r.left / innerWidth * 100).toFixed(2) : fb.x, y: shown ? +(r.top / innerHeight * 100).toFixed(2) : fb.y,
      bw: parseFloat(cs.width) > 0 ? parseFloat(cs.width) : fb.bw, bh: parseFloat(cs.height) > 0 ? parseFloat(cs.height) : fb.bh
    };
  }
  const saved = TouchLayout.data, draft = {};
  for (const k of Object.keys(base)) {
    const s = saved && saved[k];
    draft[k] = s ? { x: s.x, y: s.y, s: s.s, bw: base[k].bw, bh: base[k].bh } : { x: base[k].x, y: base[k].y, s: 1, bw: base[k].bw, bh: base[k].bh };
  }
  TouchLayout.draft = draft; TouchLayout.base = base;
  for (const k of Object.keys(draft)) { clampTouch(k); placeTouchEl(touchElOf(k), draft[k]); }
  let sel = null;
  const editKeys = Object.keys(draft).filter(k => vis[k]);
  const bar = document.createElement('div'); bar.id = 'layoutBar';
  bar.innerHTML = '<span id="layoutName">Toca un botón</span><input id="layoutSize" type="range" min="60" max="170" value="100"><button id="layoutReset">RESTABLECER</button><button id="layoutSave">GUARDAR</button><button id="layoutCancel">CANCELAR</button>';
  document.body.appendChild(bar);
  const nameEl = bar.querySelector('#layoutName'), size = bar.querySelector('#layoutSize');
  const label = k => TOUCH_NAMES[k] + ' · ' + Math.round(draft[k].s * 100) + '%';
  const select = k => {
    sel = k;
    for (const kk of Object.keys(TOUCH_IDS)) { const el = touchElOf(kk); if (el) el.classList.toggle('editSel', kk === k); }
    size.value = Math.round(draft[k].s * 100); nameEl.textContent = label(k);
  };
  const onSize = () => {
    if (!sel) return;
    const prev = draft[sel].s;
    draft[sel].s = size.value / 100; clampTouch(sel);
    if (touchOverlaps(sel, editKeys)) { draft[sel].s = prev; size.value = Math.round(prev * 100); }
    placeTouchEl(touchElOf(sel), draft[sel]); nameEl.textContent = label(sel);
  };
  size.addEventListener('input', onSize);
  TouchLayout.cleanup.push(() => size.removeEventListener('input', onSize));
  for (const k of Object.keys(draft)) {
    const el = touchElOf(k); if (!el || !vis[k]) continue;
    el.style.setProperty('touch-action', 'none');
    let drag = null;
    const down = e => {
      e.stopImmediatePropagation(); e.preventDefault();
      select(k);
      drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x0: draft[k].x, y0: draft[k].y };
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
    };
    const move = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const px = draft[k].x, py = draft[k].y;
      const nx = drag.x0 + (e.clientX - drag.px) / innerWidth * 100, ny = drag.y0 + (e.clientY - drag.py) / innerHeight * 100;
      draft[k].x = nx; draft[k].y = ny; clampTouch(k);
      if (touchOverlaps(k, editKeys)) {
        draft[k].x = nx; draft[k].y = py; clampTouch(k);                      /* desliza en X */
        if (touchOverlaps(k, editKeys)) { draft[k].x = px; draft[k].y = ny; clampTouch(k); }   /* desliza en Y */
        if (touchOverlaps(k, editKeys)) { draft[k].x = px; draft[k].y = py; }  /* no hay sitio: se queda */
      }
      placeTouchEl(el, draft[k]);
    };
    const up = e => { if (drag && drag.id === e.pointerId) drag = null; };
    el.addEventListener('pointerdown', down, true); el.addEventListener('pointermove', move, true);
    el.addEventListener('pointerup', up, true); el.addEventListener('pointercancel', up, true);
    TouchLayout.cleanup.push(() => {
      el.removeEventListener('pointerdown', down, true); el.removeEventListener('pointermove', move, true);
      el.removeEventListener('pointerup', up, true); el.removeEventListener('pointercancel', up, true);
    });
  }
  bar.querySelector('#layoutReset').onclick = () => {
    for (const k of Object.keys(draft)) {
      const b = TouchLayout.base[k]; draft[k] = { x: b.x, y: b.y, s: 1, bw: b.bw, bh: b.bh };
      placeTouchEl(touchElOf(k), draft[k]);
    }
    if (sel) select(sel);
  };
  bar.querySelector('#layoutCancel').onclick = () => { endTouchEdit(); clearTouchStyles(); applyTouchLayout(); UI.settings(''); };
  bar.querySelector('#layoutSave').onclick = () => {
    const out = {};
    for (const k of Object.keys(draft)) out[k] = { x: +draft[k].x.toFixed(2), y: +draft[k].y.toFixed(2), s: draft[k].s, bw: draft[k].bw, bh: draft[k].bh };
    TouchLayout.data = out; store.set(TOUCH_KEY, out);
    endTouchEdit(); clearTouchStyles(); applyTouchLayout(); UI.settings('Botones guardados.');
  };
}

/* qué sonido suena al aparecer cada jefe (por lo que se ve) */
const BOSS_APPEAR_SFX = { demonio_slime: 'bossDemonio', golem_laser: 'bossPiedra', golem_blue: 'bossGolemAzul', golem_orange: 'bossGolemAzul', guardian_hielo: 'bossVozGigante', minotauro: 'bossToro', daddy: 'bossDaddy', hechicero: 'bossMaga' };
