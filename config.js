'use strict';
/* =====================================================================
   ASCENSO 4.1 · configuración.
   Proyecto de Supabase: ascenso-juego (nuevo, separado de cualquier otro proyecto).
   La clave ANON es pública por diseño: la protegen las políticas de seguridad (RLS).
   NUNCA pongas aquí la clave service_role.
   ===================================================================== */
const SUPABASE_URL = 'https://rmvvluowwagjhxmvjvkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdnZsdW93d2Fnamh4bXZqdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzczODYsImV4cCI6MjEwNzMxMzM4Nn0.iQLDxT8eTY2kv1eDw1p-k00PDYZX6F4cE1Zwf9MMFu0';

const APP_CONFIG = {
  version: '4.40.0',
  cloudEnabled: true,          // false = nunca intenta conectar con Supabase
  multiplayerEnabled: true,    // false = oculta el multijugador
  roomSizes: [8, 12, 20],
  roomDefaultSize: 8,
  ghostSendHz: 5,              // envíos de posición por segundo mientras te mueves (ligeros)
  ghostStaleMs: 3000,          // un fantasma sin señal más de esto desaparece
  ghostRange: { dx: 360, dy: 300 },
  autosaveSec: 30,             // guardado periódico en la nube durante la partida
  upgradeEveryM: 120,          // (sin uso desde la 4.1: las mejoras son objetos del nivel)
  eventEveryM: 60,             // se intenta un evento aleatorio cada 60 m
  bossFirstM: 330,             // el primer jefe aparece tras 330 m
  bossEveryM: 300,             // y después, cada 300 m
  biomeLenM: 220               // tope: un bioma avanza como mucho tras 220 m
};

/* En pantalla, se considera configurada la nube sólo si ambas constantes cambiaron. */
const CLOUD_CONFIGURED = !!SUPABASE_URL && !SUPABASE_URL.startsWith('PEGAR_AQUI') &&
  !!SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('PEGAR_AQUI');
