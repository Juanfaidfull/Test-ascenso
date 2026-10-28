'use strict';
/* =====================================================================
   ASCENSO 4.29 · botín de oleadas: corazones y materiales. Las monedas y los cofres son de la carrera y ya no existen.
   ===================================================================== */
const Loot = {
  heartChance(G) { return Math.min(0.10, 0.05 + 0.025 * G.mods.luck); },
  enemyDrop(e, G) {
    if (Math.random() < this.heartChance(G)) G.spawnPickup('heart', e.x, e.y - 18, null, {});
    if (Math.random() < 0.03) { const o = G.spawnPickup('energia', e.x, e.y - 14, null, {}); o.value = 1; }
    if (e.elite && Math.random() < 0.4) G.spawnPickup('halfheart', e.x, e.y - 18, null, {});
  },
  bossDrop(b, G) {
    G.spawnPickup('heart', b.x, b.y - 40, null, {});
    G.dropMaterial(b, true);
    if (Math.random() < 0.8) { const o = G.spawnPickup('energia', b.x, b.y - 46, null, {}); o.value = Ramas.rollBossValue(b.kind, G.mods.luck); }
  }
};
