'use strict';
/* =====================================================================
   ASCENSO 3.0 · guardado en la nube. Nunca pierde progreso: los máximos
   se mezclan con lo local, y lo que no se pudo enviar queda pendiente
   en este dispositivo hasta que vuelva la conexión.
   ===================================================================== */
const CloudSave = {
  status: 'local', message: 'Solo en este dispositivo',
  listeners: [],
  set(status, message) { this.status = status; this.message = message; for (const fn of this.listeners) { try { fn(this); } catch (e) { } } },
  onChange(fn) { this.listeners.push(fn); },
  /* al entrar: trae lo de la nube, mezcla con lo local y vuelve a subir el resultado */
  async onLogin() {
    if (!Cloud.ready() || !Auth.user) return;
    this.set('guardando', 'Sincronizando…');
    try {
      const { data, error } = await Cloud.call(Cloud.client.from('game_saves').select('*').eq('user_id', Auth.user.id).maybeSingle());
      if (error) throw error;
      if (data) {
        Progress.mergeCloud({
          runs: data.runs, bestScore: data.best_score, bestH: data.best_height,
          kills: data.total_kills, bosses: data.total_bosses,
          coins: data.stats && data.stats.coins, hearts: data.stats && data.stats.hearts, missions: data.stats && data.stats.missions
        });
        if (data.hero_config && typeof data.hero_config === 'object') store.set('hero', data.hero_config);
      }
      await this.saveProgress();
      await this.flush();
    } catch (e) { this.set('sin_conexion', 'Sin conexión: el progreso se guardará al reconectar'); }
  },
  onLogout() { this.set('local', 'Solo en este dispositivo'); },
  payload() {
    const t = Progress.totals;
    return {
      user_id: Auth.user.id,
      best_score: t.bestScore, best_height: t.bestH, total_kills: t.kills, total_bosses: t.bosses, runs: t.runs,
      settings: { music: Music.enabled, sfx: Sound.sfxOn, touch: Settings.touch }, hero_config: store.get('hero', {}),
      unlocks: { bioma_tormenta: Progress.unlocked('bioma:tormenta'), bioma_espacio: Progress.unlocked('bioma:espacio') },
      stats: { coins: t.coins, hearts: t.hearts, missions: t.missions },
      updated_at: new Date().toISOString()
    };
  },
  async saveProgress() {
    if (!Auth.user) return false;
    if (!Cloud.ready()) { store.set('pendiente_guardado', this.payload()); this.set('sin_conexion', 'Sin conexión: el progreso se guardará al reconectar'); return false; }
    this.set('guardando', 'Guardando…');
    try {
      const { error } = await Cloud.call(Cloud.client.from('game_saves').upsert(this.payload(), { onConflict: 'user_id' }));
      if (error) throw error;
      store.del('pendiente_guardado');
      this.set('guardado', 'Guardado en la nube');
      return true;
    } catch (e) {
      store.set('pendiente_guardado', this.payload());
      this.set('sin_conexion', 'Sin conexión: el progreso se guardará al reconectar');
      return false;
    }
  },
  /* registra una puntuación global. Sólo con cuenta; los valores se validan antes. */
  async pushScore(run) {
    if (!Auth.user) return false;
    const row = { user_id: Auth.user.id, username: Auth.user.name, score: run.score, height: run.height, kills: run.kills, bosses: run.bosses };
    if (!CloudSave.validRow(row)) return false;
    if (!Cloud.ready()) { const q = store.get('pendiente_puntuaciones', []); q.push(row); store.set('pendiente_puntuaciones', q.slice(-20)); return false; }
    try {
      const { error } = await Cloud.call(Cloud.client.from('scores').insert(row));
      if (error) throw error;
      return true;
    } catch (e) {
      const q = store.get('pendiente_puntuaciones', []); q.push(row); store.set('pendiente_puntuaciones', q.slice(-20));
      return false;
    }
  },
  /* límites razonables: evita valores absurdos en la tabla global */
  validRow(r) {
    return isNum(r.score, 0, 10000000) && isNum(r.height, 0, 100000) && isNum(r.kills, 0, 100000) && isNum(r.bosses, 0, 1000) && typeof r.username === 'string' && r.username.length >= 3;
  },
  async flush() {
    if (!Cloud.ready() || !Auth.user) return;
    const snap = store.get('pendiente_guardado', null);
    if (snap) await this.saveProgress();
    const q = store.get('pendiente_puntuaciones', []);
    if (q.length) {
      const left = [];
      for (const r of q) {
        try { const { error } = await Cloud.call(Cloud.client.from('scores').insert(r)); if (error) left.push(r); }
        catch (e) { left.push(r); }
      }
      store.set('pendiente_puntuaciones', left);
    }
  },
  /* tabla global: los 10 mejores puntajes de todos los jugadores con cuenta */
  async topGlobal() {
    if (!Cloud.ready()) return { ok: false, msg: 'Sin conexión: la tabla global no está disponible ahora.', rows: [] };
    try {
      const { data, error } = await Cloud.call(Cloud.client.from('scores').select('username,score,height,kills,bosses,created_at').order('score', { ascending: false }).limit(10));
      if (error) throw error;
      return { ok: true, rows: data || [] };
    } catch (e) { return { ok: false, msg: Cloud.explain(e), rows: [] }; }
  }
};
