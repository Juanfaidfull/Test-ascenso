'use strict';
/* =====================================================================
   ASCENSO 4.3 · iconos de los controles y de la pausa.
   Son del pack game-icons.net (licencia CC BY 3.0). Autores y enlaces: docs/CREDITOS.md.
   Van en blanco, como PNG incrustado dentro de un <svg>: así siguen los tamaños que ya
   tienen los botones (.tb svg y .ibtn svg).
   ===================================================================== */
const GAME_ICONS = {
  pause: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADLklEQVR42u3YzU7UUBiA4bczQCBhYdjjHRBWGHWpFzD+xLjSABcGRHck/nABbomGjZE7kD1xQQIB2rr5TtIQMRF6zjDO+yaT2fXjnD7tlFZt22LT28AtEIAJwARgAjABmABMADY1zYwB3ABo43Pbqviux7R/w/juay0V0MSnSFXBN4GDjAurejwRd2HeoBSCmcInfxnYAB4AC1c2819KG/8T+AzsdY7VFjj5acYzYATc72Etp8A3YAc4KoWgxB0gLWQEbAFLGWZ8AN4CZz3+vPztNj0PvANeZphxDGwG6uwIcgMYxgJWgANgDrjo8eEznezZuHI2Mm9aOvY2sB5rqW545f+pJtZyDqwBhzGznmQANbALvIoNm+15RhszZoBV4EcmBOmYq8B34DLWV/U8J+3RLvC6s4cT929gFX/4AvAoTtQw4wMZwNOM60rHfHLN7D4vmhZ4HHtXZ5pT7D3AArDY863yuu4VWE/uGWmfFjsPykwygJwPZdc9UU/6jGL75pvAKU8AAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AJwARgAjABmABMACYAE4AATAAmABOACcAE0H9VfCg063+YUWzfSgA4BU6ANj45+1VgPblnpH06ib2bWAAtMIxF7IfmOtOc1Jf4bjLMaa7MIBPoOvZqP/ZumPPCqdo260U5jI1bAQ6AOeCiR3jpapkFdoCNOHaT8YJpgG1gPdbS5626ibWcA2vAYcysJxVAd9NGwBawlGHGR+ANcJb5pyad7HngPfAiw4xjYBPYy4y5GIAuguW4ch7GJt70oSr90UfAp9isdKzcC+rOGAHPY123XcsZ8DXuZEclTn5JAGReUJXxN3kc84qc/NIA0sIGPd6mq86D0zga9ggh/bw0pU7+OADYHcs3gQIwAZgATAAmABOACcCmp9+jRa7X920jpgAAAABJRU5ErkJggg=='
};
/* controles en pantalla: archivos de assets/img/ctrl (se incrustan solos al compilar); el resto sigue en GAME_ICONS */
const CTRL_FILE = { left: 'ctrl/izquierda.png', right: 'ctrl/derecha.png', jump: 'ctrl/saltar.png', attack: 'ctrl/atacar.png', sling: 'ctrl/tirachinas.png' };
const iconSrc = k => CTRL_FILE[k] ? ((window.ASSETS || {})[CTRL_FILE[k]] || ('assets/img/' + CTRL_FILE[k])) : GAME_ICONS[k];
for (const k of [...new Set([...Object.keys(GAME_ICONS), ...Object.keys(CTRL_FILE)])]) {
  ICON[k] = '<svg viewBox="0 0 128 128" aria-hidden="true"><image href="' + iconSrc(k) + '" width="128" height="128"/></svg>';
}
