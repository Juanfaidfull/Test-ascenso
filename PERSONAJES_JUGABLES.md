# Personajes jugables de ASCENSO

La pantalla Personaje conserva el Héroe original y añade cuatro clases seleccionables con las flechas: Mago, Cazadora, Caballero y Maestro marcial. La selección se guarda localmente y se aplica al iniciar las partidas.

## Personajes y habilidades

- **Héroe:** conserva sus colores, espada y tirachinas.
- **Mago de la bola:** ataque a distancia con orbe arcano; daño doble y recarga de 0,95 s.
- **Cazadora de lanza:** lanza un proyectil rápido; recarga de 0,75 s.
- **Caballero:** golpe pesado con mayor alcance y daño doble; recarga de 1 s.
- **Maestro marcial:** ataques rápidos en combo, alternando las animaciones de ataque; recarga de 0,48 s.

## Animaciones

Las hojas de sprites están en `assets/img/chars/<personaje>/`. Cada clase tiene hojas de quieto, correr, saltar, caer, ataque, golpe y muerte. Las dimensiones de cada cuadro y el número de cuadros están declarados en `js/characters.js`. Las animaciones se dibujan con filtrado desactivado para conservar el pixel art.

## Controles

El botón de ataque activa la habilidad de la clase seleccionada. El tirachinas sólo aparece para el Héroe original. Las flechas del menú cambian de personaje y `ELEGIR` guarda la selección.

## Notas

Las habilidades están conectadas al combate de oleadas y a los golpes del VS. En el VS, el Mago y la Cazadora usan alcance de ataque a distancia; el Caballero y el Maestro tienen alcances y daños propios. No se añadieron archivos de música.
