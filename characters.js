'use strict';
/* ASCENSO: se conserva únicamente el héroe original personalizable.
   Las clases adicionales fueron retiradas para mantener el equilibrio del juego. */
const CHARACTERS = Object.create(null);
function charSheet(id,file){ return 'chars/'+id+'/'+file+'.png'; }
const CHAR_ORDER=['hero','chica'];
const CHAR_LABEL={hero:'Héroe',arquero:'Arquero',mago_fuego:'Mago de fuego'};
const CHAR_DESC={hero:'Tirachinas de precisión: carga el disparo y apunta manualmente.',arquero:'Flechas rápidas que atraviesan a un enemigo más.',mago_fuego:'Llamas que queman al enemigo.'};
CHARACTERS.arquero = { id: 'arquero', name: 'Arquero', ability: 'Flecha arcana', abilityText: 'Dispara flechas rápidas que atraviesan a un enemigo más. Misma recarga que el tirachinas.', fw: 78, fh: 78, targetH: 56, frames: {"idle": 2, "walk": 4, "attack1": 7, "hit": 4, "death": 4, "jump": 1, "fall": 1}, shot: 'arrow', dmg: 2, speed: 520, life: 1.2 };
CHARACTERS.mago_fuego = { id: 'mago_fuego', name: 'Mago de fuego', ability: 'Llama', abilityText: 'Escupe una llama que quema al enemigo. Misma recarga que el tirachinas.', fw: 94, fh: 94, targetH: 56, frames: {"idle": 8, "walk": 8, "attack1": 8, "hit": 4, "death": 5, "jump": 1, "fall": 1}, shot: 'fire', dmg: 2, speed: 340, life: 1.4 };
/* desbloqueos: el arquero sale al derrotar al jefe con escudo; los magos salen al derrotar a la bruja (con probabilidad) */
const CHAR_UNLOCK_KEY = 'charUnlocks';
const Chars = {
  has(id) { return id === 'hero' || id === 'chica'; },
  grant(id) { if (!CHARACTERS[id]) return false; const u = store.get(CHAR_UNLOCK_KEY, null) || {}; if (u[id]) return false; u[id] = true; store.set(CHAR_UNLOCK_KEY, u); return true; },
  /* el personaje que se usa ahora (solo si ya está desbloqueado) */
  resolve() { const id = store.get('char', 'hero'); return CHARACTERS[id] && this.has(id) ? id : 'hero'; },
  /* el tirachinas y su recarga: el héroe y los personajes nuevos */
  usesSling(id) { return (id || 'hero') === 'hero' || id === 'chica' || !!CHARACTERS[id]; },
  /* devuelve los nombres de los personajes que se desbloquean con este jefe */
  onBossDown(kind) { return []; },
};

/* cada animación se busca en su propio archivo: chars/<id>/<nombre>.png */
for (const k of ['arquero', 'mago_fuego']) CHARACTERS[k].files = Object.fromEntries(Object.keys(CHARACTERS[k].frames).map(n => [n, n]));

/* icono del botón de habilidad: uno por personaje; el héroe conserva la honda */
let _skillOrig = null;
const SKILL_SVG = {
  arrow: '<svg viewBox="0 0 24 24"><path d="M2.5 12h15.5M13.5 7.5l5 4.5-5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 12l-1.8-3.2M2.5 12l-1.8 3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2.5c1 4 5.2 6.2 5.2 11.2a5.2 5.2 0 0 1-10.4 0c0-2.6 1.5-4.2 2.6-5.2.5 2.1 1.5 3.2 2.6 3.7C11.5 8.2 11 5.4 12 2.5z" fill="currentColor"/></svg>'
};
function setSkillIcon(id) {
  const puck = document.querySelector('#touch .sp-puck'); if (!puck) return;
  if (_skillOrig === null) _skillOrig = puck.innerHTML;
  puck.innerHTML = SKILL_SVG[id] || _skillOrig;
}

/* proyectiles de personajes: misma física que la bola del tirachinas (gravedad, rebote, alcance limitado) */
CHARACTERS.arquero.scale = 0.9825; Object.assign(CHARACTERS.arquero, { grav: 340, bounces: 1, pierce: 1, life: 3.0 });
CHARACTERS.mago_fuego.scale = 1.0; Object.assign(CHARACTERS.mago_fuego, { grav: 40, bounces: 0, pierce: 0, life: 3.0 });
/* poses corregidas: en el arquero idle y run estaban invertidos; en los magos correr era una sola imagen */
CHARACTERS.arquero.files.idle = 'idle'; CHARACTERS.arquero.frames.idle = 2;
CHARACTERS.arquero.files.run = 'run'; CHARACTERS.arquero.frames.run = 8;
CHARACTERS.mago_fuego.files.run = 'walk'; CHARACTERS.mago_fuego.frames.run = 8;
/* poses de salto de los magos (fuente: hojas subidas), con anclaje por pies */
CHARACTERS.mago_fuego.frames.jump = 3; CHARACTERS.mago_fuego.frames.fall = 1; CHARACTERS.mago_fuego.files.jump = 'jump'; CHARACTERS.mago_fuego.files.fall = 'fall';
/* alcance: la mitad del ancho del escenario, medida desde el lanzador */
function charRange(g) { const a = g && g.world && g.world.arena; return 0.5 * (a ? a.w : 444); }
/* skin del arquero (ArcherHero): cuadros de 64 px en su propio canvas */
CHARACTERS.arquero.scale = 1.8065;
CHARACTERS.arquero.frames.walk = 8; CHARACTERS.arquero.files.walk = 'walk';
CHARACTERS.arquero.frames.jump = 8; CHARACTERS.arquero.files.jump = 'jump';
CHARACTERS.arquero.frames.fall = 2; CHARACTERS.arquero.files.fall = 'fall';
CHARACTERS.arquero.frames.atk = 8; CHARACTERS.arquero.files.atk = 'atk';
CHARACTERS.arquero.frames.attack1 = 8; CHARACTERS.arquero.files.attack1 = 'attack1';
CHARACTERS.arquero.frames.attack2 = 3; CHARACTERS.arquero.files.attack2 = 'attack2';
CHARACTERS.arquero.frames.hit = 1; CHARACTERS.arquero.files.hit = 'hit';
CHARACTERS.arquero.frames.die = 8; CHARACTERS.arquero.files.die = 'die';
CHARACTERS.arquero.frames.death = 8; CHARACTERS.arquero.files.death = 'death';
/* habilidades equipables con el botón del tirachinas (desbloqueadas por crafteo) */
/* habilidades: solo sus datos de disparo (ya no dependen de los personajes viejos; los valores son los mismos) */
const SKILLS = {
  arrow: { name: 'Flecha arcana', shot: 'arrow', dmg: 2, speed: 520, life: 3, grav: 340, bounces: 1, pierce: 1 },
  fire: { name: 'Llama', shot: 'fire', dmg: 2, speed: 340, life: 3, grav: 40, bounces: 0, pierce: 0 }
};
/* juegos de efectos de los disparos: cada receta de crafteo elige uno (p = prefijo de cuadros, n = cantidad) */
const FX_SET_FRAMES = {
  fuego: { p: 'fx/fire_', n: 6, size: 52 }, hielo: { p: 'fx/frost_', n: 9, size: 46 },
  circulo: { p: 'fx/circle_', n: 10, size: 50 }, rayo: { p: 'fx/rayo_', n: 8, size: 56 }, luz: { p: 'fx/luz_', n: 10, size: 56 }, veneno: { p: 'fx/veneno_', n: 7, size: 50 }, destello: { p: 'fx/destello_', n: 18, size: 54 }, anillo: { p: 'fx/anillo_', n: 9, size: 60 },
  explosion_wills: { p: 'fx/explosion_wills_', n: 14, size: 62 }, golpe_hit: { p: 'fx/golpe_hit_', n: 12, size: 54 }
};
