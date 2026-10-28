'use strict';
/* =====================================================================
   ASCENSO 4.19 · materiales, botín y crafteo. 16 materiales con icono propio, en cuatro rarezas.
   Cada enemigo tiene su probabilidad de soltar algo (no todos sueltan), la suerte la sube y lo raro
   aparece menos. Craftear gasta materiales y da un efecto para la espada o el tirachinas. Un dato
   corrupto nunca rompe el juego: se valida al cargar.
   ===================================================================== */
const CRAFT_KEY = 'crafteo';
/* tier: 0 común, 1 poco común, 2 raro, 3 muy raro. w: peso del botín. La suerte sube el peso de los raros */
const MAT_DEF = {
  madera: { name: 'Madera', color: '#a0683c', file: 'mat/madera.png', w: 30, tier: 0 },
  tablon: { name: 'Tablón', color: '#c08a52', file: 'mat/tablon.png', w: 24, tier: 0 },
  cuerda: { name: 'Cuerda', color: '#d8c08a', file: 'mat/cuerda.png', w: 22, tier: 0 },
  cuero: { name: 'Cuero', color: '#9a5a32', file: 'mat/cuero.png', w: 22, tier: 0 },
  hilo: { name: 'Hilo', color: '#f0e6c8', file: 'mat/hilo.png', w: 20, tier: 0 },
  clavos: { name: 'Clavos', color: '#b8c4d6', file: 'mat/clavos.png', w: 22, tier: 0 },
  carbon: { name: 'Carbón', color: '#4a4a52', file: 'mat/carbon.png', w: 22, tier: 0 },
  hierro: { name: 'Hierro', color: '#b8c4d6', file: 'mat/hierro.png', w: 16, tier: 1 },
  cobre: { name: 'Cobre', color: '#d0764a', file: 'mat/cobre.png', w: 12, tier: 1 },
  oro: { name: 'Oro', color: '#ffd45c', file: 'mat/oro.png', w: 10, tier: 1 },
  cristal_azul: { name: 'Cristal azul', color: '#4fa8ff', file: 'mat/cristal_azul.png', w: 9, tier: 1 },
  cristal_hielo: { name: 'Cristal de hielo', color: '#b8f2ff', file: 'mat/cristal_hielo.png', w: 9, tier: 1 },
  ambar: { name: 'Ámbar', color: '#ffb347', file: 'mat/ambar.png', w: 5, tier: 2 },
  esmeralda: { name: 'Esmeralda', color: '#44d17a', file: 'mat/esmeralda.png', w: 4, tier: 2 },
  amatista: { name: 'Amatista', color: '#b07bff', file: 'mat/amatista.png', w: 4, tier: 2 },
  magma: { name: 'Magma', color: '#ff5a2a', file: 'mat/magma.png', w: 2, tier: 3 },
  gelatina_acida: { name: 'Gelatina ácida', color: '#6ee84a', file: 'mat/gelatina_acida.png', w: 12, tier: 2 },
  hueso_maldito: { name: 'Hueso maldito', color: '#b9a6ff', file: 'mat/hueso_maldito.png', w: 10, tier: 2 },
  nucleo_arcano: { name: 'Núcleo arcano', color: '#5ef0ff', file: 'mat/nucleo_arcano.png', w: 7, tier: 3 },
  piedra_tormenta: { name: 'Piedra de tormenta', color: '#ffe066', file: 'mat/piedra_tormenta.png', w: 7, tier: 3 },
};
const MAT_IDS = Object.keys(MAT_DEF);
/* probabilidad de que un enemigo suelte un material al morir (antes de la suerte). Un jefe siempre suelta */
const MAT_DROP_CHANCE = { orco: 0.2, demon: 0.25, ballestero: 0.25, arquero: 0.25, zombie: 0.22, raptor: 0.3, slime: 0.2, imp: 0.25, skeleton: 0.25, skullwolf: 0.3, gordo: 0.3, verde: 0.25, arrastre: 0.22, armadura: 0.3, escudero: 0.25, bombardero: 0.25, sanador: 0.3, camaleon: 0.3, golem: 0.4, mini_golem: 0.5, bee: 0.15 };
const CRAFT_RECIPES = [
  { id: 'chispa', weapon: 'sword', name: 'Chispas doradas', desc: 'La espada suelta chispas doradas al golpear.', cost: { oro: 1, carbon: 1 }, color: '#ffd45c' },
  { id: 'escarcha', weapon: 'sword', name: 'Escarcha', desc: 'Un rastro helado y azul tras cada golpe.', cost: { cristal_hielo: 1, cristal_azul: 1 }, color: '#8fe8ff' },
  { id: 'brasa', weapon: 'sword', name: 'Brasa violeta', desc: 'Humo y brasas violetas en cada corte.', cost: { amatista: 1, ambar: 1 }, color: '#c79bff' },
  { id: 'rayo', weapon: 'sling', name: 'Bola de rayo', desc: 'La bola deja una estela eléctrica amarilla.', cost: { cristal_azul: 1, cobre: 1 }, color: '#fff06a', fx: 'rayo' },
  { id: 'lava', weapon: 'sling', name: 'Bola de magma', desc: 'La bola arde y deja brasas naranjas.', cost: { magma: 1, carbon: 3 }, color: '#ff7a3d', fx: 'explosion_wills' },
  { id: 'hielo', weapon: 'sling', name: 'Bola de hielo', desc: 'La bola deja escarcha azul al disparar.', cost: { cristal_hielo: 1, hilo: 5 }, color: '#9be7ff', fx: 'hielo' },
  { id: 'punta_hierro', weapon: 'arrow', name: 'Punta de hierro', desc: 'La flecha lleva punta de hierro: se ve más brillante al volar.', cost: { hierro: 1, clavos: 3 }, color: '#cfe0f0', fx: 'circulo' },
  { id: 'plumas_cuero', weapon: 'arrow', name: 'Plumas de cuero', desc: 'Plumas de cuero que dejan una estela cálida.', cost: { cuero: 1, cuerda: 1 }, color: '#e6a85c', fx: 'luz' },
  { id: 'llama_lena', weapon: 'fire', name: 'Llama de leña', desc: 'La llama crepita con leña y suelta chispas.', cost: { madera: 1, tablon: 1 }, color: '#ffb347', fx: 'fuego' },
  { id: 'llama_esmeralda', weapon: 'fire', name: 'Llama esmeralda', desc: 'Una llama verde que se contagia de esmeralda.', cost: { esmeralda: 1, madera: 5 }, color: '#5cff9a', fx: 'luz' },
  { id: 'libro_flechas', weapon: 'skill', shop: true, unlock: 'arrow', name: 'Libro de flechas', desc: 'Desbloquea la habilidad Flecha: se equipa en el botón del tirachinas.', cost: { cuerda: 2, madera: 1 }, color: '#e8f7ff' },
  { id: 'libro_hechizos', weapon: 'skill', shop: true, unlock: 'fire', name: 'Libro de hechizos', desc: 'Desbloquea el hechizo de fuego como habilidad mágica.', cost: { cristal_azul: 2, ambar: 1 }, color: '#ffb347' },
  { id: 'hoja_hueso', weapon: 'sword', name: 'Hoja de hueso', desc: 'Una hoja de hueso maldito que deja un rastro violeta.', cost: { hueso_maldito: 1, hierro: 1 }, color: '#b9a6ff' },
  { id: 'punta_acida', weapon: 'arrow', name: 'Punta ácida', desc: 'La flecha gotea gelatina verde y deja un rastro tóxico.', cost: { gelatina_acida: 1, hierro: 1 }, color: '#6ee84a', fx: 'veneno' },
  { id: 'orbe_arcano', weapon: 'sling', name: 'Orbe arcano', desc: 'Una bola de luz arcana que estalla en destellos cian.', cost: { nucleo_arcano: 1, cristal_azul: 1 }, color: '#5ef0ff', fx: 'destello' },
  { id: 'tormenta', weapon: 'sling', name: 'Bala de tormenta', desc: 'La piedra electrifica la bola: rayos al impactar.', cost: { piedra_tormenta: 1, cobre: 1 }, color: '#ffe066', fx: 'rayo' },
];
const SKILL_UNLOCK = { arrow: 'libro_flechas', fire: 'libro_hechizos' };
/* qué suelta cada enemigo y cada jefe: cada tipo tiene su botín, así que farmear un tipo da unos materiales y no otros */
const MAT_TABLE = {
  orco: [['madera', 30], ['cuerda', 20], ['clavos', 15], ['hierro', 10], ['cuero', 15], ['tablon', 26], ['carbon', 5]],
  demon: [['carbon', 30], ['cobre', 20], ['cuero', 22], ['magma', 7], ['ambar', 35], ['hierro', 10], ['clavos', 10]],
  gordo: [['hierro', 35], ['cuerda', 25], ['hilo', 20], ['madera', 20]],
  verde: [['gelatina_acida', 18], ['clavos', 30], ['madera', 20], ['cuerda', 20]],
  arrastre: [['madera', 30], ['clavos', 25], ['cuerda', 25], ['hilo', 20]],
  armadura: [['hierro', 40], ['clavos', 25], ['cuerda', 20], ['madera', 15]],
  slime: [['gelatina_acida', 31], ['madera', 25], ['clavos', 20], ['cuerda', 25]],
  imp: [['hierro', 25], ['clavos', 25], ['madera', 25], ['hilo', 25]],
  skeleton: [['hueso_maldito', 15], ['clavos', 30], ['cuerda', 20], ['madera', 20]],
  skullwolf: [['hueso_maldito', 8], ['hierro', 25], ['hilo', 25], ['clavos', 20]],
  zombie: [['hueso_maldito', 10], ['hilo', 25], ['clavos', 25], ['cuerda', 15], ['hierro', 10]],
  raptor: [['hierro', 30], ['cuerda', 25], ['clavos', 25], ['hilo', 20]],
  arquero: [['hueso_maldito', 6], ['madera', 25], ['hilo', 20], ['hierro', 15], ['clavos', 15]],
  ballestero: [['cuerda', 25], ['clavos', 25], ['hierro', 20], ['madera', 15], ['hilo', 15]],
  escudero: [['hierro', 30], ['clavos', 20], ['cobre', 15], ['oro', 29], ['tablon', 43], ['carbon', 10]],
  bombardero: [['piedra_tormenta', 10], ['clavos', 20], ['cobre', 20], ['tablon', 43], ['cuerda', 15]],
  golem: [['piedra_tormenta', 19], ['hierro', 25], ['cobre', 20], ['cristal_hielo', 26], ['ambar', 17], ['carbon', 15]],
  sanador: [['hilo', 30], ['esmeralda', 31], ['amatista', 47], ['cristal_hielo', 61], ['cuero', 37]],
  camaleon: [['gelatina_acida', 10], ['esmeralda', 41], ['amatista', 65], ['cuero', 37], ['cristal_azul', 210]],
  arana: [['hilo', 40], ['cuero', 30], ['cuerda', 20], ['esmeralda', 10]],
  demonio_volador: [['piedra_tormenta', 6], ['amatista', 15], ['cobre', 15], ['cristal_azul', 15], ['magma', 10], ['ambar', 10], ['hilo', 10]],
  mini_golem: [['nucleo_arcano', 20], ['cobre', 25], ['magma', 20], ['carbon', 20], ['oro', 29]],
  bee: [['hilo', 50], ['cuero', 58], ['esmeralda', 41]],
  golem_blue: [['nucleo_arcano', 15], ['cristal_hielo', 25], ['oro', 15], ['ambar', 15], ['hierro', 10]],
  golem_orange: [['piedra_tormenta', 12], ['hierro', 25], ['oro', 20], ['magma', 10], ['carbon', 10]],
  hechicero: [['nucleo_arcano', 20], ['hilo', 20], ['esmeralda', 20], ['magma', 15], ['ambar', 10]],
  avispa_reina: [['hilo', 35], ['esmeralda', 25], ['ambar', 20], ['oro', 20]],
  caballero: [['hierro', 35], ['oro', 25], ['clavos', 20], ['cobre', 20]],
  sombra: [['amatista', 35], ['magma', 15], ['esmeralda', 25], ['cristal_azul', 25]],
  guardian_hielo: [['cristal_hielo', 40], ['cristal_azul', 30], ['esmeralda', 15], ['amatista', 15]],
  demonio_slime: [['magma', 30], ['carbon', 25], ['amatista', 20], ['ambar', 25]],
  minotauro: [['cuero', 35], ['hierro', 25], ['cobre', 20], ['clavos', 20]],
  golem_laser: [['piedra_tormenta', 15], ['cristal_azul', 25], ['oro', 20], ['magma', 15], ['hierro', 10]]
};
/* nivel de cada efecto (1 básico, 2 medio, 3 avanzado): cuanto más alto, más brillante y llamativo se ve en combate */
const RECIPE_TIER = { chispa: 1, escarcha: 2, brasa: 3, rayo: 1, lava: 3, hielo: 2 };
const craftRecipe = id => CRAFT_RECIPES.find(r => r.id === id) || null;
/* icono de cada efecto en la mesa de crafteo */
const CRAFT_ICON = { chispa: 'craft/chispa.png', escarcha: 'craft/escarcha.png', brasa: 'craft/brasa.png', rayo: 'craft/rayo.png', lava: 'craft/lava.png', hielo: 'craft/hielo.png' };
/* tienda y niveles: los libros se compran con materiales; el pergamino es un objeto aparte (no cae en el botín) */
const SHOP_ITEMS = { pergamino: { name: 'Pergamino de mejora', desc: 'Hace falta para subir de nivel una habilidad.', cost: { cuero: 1, hilo: 2 } } };
const UPGRADE_COST = { 1: { cuero: 2, cuerda: 2 }, 2: { hierro: 2, cuerda: 2 }, 3: { cobre: 2, cristal_azul: 1 }, 4: { cristal_azul: 2, ambar: 1 } };
const SKILL_LEVEL_DESC = {
  arrow: ['Flecha básica.', 'Más daño: +1 por golpe.', '+1 de daño y atraviesa 1 enemigo.', '+2 de daño y atraviesa 2 enemigos.', '+2 de daño, atraviesa 2 y dispara dos flechas en abanico.'],
  fire: ['Hechizo de fuego básico.', 'Más daño: +1 por golpe.', '+1 de daño y atraviesa 1 enemigo.', '+2 de daño y atraviesa 2 enemigos.', '+2 de daño, atraviesa 2 y lanza dos llamaradas en abanico.']
};
const Craft = {
  data: null,
  load() {
    const raw = store.get(CRAFT_KEY, null);
    const d = raw && typeof raw === 'object' ? raw : {};
    const out = { mats: {}, owned: [], equipped: { sword: null, sling: null, arrow: null, fire: null } };
    for (const m of MAT_IDS) out.mats[m] = Math.max(0, Math.min(999, Math.floor(+((d.mats || {})[m]) || 0)));
    out.owned = (Array.isArray(d.owned) ? d.owned : []).filter(id => !!craftRecipe(id));
    const eq = d.equipped || {};
    for (const w of ['sword', 'sling', 'arrow', 'fire']) {
      const id = eq[w];
      out.equipped[w] = out.owned.includes(id) && craftRecipe(id) && craftRecipe(id).weapon === w ? id : null;
    }
    const sk = d.skill; out.skill = (sk === 'arrow' || sk === 'fire') && out.owned.includes(SKILL_UNLOCK[sk]) ? sk : null;
    const lv = d.lvl || {};
    out.items = { pergamino: Math.max(0, Math.min(99, Math.floor(+((d.items || {}).pergamino) || 0))) };
    out.lvl = { arrow: Math.max(1, Math.min(5, Math.floor(+lv.arrow) || 1)), fire: Math.max(1, Math.min(5, Math.floor(+lv.fire) || 1)) };
    this.data = out;
    return out;
  },
  get() { return this.data || this.load(); },
  save() { store.set(CRAFT_KEY, this.get()); },
  addMat(m, n) {
    if (!MAT_DEF[m]) return 0;
    const d = this.get(); d.mats[m] = Math.min(999, d.mats[m] + (n || 1)); this.save(); return d.mats[m];
  },
  canCraft(id) {
    const r = craftRecipe(id), d = this.get();
    return !!r && !d.owned.includes(id) && Object.entries(r.cost).every(([m, n]) => d.mats[m] >= n);
  },
  craft(id) {
    if (!this.canCraft(id)) return false;
    const r = craftRecipe(id), d = this.get();
    for (const [m, n] of Object.entries(r.cost)) d.mats[m] -= n;
    d.owned.push(id);
    if (!d.equipped[r.weapon] && r.weapon !== 'skill') d.equipped[r.weapon] = id;
    this.save(); return true;
  },
  equip(id) {
    const r = craftRecipe(id), d = this.get();
    if (!r || !d.owned.includes(id)) return false;
    if (r.weapon === 'skill') return this.equipSkill(r.unlock);
    d.equipped[r.weapon] = d.equipped[r.weapon] === id ? null : id;
    this.save(); return true;
  },
  equipSkill(key) { const d = this.get(); if (!SKILL_UNLOCK[key] || !d.owned.includes(SKILL_UNLOCK[key])) return false; d.skill = d.skill === key ? null : key; this.save(); return true; },
  skillFor() { return this.get().skill; },
  /* nivel de una habilidad: 0 si no se tiene, 1 a 5 si se tiene */
  level(key) { const d = this.get(); return d.owned.includes(SKILL_UNLOCK[key]) ? Math.max(1, Math.min(5, d.lvl[key] || 1)) : 0; },
  /* estadísticas de disparo de una habilidad según su nivel */
  skillStats(key) {
    const base = SKILLS[key], L = Math.max(1, this.level(key) || 1), R = (typeof G !== 'undefined' && G.ramas) || {};
    return Object.assign({}, base, {
      dmg: base.dmg + [0, 1, 1, 2, 2][L - 1] + (Math.random() < (R[key === 'arrow' ? 'arrowDmg' : 'fireDmg'] || 0) ? 1 : 0),
      pierce: (base.pierce || 0) + [0, 0, 1, 2, 2][L - 1] + (key === 'arrow' && Math.random() < (R.arrowPierce || 0) ? 1 : 0),
      life: base.life * (key === 'fire' ? 1 + (R.fireLife || 0) : 1),
      multi: L === 5 ? 2 : 1, lvl: L
    });
  },
  canPay(cost) { const d = this.get(); return Object.entries(cost).every(([m, n]) => (d.mats[m] || 0) >= n); },
  pay(cost) { const d = this.get(); for (const [m, n] of Object.entries(cost)) d.mats[m] -= n; },
  canUpgrade(key) { const d = this.get(), L = this.level(key); return L > 0 && L < 5 && !!UPGRADE_COST[L] && (d.items.pergamino || 0) >= 1 && this.canPay(UPGRADE_COST[L]); },
  /* compra en la tienda: libros (con materiales) o pergamino */
  buy(id) {
    const d = this.get();
    if (id === 'pergamino') {
      if (!this.canPay(SHOP_ITEMS.pergamino.cost)) return false;
      this.pay(SHOP_ITEMS.pergamino.cost); d.items.pergamino = (d.items.pergamino || 0) + 1; this.save(); return true;
    }
    const r = craftRecipe(id);
    if (!r || !r.shop || d.owned.includes(id) || !this.canPay(r.cost)) return false;
    this.pay(r.cost); d.owned.push(id); d.lvl[r.unlock] = 1; this.save(); return true;
  },
  /* sube una habilidad un nivel: materiales del nivel actual y un pergamino */
  upgrade(key) {
    if (!this.canUpgrade(key)) return false;
    const d = this.get(), L = this.level(key);
    this.pay(UPGRADE_COST[L]); d.items.pergamino -= 1; d.lvl[key] = L + 1; this.save(); return true;
  },
  effectFor(weapon) { const id = this.get().equipped[weapon]; return id ? craftRecipe(id) : null; },
  /* un material del botín de un tipo concreto (su tabla); si no tiene tabla, un material general */
  rollMaterialFor(kind, luck) {
    const table = MAT_TABLE[kind];
    if (!table) return this.rollMaterial(luck);
    const l = Math.max(0, Math.min(3, +luck || 0));
    const ws = table.map(([id, w]) => w * (1 + 0.4 * l * (MAT_DEF[id] ? MAT_DEF[id].tier : 0)));
    let v = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < table.length; i++) { v -= ws[i]; if (v <= 0) return table[i][0]; }
    return table[table.length - 1][0];
  },
  /* un material del botín: el peso de los raros sube con la suerte (0 a 3) */
  rollMaterial(luck) {
    const l = Math.max(0, Math.min(3, +luck || 0));
    const ws = MAT_IDS.map(id => MAT_DEF[id].w * (1 + 0.4 * l * MAT_DEF[id].tier));
    let v = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < MAT_IDS.length; i++) { v -= ws[i]; if (v <= 0) return MAT_IDS[i]; }
    return MAT_IDS[MAT_IDS.length - 1];
  }
};

/* ---------- efectos en combate (4.16) ----------
   Cada efecto tiene un estilo de chispas (espada) y su color (tirachinas). Un identificador que llega por la
   red se valida: solo cuenta si existe y si es del arma que dice. */
const FX_STYLE = {
  chispa: { colors: ['#ffd45c', '#fff3a8'], n: 9, spd: 80, life: 0.45 },
  escarcha: { colors: ['#8fe8ff', '#e6fbff'], n: 8, spd: 55, life: 0.55 },
  brasa: { colors: ['#c79bff', '#7a4dd6', '#ffb3ff'], n: 8, spd: 60, life: 0.6 },
  rayo: { colors: ['#fff06a'], n: 6, spd: 40, life: 0.35 },
  lava: { colors: ['#ff7a3d', '#ffd08a'], n: 6, spd: 40, life: 0.4 },
  hielo: { colors: ['#9be7ff', '#ffffff'], n: 6, spd: 40, life: 0.4 }
};
const craftRecipeFor = (id, weapon) => {
  const r = craftRecipe(id);
  return r && r.weapon === weapon ? r : null;
};
const Fx = {
  /* destello de la espada, en la mano del personaje que golpea */
  sword(x, y, face, rec) { if (typeof Effects !== 'undefined') Effects.sword(x, y, face, rec); }
};

/* estadísticas de las partidas: el ritmo real de enemigos y materiales por minuto, para medir el botín */
const Stats = {
  get() { return store.get('stats', { runs: 0, minutes: 0, kills: 0, mats: 0 }); },
  endRun(run) { if (!run || !(run.t > 0)) return; const st = this.get(); st.runs++; st.minutes += run.t / 60; st.kills += run.kills || 0; store.set('stats', st); },
  addMat() { const st = this.get(); st.mats = (st.mats || 0) + 1; store.set('stats', st); },
  rates() { const st = this.get(); return { runs: st.runs, kills: st.minutes ? st.kills / st.minutes : 0, mats: st.minutes ? st.mats / st.minutes : 0 }; },
  line() { const r = this.rates(); return r.runs ? `Ritmo medido (${r.runs} partidas): ${r.kills.toFixed(1)} enemigos y ${r.mats.toFixed(1)} materiales por minuto` : 'Ritmo medido: juega una partida para verlo'; }
};
