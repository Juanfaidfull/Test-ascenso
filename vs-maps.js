'use strict';
/* =====================================================================
   ASCENSO 4.14 · mapas del VS: datos y geometría, separados de la interfaz y de la partida.
   Cada mapa es UNA isla principal y DOS plataformas delgadas. Las medidas son píxeles de la imagen
   (isla de 669×373): la superficie que se pisa es la que se ve. Todas las islas usan la misma escala,
   así que el personaje mide lo mismo en cualquier mapa.
   ===================================================================== */
const VS_MAP_DEFAULT = 'normal';                 /* valor seguro si el mapa no existe o no llega bien */
const VS_MAP_ORDER = ['normal', 'ice', 'magma', 'candy', 'abyss', 'cristal', 'playa', 'volcan'];
const VS_MAP_SCALE = 0.9;                        /* escala común de las cinco islas */
const VS_MAP_TOP = 140;                          /* altura de la superficie de la isla en la pantalla lógica */
const VS_MAPS = {
  cristal: { name: 'Caverna de Cristal', desc: 'Cristales azules bajo una aurora', isla: 'vs/isla_cristal.png', fondo: 'vs/fondo_cristal.jpg', size: [677, 369], scale: 0.85, T: 113, art: { cx: 338, top: 167 }, isl: { x0: 98, x1: 578 }, plats: [{ x0: 166, x1: 300, y: 113 }, { x0: 376, x1: 510, y: 68 }] },
  playa: { name: 'Isla Playa', desc: 'Arena y palmeras sobre el mar', isla: 'vs/isla_playa.png', fondo: 'vs/fondo_playa.jpg', size: [677, 369], scale: 0.95, T: 111, art: { cx: 281, top: 178 }, isl: { x0: 53, x1: 509 }, plats: [{ x0: 172, x1: 285, y: 127 }, { x0: 389, x1: 503, y: 96 }] },
  volcan: { name: 'Volcán Ardiente', desc: 'Lava que cae por los bordes', isla: 'vs/isla_volcan.png', fondo: 'vs/fondo_volcan.jpg', size: [669, 373], scale: 0.79, T: 115, art: { cx: 336.5, top: 168 }, isl: { x0: 61, x1: 612 }, plats: [{ x0: 149, x1: 258, y: 114 }, { x0: 410, x1: 519, y: 84 }] },
  normal: { name: 'Islas del Crepúsculo', desc: 'Piedra pesada bajo cielo violeta',
    isla: 'vs/isla_normal.png', fondo: 'vs/fondo_normal.jpg', art: { cx: 334.5, top: 188 }, isl: { x0: 93, x1: 576 },
    plats: [{ x0: 141, x1: 276, y: 116 }, { x0: 392, x1: 527, y: 78 }] },
  ice: { name: 'Cumbres de Cristal', desc: 'Nieve compacta sobre hielo azul',
    isla: 'vs/isla_ice.png', fondo: 'vs/fondo_ice.jpg', art: { cx: 335, top: 164 }, isl: { x0: 88, x1: 582 },
    plats: [{ x0: 138, x1: 279, y: 93 }, { x0: 388, x1: 529, y: 73 }] },
  magma: { name: 'La Forja del Abismo', desc: 'Basalto ardiente sobre lava',
    isla: 'vs/isla_magma.png', fondo: 'vs/fondo_magma.jpg', art: { cx: 335, top: 146 }, isl: { x0: 121, x1: 549 },
    plats: [{ x0: 128, x1: 262, y: 78 }, { x0: 406, x1: 543, y: 49 }] },
  candy: { name: 'Cielo de Azúcar', desc: 'Galleta y crema sobre algodón',
    isla: 'vs/isla_candy.png', fondo: 'vs/fondo_candy.jpg', art: { cx: 334.5, top: 186 }, isl: { x0: 111, x1: 558 },
    plats: [{ x0: 151, x1: 282, y: 114 }, { x0: 387, x1: 517, y: 61 }] },
  abyss: { name: 'Arrecife del Abismo', desc: 'Roca coralina en el abismo',
    isla: 'vs/isla_abyss.png', fondo: 'vs/fondo_abyss.jpg', art: { cx: 334.5, top: 184 }, isl: { x0: 90, x1: 579 },
    plats: [{ x0: 131, x1: 262, y: 93 }, { x0: 406, x1: 537, y: 93 }] }
};
/* mapas de los otros modos: no se eligen en el VS. Entrenamiento y bastión de oleadas */
const SOLO_MAPS = {
  selva: { name: 'Selva Ancestral', desc: 'Lianas y ruinas sobre la niebla', isla: 'vs/isla_selva.png', fondo: 'vs/fondo_selva.jpg', size: [794, 314], scale: 0.8186, T: 140, art: { cx: 399, top: 143 }, isl: { x0: 54, x1: 744 }, plats: [{ x0: 274, x1: 506, y: 47 }, { x0: 472, x1: 597, y: 99 }] },
  tiempo: { name: 'Engranajes del Tiempo', desc: 'Relojes y bronce sobre la ciudad', isla: 'vs/isla_tiempo.png', fondo: 'vs/fondo_tiempo.jpg', size: [677, 369], scale: 0.8758, T: 132, art: { cx: 334.5, top: 144 }, isl: { x0: 12, x1: 657 }, plats: [{ x0: 109, x1: 253, y: 96 }, { x0: 204, x1: 472, y: 30 }, { x0: 423, x1: 566, y: 96 }] },
  entrenamiento: { name: 'Campo de entrenamiento', desc: 'Cuadrícula de práctica con tres repisas.',
    isla: 'vs/isla_entrenamiento.png', fondo: 'vs/fondo_entrenamiento.jpg', art: { cx: 334, top: 192 }, isl: { x0: 83, x1: 585 },
    plats: [{ x0: 119, x1: 227, y: 122 }, { x0: 281, x1: 387, y: 69 }, { x0: 441, x1: 549, y: 122 }] },
  bastion: { name: 'Bastión de oleadas', desc: 'Isla de piedra con runa y dos repisas.',
    isla: 'vs/isla_bastion.png', fondo: 'vs/fondo_bastion.jpg', art: { cx: 343, top: 168 }, isl: { x0: 82, x1: 605 },
    plats: [{ x0: 156, x1: 275, y: 100 }, { x0: 394, x1: 511, y: 108 }] }
};
/* un identificador de cualquier mapa conocido (VS u otros modos) o el normal */
const mapKey = id => (typeof id === 'string' && (VS_MAPS[id] || SOLO_MAPS[id]) ? id : VS_MAP_DEFAULT);
/* un identificador válido del VS o el mapa normal: lo que llega de la red solo puede ser un mapa del VS */

const vsMapId = id => (typeof id === 'string' && VS_MAPS[id] ? id : VS_MAP_DEFAULT);
/* geometría en coordenadas del mundo: isla, plataformas, puntos de aparición y dibujo de la imagen */
const VsGeo = {
  cache: {},
  of(id) {
    const key = mapKey(id);
    if (this.cache[key]) return this.cache[key];
    const m = VS_MAPS[key] || SOLO_MAPS[key], s = m.scale || VS_MAP_SCALE, cx = ARENA.CX, T = m.T || VS_MAP_TOP;
    const X = x => cx + (x - m.art.cx) * s, Y = y => T + (y - m.art.top) * s;
    const isl = { x0: X(m.isl.x0), x1: X(m.isl.x1), y: T };
    const hw = (isl.x1 - isl.x0) / 2;
    const plats = m.plats.map(p => ({ x0: X(p.x0), x1: X(p.x1), y: Y(p.y) }));
    /* aparición: a cada lado, un poco hacia dentro del borde; el tercero en el centro */
    const spawns = [{ x: cx - 0.7 * hw, face: 1 }, { x: cx + 0.7 * hw, face: -1 }, { x: cx, face: 1 }];
    const art = { x: cx - m.art.cx * s, y: T - m.art.top * s, w: (m.size || [669, 373])[0] * s, h: (m.size || [669, 373])[1] * s, scale: s, isla: m.isla, fondo: m.fondo };
    return (this.cache[key] = { id: key, name: m.name, desc: m.desc, isl, plats, spawns, art });
  }
};
