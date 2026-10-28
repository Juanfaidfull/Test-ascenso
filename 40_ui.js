'use strict';
/* =====================================================================
   ASCENSO 3.0 · pantallas (DOM): menú, personaje, tabla, cuenta, salas,
   mejoras, tienda, pausa, fin de partida y HUD. Los botones sólo envían
   acciones (data-act) al juego; no cambian el estado por sí mismos.
   ===================================================================== */
const Settings = { touch: store.get('touch', 'auto'), ghosts: store.get('ghosts', true) };

/* iconos pixel-art propios (9x9) para los botones del menú: mismo trazo y mismo color que el texto */
const PIX = {
  play: ['.........', '.X.......', '.XX......', '.XXX.....', '.XXXX....', '.XXX.....', '.XX......', '.X.......', '.........'],
  swords: ['X.......X', '.X.....X.', '..X...X..', '...X.X...', '....X....', '...X.X...', '..X...X..', '.X.....X.', 'X.......X'],
  shield: ['XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....', '.........'],
  trophy: ['.XXXXXXX.', '.XXXXXXX.', '.XXXXXXX.', '..XXXXX..', '...XXX...', '...XXX...', '..XXXXX..', '..XXXXX..', '.........'],
  key: ['.........', '..XXXXX..', '.XX...XX.', '.XX...XX.', '..XXXXX..', '....X....', '....XX...', '....X.X..', '.........'],
  gear: ['...X.X...', '..XXXXX..', '.XX...XX.', 'X..XXX..X', 'X.XX.XX.X', 'X..XXX..X', '.XX...XX.', '..XXXXX..', '...X.X...']
};
const pixIcon = name => {
  const g = PIX[name]; if (!g) return '';
  let r = ''; g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'X') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; });
  return `<span class="ico"><svg viewBox="0 0 9 9" aria-hidden="true" fill="currentColor">${r}</svg></span>`;
};
const UI = {
  root: null, act: null, heroLoop: null, heroRaf: 0, hudCache: {},
  /* el tema: las piezas de assets/img/ui se pasan a variables CSS (así también funcionan dentro del HTML de una pieza) */
  themeVars() {
    const u = n => `url("${(Img.get('ui/' + n + '.png') || {}).src || ''}")`;
    const r = document.documentElement.style;
    r.setProperty('--panel', u('panel')); r.setProperty('--envivo', u('envivo')); r.setProperty('--envivoM', u('envivo_marco')); r.setProperty('--hlock', u('hero_lock'));
    r.setProperty('--wood', u('wood_brown')); r.setProperty('--wood2', u('wood_green'));
    for (const k of ['calavera', 'demonio', 'llave', 'corazon', 'estrella']) r.setProperty('--pl-' + k, u('placa_' + k));
  },
  init() {
    this.themeVars(); this.craftDragInit();
    this.root = document.getElementById('ui');
    this.root.addEventListener('click', e => {
      const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
      Sound.stopAll(['click']);   /* al pulsar un botón se cortan los efectos que suenan: se sale de la pantalla (también la mejora tras un jefe) */
      Sound.unlock(); Sound.play('click', 0.6);
      if (el.dataset.act === 'pick') { el.classList.add('picked'); setTimeout(() => { if (this.act) this.act('pick', el); }, 200); return; }
      if (this.act) this.act(el.dataset.act, el);
    });
    this.root.addEventListener('input', e => { if (this.onInput) this.onInput(e); });
    /* una oferta sin monedas se sacude y explica por qué (sin romper el flujo) */
    this.root.addEventListener('pointerdown', e => {
      const of = e.target.closest('.offer.no'); if (!of) return;
      of.classList.remove('nope'); void of.offsetWidth; of.classList.add('nope');
      const m = document.getElementById('shopMsg'); if (m) m.textContent = 'Te faltan monedas para esta mejora.';
    });
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.fitCards()) : null;
    addEventListener('resize', () => this.fitCards());
    /* en Android la barra del navegador aparece y desaparece: el área visible (visualViewport) cambia sin cambiar la ventana */
    if (window.visualViewport) { visualViewport.addEventListener('resize', () => this.fitCards()); visualViewport.addEventListener('scroll', () => this.fitCards()); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.fitCards());
  },
  show(html, cls = '') {
    this.stopHeroLoop(); Demo.stop(); clearTimeout(this._outT);   /* si se estaba cerrando otra pantalla, esta la reemplaza */
    this.root.className = 'show ' + cls;
    this.root.innerHTML = '<div class="scrim"></div>' + html;
    this.paintMapThumbs(); this.fitCards(); requestAnimationFrame(() => this.fitCards());
    if (!this.watch) this.watch = setInterval(() => { if (this.root && this.root.classList.contains('show')) this.fitCards(); }, 400);
  },
  /* cada pantalla se centra en la pantalla y se reduce lo justo para caber: nunca se desplaza ni se corta.
     Se recalcula al cambiar el tamaño, al cargar las fuentes y cuando la tarjeta cambia de altura (listas, salas) */
  fitCards() {
    if (!this.root) return;
    /* la capa de pantallas ocupa exactamente el área visible del navegador */
    const vv = window.visualViewport;
    if (vv) { this.root.style.left = vv.offsetLeft + 'px'; this.root.style.top = vv.offsetTop + 'px'; this.root.style.width = vv.width + 'px'; this.root.style.height = vv.height + 'px'; }
    /* el crafteo se reparte en columnas propias: no se envuelve ni se escala como una tarjeta */
    if (this.root.querySelector('.cfWrap')) return;
    const c = this.root.querySelector('.fitRoot, .card, .menuCard');
    if (!c) return;
    let w = c.parentNode;
    if (!w.classList || !w.classList.contains('fitWrap')) {
      w = document.createElement('div'); w.className = 'fitWrap';
      c.parentNode.insertBefore(w, c); w.appendChild(c);
    }
    const left = this.root.classList.contains('left');
    w.style.maxWidth = this.root.classList.contains('stage') ? 'none' : '';   /* la escena del menú se escala entera, sin límite de ancho de la envoltura */
    const h = c.offsetHeight, cw = c.offsetWidth;
    if (h && cw) {
      const vh = vv ? vv.height : innerHeight, vw = vv ? vv.width : innerWidth;
      const s = Math.min(1, (vh - 16) / h, (vw - 16) / cw).toFixed(3);
      w.style.width = cw + 'px';   /* el envoltorio tiene el ancho real de la pantalla: así el centrado es exacto */
      w.style.left = left ? 'max(4vw, env(safe-area-inset-left, 0px))' : '50%';
      w.style.top = '50%'; w.style.position = 'absolute';
      w.style.transformOrigin = left ? '0% 50%' : '50% 50%';
      w.style.transform = (left ? 'translateY(-50%)' : 'translate(-50%, -50%)') + ' scale(' + s + ')';
    }
    if (this.ro) { this.ro.disconnect(); this.ro.observe(c); }
  },
  /* cierre animado: la pantalla se desvanece y luego se quita; si se abre otra antes, no se cierra a mitad */
  hide() {
    this.stopHeroLoop(); Demo.stop();
    const r = this.root; if (!r) return;
    clearTimeout(this._outT);
    if (!r.innerHTML || !r.classList.contains('show')) { r.className = ''; r.innerHTML = ''; return; }
    r.classList.remove('show'); r.classList.add('uiOut');
    this._outT = setTimeout(() => { r.className = ''; r.innerHTML = ''; }, 190);
  },
  esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  fmtDate(ts) { const d = new Date(ts); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); },
  localTop() { const t = store.get('top', []); return Array.isArray(t) ? t.filter(r => r && isNum(r.s, 0, 1e7)).slice(0, 10) : []; },
  syncLine() {
    if (!APP_CONFIG.cloudEnabled || !CLOUD_CONFIGURED) return 'Modo local · la nube no está configurada';
    if (!Cloud.ready()) return 'Modo local · ' + Cloud.reason;
    if (!Auth.user) return 'Modo local · inicia sesión para guardar en la nube';
    return Auth.user.name + ' · ' + CloudSave.message;
  },
  menu(best) {
    const spr = n => (Img.get('ui/' + n + '.png') || {}).src || '';
    this.show(`
      <div class="fitRoot stage menuStage">
        <div class="card menuCard">
          <div class="logo">ASCENSO</div>
          <button class="sbtn" data-act="play"><img src="${spr('btn_arcade')}" alt="ARCADE"></button>
          <div class="grid2">
            <button class="sbtn" data-act="vs"><img src="${spr('btn_multijugador')}" alt="MULTIJUGADOR"></button>
            <button class="sbtn" data-act="hero"><img src="${spr('btn_personaje')}" alt="PERSONAJE"></button>
          </div>
          <div class="grid2">
            <button class="sbtn" data-act="board"><img src="${spr('btn_tabla')}" alt="TABLA"></button>
            <button class="sbtn" data-act="account"><img src="${spr('btn_cuenta')}" alt="CUENTA"></button>
          </div>
          <button class="sbtn" data-act="craft"><img src="${spr('btn_crafteo')}" alt="CRAFTEO"></button>
          <button class="sbtn" data-act="settings"><img src="${spr('btn_ajustes')}" alt="AJUSTES"></button>
        </div>
        <div class="demoWin"><div class="demoHead"><span class="demoLive"><i></i>EN VIVO</span><span class="demoTitle">Duelo de práctica · 1 contra 1</span></div><canvas id="demoCv" class="demoCv"></canvas>
        </div>
      </div>`, 'stage');
    Demo.attach(document.getElementById('demoCv')); Demo.start();
  },
  charPreview(id, cfg) {
    this.stopHeroLoop(); this.charName(id);
    if (id === 'hero') { const rows=document.getElementById('heroRows'); if(rows) rows.classList.remove('charInfo'); this.heroRows(cfg); this.startHeroLoop(cfg); return; }
    const rows=document.getElementById('heroRows');
    if(rows){ rows.classList.add('charInfo'); rows.innerHTML=`<div class="charAbility"><b>HABILIDAD: ${this.esc(CHARACTERS[id].ability)}</b><span>${this.esc(CHARACTERS[id].abilityText)}</span></div>`; }
    const cv=document.getElementById('heroPrev'); if(!cv || !CHARACTERS[id]) return;
    const ctx=cv.getContext('2d'), c=CHARACTERS[id], im=Img.get(charSheet(id,'idle')); let on=true, raf=0; const t0=performance.now();
    const frame=()=>{ if(!on || !cv.isConnected) return; ctx.clearRect(0,0,cv.width,cv.height);
      if(Img.ready(im)){ const n=c.frames.idle, i=Math.floor((performance.now()-t0)/1000*7)%n; drawCharacterFrame(ctx,im,i,c.fh,c.fh,240,300,false,164,1); }
      raf=requestAnimationFrame(frame); };
    this.heroLoop=()=>{on=false;cancelAnimationFrame(raf);}; frame();
  },
  charName(id){ const el=document.getElementById('hcLabel'); if(el) el.textContent=CHAR_LABEL[id]||''; },
  hero(cfg) {
    const sp = n => (Img.get('ui/' + n + '.png') || {}).src || '';
    this.show(`
      <div class="hScreen">
        <div class="hLeft">
          <img class="hLeftBg" alt="" src="${sp('hero_libro')}">
          <img class="hRibbon2" alt="Personaje" src="${sp('hero_ribbon')}">
          <div class="hStage">
            <img class="hPed2" alt="" src="${sp('hero_pedestal')}">
            <canvas id="heroPrev" class="hCanvas2" width="480" height="384"></canvas>
          </div>
          <div class="hcLbl2" id="hcLabel">Héroe</div>
        </div>
        <div class="hRight">
          <p class="hTip2" id="heroTip">Elige qué pintar y el color.</p>
          <div id="heroRows" class="hRows2"></div>
          <div class="hFoot2">
            <button class="hBtn2" data-act="menu">VOLVER</button>
            <button class="hBtn2 gold" data-act="heroSave">ELEGIR</button>
          </div>
        </div>
      </div>`, 'stage');
    this.charPreview('hero', cfg);
  },
  /* libro del personaje: eliges la parte (piel, pelo, camisa, bufanda, zapatos, pantalón) y la pintas con
     cualquier color deslizando tono, color y brillo; los colores rápidos son atajos a la paleta */
  /* panel del personaje: partes, colores seleccionables de siempre (botones pequeños, sin paleta ni deslizadores) */
  /* panel del personaje: elige el personaje (héroe o guerrera), luego las partes y los colores de siempre */
  heroRows(cfg) {
    const who = store.get('char', 'hero') === 'chica' ? 'chica' : (typeof Chars !== 'undefined' && CHARACTERS[store.get('char', 'hero')] && Chars.has(store.get('char', 'hero')) ? store.get('char', 'hero') : 'hero');
    const all = [['skin', 'Piel'], ['hair', 'Pelo'], ['shirt', 'Camisa'], ['cape', 'Bufanda'], ['shoes', 'Zapatos'], ['pants', 'Pantalón']];
    const chica = [['skin', 'Piel'], ['hair', 'Pelo'], ['shirt', 'Armadura'], ['shoes', 'Botas'], ['pants', 'Falda']];
    const cats = who === 'chica' ? chica : all;
    const k = cats.some(c => c[0] === this.heroPart) ? this.heroPart : 'skin';
    this.heroPart = k;
    const label = cats.find(c => c[0] === k)[1];
    const presets = HERO_OPT[k], cur = cfg[k];
    const chars = [['hero', 'Héroe'], ['chica', 'Guerrera']].map(([id, lab]) => { const ok = typeof Chars === 'undefined' || Chars.has(id); return `<button class="hChar${id === who ? ' on' : ''}${ok ? '' : ' locked'}" data-act="heroChar" data-c="${id}"${ok ? '' : ' disabled title="Bloqueado"'}>${ok ? lab : '🔒 ' + lab}</button>`; }).join('');
    const tabs = cats.map(([id, lab]) => `<button class="hPart${id === k ? ' on' : ''}" data-act="heroPart" data-k="${id}">${lab}</button>`).join('');
    const chips = presets.map((o, i) => `<button class="chip sm${cfg[k] === i ? ' on' : ''}" data-act="heroPick" data-k="${k}" data-i="${i}" style="--c:${o.chip}" title="${this.esc(o.name)}"></button>`).join('');
    const sel = typeof cur === 'string' ? null : (presets[typeof cur === 'number' && presets[cur] ? cur : 0] || presets[0]);
    const swatch = sel ? sel.chip : cur;
    const name = sel ? this.esc(sel.name) : String(cur).toUpperCase();
    const el = document.getElementById('heroRows'); if (!el) return;
    el.innerHTML = `<div class="hCharBar">${chars}</div><div class="hPartBar">${tabs}</div>
      <div class="hPal"><span class="hSw" style="background:${swatch}"></span><span class="hPalName">${label} · ${name}</span></div>
      <div class="hPresets">${chips}</div>`;
  },
  startHeroLoop(cfg) {
    const cv = document.getElementById('heroPrev'); if (!cv) return;
    const ctx = cv.getContext('2d'); const art = artFor(store.get('char', 'hero'));
    let on = true; const t0 = performance.now();
    const frame = () => {
      if (!on || !cv.isConnected) return;
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const strips = art.strips(cfg);   /* se vuelve a pedir hasta que la hoja esté lista */
      if (strips) {
        const phase = Math.floor(t / 3.2) % 3;
        const key = phase === 0 ? 'idle' : phase === 1 ? 'walk' : 'run';
        const fps = key === 'idle' ? 6 : key === 'walk' ? 10 : 14;
        drawStrip(ctx, strips[key], frameFromAnim(t, fps, frameCount(strips[key], key), true), HERO.FW, HERO.FH, 240, 300, false, 4.4, 1);
      }
      this.heroRaf = requestAnimationFrame(frame);
    };
    this.heroLoop = () => { on = false; cancelAnimationFrame(this.heroRaf); };
    frame();
  },
  stopHeroLoop() { if (this.heroLoop) { this.heroLoop(); this.heroLoop = null; } },

  board(tab, cloudRows, cloudMsg) {
    const local = this.localTop();
    const rowsHtml = (rows, global) => rows.length ? `<table class="table"><tr><th>#</th>${global ? '<th>Jugador</th>' : ''}<th>Puntos</th><th>Altura</th><th>Enemigos</th><th>Fecha</th></tr>` +
      rows.map((r, i) => `<tr class="${i === 0 ? 'first' : ''}"><td><span class="medal">${i + 1}</span></td>${global ? `<td>${this.esc(r.username)}</td>` : ''}<td>${r.s != null ? r.s : r.score}</td><td>${(r.m != null ? r.m : r.height)} m</td><td>${r.k != null ? r.k : r.kills}</td><td>${this.fmtDate(r.d != null ? r.d : Date.parse(r.created_at) || Date.now())}</td></tr>`).join('') + '</table>'
      : '<div class="empty">Sin partidas todavía.<br>Sube tu primera plataforma.</div>';
    const body = tab === 'global' ? (cloudMsg ? `<div class="empty">${this.esc(cloudMsg)}</div>` : rowsHtml(cloudRows || [], true)) : rowsHtml(local, false);
    const canGlobal = Cloud.ready();
    this.show(`
      <div class="card">
        <h2>Tabla de ascenso</h2>
        <div class="tabs">
          <button class="tab ${tab !== 'global' ? 'on' : ''}" data-act="boardTab" data-tab="local">Este dispositivo</button>
          <button class="tab ${tab === 'global' ? 'on' : ''}" data-act="boardTab" data-tab="global" ${canGlobal ? '' : 'disabled'}>Global${canGlobal ? '' : ' (sin conexión)'}</button>
        </div>
        ${body}
        <div class="centerRow" style="margin-top:12px"><button class="btn" data-act="menu" style="width:auto;padding:12px 26px">VOLVER</button></div>
      </div>`);
  },

  settings(clearMsg) {
    const sw = (on, k) => `<button class="switch ${on ? 'on' : ''}" data-act="toggle" data-k="${k}" aria-label="${k}"></button>`;
    const touchLabel = Settings.touch === 'on' ? 'Siempre' : Settings.touch === 'off' ? 'Nunca' : 'Automático';
    this.show(`
      <div class="card ajustesCard">
        <h2>Ajustes</h2>
        <p class="sub">Sonido, controles y datos.</p>
        <div class="row"><span class="lbl">Música</span>${sw(Music.enabled, 'music')}</div>
        <div class="row"><span class="lbl">Efectos</span>${sw(Sound.sfxOn, 'sfx')}</div>
        <div class="row"><span class="lbl">Botones en pantalla: ${touchLabel}</span><button class="btn small" data-act="touchCycle">CAMBIAR</button></div>
        <div class="row"><span class="lbl">Controles: ${Controls.mode === 'joystick' ? 'Joystick' : 'Botones'}</span><button class="btn small" data-act="controlsCycle">CAMBIAR</button></div>
        <div class="row"><span class="lbl">Diseño de botones</span><button class="btn small" data-act="layoutEdit">DISEÑAR</button></div>
        <div class="row"><span class="lbl">Restablecer botones</span><button class="btn small" data-act="layoutReset">RESTABLECER</button></div>
        <div class="row"><span class="lbl">Borrar progreso</span><button class="btn small danger" data-act="resetProgress">BORRAR</button></div>
        ${clearMsg ? `<div class="hint">${this.esc(clearMsg)}</div>` : ''}
        <div class="centerRow" style="margin-top:12px"><button class="btn" data-act="menu" style="width:auto;padding:12px 26px">VOLVER</button></div>
      </div>`);
  },

  diag(lines) {
    this.show(`<div class="card"><h2>Diagnóstico de audio</h2><pre class="diagTxt">${this.esc(lines.join('\n'))}</pre><div class="centerRow" style="margin-top:12px"><button class="btn" data-act="settings" style="width:auto;padding:12px 26px">VOLVER</button></div></div>`);
  },

  account(state) {
    const u = Auth.user;
    let body;
    if (!APP_CONFIG.cloudEnabled || !CLOUD_CONFIGURED) {
      body = `<p class="sub">La nube no está configurada todavía.</p>
        <p class="hint">Pega tu URL de Supabase y tu clave ANON en <b>js/config.js</b>, luego ejecuta <b>supabase/schema.sql</b>. Mientras tanto puedes jugar como invitado.</p>`;
    } else if (!Cloud.ready()) {
      body = `<p class="sub">Sin conexión con el servicio.</p><p class="hint">${this.esc(Cloud.reason)}. Tu progreso se guarda en este dispositivo.</p>`;
    } else if (u) {
      body = `<div class="acc"><div class="accName">${this.esc(u.name)}</div><div class="hint">Cuenta de jugador</div>
        <div class="sync" id="syncLine2">${this.esc(CloudSave.message)}</div></div>
        <div class="grid2"><button class="btn" data-act="syncNow">SINCRONIZAR</button><button class="btn danger" data-act="logout">CERRAR SESIÓN</button></div>`;
    } else {
      body = `<div class="forms">
          <input id="accPass" class="inp" type="password" autocomplete="current-password" placeholder="Contraseña (6+)" maxlength="72">
          <input id="accName" class="inp" type="text" autocomplete="username" placeholder="Nombre de usuario (3 a 16)" maxlength="16" value="${this.esc(state && state.name || '')}">
        </div>
        <div class="grid2"><button class="btn primary" data-act="login" ${Auth.busy ? 'disabled' : ''}>ENTRAR</button><button class="btn" data-act="signup" ${Auth.busy ? 'disabled' : ''}>CREAR CUENTA</button></div>`;
    }
    this.show(`
      <div class="card accCard">
        <h2>Cuenta</h2>
        ${u ? '<button class="accX" data-act="menu" aria-label="Salir">✕</button>' : ''}
        ${body}
        <div class="msg" id="accMsg">${state && state.msg ? this.esc(state.msg) : ''}</div>
        ${u ? '' : '<div class="grid2" style="margin-top:12px"><button class="btn" data-act="menu">JUGAR COMO INVITADO</button><span></span></div>'}
      </div>`);
  },

  /* ---- MULTIJUGADOR (VS): menú, crear sala (con o sin contraseña), unirse (lista pública y código) y sala ---- */
  /* pantalla de crafteo: materiales guardados, recetas para la espada y el tirachinas, y el efecto equipado */
  /* ---- crafteo: pantalla copiada de la referencia (1530 × 688), escalada a cualquier pantalla ---- */
  /* ---- crafteo: inventario (arrastrar o tocar materiales), mesa con dos ranuras y lista de recetas ---- */
  craftMatch() {
    const [a, b] = this.craftSlots || [];
    if (!a || !b || a === b) return null;
    return CRAFT_RECIPES.find(r => { const k = Object.keys(r.cost); return k.length === 2 && k.includes(a) && k.includes(b); }) || null;
  },
  craftPlace(i, m) {
    if (!this.craftSlots) this.craftSlots = [null, null];
    if ((Craft.get().mats[m] || 0) <= 0) { Sound.play('error2', 0.6); return; }
    if (i == null) { i = this.craftSlots.indexOf(null); if (i < 0) return; }
    this.craftSlots[i] = m; this.craft();
  },
  craftMake() {
    const r = this.craftMatch(); if (!r) { Sound.play('error1', 0.6); return; }
    if (Craft.craft(r.id)) this.craftSlots = [null, null];
    this.craft();
  },
  /* arrastrar un material con el dedo o el ratón hasta una ranura; un toque simple lo pone en la primera ranura libre */
  craftDragInit() {
    if (this._ckDrag) return; this._ckDrag = true;
    let d = null;
    window.addEventListener('pointerdown', e => {
      const c = e.target.closest && e.target.closest('.ckCell[data-mat]');
      if (!c || c.classList.contains('zero')) return;
      d = { m: c.dataset.mat, x: e.clientX, y: e.clientY, on: false, g: null };
    });
    window.addEventListener('pointermove', e => {
      if (!d) return;
      if (!d.on && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        d.on = true; const g = document.createElement('img'); g.className = 'ckGhost'; g.alt = '';
        g.src = (Img.get('crafteo/mat_' + d.m + '.png') || {}).src || ''; document.body.appendChild(g); d.g = g;
        document.body.classList.add('ckDragging');
      }
      if (d.on) { d.g.style.left = e.clientX + 'px'; d.g.style.top = e.clientY + 'px'; }
    });
    const fin = e => {
      if (!d) return; const was = d; d = null;
      if (was.g) was.g.remove(); document.body.classList.remove('ckDragging');
      if (was.on) {
        const el = document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest && el.closest('.ckSlot[data-slot]');
        if (sl) this.craftPlace(+sl.dataset.slot, was.m);
      } else this.craftPlace(null, was.m);
    };
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', () => { if (d && d.g) d.g.remove(); d = null; document.body.classList.remove('ckDragging'); });
  },
  craft() {
    if (this.craftTab === 'shop') { this.craftShop(); return; }
    if (this.craftTab === 'ramas') { this.craftRamas(); return; }
    if (!this.craftSlots) this.craftSlots = [null, null];
    const d = Craft.get(), spr = n => (Img.get('crafteo/' + n + '.png') || {}).src || '';
    const open = this.craftInvOpen !== false;
    const orden = ['madera', 'tablon', 'cuerda', 'cuero', 'hilo', 'clavos', 'carbon', 'hierro', 'cobre', 'oro', 'cristal_azul', 'cristal_hielo', 'ambar', 'esmeralda', 'amatista', 'magma'];
    const cells = orden.map(m => { const n = d.mats[m] || 0;
      return `<div class="ckCell${n ? '' : ' zero'}" data-mat="${m}"><span class="ckCnt">x${n}</span><img alt="" src="${spr('mat_' + m)}"><span class="ckMatN">${this.esc(MAT_DEF[m].name)}</span></div>`; }).join('');
    const r = this.craftMatch(), [a, b] = this.craftSlots;
    const slot = k => { const m = this.craftSlots[k]; const need = r && m ? (r.cost[m] || 0) : 0;
      return `<div class="ckSlot" data-slot="${k}" data-act="craftSlot" data-i="${k}">` +
        (m ? `<img alt="" src="${spr('mat_' + m)}"><span class="ckSlotN">${this.esc(MAT_DEF[m].name)}</span>${need ? `<span class="ckNeed">x${need}</span>` : ''}`
           : '') + `</div>`; };
    let status = '', btn = '';
    if (!a || !b) status = '';
    else if (a === b) status = 'Necesitas dos materiales distintos.';
    else if (!r) status = 'Esa mezcla no crea ningún efecto.';
    else if (d.owned.includes(r.id)) status = 'Ya tienes este efecto: equípalo en la lista.';
    else {
      const falta = Object.entries(r.cost).filter(([m, n]) => (d.mats[m] || 0) < n).map(([m, n]) => `${n - (d.mats[m] || 0)} ${MAT_DEF[m].name}`);
      if (falta.length) status = 'Te faltan: ' + falta.join(', ') + '.';
      else { status = 'Receta lista.'; btn = '<button class="btn primary ckMake" data-act="craftMake">FABRICAR</button>'; }
    }
    const res = r ? `<img alt="" src="${spr('vista_' + r.id)}"><div class="ckResName">${this.esc(r.name)}</div>` : '';
    const rows = CRAFT_RECIPES.filter(rc => !rc.shop).map(rc => {
      const own = d.owned.includes(rc.id), eq = d.equipped[rc.weapon] === rc.id;
      const cost = Object.entries(rc.cost).map(([m, n]) => `<span class="${(d.mats[m] || 0) < n ? 'lack' : ''}"><img alt="" src="${spr('mat_' + m)}">${n} ${this.esc(MAT_DEF[m].name)}</span>`).join('');
      const act = own ? `<button class="btn ckRowBtn${eq ? ' primary' : ' ghost'}" data-act="craftEq" data-id="${rc.id}">${eq ? 'EQUIPADO' : 'EQUIPAR'}</button>` : '';
      return `<div class="ckRow"><img class="ckPrev" alt="" src="${spr('vista_' + rc.id)}"><div class="ckInfo">` +
        `<div class="ckRn">${this.esc(rc.name)} <span class="ckRw">(${({ sword: 'espada', sling: 'tirachinas', arrow: 'flecha', fire: 'llama', skill: 'habilidad' })[rc.weapon]})</span></div>` +
        `<div class="ckRd">${this.esc(rc.desc)}</div><div class="ckRc">${cost}</div></div>${act}</div>`;
    }).join('');
    this.show(`
      <div class="cfWrap ckWrap">
        <header class="ckHead">
          <img class="ckHam" alt="" src="${spr('martillo_cab')}">
          <div class="ckTitle">Crafteo</div>
          <button class="ckBtn" data-act="craftShop"><img alt="" src="${spr('tienda')}">Tienda</button>
          <button class="ckBtn${open ? ' on' : ''}" data-act="craftInv"><img alt="" src="${spr('bolsa_pestana')}">Inventario</button>
          <button class="ckBtn wood" data-act="craftBack">VOLVER</button>
                  <button class="ckBtn" data-act="craftRamas"><img alt="" src="${(Img.get('ui/ramas/emblem_arcana.png') || {}).src || ''}">Ramas</button>
        </header>
        <div class="ckBody${open ? '' : ' invOff'}">
          <section class="ckPanel ckLeft"${open ? '' : ' hidden'}>
            <div class="ckTh"><img alt="" src="${spr('bolsa_panel')}"><div><h3>Inventario</h3><p>Arrastra o toca un material para la mesa.</p><p>${Stats.line()}</p></div></div>
            <div class="ckInv">${cells}</div>
          </section>
          <section class="ckPanel ckMid">
            <div class="ckTh"><div><h3>Mesa</h3><p>Ranura 1 y ranura 2</p></div></div>
            <div class="ckResult">${res}</div>
            <div class="ckSlots">${slot(0)}${slot(1)}</div>
            <div class="ckStatus">${status}</div>${btn}
          </section>
          <section class="ckPanel ckRight">
            <div class="ckTh"><img alt="" src="${spr('martillos_panel')}"><div><h3>Recetas de crafteo</h3><p>Recetas disponibles.</p></div></div>
            <div class="ckRecipes">${rows}</div>
          </section>
        </div>
      </div>`);
  },
  craftShop() {
    const d = Craft.get(), spr = n => (Img.get('crafteo/' + n + '.png') || {}).src || '';
    const costHtml = c => Object.entries(c).map(([m, n]) => `<span class="${(d.mats[m] || 0) < n ? 'lack' : ''}"><img alt="" src="${spr('mat_' + m)}">${n} ${this.esc(MAT_DEF[m].name)}</span>`).join('');
    const bookRows = ['libro_flechas', 'libro_hechizos'].map(id => {
      const r = craftRecipe(id), own = d.owned.includes(id), can = Craft.canPay(r.cost);
      const btn = own ? '<button class="btn ghost ckRowBtn" disabled>COMPRADO</button>'
        : `<button class="btn ${can ? 'primary' : 'ghost'} ckRowBtn" data-act="shopBuy" data-id="${id}"${can ? '' : ' disabled'}>COMPRAR</button>`;
      return `<div class="ckRow"><img class="ckPrev" alt="" src="${spr(id)}"><div class="ckInfo"><div class="ckRn">${this.esc(r.name)} <span class="ckRw">(habilidad)</span></div><div class="ckRd">${this.esc(r.desc)}</div><div class="ckRc">${costHtml(r.cost)}</div></div>${btn}</div>`;
    }).join('');
    const pg = SHOP_ITEMS.pergamino, canPg = Craft.canPay(pg.cost);
    const pgRow = `<div class="ckRow"><img class="ckPrev" alt="" src="${spr('pergamino')}"><div class="ckInfo"><div class="ckRn">${this.esc(pg.name)} <span class="ckRw">(objeto)</span></div><div class="ckRd">${this.esc(pg.desc)} Tienes: ${d.items.pergamino || 0}.</div><div class="ckRc">${costHtml(pg.cost)}</div></div><button class="btn ${canPg ? 'primary' : 'ghost'} ckRowBtn" data-act="shopBuy" data-id="pergamino"${canPg ? '' : ' disabled'}>COMPRAR</button></div>`;
    const skills = ['arrow', 'fire'].map(key => {
      const L = Craft.level(key), own = L > 0, eq = d.skill === key;
      const name = key === 'arrow' ? 'Flecha' : 'Hechizo de fuego', icon = key === 'arrow' ? 'btn_flecha' : 'btn_hechizo';
      const badges = [1, 2, 3, 4, 5].map(n => `<img alt="" style="width:30px;height:30px" src="${spr(L >= n ? 'nivel_' + n : 'candado')}">`).join('');
      const now = own ? SKILL_LEVEL_DESC[key][L - 1] : 'Aún no la tienes. Cómprala en la pestaña Tienda.';
      const next = own && L < 5 ? `<div class="ckRd">Siguiente nivel: ${this.esc(SKILL_LEVEL_DESC[key][L])}</div>` : '';
      const upHtml = own && L < 5 ? `<div class="ckRc">${costHtml(UPGRADE_COST[L])} <span class="${(d.items.pergamino || 0) < 1 ? 'lack' : ''}"><img alt="" src="${spr('pergamino')}">1 Pergamino</span></div>` : '';
      const canUp = Craft.canUpgrade(key);
      const upBtn = own && L < 5 ? `<button class="btn ${canUp ? 'primary' : 'ghost'} ckRowBtn" data-act="craftUpgrade" data-skill="${key}"${canUp ? '' : ' disabled'}>MEJORAR</button>` : '';
      const eqBtn = own ? `<button class="btn ckRowBtn${eq ? ' primary' : ' ghost'}" data-act="craftSkillEq" data-skill="${key}">${eq ? 'EQUIPADO' : 'EQUIPAR'}</button>` : '';
      const maxTxt = own && L >= 5 ? '<div class="ckRd">Nivel máximo.</div>' : '';
      return `<div class="ckRow"><img class="ckPrev" alt="" src="${spr(icon)}"><div class="ckInfo">` +
        `<div class="ckRn">${name} <span class="ckRw">nivel ${L}/5</span>${eq ? ` <img alt="" style="width:22px;height:22px;vertical-align:middle" src="${spr('equipado')}">` : ''}</div>` +
        `<div style="display:flex;gap:4px;margin:4px 0">${badges}</div>` +
        `<div class="ckRd">${this.esc(now)}</div>${next}${maxTxt}${upHtml}</div>` +
        `<div class="skActs" style="display:flex;flex-direction:column;gap:6px">${eqBtn}${upBtn}</div></div>`;
    }).join('');
    this.show(`
      <div class="cfWrap ckWrap">
        <header class="ckHead">
          <img class="ckHam" alt="" src="${spr('tienda')}">
          <div class="ckTitle">Tienda</div>
          <button class="ckBtn" data-act="craftInv"><img alt="" src="${spr('bolsa_pestana')}">Inventario</button>
          <button class="ckBtn wood" data-act="craftBack">VOLVER</button>
        </header>
        <div class="ckBody">
          <section class="ckPanel ckLeft">
            <div class="ckTh"><img alt="" src="${spr('tienda')}"><div><h3>Comprar</h3><p>Se paga con materiales. Las monedas llegan en el modo invasión.</p></div></div>
            <div class="ckRecipes">${bookRows}${pgRow}</div>
          </section>
          <section class="ckPanel ckMid">
            <div class="ckTh"><img alt="" src="${spr('yunque')}"><div><h3>Herrería</h3><p>Sube de nivel tus habilidades.</p></div></div>
            <div class="ckResult"><img alt="" src="${spr('yunque')}" style="width:120px;height:120px"></div>
            <div class="ckStatus">Pergamino de mejora: ${d.items.pergamino || 0}</div>
            <div class="ckStatus">Cada mejora cuesta materiales y un pergamino.</div>
          </section>
          <section class="ckPanel ckRight">
            <div class="ckTh"><img alt="" src="${spr('martillos_panel')}"><div><h3>Habilidades</h3><p>Nivel actual y mejoras.</p></div></div>
            <div class="ckRecipes">${skills}</div>
          </section>
        </div>
      </div>`);
  },
  craftRamas() {
    const spr = n => (Img.get('crafteo/' + n + '.png') || {}).src || '';
    this.show(`<div class="cfWrap ckWrap">
        <header class="ckHead">
          <img class="ckHam" alt="" src="${(Img.get('ui/ramas/emblem_arcana.png') || {}).src || ''}">
          <div class="ckTitle">Ramas</div>
          <div class="rmPoolHead">Ascendencia: <b id="rmPool">${Ramas.pool()}</b></div>
          <button class="ckBtn" data-act="craftShop"><img alt="" src="${spr('tienda')}">Tienda</button>
          <button class="ckBtn wood" data-act="craftBack">VOLVER</button>
        </header>
        <div class="rmBody" id="rmBody" style="flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden"></div>
      </div>`);
    Ramas.bind(document.getElementById('rmBody'));
  },
  /* escala la pantalla de crafteo (1530 × 688) para que quepa entera en la pantalla, sin deformarla */
  fitCrafteo() {
    const w = this.root && this.root.querySelector('.crafteoWrap'); if (!w) return;
    const st = w.querySelector('.crafteoStage');
    st.style.setProperty('--s', Math.min(w.clientWidth / 1530, w.clientHeight / 688));
  },
  /* las tarjetas de mapa: el anfitrión elige; los invitados solo ven cuál está elegido */
  mapCardsHTML(sel, canPick) {
    return `<div class="mapGrid">${VS_MAP_ORDER.map(id => {
      const m = VS_MAPS[id], on = id === sel;
      return `<button class="mapCard${on ? ' on' : ''}" data-act="map" data-id="${id}" aria-pressed="${on}" ${canPick ? '' : 'disabled'}>` +
        `<span class="mapThumb" data-thumb="${id}"></span><span class="mapName">${this.esc(m.name)}</span>` +
        `<span class="mapDesc">${this.esc(m.desc)}</span></button>`;
    }).join('')}</div>`;
  },
  /* pinta las miniaturas de los mapas; si las imágenes aún cargan, vuelve a intentarlo */
  paintMapThumbs() {
    if (!this.root || !this.root.querySelector('[data-thumb]')) return;
    this.root.querySelectorAll('[data-thumb]').forEach(el => {
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 90;
      el.innerHTML = ''; el.appendChild(cv);
      if (!Versus.paintThumb(cv, el.dataset.thumb)) setTimeout(() => this.paintMapThumbs(), 400);
    });
  },
  vsMenu(msg) {
    this.show(`
      <div class="card">
        <h2>Multijugador</h2>
        <div class="msg" id="vsMsg">${this.esc(msg)}</div>
        <div class="grid2">
          <button class="btn primary" data-act="vsCreate">CREAR SALA (VS)</button>
          <button class="btn primary" data-act="vsBrowse">BUSCAR SALAS</button>
        </div>
        <div class="grid2" style="margin-top:8px">
          <button class="btn" data-act="vsJoinScreen">UNIRSE CON CÓDIGO</button>
          <button class="btn" data-act="menu">VOLVER</button>
        </div>
        <div class="trainBox">
          <button class="btn primary" data-act="train">ENTRENAMIENTO</button>
        </div>
      </div>`);
  },
  vsCreate(msg) {
    const m = Versus.createMode;
    this.show(`
      <div class="card wide vsCreate">
        <h2>Crear sala</h2>
        ${this.mapCardsHTML(Versus.createMap, true)}
        <div class="grid2">
          <button class="btn ${m === 2 ? 'primary' : ''}" data-act="vsMode" data-m="2">1 CONTRA 1</button>
          <button class="btn ${m === 3 ? 'primary' : ''}" data-act="vsMode" data-m="3">1 CONTRA 1 CONTRA 1</button>
        </div>
        <div class="grid2" style="margin-top:8px">
          <button class="btn primary" data-act="vsPwdMode" data-m="0">SIN CONTRASEÑA</button>
          <button class="btn" data-act="vsPwdMode" data-m="1">CON CONTRASEÑA</button>
        </div>
        <input id="vsNewPwd" class="inp" maxlength="12" autocomplete="off" placeholder="Contraseña (4 a 12)" disabled style="margin-top:8px">
        <div class="msg" id="vsMsg">${this.esc(msg)}</div>
        <div class="grid2">
          <button class="btn primary" data-act="vsCreateGo">CREAR SALA</button>
          <button class="btn" data-act="vs">VOLVER</button>
        </div>
      </div>`);
  },
  vsBrowse(msg) {
    this.show(`
      <div class="card">
        <h2>Buscar salas</h2>
        <div id="vsList"></div>
        <div class="msg" id="vsMsg">${this.esc(msg)}</div>
        <div class="grid2">
          <button class="btn" data-act="vs">VOLVER</button>
          <button class="btn" data-act="vsJoinScreen">UNIRSE CON CÓDIGO</button>
        </div>
      </div>`);
    this.vsList(Versus.roomRows());
  },
  vsJoin(msg) {
    this.show(`
      <div class="card">
        <h2>Unirse con código</h2>
        <p class="sub">Escribe el código de cuatro o cinco caracteres que te dio tu rival.</p>
        <input id="vsCode" class="inp" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="CÓDIGO">
        <div class="msg" id="vsMsg">${this.esc(msg)}</div>
        <div class="grid2">
          <button class="btn primary" data-act="vsJoin">ENTRAR</button>
          <button class="btn" data-act="vs">VOLVER</button>
        </div>
      </div>`);
  },
  vsList(rows) {
    const el = document.getElementById('vsList');
    if (!el) return;
    if (!rows.length) { el.innerHTML = '<p class="sub">No hay salas abiertas ahora. Crea una o espera a que alguien abra una.</p>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0">
        <span class="lbl">${this.esc(r.code)} · ${this.esc(r.host)} · gana a ${r.rounds} · ${r.players}/${r.mode} · ${this.esc((VS_MAPS[r.mapId] || {}).name || '')} ${r.pwd ? '<span style="display:inline-block;width:14px;height:14px;vertical-align:-2px">' + ICON.lock + '</span>' : ''}</span>
        ${r.players < r.mode ? `<button class="btn small primary" data-act="vsJoinRow" data-code="${this.esc(r.code)}" data-pwd="${r.pwd ? 1 : 0}">UNIRSE</button>` : '<button class="btn small" disabled>LLENA</button>'}
      </div>`).join('');
  },
  vsPwd(code, msg) {
    this.show(`
      <div class="card">
        <h2>Contraseña</h2>
        <p class="sub">La sala ${this.esc(code)} pide contraseña.</p>
        <input id="vsPwdIn" class="inp" type="password" maxlength="12" autocomplete="off" placeholder="Contraseña">
        <div class="msg" id="vsMsg">${this.esc(msg)}</div>
        <div class="grid2">
          <button class="btn primary" data-act="vsJoinPwd">ENTRAR</button>
          <button class="btn" data-act="${Versus.joinFrom === 'browse' ? 'vsBrowse' : 'vsJoinScreen'}">VOLVER</button>
        </div>
      </div>`);
  },
  vsRoom(v) {
    const host = v.role === 'host';
    const picks = ARENA.ROUND_OPTS.map(n => `<button class="btn ${n === v.rounds ? 'primary' : ''}" data-act="vsRounds" data-n="${n}" style="flex:1;padding:8px 0" ${host ? '' : 'disabled'}>${n}</button>`).join('');
    const canStart = host && v.full && v.cd === 0;
    const slots = Array.from({ length: v.mode }, (_, i) => (v.names[i] ? this.esc(v.names[i]) : '<i>esperando…</i>')).join(' · ');
    this.show(`
      <div class="card wide">
        <h2>Sala ${this.esc(v.code)}</h2>
        <p class="sub">${host ? 'Comparte el código o espera a que alguien la vea en la lista.' : 'Espera a que el anfitrión inicie la partida.'}</p>
        ${this.mapCardsHTML(v.map, host)}
        <div class="sync">Modo: <b>${v.mode === 3 ? '1 contra 1 contra 1' : '1 contra 1'}</b> · jugadores: <b>${v.names.length}/${v.mode}</b></div>
        <div class="sync">${slots}</div>
        <div style="display:flex;gap:6px;align-items:center;margin:8px 0 10px"><span class="sub" style="margin:0 4px 0 0;white-space:nowrap">Ganar a</span>${picks}</div>
        <div style="display:flex;gap:8px">
          <button class="btn primary" id="vsStart" data-act="vsStart" style="flex:2" ${canStart ? '' : 'disabled'}>${this.esc(Versus.startLabel(v))}</button>
          <button class="btn danger" data-act="vsLeave" style="flex:1">SALIR</button>
        </div>
        <div class="msg" id="vsMsg">${this.esc(v.msg)}</div>
      </div>`);
  },
  pause() {
    /* en una partida VS no hay carrera que reiniciar: se continúa o se sale de la partida */
    if (typeof Versus !== 'undefined' && Versus.phase === 'arena') {
      this.show(`
        <div class="card centerCard">
          <h2>Pausa</h2>
          <p class="sub">Tu rival sigue en la isla. Si sales, la partida termina.</p>
          <button class="btn primary" data-act="resume">CONTINUAR</button>
          <button class="btn danger" data-act="vsQuit">SALIR DE LA PARTIDA</button>
        </div>`);
      return;
    }
    this.show(`
      <div class="card centerCard">
        <h2>Pausa</h2>
        <p class="sub">Tu carrera sigue donde la dejaste.</p>
        <button class="btn primary" data-act="resume">CONTINUAR</button>
        <div class="grid2"><button class="btn" data-act="restart">REINICIAR</button><button class="btn" data-act="menu">MENÚ</button></div>
      </div>`);
  },

  /* elección de mejora: tres cartas, la pantalla no sigue hasta elegir */
  pick(list) {
    const left = Upgrades.rerollsLeft(G), ic = n => (Img.get('crafteo/' + n + '.png') || {}).src || '';
    const cards = list.map((up, i) => {
      const lvl = Upgrades.count(G, up.id), cat = CATS[up.cat] || { name: '', col: '#ffffff' };
      const pips = Array.from({ length: up.max }, (_, n) => `<img alt="" class="upPip" style="width:14px;height:14px" src="${ic(n < lvl ? 'estrella_llena' : 'estrella_vacia')}">`).join('');
      const nivel = lvl === 0 ? `<img alt="" style="width:14px;height:14px;vertical-align:middle" src="${ic('mejora_nueva')}"> Nueva` : `Nivel ${lvl} → ${lvl + 1}`;
      const desc = up.desc[Math.min(lvl, up.desc.length - 1)];
      const fam = UPGRADES.filter(x => x.cat === up.cat && Upgrades.count(G, x.id) > 0).length;
      return `
      <button class="ucard r-${up.rarity}" data-act="pick" data-i="${i}">
        <span class="uic">${Upgrades.iconImg(up)}</span>
        <span class="uname">${this.esc(up.name)}</span>
        <span class="ufam" style="color:${cat.col}"><img alt="" style="width:16px;height:16px;vertical-align:middle" src="${ic('cat_' + up.cat)}">${this.esc(cat.name)} · ${fam}/3${fam >= 3 ? ` <img alt="" style="width:14px;height:14px;vertical-align:middle" src="${ic('sinergia')}">` : ''}</span>
        <span class="urar" style="color:${({ comun: '#2e6aa3', rara: '#6d3fd1', epica: '#b26a00' })[up.rarity]}"><img alt="" style="width:16px;height:16px;vertical-align:middle" src="${ic('rar_' + up.rarity)}">${RARITY[up.rarity].name}</span>
        <span class="upips">${pips}</span>
        <span class="univel">${nivel}</span>
        <span class="udesc">${this.esc(desc)}</span>
      </button>`;
    }).join('');
    this.show(`
      <div class="card wide">
        <h2>Elige una mejora</h2>
        <div class="upgrades">${cards}</div>
        <div class="upReroll"><button class="btn ${left > 0 ? 'primary' : 'ghost'}" data-act="reroll"${left > 0 ? '' : ' disabled'}><img alt="" class="upIcon" src="${ic('reroll')}"> Volver a tirar (${left})</button></div>
      </div>`, 'mid');
  },


  over(r) {
    const spr = n => (Img.get('ui/' + n + '.png') || {}).src || '';
    const plates = [['calavera', 'Enemigos', r.kills], ['laurel', 'Jefes', r.bosses], ['llave', r.waves ? 'Oleada' : 'Distancia', r.waves || (r.height + ' m')],
                    ['corazon', 'Corazones', r.hearts], ['estrella', 'Mejoras', r.ups]];
    const pl = p => `<div class="stat pl-${p[0]}"><b>${p[2]}</b><span>${p[1]}</span></div>`;
    this.show(`
      <div class="card centerCard overCard">
        ${r.isRecord ? '<div class="record">¡Nuevo récord!</div>' : ''}
        <img class="ovBanner" src="${spr('derrota')}" alt="DERROTA">
        <img class="ovRibbon" src="${spr('puntos')}" alt="PUNTOS">
        <div class="ovScoreRow">
          <img class="ovGem" src="${spr('gema_izq')}" alt="">
          <div class="over-score">${r.score}</div>
          <img class="ovGem" src="${spr('gema_der')}" alt="">
        </div>
        <div class="stats">${plates.map(pl).join('')}</div>
        <div class="sync">${this.esc(r.cloudMsg)}</div>
        <div class="ovBtns">
          <button class="sbtn" data-act="restart"><img src="${spr('btn_reintentar')}" alt="REINTENTAR"></button>
          <button class="sbtn" data-act="menu"><img src="${spr('btn_menu')}" alt="MENÚ"></button>
        </div>
      </div>`);
  },

  /* el HUD se dibuja en el lienzo (Hud.draw en 30_render.js): ya no se escribe en el HTML */
  hud() {},
  showHud(on) {
    document.getElementById('hud').classList.toggle('hidden', !on);
    const touchOn = Settings.touch === 'on' || (Settings.touch === 'auto' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    document.getElementById('touch').classList.toggle('hidden', !(on && touchOn));
    if (on && touchOn && typeof applyTouchLayout === 'function') applyTouchLayout();
    this.hudCache = {};
  },
  flash(text, cls) {
    const el = document.getElementById('event');
    el.textContent = text; el.className = 'evt show ' + (cls || '');
    clearTimeout(this._flashT); this._flashT = setTimeout(() => { el.className = 'evt'; }, 2600);
  }
};
addEventListener('resize', () => UI.fitCards());
