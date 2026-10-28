'use strict';
/* =====================================================================
   ASCENSO 4.2 · salas y presencia para el VS. Dos transportes con la misma interfaz:
   · Supabase Realtime (Presence + Broadcast), cuando hay nube configurada.
   · Local (BroadcastChannel): pestañas del mismo navegador, para probar sin cuenta.
   Sólo viajan datos ligeros: posiciones, animaciones y eventos de la partida (golpes,
   bolas, rondas). Nunca mapa ni enemigos. Cada sala tiene dos plazas.
   ===================================================================== */
const Net = {
  t: null, roomId: null, max: 2, me: null, list: [], timers: [], listeners: [], count: 0,
  status: 'offline', message: 'Multijugador desconectado',
  set(st, msg) { this.status = st; this.message = msg; for (const fn of this.listeners) { try { fn(this); } catch (e) { } } },
  onChange(fn) { this.listeners.push(fn); },
  /* sala VS: el código de 4 o 5 caracteres identifica el canal de la sala */
  roomFor(code) { return 'vs-' + String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); },
  newRoomCode() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; },
  /* entra en una sala; si ya está llena, lo dice sin bloquear el juego */
  async join(roomId, max, me) {
    await this.leave();
    this.roomId = roomId; this.max = max; this.me = me;
    this.set('conectando', 'Conectando a la sala…');
    let transport = null;
    if (Cloud.ready()) transport = SupabaseTransport;   /* con la nube lista, no hace falta cuenta para jugar */
    else if (typeof BroadcastChannel !== 'undefined') transport = LocalTransport;
    else { this.set('offline', 'Este navegador no permite el multijugador'); return { ok: false, msg: 'Este navegador no permite el multijugador.' }; }
    this.t = transport;
    const res = await transport.connect(roomId, me, {
      onPresence: list => this.onPresence(list),
      onState: m => (m && m.ev ? Versus.onNet(m) : Ghosts.onState(m))
    });
    if (!res.ok) { this.t = null; this.set('offline', res.msg); return res; }
    this.set('conectado', 'Sala ' + roomId.replace(/^vs-/, '') + ' · ' + (transport === SupabaseTransport ? 'nube' : 'local'));
    return { ok: true };
  },
  onPresence(list) {
    this.list = list;
    const ids = new Set(list.map(p => p.id));
    Ghosts.setPresence(list.filter(p => p.id !== (this.me && this.me.id)));
    this.count = ids.size;
    if (typeof Versus !== 'undefined') Versus.onPresence(list);
  },
  /* envía un estado o un evento a la sala */
  send(state) { if (this.t && this.status === 'conectado') this.t.send(state); },
  async leave() {
    if (this.t) { try { await this.t.disconnect(); } catch (e) { } }
    this.t = null; this.roomId = null; this.list = []; this.count = 0; Ghosts.clear();
    if (this.status !== 'offline') this.set('offline', 'Multijugador desconectado');
  }
};

/* ---- transporte local: BroadcastChannel dentro del mismo origen ---- */
const LocalTransport = {
  bc: null, timer: 0, peers: new Map(), h: null, me: null,
  self() { return { id: this.me.id, name: this.me.name, host: !!this.me.host, look: this.me.look || null }; },
  hello(t) { return Object.assign({ t }, this.self()); },
  connect(roomId, me, h) {
    this.h = h; this.me = me; this.peers.clear();
    try { this.bc = new BroadcastChannel('ascenso-' + roomId); }
    catch (e) { return Promise.resolve({ ok: false, msg: 'No se pudo abrir la sala.' }); }
    this.bc.onmessage = e => this.onMsg(e.data);
    this.post(this.hello('hello'));
    return new Promise(res => setTimeout(() => {
      const count = this.peers.size + 1;
      if (count > Net.max) { this.disconnect(); res({ ok: false, msg: 'La sala está llena (máx. ' + Net.max + ').' }); return; }
      this.timer = setInterval(() => this.tick(), 1000);
      this.publish(); res({ ok: true });
    }, 350));
  },
  post(m) { try { if (this.bc) this.bc.postMessage(m); } catch (e) { } },
  publish() {
    this.h.onPresence([this.self(), ...[...this.peers.values()].map(p => ({ id: p.id, name: p.name, host: p.host, look: p.look }))]);
  },
  tick() {
    this.post(this.hello('hb'));
    const now = Date.now(); let changed = false;
    for (const [id, p] of this.peers) if (now - p.seen > APP_CONFIG.ghostStaleMs) { this.peers.delete(id); changed = true; }
    if (changed) this.publish();
  },
  onMsg(m) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string' || m.id === this.me.id) return;
    if (m.t === 'hello') this.post(this.hello('hb'));
    if (m.t === 'hello' || m.t === 'hb') {
      const isNew = !this.peers.has(m.id);
      this.peers.set(m.id, { id: m.id, name: String(m.name || 'jugador').slice(0, 16), host: !!m.host, look: m.look || null, seen: Date.now() });
      if (isNew) this.publish();
    } else if (m.t === 'bye') { if (this.peers.delete(m.id)) this.publish(); }
    else if (m.t === 'st') { this.h.onState(m); }
  },
  send(state) { this.post(Object.assign({ t: 'st', id: this.me.id }, state)); },
  disconnect() {
    this.post({ t: 'bye', id: this.me.id });
    clearInterval(this.timer); this.timer = 0;
    if (this.bc) { this.bc.close(); this.bc = null; }
    this.peers.clear();
  }
};

/* ---- transporte Supabase Realtime: Presence (quién está, si es anfitrión) y Broadcast (estados y eventos) ---- */
const SupabaseTransport = {
  ch: null, h: null,
  connect(roomId, me, h) {
    this.h = h;
    return new Promise(res => {
      try {
        this.ch = Cloud.client.channel('ascenso:' + roomId, { config: { broadcast: { self: false }, presence: { key: me.id } } });
        this.ch.on('presence', { event: 'sync' }, () => {
          const st = this.ch.presenceState(); const list = [];
          for (const k of Object.keys(st)) for (const meta of st[k]) {
            list.push({ id: k, name: String(meta.name || 'jugador').slice(0, 16), host: !!meta.host, look: meta.look || null });
          }
          h.onPresence(list);
        });
        this.ch.on('broadcast', { event: 'st' }, ({ payload }) => h.onState(payload));
        this.ch.subscribe(async status => {
          if (status === 'SUBSCRIBED') {
            await this.ch.track({ name: me.name, host: !!me.host, look: me.look || null });
            /* el límite de la sala se aplica aquí: si al entrar hay más jugadores de los permitidos, se sale */
            setTimeout(async () => {
              const n = Object.keys(this.ch ? this.ch.presenceState() : {}).length;
              if (n > Net.max) {
                try { await this.ch.untrack(); await this.ch.unsubscribe(); } catch (e) { }
                this.ch = null;
                res({ ok: false, msg: 'La sala está llena (máx. ' + Net.max + ').' });
              } else res({ ok: true });
            }, 600);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') res({ ok: false, msg: 'No se pudo conectar a la sala. Inténtalo luego.' });
        });
      } catch (e) { res({ ok: false, msg: 'No se pudo conectar a la sala.' }); }
    });
  },
  send(state) { if (this.ch) this.ch.send({ type: 'broadcast', event: 'st', payload: state }); },
  async disconnect() { if (this.ch) { try { await this.ch.untrack(); await this.ch.unsubscribe(); } catch (e) { } this.ch = null; } }
};
