# ASCENSO · Nueva música de menú e islas

Las pistas del paquete `28 High Quality 16-bit RPG Music` se usan para el menú principal y los mapas/islas. La música de la tienda conserva la clave `Cozy Shop Loop.ogg`; el ZIP recibido no incluía ese archivo, por lo que debe copiarse desde la versión que ya lo tenga para que siga sonando. No se modificaron los efectos de sonido.

## Asignación aplicada

La asignación se hizo por el título/tema de cada pista y los nombres reales de los mapas del proyecto; los nombres temáticos son una correspondencia razonada, no metadatos oficiales del paquete.

| Pantalla / mapa | Archivo de música |
|---|---|
| Menú principal | `01 - Falling Apart (Prologue).ogg` |
| Islas del Crepúsculo (`normal`) | `01. Battle Theme I (loop).ogg` |
| Cumbres de Cristal (`ice`) | `06. Hidden Cavern.ogg` |
| La Forja del Abismo (`magma`) | `09. Battle Theme II (loop).ogg` |
| Cielo de Azúcar (`candy`) | `18. The Old Magician.ogg` |
| Arrecife del Abismo (`abyss`) | `26. Demon King Castle (full).ogg` |
| Caverna de Cristal (`cristal`) | `28. Holy Sanctuary.ogg` |
| Isla Playa (`playa`) | `14. Traveling the Sky.ogg` |
| Volcán Ardiente (`volcan`) | `15. Volcanic Crater.ogg` |
| Isla de Bizcocho (`bizcocho`) | `24. Battle Theme IV (loop).ogg` |
| Selva Ancestral (`selva`) | `07. Spirits Forest (loop).ogg` |
| Engranajes del Tiempo (`tiempo`) | `25. Dark Factory.ogg` |
| Campo de entrenamiento (`entrenamiento`) | `01. Battle Theme I (loop).ogg` |
| Bastión de oleadas (`bastion`) | `20. Military Base.ogg` |
| Bioma Bosque | `07. Spirits Forest (loop).ogg` |
| Bioma Cavernas | `11. Dangerous Cave.ogg` |
| Bioma Cielo | `14. Traveling the Sky.ogg` |
| Bioma Tormenta | `21. Malicious Scheme.ogg` |
| Bioma Espacio | `27. The Evil One.ogg` |

## Pistas incluidas que no se asignaron como música de isla

- `13. Magic Temple.ogg`
- `16. Battle Theme III (loop).ogg`
- `26. Demon King Castle (full).ogg` se usa en Arrecife del Abismo
- `01 - Falling Apart (Prologue).ogg` se usa en el menú
- Las pistas `Final Impact`, `New Record Fanfare` y `Victory Fanfare` no forman parte del paquete nuevo; sus referencias especiales se mantienen sin cambios excepto por el archivo de jefe que se apunta a `Final Impact.ogg`.

## Notas técnicas

- Las pistas nuevas están en `assets/audio/music/` y se cargan como archivos OGG externos; no se incrustan en el HTML.
- El modo VS elige música según el ID de la isla.
- El modo de oleadas usa la música de `Bastión de oleadas`.
- La clave de tienda `shop` no se cambió. El archivo `Cozy Shop Loop.ogg` no estaba dentro del proyecto original ni del paquete musical adjunto, así que se debe restaurar desde la copia anterior si se quiere garantizar que la música de tienda siga disponible.
- La música en bucle se mantiene en bucle automáticamente; el archivo de menú también se repite.

## Música de tienda y crafteo
La pantalla de crafteo solicita la pista `shop`: `assets/audio/music/Cozy Shop Loop.ogg` (también se acepta el nombre con espacios reemplazados por guiones bajos). El archivo de audio no está incluido en este ZIP; debes copiarlo tú mismo a esa carpeta. Al entrar al crafteo se solicita la música de tienda y al volver al menú se vuelve a solicitar la música del menú. La reproducción en móviles puede requerir el primer toque del usuario, como exige el navegador.
