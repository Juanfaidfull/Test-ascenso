'use strict';
/* =====================================================================
   ASCENSO 4.4 · lista pública de salas VS. El anfitrión anuncia su sala cada segundo
   (código, nombre, victorias, si lleva contraseña y cuántos jugadores hay). Quien busca
   sala escucha esos anuncios; una sala que deja de anunciarse sale de la lista.
   La contraseña nunca se anuncia: el anfitrión la comprueba cuando alguien entra.
   ===================================================================== */
const Lobby = {
  rooms: new Map(), ch: null, bc: null, ready: false, opened: false, timer: 0, host: null,
  open() {
    if (this.opened) return;
    this.opened = true;
    this.timer = setInterval(() => this.tick(), 1000);
    if (Cloud.ready() && Cloud.client) {
      try {
        this.ch = Cloud.client.channel('ascenso:vs-lobby', { config: { broadcast: { self: false } } });
        this.ch.on('broadcast', { event: 'room' }, ({ payload }) => this.onMsg(payload));
        this.ch.subscribe(st => { if (st === 'SUBSCRIBED') { this.ready = true; this.send(this.hostMsg()); } });
      } catch (e) { this.ch = null; }
    } else if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('ascenso-vs-lobby');
        this.bc.onmessage = e => this.onMsg(e.data);
        this.ready = true;
      } catch (e) { this.bc = null; }
    }
  },
  onMsg(m) {
    if (!m || typeof m !== 'object' || typeof m.code !== 'string') return;
    const code = normCode(m.code);
    if (code.length < 4) return;
    if (m.t === 'close') { this.rooms.delete(code); return; }
    if (m.t !== 'room') return;
    this.rooms.set(code, { code, host: String(m.host || 'jugador').slice(0, 16), rounds: clampRounds(m.rounds),
      pwd: !!m.pwd, players: clamp(Math.floor(+m.players) || 1, 1, 3), mode: m.mode === 3 ? 3 : 2, mapId: vsMapId(m.mapId), seen: Date.now() });
  },
  tick() {
    const now = Date.now();
    for (const [k, r] of this.rooms) if (now - r.seen > 4000) this.rooms.delete(k);
    if (this.host) this.send(this.hostMsg());
  },
  hostMsg() { return this.host ? Object.assign({ t: 'room' }, this.host) : null; },
  send(m) {
    if (!m || !this.ready) return;
    try {
      if (this.bc) this.bc.postMessage(m);
      else if (this.ch) this.ch.send({ type: 'broadcast', event: 'room', payload: m });
    } catch (e) { }
  },
  setHost(info) { this.host = Object.assign({}, info, { code: normCode(info.code) }); this.send(this.hostMsg()); },
  clearHost(code) { this.host = null; this.send({ t: 'close', code: normCode(code) }); }
};
