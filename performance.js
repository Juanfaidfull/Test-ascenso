'use strict';
/* =====================================================================
   ASCENSO 3.0 · rendimiento: bucle de paso fijo (60 pasos/s), un solo
   requestAnimationFrame activo, pausa limpia y sin "espiral de la muerte".
   ===================================================================== */
const Perf = { STEP: 1 / 60, MAX_STEPS: 5 };

/* onStep(dt) se llama con paso fijo; onFrame(dt) se llama en cada fotograma para dibujar. */
function createLoop(onStep, onFrame) {
  let raf = 0, last = 0, acc = 0, running = false, paused = false;
  const tick = now => {
    raf = 0;
    if (!running) return;
    const frame = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    if (!paused) {
      acc += frame; let n = 0;
      while (acc >= Perf.STEP && n < Perf.MAX_STEPS) { onStep(Perf.STEP); acc -= Perf.STEP; n++; }
      if (n >= Perf.MAX_STEPS) acc = 0;
    } else acc = 0;
    if (onFrame) onFrame(paused ? 0 : frame);
    raf = requestAnimationFrame(tick);
  };
  return {
    start() {
      if (running) return;
      running = true; paused = false; last = performance.now(); acc = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    setPaused(p) { paused = !!p; },
    isRunning() { return running; }
  };
}
