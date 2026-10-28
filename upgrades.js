'use strict';
/* =====================================================================
   ASCENSO · mejoras de la partida (roguelite del modo oleadas).
   Cada mejora tiene 3 niveles: tomarla otra vez sube su nivel y cambia su efecto.
   Tres mejoras de la misma familia activan una sinergia.
   ===================================================================== */
const RARITY = {
  comun: { name: 'Común', col: '#cfd8e3', w: 60 },
  rara: { name: 'Rara', col: '#7af06a', w: 30 },
  epica: { name: 'Épica', col: '#ffd34a', w: 10 }
};
const CATS = {
  espada: { name: 'Espada', col: '#ff8a3d', bonus: 'Sinergia de espada: +10 de alcance y +10 % de crítico.' },
  tirachinas: { name: 'Tirachinas', col: '#4ad0ff', bonus: 'Sinergia de tirachinas: recarga un 15 % más rápida.' },
  defensa: { name: 'Defensa', col: '#7af06a', bonus: 'Sinergia de defensa: +1 corazón y +1 bloqueo.' },
  fortuna: { name: 'Fortuna', col: '#ffd34a', bonus: '' }
};
const UPGRADES = [
  { id: 'espada_ancha', name: 'Espada ancha', cat: 'espada', rarity: 'comun', max: 3, desc: ['Tu espada golpea a más distancia.', 'Más alcance de espada.', 'Alcance máximo de la espada.'] },
  { id: 'golpe_critico', name: 'Golpe crítico', cat: 'espada', rarity: 'rara', max: 3, desc: ['+15 % de probabilidad de golpe crítico.', '+30 % de golpe crítico.', '+45 % de golpe crítico.'] },
  { id: 'vampirismo', name: 'Vampirismo', cat: 'espada', rarity: 'rara', max: 3, desc: ['Cada enemigo derrotado puede curarte.', 'Cura más seguido al derrotar enemigos.', 'Cura casi siempre al derrotar enemigos.'] },
  { id: 'parry_cd', name: 'Parry veloz', cat: 'espada', rarity: 'rara', max: 3, desc: ['El parry vuelve antes.', 'El parry vuelve mucho antes.', 'El parry casi no se enfría.'] },
  { id: 'tiro_doble', name: 'Tiro doble', cat: 'tirachinas', rarity: 'epica', max: 3, desc: ['La tirachinas lanza dos bolitas en abanico.', 'Dos bolitas con un rebote más.', 'Dos bolitas, rebote extra y recarga más rápida.'] },
  { id: 'tiro_rapido', name: 'Tiro rápido', cat: 'tirachinas', rarity: 'comun', max: 3, desc: ['La tirachinas se recarga un 30 % más rápido.', 'Recarga aún más rápida.', 'Recarga muy rápida.'] },
  { id: 'bolita_rebote', name: 'Bolita rebotona', cat: 'tirachinas', rarity: 'rara', max: 3, desc: ['La bolita rebota una vez más.', 'La bolita rebota dos veces más.', 'La bolita rebota tres veces más.'] },
  { id: 'escudo', name: 'Escudo', cat: 'defensa', rarity: 'comun', max: 3, desc: ['Un bloqueo extra. Se recarga cada 20 s.', 'Dos bloqueos extra.', 'Tres bloqueos extra.'] },
  { id: 'corazon_extra', name: 'Corazón extra', cat: 'defensa', rarity: 'rara', max: 3, desc: ['+1 corazón máximo y curación completa.', '+2 corazones máximos.', '+3 corazones máximos.'] },
  { id: 'salto_explosivo', name: 'Salto explosivo', cat: 'defensa', rarity: 'epica', max: 1, desc: ['Al saltar, empuja a los enemigos cercanos.'] },
  { id: 'pisoton_potenciado', name: 'Pisotón potenciado', cat: 'defensa', rarity: 'comun', max: 3, desc: ['Al pisar enemigos, rebotas más alto.', 'Rebotas aún más alto.', 'Rebotas muy alto.'] },
  { id: 'suerte', name: 'Suerte', cat: 'fortuna', rarity: 'comun', max: 3, desc: ['Más probabilidad de materiales raros.', 'Aún más probabilidad de materiales raros.', 'Muchísima más probabilidad de materiales raros.'] }
];
const Upgrades = {
  count(G, id) { return G.run ? G.run.ups.filter(x => x === id).length : 0; },
  available(G) { return UPGRADES.filter(u => this.count(G, u.id) < u.max); },
  /* n mejoras distintas, con más probabilidad para las comunes */
  pick(G, n) {
    const pool = this.available(G).slice(), out = [];
    while (out.length < n && pool.length) {
      const tot = pool.reduce((s, u) => s + RARITY[u.rarity].w, 0);
      let v = Math.random() * tot, idx = 0;
      for (let i = 0; i < pool.length; i++) { v -= RARITY[pool[i].rarity].w; if (v <= 0) { idx = i; break; } }
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  },
  /* aplica la mejora tomada: el nivel nuevo decide el efecto */
  apply(id, G) {
    G.run.ups.push(id);
    const lvl = this.count(G, id), p = G.player, m = G.mods;
    switch (id) {
      case 'espada_ancha': m.attackRange += 10; break;
      case 'golpe_critico': m.crit += 0.15; break;
      case 'vampirismo': m.lifesteal = [0.2, 0.35, 0.5][lvl - 1]; break;
      case 'parry_cd': m.parryCdReduction = Math.min(1, (m.parryCdReduction || 0) + 0.3); break;
      case 'tiro_doble': m.multi = 2; if (lvl >= 2) m.bounces += 1; if (lvl >= 3) m.reloadMul *= 0.85; break;
      case 'tiro_rapido': m.reloadMul *= 0.7; break;
      case 'bolita_rebote': m.bounces += 1; break;
      case 'escudo': G.shield.charges += 1; m.shieldRegen = true; break;
      case 'corazon_extra': p.maxHp += 1; p.hp = p.maxHp; break;
      case 'salto_explosivo': m.explosive = true; break;
      case 'pisoton_potenciado': m.bounceMul += 0.3; break;
      case 'suerte': m.luck += 1; break;
    }
    this.checkSynergy(G);
  },
  /* sinergia: al tener 3 mejoras distintas de una misma familia, se activa su bono (una sola vez por partida) */
  checkSynergy(G) {
    G.run.syn = G.run.syn || {};
    for (const cat of ['espada', 'tirachinas', 'defensa']) {
      const distintas = UPGRADES.filter(u => u.cat === cat && this.count(G, u.id) > 0).length;
      if (distintas < 3 || G.run.syn[cat]) continue;
      G.run.syn[cat] = true;
      const m = G.mods;
      if (cat === 'espada') { m.attackRange += 10; m.crit += 0.1; }
      if (cat === 'tirachinas') m.reloadMul *= 0.85;
      if (cat === 'defensa') { G.player.maxHp += 1; G.player.hp = G.player.maxHp; G.shield.charges += 1; }
      if (G.player && typeof Feel !== 'undefined') Feel.text(G.player.x, G.player.y - 80, '¡Sinergia de ' + CATS[cat].name + '!', CATS[cat].col);
    }
  },
  /* dados para volver a tirar: 1 por partida */
  rerollsLeft(G) {
    if (!G.run) return 0;
    if (G.run.rerolls === undefined) G.run.rerolls = 1;
    return G.run.rerolls;
  },
  /* cada mejora tiene su propio icono (assets/img/ui/mejoras/<id>.png) */
  iconImg(up) { const k = 'ui/mejoras/' + up.id + '.png'; const src = (window.ASSETS || {})[k] || ('assets/img/' + k); return '<img class="upIcon" alt="" src="' + src + '">'; }
};

/* =====================================================================
   RAMAS (antes santuario): árbol de habilidades que se llena con ascendencia energética.
   Los jefes sueltan ascendencia (de 2 a 7). Cada nodo cuesta de 18 a 40 para desbloquearse;
   cada nivel extra (hasta 3) sube su buff un 6 % del valor base.
   ===================================================================== */
const RAMAS_BRANCH = {
  espada: { name: 'Espada', icon: 'emblem_espada', pos: [10, 12] },
  honda: { name: 'Honda', icon: 'emblem_honda', pos: [90, 12] },
  escudo: { name: 'Escudo', icon: 'emblem_escudo', pos: [10, 88] },
  arcana: { name: 'Arcana', icon: 'emblem_arcana', pos: [90, 88] }
};
const RAMAS_NODES = [
  { id: 'filo', branch: 'espada', name: 'Filo afilado', icon: 'nodo_filo_afilado', cost: 18, pos: [26, 14], parents: [], fx: 'swDmg', base: 8, txt: '+8 % de daño de espada' },
  { id: 'alcance', branch: 'espada', name: 'Alcance', icon: 'nodo_alcance', cost: 24, pos: [14, 27], parents: ['filo'], fx: 'swRange', base: 6, txt: '+6 % de alcance de espada' },
  { id: 'golpe_critico', branch: 'espada', name: 'Golpe crítico', icon: 'nodo_golpe_critico', cost: 24, pos: [36, 27], parents: ['filo'], fx: 'crit', base: 12, txt: '+12 % de golpe crítico' },
  { id: 'golpe_rapido', branch: 'espada', name: 'Golpe rápido', icon: 'nodo_golpe_rapido', cost: 30, pos: [10, 40], parents: ['alcance'], fx: 'swSpeed', base: 12, txt: '+12 % de velocidad de espada' },
  { id: 'vampirismo', branch: 'espada', name: 'Vampirismo', icon: 'nodo_vampirismo', cost: 30, pos: [30, 40], parents: ['golpe_critico'], fx: 'lifesteal', base: 6, txt: '+6 % de robo de vida' },
  { id: 'corte_doble', branch: 'espada', name: 'Corte doble', icon: 'nodo_corte_doble', cost: 40, pos: [20, 40], parents: ['golpe_rapido', 'vampirismo'], fx: 'swDouble', base: 20, txt: '+20 % de probabilidad de golpe doble' },
  { id: 'recarga', branch: 'honda', name: 'Recarga', icon: 'nodo_recarga', cost: 18, pos: [74, 14], parents: [], fx: 'reload', base: 8, txt: '+8 % de recarga de la honda' },
  { id: 'potencia', branch: 'honda', name: 'Potencia', icon: 'nodo_potencia', cost: 24, pos: [86, 27], parents: ['recarga'], fx: 'ballSpeed', base: 12, txt: '+12 % de velocidad de la bola' },
  { id: 'rebote', branch: 'honda', name: 'Rebote', icon: 'nodo_rebote', cost: 24, pos: [64, 27], parents: ['recarga'], fx: 'ballBounce', base: 6, txt: '+6 % de probabilidad de rebote extra' },
  { id: 'tiro_doble', branch: 'honda', name: 'Tiro doble', icon: 'nodo_tiro_doble', cost: 30, pos: [90, 40], parents: ['potencia'], fx: 'multi', base: 20, txt: '+20 % de probabilidad de bola extra' },
  { id: 'piedra_perforante', branch: 'honda', name: 'Piedra perforante', icon: 'nodo_piedra_perforante', cost: 30, pos: [70, 40], parents: ['rebote'], fx: 'ballDmg', base: 6, txt: '+6 % de probabilidad de +1 de daño' },
  { id: 'tiro_certero', branch: 'honda', name: 'Tiro certero', icon: 'nodo_tiro_certero', cost: 36, pos: [80, 40], parents: ['tiro_doble', 'piedra_perforante'], fx: 'ballDmg', base: 12, txt: '+12 % de probabilidad de +1 de daño con la bola' },
  { id: 'resistencia', branch: 'escudo', name: 'Resistencia', icon: 'nodo_resistencia', cost: 18, pos: [26, 86], parents: [], fx: 'parryDur', base: 8, txt: '+8 % de duración del escudo' },
  { id: 'regeneracion', branch: 'escudo', name: 'Regeneración', icon: 'nodo_regeneracion', cost: 24, pos: [14, 73], parents: ['resistencia'], fx: 'parryCd', base: 6, txt: '+6 % de recarga del escudo' },
  { id: 'corazon', branch: 'escudo', name: 'Corazón', icon: 'nodo_corazon', cost: 24, pos: [36, 73], parents: ['resistencia'], fx: 'restHeal', base: 20, txt: '+20 % de probabilidad de curar al descansar' },
  { id: 'pisoton', branch: 'escudo', name: 'Pisotón', icon: 'nodo_pisoton', cost: 30, pos: [10, 60], parents: ['regeneracion'], fx: 'bounceMul', base: 12, txt: '+12 % de rebote al pisar' },
  { id: 'empuje', branch: 'escudo', name: 'Empuje', icon: 'nodo_empuje', cost: 30, pos: [30, 60], parents: ['corazon'], fx: 'swKnock', base: 6, txt: '+6 % de probabilidad de empujar al enemigo' },
  { id: 'movimiento', branch: 'escudo', name: 'Movimiento', icon: 'nodo_movimiento', cost: 36, pos: [20, 60], parents: ['pisoton', 'empuje'], fx: 'runSpeed', base: 8, txt: '+8 % de velocidad de carrera' },
  { id: 'flecha_arcana', branch: 'arcana', name: 'Flecha arcana', icon: 'nodo_flecha_arcana', cost: 18, pos: [74, 86], parents: [], fx: 'arrowDmg', base: 12, txt: '+12 % de probabilidad de +1 de daño con la flecha' },
  { id: 'llama', branch: 'arcana', name: 'Llama', icon: 'nodo_llama', cost: 24, pos: [86, 73], parents: ['flecha_arcana'], fx: 'fireDmg', base: 12, txt: '+12 % de probabilidad de +1 de daño con la llama' },
  { id: 'flecha_perforante', branch: 'arcana', name: 'Flecha perforante', icon: 'nodo_flecha_perforante', cost: 24, pos: [64, 73], parents: ['flecha_arcana'], fx: 'arrowPierce', base: 8, txt: '+8 % de probabilidad de atravesar un enemigo' },
  { id: 'llama_persistente', branch: 'arcana', name: 'Llama persistente', icon: 'nodo_llama_persistente', cost: 30, pos: [90, 60], parents: ['llama'], fx: 'fireLife', base: 6, txt: '+6 % de duración de la llama' },
  { id: 'recarga_arcana', branch: 'arcana', name: 'Recarga arcana', icon: 'nodo_recarga_arcana', cost: 30, pos: [70, 60], parents: ['flecha_perforante'], fx: 'reload', base: 20, txt: '+20 % de recarga' },
  { id: 'suerte', branch: 'arcana', name: 'Suerte', icon: 'nodo_suerte', cost: 40, pos: [80, 60], parents: ['llama_persistente', 'recarga_arcana'], fx: 'luck', base: 8, txt: '+8 % de probabilidad de materiales raros' }
];
const Ramas = {
  data() { return store.get('ramas', { pool: 0, inv: {} }); },
  save(d) { store.set('ramas', d); },
  pool() { return this.data().pool; },
  addPool(n) { const d = this.data(); d.pool += n; this.save(d); },
  node(id) { return RAMAS_NODES.find(n => n.id === id); },
  invested(id) { return this.data().inv[id] || 0; },
  level(id) { const n = this.node(id), inv = this.invested(id); return inv >= n.cost ? Math.min(3, Math.floor(inv / n.cost)) : 0; },
  unlocked(id) { return this.level(id) >= 1; },
  available(id) { const n = this.node(id); return !this.unlocked(id) && (n.parents.length === 0 || n.parents.some(p => this.unlocked(p))); },
  canPour(id) { return (this.unlocked(id) || this.available(id)) && this.level(id) < 3 && this.pool() >= 1; },
  pour(id) { if (!this.canPour(id)) return false; const d = this.data(); d.pool -= 1; d.inv[id] = (d.inv[id] || 0) + 1; this.save(d); return true; },
  capOf(id) { return this.unlocked(id) ? this.node(id).cost * 3 : this.node(id).cost; },
  valueOf(n, L) { return n.base * (1 + 0.06 * Math.max(0, L - 1)); },
  /* suma de cada efecto (en fracción) con los nodos desbloqueados */
  buffs() {
    const out = {};
    for (const n of RAMAS_NODES) { const L = this.level(n.id); if (L < 1) continue; out[n.fx] = (out[n.fx] || 0) + this.valueOf(n, L) / 100; }
    return out;
  },
  /* al empezar cada partida: aplica lo que está desbloqueado a los modificadores del jugador */
  apply(G) {
    const R = this.buffs(); G.ramas = R; const m = G.mods;
    m.attackRange += (R.swRange || 0) * 100;
    m.crit += R.crit || 0;
    m.lifesteal = (m.lifesteal || 0) + (R.lifesteal || 0);
    m.reloadMul *= (1 - (R.reload || 0));
    m.bounceMul += R.bounceMul || 0;
    m.parryCdReduction = Math.min(1, (m.parryCdReduction || 0) + (R.parryCd || 0));
    m.luck += (R.luck || 0) * 10;
  },
  /* valor de ascendencia que suelta un jefe: rango propio del jefe, con la suerte empujando hacia arriba */
  rollBossValue(kind, luck) {
    const range = { cthulhu: [5, 7], bringer: [4, 7], nightborne: [4, 6], demonio_hacha: [3, 5], cultista: [2, 4], garras: [2, 4] }[kind] || [2, 5];
    let v = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    if (Math.random() < 0.15 + 0.05 * (luck || 0)) v = range[1];
    return Math.max(2, Math.min(7, v));
  },
  /* cada valor tiene su objeto: 1 azul de burbujas, 2 azul pequeño, 3-4 llama, 5 naranja, 6 verde, 7 negro */
  orbSprite(v) { return { 1: 'energia_1', 2: 'energia_2', 3: 'energia_3_4', 4: 'energia_3_4', 5: 'energia_5', 6: 'energia_6', 7: 'energia_7' }[v] || 'energia_2'; },
  src(k) { return (window.ASSETS || {})['ui/ramas/' + k + '.png'] || ''; },
  html() {
    const lines = RAMAS_NODES.flatMap(n => n.parents.map(p => [this.node(p), n]))
      .map(([a, b]) => `<line x1="${a.pos[0]}" y1="${a.pos[1]}" x2="${b.pos[0]}" y2="${b.pos[1]}" class="rmLine${this.unlocked(a.id) ? ' on' : ''}"/>`).join('');
    const emb = Object.values(RAMAS_BRANCH).map(b => `<div class="rmEmb" style="left:${b.pos[0]}%;top:${b.pos[1]}%"><img alt="" draggable="false" src="${this.src(b.icon)}"></div>`).join('');
    const nodes = RAMAS_NODES.map(n => this.nodeHtml(n)).join('');
    return `<div class="rmTree"><svg class="rmSvg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${emb}${nodes}` +
      `<button class="rmFill" id="rmFill" style="left:50%;top:50%"><img alt="" draggable="false" src="${this.src('boton_llenar')}"></button>` +
      `<div class="rmTip" id="rmTip" hidden></div></div>`;
  },
  nodeHtml(n) {
    const L = this.level(n.id), st = L >= 1 ? 'ok' : (this.available(n.id) ? 'av' : 'lk');
    const pct = Math.min(100, Math.round(100 * this.invested(n.id) / this.capOf(n.id)));
    const badge = { ok: 'estado_desbloqueado', av: 'estado_disponible', lk: 'estado_bloqueado' }[st];
    return `<button class="rmNode ${st}" data-id="${n.id}" style="left:${n.pos[0]}%;top:${n.pos[1]}%">` +
      `<span class="rmWater" style="height:${pct}%"></span><img class="rmIco" alt="" draggable="false" src="${this.src(n.icon)}">` +
      `<img class="rmBadge" alt="" draggable="false" src="${this.src(badge)}"><span class="rmLv">${L ? 'Nv ' + L : ''}</span></button>`;
  },
  updateNode(id, root) {
    const el = root.querySelector(`.rmNode[data-id="${id}"]`); if (!el) return;
    const L = this.level(id), st = L >= 1 ? 'ok' : (this.available(id) ? 'av' : 'lk');
    el.className = 'rmNode ' + st + (el.classList.contains('sel') ? ' sel' : '');
    el.querySelector('.rmWater').style.height = Math.min(100, Math.round(100 * this.invested(id) / this.capOf(id))) + '%';
    el.querySelector('.rmBadge').src = this.src({ ok: 'estado_desbloqueado', av: 'estado_disponible', lk: 'estado_bloqueado' }[st]);
    el.querySelector('.rmLv').textContent = L ? 'Nv ' + L : '';
  },
  tipHtml(n) {
    const L = this.level(n.id), inv = this.invested(n.id), cap = this.capOf(n.id);
    const cur = L >= 1 ? this.valueOf(n, L) : n.base;
    const req = (n.parents.length && !this.unlocked(n.id) && !this.available(n.id)) ? `<div class="rmWarn">Antes desbloquea: ${n.parents.map(p => this.node(p).name).join(' o ')}</div>` : '';
    return `<b>${n.name}</b><div>${n.txt}</div>` +
      `<div class="rmRow">Actual: +${cur.toFixed(1)} % · Nivel ${L}/3</div>` +
      `<div class="rmRow">Energía: ${Math.min(inv, cap)}/${cap}</div>` +
      `<div class="rmSub">Cada nivel extra suma un 6 % al buff.</div>${req}`;
  },
  css() { return `
[hidden]{display:none!important}
.rmTree{position:relative;height:100%;aspect-ratio:1.8;max-width:100%;user-select:none;-webkit-user-select:none;touch-action:none}
.rmSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.rmLine{stroke:#55606e;stroke-width:1.4;vector-effect:non-scaling-stroke}
.rmLine.on{stroke:#ffd76a;stroke-width:2.4}
.rmEmb{position:absolute;width:clamp(40px,11vh,62px);height:clamp(40px,11vh,62px);transform:translate(-50%,-50%);pointer-events:none}
.rmEmb img{width:100%;height:100%}
.rmNode{position:absolute;width:clamp(34px,9vh,54px);height:clamp(34px,9vh,54px);transform:translate(-50%,-50%);padding:0;border:0;border-radius:50%;background:#1d1218;overflow:hidden;cursor:pointer;touch-action:none}
.rmWater{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#9fefff,#2a9fd6);opacity:.8;transition:height .2s}
.rmIco{position:absolute;left:10%;top:10%;width:80%;height:80%;pointer-events:none}
.rmBadge{position:absolute;right:-2px;bottom:-2px;width:24px;height:24px;pointer-events:none}
.rmNode.lk .rmIco{filter:grayscale(1) brightness(.55)}
.rmNode.av{box-shadow:0 0 12px #3fb6ff}
.rmNode.sel{outline:2px solid #ffd76a;outline-offset:2px}
.rmLv{position:absolute;left:0;right:0;top:0;font:700 10px Nunito,sans-serif;color:#fff;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none}
.rmFill{position:absolute;width:clamp(48px,13vh,74px);height:clamp(48px,13vh,74px);transform:translate(-50%,-50%);padding:0;border:0;background:none;cursor:pointer;touch-action:none}
.rmFill img{width:100%;height:100%;pointer-events:none}
.rmFill.pressed img{transform:translateY(2px) scale(.97)}
.rmTip{position:absolute;width:210px;padding:12px 14px;transform:translate(-50%,-100%) translateY(-30px);background:#f2dbb6;border:2px solid #8a5a34;border-radius:10px;color:#3e2514;font:600 12px Nunito,sans-serif;box-shadow:0 6px 14px rgba(0,0,0,.4);z-index:5;pointer-events:none}
.rmTip b{display:block;font-size:14px;margin-bottom:4px}
.rmRow{margin-top:3px}
.rmSub{margin-top:4px;opacity:.8}
.rmWarn{margin-top:4px;color:#a0302c;font-weight:800}
.ramasMenuBtn{display:flex;align-items:center;justify-content:center;gap:8px;font:800 15px Nunito,sans-serif;color:#ffe7a6;letter-spacing:.06em}
.ramasMenuBtn img{width:30px;height:30px;object-fit:contain}
.rmPoolHead{font:600 13px Nunito,sans-serif;color:#ffe7a6;margin-left:auto;margin-right:10px}
`; },
  /* dibuja el árbol y conecta los gestos: mantener para ver la descripción, tocar para elegir, mantener el botón central para llenar */
  bind(root) {
    if (!document.getElementById('rmCss')) { const st = document.createElement('style'); st.id = 'rmCss'; st.textContent = this.css(); document.head.appendChild(st); }
    root.innerHTML = this.html();
    let sel = null, holdT = null, pourT = null;
    const pick = id => { sel = id; root.querySelectorAll('.rmNode').forEach(x => x.classList.toggle('sel', x.dataset.id === id)); };
    const showTip = (id, el) => { const t = root.querySelector('#rmTip'); t.innerHTML = this.tipHtml(this.node(id)); t.style.left = el.style.left; t.style.top = el.style.top; t.hidden = false; };
    const hideTip = () => { const t = root.querySelector('#rmTip'); if (t) t.hidden = true; };
    const updatePool = () => { const p = document.getElementById('rmPool'); if (p) p.textContent = this.pool(); };
    const stopPour = () => { clearInterval(pourT); pourT = null; const f = root.querySelector('#rmFill'); if (f) f.classList.remove('pressed'); };
    const pourTick = () => {
      if (!sel) { stopPour(); return; }
      const was = this.unlocked(sel);
      if (!this.pour(sel)) { stopPour(); this.updateNode(sel, root); updatePool(); return; }
      updatePool();
      if (!was && this.unlocked(sel)) { stopPour(); root.innerHTML = this.html(); pick(sel); return; }
      this.updateNode(sel, root);
    };
    root.addEventListener('pointerdown', e => {
      const node = e.target.closest('.rmNode');
      if (node) { const id = node.dataset.id; pick(id); holdT = setTimeout(() => showTip(id, node), 420); return; }
      const fill = e.target.closest('#rmFill');
      if (fill) { fill.classList.add('pressed'); pourTick(); pourT = setInterval(pourTick, 120); }
    });
    const up = () => { clearTimeout(holdT); holdT = null; hideTip(); stopPour(); };
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    root.addEventListener('pointerleave', up);
  }
};
