# ASCENSO 4.8 · guía del proyecto

## Qué cambia en la 4.8
- **VS de tres jugadores (1 contra 1 contra 1)**: el anfitrión elige el tamaño al crear la sala. El tercero aparece sobre la plataforma de arriba. Cada jugador tiene su color; quien queda en pie el último gana la ronda, y si caen todos a la vez es empate. Un cuarto jugador queda fuera de la sala.
- **HUD del VS**: las victorias van junto al nombre de cada jugador y el centro queda libre. El marcador completo aparece en cada aviso de ronda.
- **Tirachinas del modo normal sin recarga**: se puede disparar sin esperar. En el VS sigue la recarga de 1,5 s.
- **Pantalla**: el lienzo ocupa toda la pantalla con su proporción exacta, y los menús se reducen para caber sin desplazarse.
- **Pendiente**: la bola del tirachinas todavía empuja al rival (no lo agarra); el VS no suma al ranking global; la decoración con marcos, cuando llegue el pack.

## Qué cambia en la 4.40.0
- **Repisas que desaparecen al pisarlas**: ya no es un reloj. Una repisa queda firme mientras nadie está encima. Al pisarla se desvanece 0,8 s, queda fuera 2 s y vuelve con un fundido corto. Si nadie la pisa, no cambia nunca. Aplica a las oleadas y al VS; los rivales del VS también cuentan. El entrenamiento sigue con las repisas fijas.
- **Isla de Bizcocho**: un 20 % más grande (escala 0,544 a 0,653).
- **Pruebas**: `tests/a28_plataformas.py` reescrita para el comportamiento nuevo (9). La prueba de mapas `a37` acepta el ancho de Bizcocho.

## Qué cambia en la 4.39.0
- **Pantalla del personaje rehecha** como el libro de la referencia: libro abierto, título "Personaje" en su cinta, el héroe sobre el pedestal, cinco filas de colores (Piel, Pelo, Camisa, Bufanda, Pantalón) con el nombre del color seleccionado debajo, candados en los colores bloqueados, y botones VOLVER y GUARDAR de madera.
- Se conservan las mismas acciones (elegir color y guardar), así que el progreso y los colores guardados no cambian.
- **Escalado de pantallas**: el envoltorio de las pantallas escaladas toma el ancho real de la pantalla, así que se centran bien en cualquier teléfono.

## Qué cambia en la 4.38.0
- **EN VIVO grande**: ocupa el lado derecho del menú principal con la misma altura que el menú. El marco se estira en 9 partes (no se deforma), el texto "EN VIVO" y el título van en HTML y la demostración se encaja sin deformarse.
- **Pisotón a jefes**: un pisotón por jefe cada 2 segundos. Si se repite antes, no hay rebote ni daño.
- **Cinta PUNTOS** sin el tablero de cuadros.
- **Pruebas**: `tests/a47_pisoton_jefes.py` (4). La prueba de textos `a45` se mide a 915x318.

## Qué cambia en la 4.37.0
- **Menús más anchos y apaisados** para un teléfono de 318 px de alto (así no se encogen): menú principal más estrecho con el marco EN VIVO más ancho; crear sala en dos columnas (mapas a la izquierda, opciones a la derecha); derrota en dos columnas (banner y puntuación a la izquierda, placas y botones a la derecha); tarjetas base y de clase `wide` más anchas.
- **Crear sala**: nombres y descripciones de los mapas se leen enteros; los botones bajan de línea dentro de su caja.
- **Elegir mejora**: cada icono tiene su color (azul, verde, amarillo) y la rareza se lee sobre el pergamino.
- **Pruebas**: el texto de los textos sin solapes (`a45`) ahora se mide con 915x318, la altura del teléfono.

## Qué cambia en la 4.36.0
- **Efectos de la espada** (arco de corte con capas y partículas de cada efecto): chispa (destellos dorados), escarcha (cristales y neblina helada), brasa (humo y brasas violetas).
- **Efectos del tirachinas**: la bola tiene color propio y una estela que sigue en el aire mientras viaja y se apaga al impactar. Rayo (amarilla, arcos eléctricos), lava (naranja, brasas) y hielo (celeste, cristales). Cada una tiene su choque al impactar.
- **Crafteo**: se quitan los textos sobrantes (subtítulo, pista de la mesa, etiquetas de ranura y aviso inicial) y los nombres de los materiales se leen enteros.
- **Pruebas**: `tests/a46_efectos_crafteo.py` (18). La prueba `a23` mide ahora el sistema nuevo.

## Qué cambia en la 4.35.0
- **Crafteo rehecho**: tres columnas compactas (inventario, mesa y recetas) con la distribución de la referencia.
- **Botón Inventario**: muestra u oculta la columna de materiales. Cada material muestra su cantidad (x21, x0...).
- **Mesa**: dos ranuras. Arrastra un material con el ratón o el dedo, o tócalo para ponerlo en la primera ranura libre. Si la mezcla es una receta y tienes material suficiente, aparece FABRICAR abajo. Si falta material, la mesa dice cuánto.
- **Recetas**: cada una muestra su coste (en rojo lo que te falta) y, si ya la tienes, EQUIPAR / EQUIPADO.
- **Pruebas**: `tests/a43_crafteo_pantalla.py` (15), con arrastre real del ratón.
- **Pendiente**: los efectos visuales de la espada y del tirachinas (aún no están hechos).

## Qué cambia en la 4.34.0
- **Decoración de todas las interfaces** según las referencias: paneles de pergamino con su marco, botones de madera con borde de latón, y textos marrón oscuro sobre el pergamino.
- **Menú principal**: botones de sprite (ARCADE, MULTIJUGADOR, PERSONAJE, TABLA, CUENTA, CRAFTEO, AJUSTES) y la demostración dentro del marco EN VIVO.
- **Derrota**: banner DERROTA, cinta PUNTOS con la puntuación entre diamantes, placas de madera con su icono (enemigos, jefes, oleada, corazones, mejoras) y botones REINTENTAR y MENÚ de fuego y hielo.
- **Crafteo**: nuevo diseño de la referencia (Mesa con materiales, ranuras de lo equipado y recetas con su botón).
- **Corazones** del marcador con el sprite de la referencia.
- **Textos**: no se pisan en ninguna pantalla (lo mide `tests/a45_textos_sin_colision.py`).
- **Pendiente**: el título ASCENSO es texto dibujado con CSS (no el arte de la referencia).

## Qué cambia en la 4.33.0
- **Jefes**: tocar el cuerpo de un jefe ya no quita vida. El daño viene de sus golpes con aviso (espada, carga, pisotón, grito, láser, disparos). Así se puede atacar con la espada.
- **Daddy**: su golpe pesado no llegaba nunca (el estado de preparación se cerraba antes de golpear). Corregido.
- **Oleadas**: menos enemigos (2 al principio, nunca más de 9 por oleada), ritmo más calmado, tope de enemigos vivos que sube despacio (2, 3, 4), y tope de arqueros (1 hasta la oleada 8, luego 2).
- **Corazones**: 5 en el modo oleadas (antes 3). El VS sigue con su vida propia.
- **Pruebas**: `tests/a44_dificultad_jefes.py` (6). Las de oleadas, Daddy y jefes nuevos se ajustan a 5 corazones y al golpe corregido.

## Qué cambia en la 4.32.0
- **Pantalla de crafteo nueva**, copiada de la referencia: cabecera con pestañas Materiales y Crafteo, panel de materiales con sus 16 contadores, y panel de recetas con sus vistas, costes y botones. Se escala entera a cualquier pantalla sin deformarla.
- **Pestaña Crafteo**: muestra lo equipado en la espada y en el tirachinas.
- **Lógica igual que antes**: fabricar descuenta materiales y equipa el efecto; pulsar EQUIPADO lo quita; VOLVER regresa al menú.
- **Iconos nuevos** en `assets/img/crafteo/` (materiales, vistas de efectos, bolsa, martillos y reloj de arena), recortados de la referencia.
- **Pendiente**: las fuentes Pixelify Sans y Nunito se cargan de internet. Sin conexión, la pantalla cambia de letra (para el APK habrá que incrustarlas).
- **Pruebas**: `tests/a43_crafteo_pantalla.py` (15). Las de crafteo y pantallas se ajustan a las clases nuevas.

## Qué cambia en la 4.31.4
- **Isla de Bizcocho (oleadas)**: tenía declarada una sola repisa. Ahora tiene las tres de la imagen: las dos de abajo (a la altura de la tarta y de la rosquilla) también sostienen al jugador.
- **Araña**: su dibujo mira a la izquierda por defecto. Ahora se voltea al revés, así va hacia donde camina (`FACE_LEFT_ART` en `js/30_render.js`).
- **Pruebas**: `tests/a42_bizcocho_arana.py` (8).

## Qué cambia en la 4.31.3
- **Siluetas y franjas rotas en las repisas (y islas en blanco)**: `Img.ready()` daba por lista una imagen a medias de cargar (solo miraba `naturalWidth`). Las repisas de un mapa se recortaban y se guardaban en caché con datos incompletos, y quedaban rotas hasta recargar la página. Ahora una imagen cuenta como lista solo cuando está completa (`complete && naturalWidth > 0`), igual que en la 4.28.1.
- **Pruebas**: `tests/a41_imagen_a_medias.py` (7).

## Qué cambia en la 4.31.2
- **Entrada principal = archivo de una sola pieza.** `index.html` del zip es ahora la versión compilada (`ascenso-sin-nube.html`), que carga todo dentro del archivo. La versión de carpeta (`js/`, `assets/`) queda para editar más adelante.
- **Motivo**: en la versión de carpeta, en algunos teléfonos, las islas no cargaban y aparecía una franja oscura sobre una repisa. En la versión de una sola pieza no pasa.
- **Música**: sigue en `assets/audio/music/` junto al archivo; los `.ogg` los pones tú.

## Qué cambia en la 4.31.1
- **Islas que se quedaban en el rectángulo marrón**: en algunos teléfonos la carga de la imagen se queda colgada (ni termina ni falla). Ahora el cargador vigila cada imagen y, si a los 2,5 s no está lista, la vuelve a pedir con una dirección distinta. Las islas de todos los mapas empiezan a cargarse al arrancar el juego.
- **Pruebas**: `tests/a40_imagenes_colgadas.py` (3).

## Qué cambia en la 4.31.0
- **Controles en pantalla nuevos**: izquierda, derecha, saltar, atacar y tirachinas, sin círculo de fondo. Los iconos están en `assets/img/ctrl/` (PNG con transparencia). Para cambiar un icono, reemplaza su archivo y compila.
- **Bolita del tirachinas**: 60 px con el icono de 48 px, en color (se quitó el filtro negro).
- **Sin cambios**: el botón de pausa (sigue con su icono anterior) y la franja del tirachinas.
- **Pruebas**: `tests/a39_controles_nuevos.py` (6).

## Qué cambia en la 4.30.1
- **Islas que a veces no se pintaban**: si el navegador fallaba al cargar una imagen (por ejemplo, por poca memoria en un momento), la caché la guardaba como fallida para siempre y el mapa quedaba en el rectángulo marrón hasta reiniciar. Ahora el cargador reintenta con una pausa creciente (`js/00_base.js`, `Img.load`).
- **Pruebas**: `tests/a38_imagenes_reintento.py` simula el fallo y comprueba que la isla vuelve sola.

## Qué cambia en la 4.30.0
- **Tres mapas nuevos en el VS** (ocho en total): Caverna de Cristal, Isla Playa y Volcán Ardiente. Cada uno con dos repisas, como los demás.
- **Cuatro mapas en oleadas**: Bastión, Isla de Bizcocho, Selva Ancestral y Engranajes del Tiempo. Cada partida sale uno al azar.
- **Escala y altura por mapa**: cada isla tiene su propia escala y su altura (`scale` y `T` en `js/vs-maps.js`), para que quepa en pantalla sin tapar las repisas.
- **Iconos en la mesa de crafteo**: cada efecto tiene su icono (`assets/img/craft/`, mapeo en `CRAFT_ICON` en `js/crafting.js`). Se quitan los cuadros de color.
- **Pruebas**: la de mapas nuevos (`tests/a37_mapas_nuevos.py`); las que contaban cinco mapas o el bastión fijo se ajustan a ocho y a cuatro.

## Qué cambia en la 4.29.0
- **Mejoras**: se quita el Imán. Suerte ya no habla de cofres: ahora da más probabilidad de materiales raros.
- **Monedas y cofres quitados**: ya no salen en oleadas (ni de los jefes). Se borran el sonido, los sprites, los bonus de oreja, cuerno y ala, y la tienda (`js/shop.js`).
- **Limpieza de código sin uso**: métodos, constantes, recursos de imagen, el objeto de biomas de la carrera, el récord de la carrera y el documento de especificación de oleadas (ya implementada).
- **Bug corregido en 4.28.1**: se mantiene.
- **Pruebas**: se quitan las de sprites de cofres y se ajustan las de tienda, monedas y música a lo que existe.

## Qué cambia en la 4.28.1
- **Bug corregido: el menú de mejoras se quedaba congelado.** Al pulsar una mejora tras un jefe, la acción no llegaba a la partida. Ahora la mejora se aplica y la partida sigue. Se guarda la elección solo mientras el menú está abierto.
- **Textos quitados**: lista de salas, crear sala, unirse, multijugador, entrenamiento, elegir mejora, pantalla de fin (récord de la nube y misión) y los créditos de la pantalla de ajustes. Los créditos siguen en `docs/CREDITOS.md`, porque las licencias CC BY piden el crédito.
- **Pendiente**: algunas mejoras mencionan monedas y cofres, que ya no existen en oleadas.

## Qué cambia en la 4.28.0
- **Marcador de oleada animado**: "Oleada N" ya no está arriba todo el tiempo. Aparece al empezar cada ronda, crece un poco y se desvanece en unos 2,4 s. Los puntos siguen visibles.

## Qué cambia en la 4.27.0
- **Menú limpio**: se quitan el lema, el récord, el estado de la nube y la línea de controles.
- **Jefes sin tapar la interfaz**: la barra de vida va sobre la cabeza del jefe. Al aparecer, un aviso de 5 s muestra solo su nombre, y durante ese tiempo el jefe no ataca ni recibe daño. Se quita el aviso de texto de oleada, que estaba repetido.
- **Golpe y muerte para todos los jefes**: la bruja tiene sus animaciones de golpe (3 cuadros) y muerte (7 cuadros). Al jefe que no trae animación de muerte (Minotauro y Daddy) se le suma una caída: se inclina sobre sus pies, suelta polvo y se desvanece. Al recibir daño brilla un instante.
- **Sombra suave** bajo los jugadores.
- **Botín por tipo**: cada enemigo y cada jefe suelta sus propios materiales (tablas `MAT_TABLE` en `js/crafting.js`). Farmear un tipo da unos materiales y no otros.
- **Efectos por nivel**: cada efecto de crafteo tiene nivel 1, 2 o 3. Los de nivel alto sueltan más chispas y bolas de tirachinas más grandes.
- **Dificultad creciente**: cada 3 oleadas, los enemigos se mueven un 3 % más rápido, y cada jefe aparece con un 25 % más de vida que el anterior.
- **Crafteo**: solo en el menú principal. No hay pantalla de crafteo entre oleadas.
- **Pendiente**: que el usuario confirme el criterio de "progreso" (ver mensaje de cambio). El nombre de la oleada y los jefes pueden tapar el texto central del marcador.

## Qué cambia en la 4.26.0
- **Daddy (peso pesado)**: jefe de la rotación de oleadas, de 22 de vida. Camina despacio (más rápido bajo la mitad de su vida) y elige su ataque según la distancia, siempre anunciado por su animación:
  - **De cerca**: golpe pesado. Se prepara con *charge* (0,9 s) y golpea con *strike* (0,4 s). Solo daña si estás a su alcance.
  - **Media distancia**: grito (*scream*, 1,1 s). Sacude la isla y daña si estás pegado a él en el suelo.
  - **Lejos**: lanza una bomba (*shoot*, 0,6 s).
  - Tras cada ataque hace una pausa de 1,1 s.
- Sus animaciones vienen de 6 tiras verticales recortadas a una cuadrícula (cuadros de 176 px de ancho y 180 px de alto, con los pies en la misma fila). No trae animación de golpe ni de muerte: al morir se desvanece.
- **Pendiente**: ninguno de los jefes o enemigos de la lista. Queda por probar en el teléfono el tamaño y la dificultad de cada uno.

## Qué cambia en la 4.25.0
- **Jefes nuevos** (rotación de oleadas): Minotauro (reposo, caminar y ataque; sin animación de golpe ni de muerte propia: al morir se desvanece), Golem láser (Mecha-stone: el brazo apunta al jugador con un aviso de 1 s y dispara un rayo de 0,7 s que solo daña en su trayectoria; cada 4,5 s).
- **Enemigos nuevos** (normales): Araña gigante (café, rápida, cuerpo a cuerpo, desde la oleada 3) y Demonio volador (vuela y se lanza en picado como la avispa, desde la oleada 6). El proyectil del demonio no se usa: su comportamiento es el de la avispa.
- **Demonio slime, guardián de hielo y minotauro**: integrados con sus cuadros revisados (pies en la misma fila, fondo transparente).
- **Pendiente**: evaluar Daddy (sus hojas son verticales y de tamaños distintos; no encaja con el resto).

## Qué cambia en la 4.24.0
- **Demonio slime**: nuevo jefe, con sus cinco animaciones (reposo, caminar, ataque, golpe y muerte) cortadas a 288 × 159 px, con los pies en la misma fila. Entra en la rotación de jefes de oleadas.
- **Pendiente**: Minotaur y Mecha-stone Golem (jefes); Giant Spider y Flying Demon (enemigos); y revisar Daddy.

## Qué cambia en la 4.23.0
- **Código de la carrera eliminado**: mundo de la carrera, eventos, misiones, director de enemigos, avance de bioma, tienda entre biomas y cámara de la carrera. Se quitaron sus pruebas (`a4_horizontal`, `a5_41`).
- **Hechicero**: el dibujo usaba un tamaño de cuadro fijo de 200 px y cortaba mal los cuadros de 250 px. Ahora usa el tamaño de su ficha.
- **Guardián de hielo**: nuevo jefe, con su ataque, daño, muerte y golpe. Entra en la rotación de jefes de oleadas.
- **Pendiente**: Demon Slime, Minotaur y Mecha-stone Golem (jefes); Giant Spider y Flying Demon (enemigos); y revisar Daddy, cuyo formato no encaja con el resto.

## Qué cambia en la 4.22.0
- **Hechicero (bruja maga) reemplazado**: sprites nuevos con fondo transparente, cuadros de 250 × 167 px con los pies en la misma fila. Antes el hechicero tenía fondo opaco. Ajustes de tamaño en `ENEMY_DEF`.
- **Récords separados**: las oleadas tienen su propio récord (mejor oleada y mejor puntuación de oleadas). La carrera conserva el suyo.
- **Ranking global**: las oleadas no se suben a la tabla de la carrera, porque sus puntuaciones no son comparables. Un ranking de oleadas necesita una base de datos nueva.
- **Pendiente**: borrar el código de la carrera (World, biomas, tiendas y misiones; sigue sin ser accesible), e integrar los nuevos enemigos y jefes (cuadros cortados y revisados uno a uno).

## Qué cambia en la 4.21.0
- **Efectos que se cortan al salir de una pantalla**: al pulsar continuar, reiniciar, menú, elegir mejora, o al salir de una sala o partida, se paran los efectos que sonaban (el click del botón no se corta). Los efectos que empiezan solos suenan hasta el final.
- **Sin límite de 4 copias por efecto**: antes, si un efecto ya estaba en 4 copias, no volvía a sonar.
- Lista de archivos de audio que espera el juego: `docs/AUDIO.md`.

## Qué cambia en la 4.20.0
- **Repisas que desaparecen** (anti-campeo) en el VS y en las oleadas: 2 s firmes; luego 0,8 s desvaneciéndose (parpadeando, todavía sólidas); luego 4 s fuera; y 0,4 s de reaparición. Se repite en bucle y las repisas van desfasadas.
- Quien está encima cae cuando la repisa desaparece. La caída se avisa con el parpadeo.
- El entrenamiento deja las repisas fijas.
- Las repisas están separadas de la isla en `js/platforms.js` (medidas de caja en `PLAT_BOX`).
- **Pendiente**: el audio.

## Qué cambia en la 4.19.0
- **16 materiales con icono propio**: madera, tablón, cuerda, cuero, hilo, clavos, carbón (comunes); hierro, cobre, oro, cristal azul y cristal de hielo (poco comunes); ámbar, esmeralda y amatista (raros); magma (muy raro). Los iconos están en `assets/img/mat/`.
- **Botín realista**: cada enemigo tiene su probabilidad de soltar algo (orco 20 %, golem 40 %, avispa 15 %). Un jefe siempre suelta de 2 a 3 materiales.
- **Suerte**: sube la probabilidad de caída (+35 % por nivel) y hace más frecuentes los materiales raros.
- **Recetas nuevas** con los 16 materiales. La pantalla de crafteo muestra cada icono.
- Los materiales anteriores (hierro, cristal y piedra mágica de la versión 4.15) se han sustituido; los que se guardaron con esos nombres se pierden.

## Qué cambia en la 4.18.0
- **ARCADE es el modo oleadas** en el bastión: oleadas sin fin, descanso entre oleadas y un jefe cada 5 oleadas.
- Tras cada jefe, 3 mejoras para elegir. Sin monedas. El marcador muestra la oleada.
- Justicia: los enemigos y el jefe aparecen en el borde lejano al jugador; nunca encima. Máximo 4 enemigos vivos.
- La carrera ya no es accesible desde el menú; su código se mantiene y lo usan sus pruebas.
- **Pendiente**: el audio (música con archivos propios y sonidos que terminan aunque se cambie de pantalla).

## Qué cambia en la 4.17.0
- **Entrenamiento con su propia isla**: cuadrícula de práctica con tres repisas (`isla_entrenamiento.png`).
- **Bastión de oleadas**: isla de piedra con runa y dos repisas (`isla_bastion.png`). Todavía no se usa en el juego: lo usará el modo oleadas.
- Los dos mapas están en `SOLO_MAPS` (`js/vs-maps.js`), fuera de la lista de salas del VS, que sigue siendo de cinco mapas.
- **Pendiente**: el modo oleadas (ver `docs/OLEADAS.md`).

## Qué cambia en la 4.16.2
- **Espada: cooldown de 0,8 s** para el jugador, el entrenador y el multijugador (antes 0,5 s). Los bots también esperan ese cooldown entre golpes.
- **Espada: aturdimiento de 0,2 s** (antes 0,3 s). Ambos valores están en `SWORD_RULES` (`js/00_base.js`).

## Qué cambia en la 4.16.1
- **Espada: cooldown de 0,5 s** entre golpes del jugador (antes salía en cuanto acababa la animación).
- **Espada: aturdimiento de 0,3 s** al rival (antes 0,4 s). Ambos valores están en `SWORD_RULES` (`js/00_base.js`).
- **Pendiente**: el modo oleadas que sustituye a la carrera de Arcade.

## Qué cambia en la 4.16.0
- **Efectos en combate**: al empezar el golpe, la espada suelta destellos con el color y el estilo del efecto equipado. La bola del tirachinas toma el color del efecto y deja su rastro en ese color (`js/crafting.js`, `Fx`).
- **Efectos en red**: el golpe y la bola envían el identificador del efecto. Quien lo recibe lo valida: solo cuenta si existe y si es del arma correcta.
- **Pendiente**: el modo oleadas que sustituye a la carrera de Arcade (enemigos y jefes sin fin, con pausa entre oleadas para curarse y craftear).

## Qué cambia en la 4.15.0
- **Menú**: el botón JUGAR se llama ARCADE. Nuevo botón CRAFTEO.
- **Materiales**: hierro, cristal y piedra mágica. Los enemigos los sueltan con cierta probabilidad y los jefes sueltan tres. Se recogen al pasar cerca, como las monedas, y se guardan en el dispositivo (`js/crafting.js`).
- **Crafteo**: seis recetas (tres para la espada y tres para el tirachinas). Craftear gasta materiales; equipar elige el efecto de cada arma. Un dato corrupto se trata como vacío.
- **Pendiente**: los efectos visibles en combate y que los demás jugadores los vean; el modo oleadas, que sustituirá al modo carrera de Arcade. No se añade dash a los jugadores.

## Qué cambia en la 4.14.1
- **Espada: aturdimiento de 0,4 s** (antes 1,5 s). Al recibir un golpe de espada, el personaje queda inmóvil un instante y el ritmo no se corta. Vale en el VS y en el duelo de los bots. La bola sigue dejando inmóvil 1 s.

## Qué cambia en la 4.14.0
- **Cinco mapas del VS** (se eligen al crear la sala): Islas del Crepúsculo (normal), Cumbres de Cristal (ice), La Forja del Abismo (magma), Cielo de Azúcar (candy) y Arrecife del Abismo (abyss). Cada uno tiene UNA isla principal y DOS plataformas, con el arte del pack y su propio fondo. Los datos y la geometría están en `js/vs-maps.js`, separados de la interfaz.
- **Selección sincronizada**: el anfitrión elige en las tarjetas de crear sala o de la sala; los invitados ven la selección al instante. Quien entra después recibe el mapa en la bienvenida. Un mapa no válido carga el normal.
- **Tarjetas**: miniatura, nombre, descripción de una línea y selección en dorado con animación. Solo el anfitrión puede pulsarlas.
- **Tirachinas**: recarga de 1,5 s también en el modo normal (sin ella se disparaba sin pausa).
- **Pendiente**: el modo por oleadas (enemigos y jefes en oleadas, sustituye al modo carrera), los materiales y el crafteo de armas y tirachinas.

## Qué cambia en la 4.13.0
- **HUD sin recuadros**: se quitaron los marcos del bloque de la izquierda y del marcador central. Se quitaron también el nombre del bioma y el contador de bajas. Siguen la altura, los puntos, la misión y las animaciones (monedas, corazones, buffs y récord).
- **Duelo del menú**: se quitó el mensaje "Los bots se pegan, disparan y esquivan sin parar".
- **ENTRENAMIENTO** (dentro de MULTIJUGADOR, en su propia casilla): una partida sin fin contra un bot, sin conexión ni ranking. El bot usa la misma IA del duelo y se comunica con la partida como un rival de red, así que la partida no cambia. Al salir se vuelve al menú de multijugador.
- **Pendiente**: el modo PvP con cuatro islas nuevas y el diseño visual de los escenarios.

## Qué cambia en la 4.12.0
- **HUD con placa**: el bloque de la izquierda (vida, monedas, tirachinas y misión) y el marcador central tienen un marco oscuro redondeado, legible sobre cualquier bioma.
- **Feedback en partida**: las monedas suben contando y pulsan al ganar; los corazones se sacuden y se ponen rojos al recibir daño y pulsan al curarse; cada buff aparece como insignia con anillo de progreso; al superar el récord aparece un aviso dorado breve.
- **Feedback en menús**: la mejora elegida se levanta y se ilumina antes de aplicarse; una oferta sin monedas se sacude y explica por qué; los botones se hunden 2 px al pulsarlos.
- **Iconos**: los botones del menú (jugar, multijugador, personaje, tabla, cuenta y ajustes) llevan iconos pixel-art propios.
- **Victoria en el VS**: el aviso de ganador entra con un golpe de escala.
- **Menú**: la escena se escala y se centra en cualquier ancho de pantalla.

## Qué cambia en la 4.11.0
- **Bots más inteligentes**: cada bot tiene una personalidad (cuerpo a cuerpo, tirador, astuto o estratega), y en cada partida se eligen dos distintas.
- **Decisiones por utilidad**: acercarse, mantener la distancia, disparar, retirarse, subir a la plataforma, bajar sobre el rival, fintar o reposicionarse, según la situación. Nunca se quedan quietos sin motivo.
- **Lectura del rival con retraso humano**: reaccionan si el rival carga el tirachinas o prepara un espadazo, y se apartan o saltan.
- **Tiro con anticipación**: calculan hacia dónde irá el rival durante el vuelo de la bola y tienen en cuenta la plataforma y los rebotes.
- **Reglas del VS**: la espada deja inmóvil al rival 1,5 s y la bola 1 s, sin empujar.
- **Pendiente**: el HUD de la partida, los iconos a juego y las animaciones de feedback.

## Qué cambia en la 4.10.0
- **Menú principal nuevo**: la tarjeta queda centrada a la izquierda y, a la derecha, un panel flotante con un duelo de práctica 1 contra 1 en vivo. Los bots se pegan con la espada, disparan con el tirachinas (calculan el tiro con la misma física de la bola), esquivan las bolas y los espadazos, improvisan con ataques aleatorios y no se caen a menudo. El duelo no tiene fin y se detiene cuando se abre otra pantalla.
- **Fondo del menú**: bosque nocturno con luciérnagas y velo en los bordes. Se quitó el personaje sobre el bloque de tierra.
- **Marcos redondeados**: paneles, botones y campos de texto usan marcos con esquinas circulares, generados a partir de la paleta de ASCENSO. La animación de los controles táctiles no cambia (a17 lo comprueba).
- **Pendiente**: marcos del HUD de la partida, iconos a juego y animaciones de feedback (monedas, corazones, récord y victoria).

## Qué cambia en la 4.9.0
- **Marcos de la interfaz**: tarjetas, botones y ofertas usan los marcos del pack Complete UI Essential Pack Free (Crusenho, CC BY 4.0), recoloreados a la noche de ASCENSO: piedra azul oscura con borde dorado, y el botón principal en oro. Los créditos están en Ajustes y en docs/CREDITOS.md.
- **Controles táctiles**: sin cambios. Un test (a17) compara su posición y tamaño con la referencia en cuatro tamaños de pantalla.
- **Pendiente** del rediseño (documento de dirección visual): marcos para el HUD del juego (placa en el canvas), iconos a juego, animaciones de feedback (monedas que suben, corazones que pulsan, banner de récord, presentación de victoria) y revisar Rankings y Personalización con el mismo estilo.

## Qué cambia en la 4.8.2
- **Muerte del personaje**: al perder, el personaje recibe el golpe (chispas y sacudida), sale despedido hacia atrás, cae, rebota una vez y queda tendido girando hacia atrás. Después se deshace en bloques de píxeles que suben como brasas, y queda un destello dorado y azul que se aleja.
- **Juego de un jugador**: la pantalla de fin aparece cuando termina la animación, no al instante.
- **VS**: la animación la ven los dos jugadores. El anfitrión también avisa cuando pierde, así que el invitado ve caer su personaje.
- **Pendiente**: el rediseño completo de la interfaz (HUD, menús, tarjetas y feedback) queda para cuando llegue el pack de marcos. Los controles táctiles no cambian.

## Qué cambia en la 4.8.1
- **Tirachinas al girar**: si se pulsa el tirachinas y la flecha de la dirección en el mismo instante, el personaje mira hacia donde se mueve y la bola sale hacia ese lado (antes salía hacia el lado anterior).
- **Todas las pantallas caben**: se auditan en seis tamaños de teléfono, con la barra del navegador visible, y ninguna se sale ni se desplaza. El ajuste usa el área visible real (visualViewport) y se revisa mientras la pantalla está abierta.
- **Caché**: `index.html` pide cada archivo con `?v=4.8.1`. Al reemplazar la carpeta, el navegador descarga la versión nueva.
- **Archivos sueltos**: si el navegador no deja leer píxeles (archivos abiertos sin servidor), el juego sigue con el aspecto normal del héroe y sin colores de equipo. Para el APK usar `dist/ascenso-sin-nube.html`, que incrusta todas las imágenes.

## Qué cambia en la 4.7
- **Tirachinas hacia la izquierda (corregido)**: la causa era que el personaje podía girar mientras se apuntaba, y la bola cambiaba de lado con el dedo. Ahora el lado queda fijo al cargar. La bola, la banda y la trayectoria salen del mismo punto (`Scene.slingOrigin`), a ambos lados. Al pausar se cancela la carga: no se dispara al reanudar.
- **Pantallas que caben**: cada menú se centra en la pantalla y se reduce lo justo para caber, sin desplazarse ni cortarse. En pantallas bajas (como un teléfono en horizontal con la barra del navegador) se compacta primero el diseño. La prueba `a14` abre las trece pantallas en ocho tamaños.
- **Partidas de 2 o 3 jugadores**: en CREAR SALA el anfitrión elige 1 contra 1 o 1 contra 1 contra 1. El tercero aparece en la plataforma de arriba, en el centro de la isla.
- **Corazones del VS**: cada jugador tiene un corazón que gira (los seis cuadros de la hoja `Heart_Pickup`) con el número de vidas al lado: X6. En 1 contra 1 contra 1 los rivales se apilan a la derecha.
- **Cofre animado en el modo normal**: el cofre usa el sprite de la hoja `Animated Chests` (dorado y rojo, en bucle). Los cofres trampa se distinguen por sus ojos rojos.
- **Tirachinas del modo normal sin recarga**: en el modo normal se puede disparar seguido. En el VS sigue la recarga de 1,5 s.
- **Bola del tirachinas**: en el VS agarra al rival 1 segundo, como la espada, en vez de empujarlo fuera de la isla.
- **Pantalla ajustada**: el lienzo ocupa toda la pantalla con su proporción exacta, y los menús largos se reducen para caber sin desplazarse. En vertical la partida se pausa y aparece el aviso de girar el teléfono.
- **Pendiente**: decoración de todas las interfaces con los marcos del pack que enviará el usuario. Se hará con cuidado, cuando llegue el pack.
- **Pendiente antes de la APK**: probar en un teléfono Android real (pantalla completa, toques y el tirachinas con dos dedos).

## Qué cambia en la 4.6
- **Tirachinas nuevo** (tomado del proyecto 4.6): en el lado derecho hay una franja vertical con una bolita. Mantén el dedo en la franja: arriba o abajo fijan el ángulo y a la derecha hay más potencia. Al soltar, dispara. La bolita lleva dentro el icono del tirachinas y vuelve al centro. Con teclado, ↑/↓ apuntan mientras mantienes L.
- **Seis corazones por ronda** en el VS. Cada espadazo y cada bola del tirachinas quita uno. Quien se queda sin corazones pierde la ronda.
- **Caer fuera de la isla** quita un corazón y el jugador vuelve a su esquina. Con el doble salto puede volver antes de caer del todo.
- **Pendiente**: la sala de tres jugadores (1 contra 1 contra 1) con el tercero en la plataforma flotante, y la bola del tirachinas, que todavía empuja al rival.

## Qué cambia en la 4.5
- **Isla 30 % más larga**: pasa de 460 a 598 píxeles. En pantallas estrechas la vista se aleja un poco para que quepa entera.
- **Plataforma lisa encima de la isla**, estilo Brawlhalla: se atraviesa desde abajo y se pisa desde arriba.
- **Equipos de color en el VS**: verde contra rojo, o amarillo contra azul, al azar en cada partida. Todo el personaje va en el color de su equipo, menos la cara. El nombre también lleva el color.
- **Espadazo que agarra**: quita 1 de vida y agarra al rival 1,5 segundos. No lo empuja ni lo saca de la isla, y la espada no choca después del golpe. La duración está en `js/versus.js` (`sendHit(1, 0, 0, '', 1.5)`).
- **Pendiente**: la bola del tirachinas sigue empujando al rival y puede sacarlo de la isla. Si quieres que también agarre, se cambia igual.

## Qué cambia en la 4.4
- **Pausa arriba en el centro**: el botón de pausa está en el centro de la barra superior y el marcador queda debajo. Así ya no tapa los corazones de los jugadores.
- **Salir de la partida**: en el VS, SALIR DE LA PARTIDA (o REINICIAR y MENÚ de la pausa) manda a los dos a la sala. El que sale y el rival vuelven a la sala con un aviso, y la sala sigue abierta para otra partida.
- **Salas públicas**: MULTIJUGADOR → BUSCAR SALAS muestra la lista de salas abiertas, con código, anfitrión, victorias, jugadores y candado si tiene contraseña. Se entra con UNIRSE. Las salas privadas se entran con UNIRSE CON CÓDIGO.
- **Contraseña opcional**: al crear sala, el anfitrión elige SIN CONTRASEÑA o CON CONTRASEÑA (de 4 a 12 caracteres). La contraseña no aparece en la lista: el anfitrión la comprueba cuando alguien entra.
- **Pendiente**: la sala de tres jugadores y la prueba de la lista pública con dos móviles reales.

## Qué cambia en la 4.3
- **Isla más ancha y con más detalle**: 460 px de ancho (antes 400). La hierba tiene varias capas con brizas de distinto alto, florecillas, y la roca tiene estratos y grietas. Hay arbustos, rocas y farolas.
- **Tirachinas sin horquilla fija**: ya no se dibuja la horquilla delante del personaje, que tapaba la cara. Sólo se ven la goma y la bola al apuntar y tirar.
- **Cooldown de 1,5 s**: después de tirar la bola hay que esperar 1,5 segundos para volver a tirar. Vale igual en el modo de un jugador y en el VS.
- **Iconos del pack game-icons.net**: los botones de izquierda, derecha, saltar, atacar y tirachinas tienen iconos nuevos, y el botón de pausa tiene el suyo. Los créditos están en `docs/CREDITOS.md` y en Ajustes.
- **HUD izquierdo**: los corazones, las monedas, el escudo y el tirachinas se desplazan a la derecha del botón de pausa, que antes los tapaba.
- **Golpes cerca del borde**: el empuje de un golpe puede sacar al rival de la isla. Es parte del juego; si quieres menos empuje, se baja en `js/versus.js`.

## Qué cambia en la 4.2
- **Multijugador VS**: MULTIJUGADOR tiene dos opciones: CREAR SALA (VS) y UNIRSE A SALA. La sala muestra un código de 5 caracteres que el rival escribe para entrar. Las partidas son 1 contra 1 en una isla flotante, separadas del modo de un jugador.
- **Sala**: el anfitrión (quien la crea) elige cuántas victorias hacen falta (2, 3, 4 o 5; por defecto 4) y pulsa INICIAR. Para iniciar hacen falta los dos jugadores. El botón tiene un cooldown de 7 segundos.
- **Rondas**: cada ronda empieza con una cuenta de 5 a 0. Quien deja fuera al rival gana la ronda: sale WIN arriba en su pantalla, y el otro ve KO.
- **Fin de la partida**: al llegar a las victorias elegidas salen GANADOR (quien gana) y DERROTA (quien pierde), y los dos vuelven a la sala para otra partida.
- **Rival animado**: se ve caminar, correr, saltar, caer, pegar con la espada y tirar del tirachinas, con la bola a la vista. Su vida aparece en el marcador de arriba.
- **Pausa en VS**: ofrece CONTINUAR o SALIR DE LA PARTIDA. No reinicia nada.
- **Pendiente**: el control y el lanzamiento del tirachinas, una sala de tres jugadores y una lista pública de salas.

## Qué cambia en la 4.1
- **Pantalla completa en horizontal**: el lienzo ocupa toda la pantalla y su ancho se ajusta a la proporción del móvil (480 a 720 px), así que se ve más escenario. El primer toque pide pantalla completa y horizontal.
- **Tirachinas con apuntado manual**: mantén el botón y arrastra hacia atrás como si tensaras una goma; la bolita sale hacia delante. Cuanto más arrastras, más fuerte sale. Con teclado: mantén L y usa ↑/↓. La trayectoria es una línea suave con una marca donde caería.
- **Escudos que se rompen**: el escudero aguanta 3 golpes de espada o bolita; el Golem de cristal, 3 golpes (luego le hace daño de verdad); el caballero, 3 bloqueos (luego su guardia se rompe unos segundos).
- **Jefes bien dibujados**: los cuadros del golem miden 90 px (antes se recortaban a 64 px, de ahí el corte y el parpadeo). Tienen un halo de luz para leerse en escenarios oscuros.
- **Mejoras que hay que recoger**: un rombo dorado aparece en el nivel cada ~120 m. Al tocarlo se aplica una mejora al azar y se muestra su nombre. Ya no hay pausas para elegir.
- **Jefes más lejos**: el primero aparece a los 330 m y después cada 300 m.
- **Avispas espaciadas**: una a la vez (dos en dificultad alta), con una pausa de 9 a 13 segundos entre una y otra.
- **Niveles más variados**: 10 tipos de sección (rampa y puente son nuevos), y decoración fija por plataforma (arbustos, rocas y faroles).
- **Multijugador de un toque** (sustituido en la 4.2): MULTIJUGADOR buscaba una sala automática y empezaba la partida al conectar.
- **Música fuera del HTML**: las pistas ya no van incrustadas. Se leen de `assets/audio/music/` junto al HTML, y el HTML pesa 1,96 MB (antes 7,15 MB). Sin incrustar, el navegador lee la música en trozos y el bucle no se corta.
- **Rendimiento**: el HUD se dibuja en el lienzo (antes se reescribía en HTML), las plataformas y los sprites fijos se precalculan una vez, el cielo y la niebla de cada bioma se guardan en caché, y se quitaron los efectos caros de CSS (desenfoques, sombras grandes y filtros en los iconos).
- **Nube conectada**: cuentas, ranking público y multijugador con el proyecto nuevo `ascenso-juego` (ver la sección Nube).
- **Arreglos**: el texto "undefined" que aparecía con el escudo, la etiqueta DASH del botón y los nombres de los fantasmas sin nombre.

## Estructura del proyecto
```
index.html            Pantalla de juego, botón de pausa y mando táctil (Izquierda, Derecha, Salto, Tirachinas, Atacar)
css/style.css         Estilos (sin efectos de rendimiento)
assets/audio/music/   AQUÍ van las pistas (ver "Música")
assets/audio/sfx/     Efectos de sonido (vacío)
js/config.js          Versión, nube y rangos de jefes (330 m y cada 300 m)
js/00_base.js         Constantes, físicas, almacenamiento, imágenes, sonido y entrada (incluido el arrastre del tirachinas)
js/icons.js                 Iconos de los controles y de la pausa (game-icons.net)
js/performance.js     Bucle a paso fijo de 60 Hz
js/music.js           Música: pistas desde carpeta, bucle, fundidos, jingles y desbloqueo en móvil
js/progress.js        Totales, récords y desbloqueos
js/biome-art.js       Arte de fondos por conjunto
js/biomes.js          Los 5 biomas, la regla de bajas y las variantes
js/game-feel.js       Sacudidas, partículas y textos
js/upgrades.js        Mejoras de la partida, con rareza y iconos
js/shop.js            Tienda entre biomas (7 ofertas)
js/missions.js        Una misión opcional por partida
js/loot.js            Monedas, corazones, cofres y bonus de jefe
js/events.js          Eventos cada 60 m
js/10_world.js        Nivel infinito por secciones y mejoras colocadas
js/20_actors.js       Héroe, enemigos con escudo, jefes, proyectiles y objetos
js/backgrounds.js     Fondos con parallax horizontal precalculados
js/30_render.js       Sprites precalculados, plataformas horneadas, tirachinas y HUD en el lienzo
js/supabase.js, auth.js, cloud-save.js   Nube: conexión, cuentas, ranking y guardado
js/presence.js, ghost-players.js         Salas (Supabase o BroadcastChannel) y el rival del VS
js/versus.js                             VS: sala de 2, isla flotante, rondas, KO, golpes y lo que ve el rival
js/lobby.js                               Lista pública de salas: anuncios cada segundo del anfitrión
js/40_ui.js           Menús y pantallas
js/50_main.js         Controlador: estados, cámara, combate, bioma, mejoras y muerte
tools/build.py        Compila el juego en un solo HTML (sin música incrustada)
tests/                Baterías de la 4.1 (y historial_3.0 para referencia)
```

## Cómo ejecutarlo
- **En el móvil**: copia `ascenso-sin-nube.html` (o `ascenso.html` si usas la nube) y la carpeta `assets/` a la misma carpeta, y ábrelo en el navegador. Gira el móvil a horizontal.
- **Música**: pon los archivos en `assets/audio/music/` con estos nombres (con espacios o con guiones bajos, los dos valen): `Pixel Night Ascent.ogg`, `Moonlit Forest.ogg`, `Cave Echoes.ogg`, `Skyward Adventure.ogg`, `Stormy Sunset.ogg`, `Final Zone Ascent.ogg`, `Final Impact.ogg`, `Cozy Shop Loop.ogg`, `New Record Fanfare.ogg` y `Victory Fanfare.ogg`. Si falta alguno, ese tema se calla sin errores.
- **Compilar**: `python3 tools/build.py` (con nube) o `python3 tools/build.py --sin-nube` (sin nube).

## Controles
- **Teclado**: A/D o flechas para moverte. W, flecha arriba o Espacio para saltar; en el aire, un segundo salto. J, Z, K o X para golpear de cerca. **Mantén L o Shift para el tirachinas**: con ↑/↓ subes o bajas la puntería y, al soltar, dispara. Esc o P para pausa.
- **Táctil**: Izquierda, Derecha, Salto, Atacar y Tirachinas. Mantén el botón del tirachinas y **arrastra hacia atrás**: la bolita sale hacia delante, en la dirección contraria al arrastre. Suelta para disparar.

## Diseño del nivel
- **Avance infinito**: el nivel crece hacia la derecha sin final. Cada sección es una plantilla de plataformas anchas y continuas: suelo llano, escalones, pasarelas, tejados, cañones, zigzags, rampas y puentes.
- **Sin islas**: ninguna plataforma queda aislada; cada tramo enlaza con otro a menos de 120 px.
- **Medidas**: plataformas de al menos 96 px, escalones de 48 o 24 px (se suben saltando), fosos de 84 a 100 px (se saltan corriendo desde el borde).
- **Mejoras**: un rombo dorado aparece sobre una plataforma cada ~120 m. Hay que ir a por él.
- **Caídas**: caer por un foso te quita un corazón y te devuelve a un suelo visible junto a la cámara.

## Cámara
- **Horizontal**: va un poco por delante de tu movimiento. Te sigue si retrocedes.
- **Vertical**: tiene una banda de margen. Si sales por arriba, sube; si caes, baja contigo y no te pierde.
- **Arena del jefe**: la cámara se bloquea dentro de la arena hasta vencer al jefe.

## Enemigos
- **Orco**: te persigue si estás cerca y avisa antes de golpear.
- **Demonio**: se prepara con un destello y embiste en línea recta hasta el borde de su plataforma.
- **Soldado con arma**: dispara flechas rectas con aviso. Se aparta si te acercas, así que no acampa.
- **Bombardero**: lanza bombas en arco visible. Se aparta si te acercas.
- **Avispa**: entra por los laterales, fuera de la vista, y vuela por su banda. Avisa con un parpadeo y se lanza en picado una sola vez; después se retira.
- **Escudero**: bloquea lo que llega de frente con un escudo que se rompe a los 3 golpes. Desde arriba o por detrás, o cuando el escudo ya está roto, le haces daño.
- **Camaleón**: aparece y desaparece. Oculto no se puede golpear.
- **Sanador y mini-jefe**: el sanador cura a sus compañeros (abátelo primero); el mini-jefe avisa y lanza una onda por el suelo que se salta.
- **Lejanía**: los enemigos sólo se mueven cerca de ti.

## Jefes
- **Golem de cristal**: su escudo tiene 3 golpes; después le haces daño. Los pisotones quitan 2 golpes de escudo.
- **Golem de bronce, hechicero, avispa reina, caballero y sombra**: conservan las reglas de la 4.0 (fases, invocaciones y clones) adaptadas a la arena horizontal.

## Tirachinas
- **Carga**: mantén el botón (con teclado, el tiempo de carga da la potencia; con el dedo, la potencia es la distancia del arrastre). Cargar frena un poco el movimiento.
- **Apuntado**: arrastra hacia atrás (móvil) o usa ↑/↓ (teclado). El ángulo queda entre abajo y arriba para no disparar hacia atrás por accidente.
- **Trayectoria**: una línea suave de puntos que se desvanece, con una marca donde caería la bolita.
- **Rebote**: la bolita rebota una vez en el suelo (las mejoras añaden más). Un escudo la devuelve si le llega de frente y por abajo.

## Biomas
- **Cinco biomas**: bosque nocturno, cavernas y ruinas, cielo y nubes, tormenta y atardecer, espacio y cosmos.
- **Duración**: un bioma dura hasta derrotar a sus enemigos (12 bajas la primera vez, 16 la segunda, y así). Si pasas 220 m sin completarlo, avanza igualmente. Estos valores están en `BIOME_RULES` (js/biomes.js).
- **Jefes**: mientras hay un jefe vivo, el bioma no cambia. Al completar un bioma aparece la tienda.

## Nube: cuentas, ranking y multijugador (ya conectada)
- **Proyecto**: `ascenso-juego` (Supabase, región us-east-2). Es un proyecto nuevo: no se conectó ni se tocó ningún otro proyecto de la cuenta.
- **Configuración**: `js/config.js` ya tiene la URL y la clave ANON (pública) de este proyecto. Nunca pongas la clave `service_role`.
- **Base de datos**: tablas `profiles`, `game_saves` y `scores`, con seguridad a nivel de fila (RLS). El perfil se crea solo al registrarse. Está en `supabase/schema.sql`.
- **Ranking**: lo ve cualquiera, sin cuenta (pestaña Global de la TABLA). Sólo las cuentas registran puntuaciones; cada una sólo puede guardar las suyas.
- **Puntuaciones**: una validación en la base de datos rechaza valores imposibles. No es un anticheat completo.
- **Multijugador VS**: CREAR SALA o UNIRSE A SALA con código. Cada sala es un canal de Supabase Realtime con dos plazas y un anfitrión. Funciona sin cuenta.
- **Sin conexión**: el progreso queda en el dispositivo y se envía al volver la conexión.

Lo que tienes que hacer tú (en el panel de Supabase, una sola vez):
1. **Authentication → Sign In / Providers → Email → desactiva "Confirm email"**. Con la confirmación activada, el enlace del correo apunta a `localhost:3000` (la dirección por defecto) y no abre el juego.
2. Si quieres comprobar las reglas otra vez: SQL Editor → pega `tests/sql/test_rls_ascenso_juego.sql` → Run. Termina con un mensaje de resultados y **deshace todo**: no deja cuentas ni puntuaciones.
3. En el plan gratuito, Supabase limita las conexiones simultáneas y los mensajes en tiempo real. Si juegan muchas personas a la vez, puede hacer falta el plan de pago. Mira el uso en el panel del proyecto.

## Probar el multijugador VS y el ranking
1. Abre `dist/ascenso.html` (la versión con nube) en **dos móviles**, o en un móvil y un ordenador.
2. En el primero: MULTIJUGADOR → CREAR SALA (VS). Elige SIN o CON CONTRASEÑA y pulsa CREAR SALA.
3. En el segundo: MULTIJUGADOR → BUSCAR SALAS. La sala aparece en la lista: pulsa UNIRSE (si lleva candado, pide la contraseña). Si la sala no aparece, usa UNIRSE CON CÓDIGO y escribe el código.
4. En el primero: elige las victorias e INICIAR. Cada uno aparece en su esquina; tras la cuenta de 5 a 0 se pelea.
5. Para salir de la partida, pausa y pulsa SALIR DE LA PARTIDA: los dos vuelven a la sala.
6. Para el ranking: registra una cuenta (CUENTA → CREAR CUENTA), juega una partida y mira TABLA → Global.
7. Sin Supabase conectado, el VS sólo funciona entre pestañas del mismo navegador.

## Pruebas
| Batería | Resultado | Archivo |
|---|---|---|
| Carrera lateral (nivel, física, cámara, enemigos, caídas y arena) | 27 de 27 | tests/a4_horizontal.py |
| Cambios de la 4.1 (pantalla, sprites, escudos, apuntado, mejoras, jefe, avispas, música, panel y variedad) | 19 de 19 | tests/a5_41.py |
| Táctil: arrastrar el botón de tirachinas con un puntero real | 5 de 5 | tests/a5_tactil.py |
| Casos límite (almacenamiento, audio, táctil) | 11 de 11 | tests/a3_casos_limite.py |
| VS entre dos navegadores: sala, cuenta atrás, animaciones, golpes, KO, marcador, cooldown del tirachinas y vuelta a la sala | 35 de 35 | tests/a7_versus.py (dist/ascenso-sin-nube.html) |
| Salas públicas, contraseña, salida de partida y pausa en el centro | 16 de 16 | tests/a8_lobby.py (cinco navegadores) |
| Nube con el SDK real de Supabase (cuentas, ranking, guardado, pendientes, salas libres) | 10 de 10 | tests/a6_nube_supabase.py (servidor simulado en el navegador) |
| Reglas de la base de datos en el proyecto ascenso-juego | comprobado | tests/sql/test_rls_ascenso_juego.sql (ejecutado en el proyecto; deshace todo) |
| Música con audio real en Chromium | 13 de 13 | tests/a3_musica_real.py (sirve la carpeta con `python -m http.server 8765`) |
| SQL con RLS en Postgres real | 10 de 10 | tests/sql/test_rls.sql (sin cambios) |

Las baterías de la 3.0 que medían la altura vertical y el dash están en `tests/historial_3.0/` para referencia; no se ejecutan. El multijugador de la 4.1 está en `tests/historial_4.1/` y lo sustituye `tests/a7_versus.py`.

## Limitaciones
- **Equilibrio**: no se ha probado con jugadores reales. El jugador automático de prueba llega a unos 250 m y muere sobre todo ante los jefes; eso sólo indica que el nivel se recorre.
- **Teléfono real**: la pantalla completa, la horizontal y el arrastre con el dedo se han probado con eventos de puntero simulados, no en un móvil de verdad.
- **Probado en vivo**: la conexión real con el servidor de Supabase no se pudo probar desde el entorno de trabajo (no tiene acceso a esa red). Las reglas de la base de datos sí se comprobaron en el proyecto real, y el cliente con el SDK real se probó con un servidor simulado. Falta la prueba con dos móviles.
- **Efectos de sonido**: `assets/audio/sfx/` sigue vacío.
- **Puntuaciones falsificables**: la validación de la base de datos corta valores imposibles, pero quien tenga la clave pública puede enviar puntuaciones falsas dentro de esos límites. Un ranking serio necesita una Edge Function que calcule la puntuación en el servidor.
- **Partidas en curso**: no se reanudan si cierras el navegador.
- **VS en dos móviles**: la partida entre dos dispositivos reales no se ha probado. Sólo se ha probado entre dos pestañas y con la nube simulada.
- **Sala de dos**: cada sala tiene dos jugadores. La opción de tres queda pendiente.
- **Entrar por código**: no hay lista pública de salas; hay que pasar el código al rival.
- **Ranking del VS**: las partidas VS no suman al ranking.
\1\n- **Lista pública en la nube**: la lista de salas se ha probado con el transporte local (varias pestañas). Con Supabase real no se ha probado: el servidor simulado no reproduce el canal de anuncios.
