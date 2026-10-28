'use strict';
/* =====================================================================
   ASCENSO 4.0 · biomas. Un bioma dura hasta derrotar a sus enemigos (quota de bajas
   de su tipo). Tope de 220 m por si el nivel tiene pocos enemigos. Cada vuelta de
   5 biomas sube la dificultad y usa la siguiente variante de arte y música.
   ===================================================================== */
const BIOMES = {
  bosque: { id: 'bosque', name: 'Bosque nocturno', plat: 0, music: 'forest', fog: '143,211,200',
    sky: ['#0a1330', '#1d4168', '#3b8496', '#8fd3c8'], overlays: ['fireflies'],
    pool: [['orco', 3], ['demon', 3], ['ballestero', 2], ['arquero', 2], ['zombie', 2], ['slime', 2], ['gordo', 2], ['bee', 2], ['camaleon', 2]],
    variants: [{ set: 'bosque_noche' }, { set: 'bosque_noche', tint: 'rgb(40,70,140)', blend: 'multiply' }] },
  cavernas: { id: 'cavernas', name: 'Cavernas y ruinas', plat: 1, music: 'cave', fog: '122,240,255',
    sky: ['#120c1c', '#2a1f33', '#4a3a46', '#7a6a5a'], overlays: ['stalactites', 'dust'],
    pool: [['golem', 2], ['escudero', 3], ['ballestero', 2], ['arquero', 2], ['raptor', 2], ['skullwolf', 2], ['skeleton', 2], ['verde', 2], ['arrastre', 2], ['armadura', 2], ['orco', 2], ['sanador', 2], ['mini_golem', 1]],
    variants: [{ set: 'cavernas_ruinas', tint: 'rgb(92,80,140)', blend: 'multiply' }, { set: 'cavernas_ruinas', tint: 'rgb(60,70,120)', blend: 'multiply' }] },
  cielo: { id: 'cielo', name: 'Cielo y nubes', plat: 0, music: 'sky', fog: '255,255,255',
    sky: ['#4d9bd6', '#9fd6ef', '#e9f8ff', '#ffffff'], overlays: [],
    pool: [['bee', 3], ['bombardero', 3], ['demon', 2], ['sanador', 2]],
    variants: [{ set: 'cielo_azul' }, { set: 'cielo_mar' }, { set: 'cielo_alto' }, { set: 'cielo_costa' }] },
  tormenta: { id: 'tormenta', name: 'Tormenta y atardecer', plat: 1, music: 'storm', fog: '255,140,80',
    sky: ['#1b0f2e', '#5a2a4a', '#ff7a3d', '#ffb35c'], overlays: ['rain', 'lightning'],
    pool: [['bombardero', 3], ['demon', 3], ['escudero', 2], ['camaleon', 2], ['mini_golem', 1]],
    variants: [{ set: 'tormenta_gris' }, { set: 'tormenta_mar' }, { set: 'atardecer_rosa' }, { set: 'atardecer_mar' }] },
  espacio: { id: 'espacio', name: 'Espacio y cosmos', plat: 1, music: 'space', fog: '201,182,255',
    sky: ['#03030c', '#0d0a24', '#2a1655', '#5b2a86'], overlays: ['stars'],
    pool: [['golem', 2], ['bombardero', 3], ['escudero', 3], ['camaleon', 2], ['sanador', 1], ['mini_golem', 1]],
    variants: [{ set: 'espacio_violeta' }, { set: 'espacio_luna' }] }
};

