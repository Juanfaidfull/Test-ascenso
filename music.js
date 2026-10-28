'use strict';
/* =====================================================================
   ASCENSO 4.1 · música. Las pistas NO van dentro del HTML: se leen de
   assets/audio/music/ (junto al HTML). Nombres aceptados: con espacios (los del
   documento) o con guiones bajos. Si falta un archivo se ignora sin errores.
   Bucle del navegador, fundidos cruzados, jingles de una vez, pausa sin
   reinicio y desbloqueo en móvil.
   ===================================================================== */
const MUSIC_FILES = {
  menu: '01 - Falling Apart (Prologue).ogg',
  map_normal: '01. Battle Theme I (loop).ogg',
  map_ice: '06. Hidden Cavern.ogg',
  map_magma: '09. Battle Theme II (loop).ogg',
  map_candy: '18. The Old Magician.ogg',
  map_abyss: '26. Demon King Castle (full).ogg',
  map_cristal: '28. Holy Sanctuary.ogg',
  map_playa: '14. Traveling the Sky.ogg',
  map_volcan: '15. Volcanic Crater.ogg',
  map_bizcocho: '24. Battle Theme IV (loop).ogg',
  map_selva: '07. Spirits Forest (loop).ogg',
  map_tiempo: '25. Dark Factory.ogg',
  map_entrenamiento: '01. Battle Theme I (loop).ogg',
  map_bastion: '20. Military Base.ogg',
  bosque: '07. Spirits Forest (loop).ogg',
  cavernas: '11. Dangerous Cave.ogg',
  cielo: '14. Traveling the Sky.ogg',
  tormenta: '21. Malicious Scheme.ogg',
  espacio: '27. The Evil One.ogg',
  /* música del CRAFTEO (no hay tienda en el juego) */
  craft: 'Cozy Shop Loop.ogg',
  boss: 'Final Impact.ogg', newRecord: 'New Record Fanfare.ogg', victory: 'Victory Fanfare.ogg'
};
const MUSIC_DIR = 'assets/audio/music/';
const MUSIC_JINGLES = { newRecord: true, victory: true };
/* igualación de sonoridad medida en LUFS (referencia Cave Echoes, −15,3 LUFS) */
/* nombres de las pistas del pack (LEER-ME de assets/audio/music) */
const MUSIC_ALIAS = {
  menu: ['Pixel Night Ascent.ogg'],
  bosque: ['Moonlit Forest.ogg'], cavernas: ['Cave Echoes.ogg'], cielo: ['Skyward Adventure.ogg'],
  tormenta: ['Stormy Sunset.ogg'], espacio: ['Final Zone Ascent.ogg'],
  boss: ['26. Demon King Castle (full).ogg', '27. The Evil One.ogg', 'Final Impact.ogg'], craft: ['Cozy Shop Loop.ogg'],
  newRecord: ['New Record Fanfare.ogg'], victory: ['Victory Fanfare.ogg'],
  map_bastion: ['Skyward Adventure.ogg']
};
const MUSIC_SOFT = 0.5;   /* música más suave y bajita: la mitad de volumen */
const MUSIC_GAIN = { menu: 0.83, craft: 0.78, boss: 0.93, newRecord: 0.87, victory: 0.89, 'map_normal': 0.82, 'map_ice': 0.82, 'map_magma': 0.82, 'map_candy': 0.82, 'map_abyss': 0.82, 'map_cristal': 0.82, 'map_playa': 0.82, 'map_volcan': 0.82, 'map_bizcocho': 0.82, 'map_selva': 0.82, 'map_tiempo': 0.82, 'map_entrenamiento': 0.82, 'map_bastion': 0.82, bosque: 0.79, cavernas: 0.9, cielo: 0.78, tormenta: 0.78, espacio: 0.82 };
const Music = {
  enabled: store.get('music', true),
  level: clamp(store.get('musicVol', 0.85), 0, 1),
  els: {}, missing: {}, cur: null, paused: false, duckMul: 1, pendingKey: null,
  fades: [], fadeTimer: 0, jingleTimer: 0,
  /* nombres de archivo aceptados por pista: primero los del pack (LEER-ME), luego los de la lista; con espacios o guiones bajos */
  candidates(key) {
    const extra = MUSIC_ALIAS[key] || (key.indexOf('map_') === 0 ? MUSIC_ALIAS.map_bastion : []);
    const names = extra.concat(MUSIC_FILES[key] ? [MUSIC_FILES[key]] : []);
    const out = [];
    for (const n of names) for (const f of [n, n.replace(/ /g, '_')]) { const emb = (window.AUDIO_FILES || {})['music/' + f]; if (emb && out.indexOf(emb) < 0) out.push(emb); for (const u of [encodeURI(MUSIC_DIR + f), MUSIC_DIR + f]) if (out.indexOf(u) < 0) out.push(u); }
    return out.filter(u => u.indexOf('data:') === 0).concat(out.filter(u => u.indexOf('data:') !== 0));
  },
  el(key) {
    let a = this.els[key];
    if (!a) {
      a = new Audio(); a.preload = 'auto'; a.loop = !MUSIC_JINGLES[key]; a.volume = 0;
      a._cand = 0; a._key = key;
      a.addEventListener('error', () => this._nextCandidate(a, a.src));
      a.src = this.candidates(key)[0];
      this.els[key] = a;
    }
    return a;
  },
  /* un nombre fallido pasa al siguiente una sola vez: si ya se cambió, el aviso antiguo se ignora */
  _nextCandidate(a, failedSrc) {
    if (!a._key || this.missing[a._key]) return;
    if (failedSrc && failedSrc !== a.src) return;
    const list = this.candidates(a._key);
    a._cand++;
    if (a._cand < list.length) {
      a.src = list[a._cand]; a.load();
      if (a._want) this._play(a, a._key);   /* si la pista debía sonar, suena con el nombre bueno */
    } else this.missing[a._key] = true;
  },
  preloadAudio(keys) {
    for (const k of keys) {
      if (!MUSIC_FILES[k] || this.missing[k]) continue;
      try { this.el(k).load(); } catch (e) { this.missing[k] = true; }
    }
  },
  _play(a, key) {
    const src = a.src;
    a._want = true;
    let p;
    try { p = a.play(); } catch (e) { this._nextCandidate(a, src); return; }
    if (p && p.then) p.then(() => { if (this.pendingKey === key) this.pendingKey = null; }, err => {
      if (err && err.name === 'NotAllowedError') this.pendingKey = key;
      else if (err && err.name !== 'AbortError') this._nextCandidate(a, src);
    });
  },
  target(key) { return this.level * this.duckMul * (MUSIC_GAIN[key] || 1) * MUSIC_SOFT; },
  playMusic(key, opts = {}) {
    if (!MUSIC_FILES[key]) return;
    const fade = opts.fade != null ? opts.fade : 0.8;
    if (this.cur === key && !this.paused) return;
    if (this.cur === key && this.paused) { this.resumeMusic(); return; }
    const prev = this.cur ? this.els[this.cur] : null;
    this.cur = key; this.paused = false;
    if (!this.enabled) { if (prev) prev.pause(); this.paused = true; return; }
    if (prev) this.fadeOut(prev, fade);
    if (this.missing[key]) return;
    const a = this.el(key);
    a.volume = 0;
    this._play(a, key);
    this.fadeTo(a, this.target(key), fade);
  },
  crossfade(key, sec = 1) { this.playMusic(key, { fade: sec }); },
  fadeOut(el, dur) { this.fades = this.fades.filter(f => f.el !== el); this.fades.push({ el, from: el.volume, to: 0, dur: Math.max(0.05, dur), t0: performance.now(), pauseAtEnd: true }); this._tick(); },
  fadeTo(el, to, dur) { this.fades = this.fades.filter(f => f.el !== el); this.fades.push({ el, from: el.volume, to, dur: Math.max(0.05, dur), t0: performance.now(), pauseAtEnd: false }); this._tick(); },
  _tick() {
    if (this.fadeTimer || !this.fades.length) return;
    this.fadeTimer = setInterval(() => {
      const now = performance.now();
      this.fades = this.fades.filter(f => {
        const k = Math.min(1, (now - f.t0) / (f.dur * 1000));
        f.el.volume = clamp(f.from + (f.to - f.from) * k, 0, 1);
        if (k >= 1) { if (f.pauseAtEnd) f.el.pause(); return false; }
        return true;
      });
      if (!this.fades.length) { clearInterval(this.fadeTimer); this.fadeTimer = 0; }
    }, 40);
  },
  pauseMusic() {
    this.fades = [];
    for (const k in this.els) { this.els[k]._want = false; if (!this.els[k].paused) this.els[k].pause(); }
    if (this.cur) this.paused = true;
  },
  resumeMusic() {
    if (!this.cur || !this.paused || !this.enabled) return;
    const a = this.els[this.cur]; if (!a) return;
    this.paused = false; a.volume = clamp(this.target(this.cur), 0, 1); this._play(a, this.cur);
  },
  stopMusic(fade = 0.6) {
    if (this.cur && this.els[this.cur]) this.fadeOut(this.els[this.cur], fade);
    this.cur = null; this.paused = false;
  },
  setEnabled(on) {
    this.enabled = !!on; store.set('music', this.enabled);
    if (!this.enabled) { this.pauseMusic(); return; }
    if (this.cur) { this.paused = true; this.resumeMusic(); }
  },
  jingle(key, onEnd) {
    const done0 = () => { if (typeof onEnd === 'function') onEnd(); };
    if (!MUSIC_FILES[key] || !this.enabled || this.missing[key]) { done0(); return; }
    const a = this.el(key);
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true; clearTimeout(this.jingleTimer);
      this.duckMul = 1; this.applyVolume(); done0();
    };
    this.duckMul = 0.35; this.applyVolume();
    a.currentTime = 0; a.volume = clamp(this.level * (MUSIC_GAIN[key] || 1) * MUSIC_SOFT, 0, 1);
    a.addEventListener('ended', finish, { once: true });
    clearTimeout(this.jingleTimer);
    this.jingleTimer = setTimeout(finish, 15000);
    this._play(a, key);
  },
  applyVolume() {
    const k = this.cur, a = k && this.els[k];
    if (a && !this.fades.some(f => f.el === a)) a.volume = clamp(this.target(k), 0, 1);
  },
  unlockAudio() {
    if (this.pendingKey) { const k = this.pendingKey; this._play(this.el(k), k); }
    else if (this.cur && this.enabled && !this.paused) { const a = this.els[this.cur]; if (a && a.paused) this._play(a, this.cur); }
  },
  bindUnlock() {
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => this.unlockAudio(), { passive: true }));
  }
};
Music.play = Music.playMusic; Music.preload = Music.preloadAudio; Music.unlock = Music.unlockAudio;

/* diagnóstico de audio: muestra en pantalla qué pista se encuentra, si se carga y qué responde el sistema al reproducirla */
Music.diagnose = async function () {
  const lines = [];
  lines.push('Entorno: ' + (location.protocol || '?') + ' · ' + (/\bwv\b/.test(navigator.userAgent) ? 'app (WebView)' : 'navegador'));
  lines.push('AudioContext: ' + ((typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') ? 'sí' : 'no'));
  lines.push('Música activada: ' + (Music.enabled ? 'sí' : 'no') + ' · Efectos: ' + (Sound.sfxOn ? 'sí' : 'no'));
  lines.push('Pista esperando un toque: ' + (Music.pendingKey ? Music.pendingKey : 'ninguna'));
  const probe = url => new Promise(res => {
    const a = new Audio(); let done = false;
    const fin = txt => { if (done) return; done = true; clearTimeout(t); a.removeAttribute('src'); res(txt); };
    const t = setTimeout(() => fin('tiempo agotado (4 s sin respuesta)'), 4000);
    a.addEventListener('canplaythrough', () => fin('cargado'));
    a.addEventListener('loadeddata', () => fin('cargado'));
    a.addEventListener('error', () => fin('no se puede leer (código ' + (a.error ? a.error.code : '?') + ')'));
    a.preload = 'auto'; a.src = url;
  });
  const nombre = url => { try { return decodeURIComponent(url).split('/').pop(); } catch (_) { return url; } };
  lines.push('Página: ' + location.href.slice(0, 90));
  lines.push('Archivo de menú en la app: ' + (await httpInfo(Music.candidates('menu')[0] || '')));
  let primera = null;
  for (const key of ['menu', 'map_bastion']) {
    const urls = Music.candidates(key);
    if (!urls.length) { lines.push('Pista ' + key + ': sin nombre de archivo'); continue; }
    let ok = null, ultimo = '';
    for (const u of urls) { const r = await probe(u); ultimo = nombre(u) + ': ' + r; if (r === 'cargado') { ok = u; break; } }
    lines.push('Pista ' + key + ': ' + (ok ? nombre(ok) + ' cargada' : 'no encontrada (' + ultimo + ')'));
    if (ok && !primera) primera = ok;
  }
  const sfx = AUDIO.sfx.click ? Sound.file('sfx', AUDIO.sfx.click) : null;
  if (sfx) lines.push('Efecto de botón: ' + (await probe(sfx)));
  if (primera) {
    const a = new Audio(primera);
    try { await a.play(); lines.push('Reproducir la música: SÍ suena'); a.pause(); }
    catch (e) { lines.push('Reproducir la música: NO suena → ' + (e && e.name ? e.name : 'error') + (e && e.name === 'NotAllowedError' ? ' (el sistema pide tocar la pantalla antes)' : '')); }
  } else lines.push('Reproducir la música: no hay pista cargada para probar');
  return lines;
};

/* ¿el archivo existe dentro de la app, y cuánto pesa? */
async function httpInfo(url) {
  if (!url) return 'sin ruta';
  if (url.indexOf('data:') === 0) return 'incrustada en el juego';
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) return 'NO está (HTTP ' + r.status + ')';
    const n = r.headers.get('content-length');
    return 'sí está (HTTP ' + r.status + (n ? ', ' + Math.round(n / 1024) + ' kB' : '') + ')';
  } catch (e) { return 'no se pudo comprobar (' + (e && e.name ? e.name : 'error') + ')'; }
}
