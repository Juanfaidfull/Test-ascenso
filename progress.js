'use strict';
/* =====================================================================
   ASCENSO 3.0 · progresión local permanente: totales, récords y desbloqueos.
   Los datos se validan al cargar: un valor corrupto nunca rompe el juego.
   ===================================================================== */
const PROGRESS_KEY = 'progreso';
const UNLOCK_RULES = {
  'bioma:tormenta': p => p.totals.bosses >= 2,
  'bioma:espacio': p => p.totals.runs >= 5,
  'skin:cape:4': p => p.totals.runs >= 3,
  'skin:pants:4': p => p.totals.kills >= 100,
  'skin:hair:5': p => p.totals.bosses >= 1,
  'skin:shirt:5': p => p.totals.missions >= 3,
  'upg:salto_explosivo': p => p.totals.runs >= 2,
  'upg:escudo_contacto': p => p.totals.runs >= 3
};
const Progress = {
  data: null,
  defaults() {
    return { v: 1, totals: { runs: 0, bestScore: 0, bestH: 0, kills: 0, bosses: 0, coins: 0, hearts: 0, missions: 0, waveRuns: 0, bestWave: 0, bestWaveScore: 0 }, lastRunAt: 0 };
  },
  /* carga y valida: cada campo debe ser un número razonable; si no, vuelve al valor por defecto */
  load() {
    const d = this.defaults();
    const raw = store.get(PROGRESS_KEY, null);
    if (raw && typeof raw === 'object' && raw.totals && typeof raw.totals === 'object') {
      for (const k of Object.keys(d.totals)) if (isNum(raw.totals[k], 0, 1e9)) d.totals[k] = Math.floor(raw.totals[k]);
      if (isNum(raw.lastRunAt, 0, 9e15)) d.lastRunAt = raw.lastRunAt;
    }
    this.data = d; return d;
  },
  save() { store.set(PROGRESS_KEY, this.data); },
  get totals() { return this.data.totals; },
  /* registra una partida terminada */
  /* oleadas: su propio récord (no se mezcla con la carrera, cuyas puntuaciones no son comparables) */
  recordWaves(r) {
    const t = this.data.totals;
    t.waveRuns = (t.waveRuns || 0) + 1;
    t.bestWave = Math.max(t.bestWave || 0, r.waves | 0);
    t.bestWaveScore = Math.max(t.bestWaveScore || 0, r.score | 0);
    this.save();
  },
  /* mezcla con lo guardado en la nube: nunca se pierde un récord ni un total */
  mergeCloud(cloudTotals) {
    if (!cloudTotals) return;
    for (const k of Object.keys(this.data.totals)) {
      const v = cloudTotals[k];
      if (isNum(v, 0, 1e9)) this.data.totals[k] = Math.max(this.data.totals[k], Math.floor(v));
    }
    this.save();
  },
  unlocked(key) {
    const rule = UNLOCK_RULES[key];
    return rule ? !!rule(this.data) : true;
  },
  reset() { this.data = this.defaults(); this.save(); }
};
