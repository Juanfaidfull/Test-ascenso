'use strict';
/* =====================================================================
   ASCENSO 3.0 · cliente de Supabase. Si no hay SDK, no hay configuración
   o no hay conexión, Cloud queda "off" y el juego sigue en modo local.
   Sólo se usa la URL y la clave ANON (public). Nunca la service_role.
   ===================================================================== */
const Cloud = {
  client: null, status: 'off', reason: 'sin configurar',
  init() {
    if (!APP_CONFIG.cloudEnabled) { this.status = 'off'; this.reason = 'desactivada'; return; }
    if (!CLOUD_CONFIGURED) { this.status = 'off'; this.reason = 'sin configurar: pega tu URL y clave en js/config.js'; return; }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') { this.status = 'off'; this.reason = 'sin conexión con el servicio'; return; }
    try {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      this.status = 'ready'; this.reason = '';
    } catch (e) { this.client = null; this.status = 'error'; this.reason = 'configuración no válida'; }
  },
  ready() { return !!this.client && this.status === 'ready'; },
  /* ninguna llamada puede bloquear el juego: tiempo máximo y error controlado */
  call(promise, ms = 8000) {
    return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo agotado')), ms))]);
  },
  /* traduce los errores habituales a un mensaje claro en español */
  explain(err) {
    const m = String((err && (err.message || err.error_description || err)) || '').toLowerCase();
    if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
    if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese email.';
    if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar.';
    if (m.includes('password')) return 'La contraseña no cumple los requisitos.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un minuto.';
    if (m.includes('tiempo agotado') || m.includes('failed to fetch') || m.includes('network')) return 'Sin conexión con el servicio. Tu progreso sigue guardado en este dispositivo.';
    if (m.includes('username') || m.includes('duplicate') || m.includes('unique')) return 'Ese nombre de jugador ya existe.';
    return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
};
