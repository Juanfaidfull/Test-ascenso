'use strict';
/* =====================================================================
   ASCENSO 3.0 · cuentas (Supabase Auth). Validación en el cliente y en la base.
   Modo invitado: jugar sin cuenta siempre es posible.
   ===================================================================== */
const Auth = {
  user: null, session: null, listeners: [], busy: false,
  validEmail(e) { return typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },
  validName(n) { return typeof n === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(n); },
  validPass(p) { return typeof p === 'string' && p.length >= 6 && p.length <= 72; },
  async restore() {
    if (!Cloud.ready()) return;
    try {
      const { data } = await Cloud.call(Cloud.client.auth.getSession());
      this.setSession(data.session);
    } catch (e) { this.setSession(null); }
    Cloud.client.auth.onAuthStateChange((event, session) => {
      this.setSession(session, event);
    });
  },
  setSession(session, event) {
    const was = this.user;
    this.session = session || null;
    this.user = session && session.user ? {
      id: session.user.id, email: session.user.email || '',
      name: (session.user.user_metadata && session.user.user_metadata.username) || 'jugador'
    } : null;
    this.notify();
    if (this.user && (!was || event === 'SIGNED_IN')) CloudSave.onLogin();
    if (!this.user && was) CloudSave.onLogout();
  },
  /* el email de la cuenta se genera con el nombre de usuario: el jugador solo escribe usuario y contraseña */
  emailFor(name) { return (name || '').trim().toLowerCase() + '@jugador.ascenso.game'; },
  async signUp(email, password, username) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test((username || '').trim())) return { ok: false, msg: 'El nombre de usuario tiene de 3 a 16 letras, números o _.' };
    if (!Cloud.ready()) return { ok: false, msg: 'La nube no está disponible en este momento.' };
    if (!this.validEmail(email)) return { ok: false, msg: 'Escribe un email válido.' };
    if (!this.validName(username)) return { ok: false, msg: 'El nombre debe tener 3–16 letras, números o _.' };
    if (!this.validPass(password)) return { ok: false, msg: 'La contraseña debe tener al menos 6 caracteres.' };
    this.busy = true; this.notify();
    try {
      const { data, error } = await Cloud.call(Cloud.client.auth.signUp({ email, password, options: { data: { username } } }));
      if (error) return { ok: false, msg: Cloud.explain(error) };
      if (data && data.session) this.setSession(data.session, 'SIGNED_IN');
      return { ok: true, msg: data && data.session ? 'Cuenta creada. ¡Bienvenido!' : 'Cuenta creada. Revisa tu email para confirmarla.' };
    } catch (e) { return { ok: false, msg: Cloud.explain(e) }; }
    finally { this.busy = false; this.notify(); }
  },
  async signIn(email, password) {
    if (!Cloud.ready()) return { ok: false, msg: 'La nube no está disponible en este momento.' };
    if (!this.validEmail(email) || !this.validPass(password)) return { ok: false, msg: 'Revisa el email y la contraseña.' };
    this.busy = true; this.notify();
    try {
      const { data, error } = await Cloud.call(Cloud.client.auth.signInWithPassword({ email, password }));
      if (error) return { ok: false, msg: Cloud.explain(error) };
      this.setSession(data.session, 'SIGNED_IN');
      return { ok: true, msg: 'Sesión iniciada.' };
    } catch (e) { return { ok: false, msg: Cloud.explain(e) }; }
    finally { this.busy = false; this.notify(); }
  },
  async signOut() {
    if (!Cloud.ready()) { this.setSession(null); return { ok: true }; }
    try { await Cloud.call(Cloud.client.auth.signOut()); } catch (e) { }
    this.setSession(null);
    return { ok: true, msg: 'Sesión cerrada. Tu progreso local sigue en este dispositivo.' };
  },
  onChange(fn) { this.listeners.push(fn); },
  notify() { for (const fn of this.listeners) { try { fn(this); } catch (e) { } } }
};
