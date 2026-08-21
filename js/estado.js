// estado.js — decirle a quien mira qué está pasando
//
// El motor tarda lo que tarda: unos segundos la primera vez, mientras se baja
// el intérprete. Sin avisos, ese hueco se lee como que la página está rota o
// como que no se ha pulsado nada. Aquí viven las tres señales que lo evitan:
// el aviso del motor, la barra de trabajo y la marca de resultado caduco.

const raiz = document.documentElement;

/** El aviso del motor: cargando, listo, o lo que haya fallado. */
export function crearAviso(elemento) {
  const pasos = { 'descargando el intérprete': 1, 'cargando el analizador': 2, listo: 3 };
  return function estado(mensaje, clase = '') {
    const paso = pasos[mensaje] || 0;
    elemento.className = `aviso-motor ${clase}`;
    elemento.innerHTML = `<span class="punto"></span><span class="texto">${mensaje}</span>`
      + (paso && paso < 3
        ? `<span class="pasos" aria-hidden="true">${
            [1, 2, 3].map((n) => `<i class="${n <= paso ? 'hecho' : ''}"></i>`).join('')}</span>`
        : '');
  };
}

/**
 * La barra de trabajo, fina y fija bajo la navegación.
 *
 * Indeterminada a propósito: no sabemos cuánto va a tardar el análisis, y una
 * barra que finge un porcentaje miente. Lo que sí dice es que algo está pasando.
 */
export function trabajando(si) {
  raiz.classList.toggle('trabajando', si);
}

/**
 * Marca el resultado como caduco cuando el texto cambia después de analizarlo.
 *
 * Es el problema de no saber si lo que se ve es el poema de antes o el de
 * ahora. En vez de borrar el resultado —que deja la pantalla vacía mientras se
 * escribe— se atenúa y se dice.
 */
export function vigilarCaducidad(entrada, salida, analizar) {
  let analizado = null;

  const revisar = () => {
    const caduco = analizado !== null && entrada.value.trim() !== analizado;
    salida.classList.toggle('caduco', caduco);
    let cinta = salida.querySelector('.cinta-caduco');
    if (caduco && !cinta) {
      cinta = document.createElement('div');
      cinta.className = 'cinta-caduco';
      cinta.innerHTML = 'Este análisis es del texto anterior. '
        + '<button type="button">Volver a escandir</button>';
      cinta.querySelector('button').addEventListener('click', analizar);
      salida.prepend(cinta);
    } else if (!caduco && cinta) {
      cinta.remove();
    }
  };

  entrada.addEventListener('input', revisar);
  return {
    fijar(valor) { analizado = valor; revisar(); },
  };
}

/** Entra escalonado: cada tarjeta y cada verso, un poco después del anterior. */
export function animarEntrada(contenedor) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const piezas = contenedor.querySelectorAll('.tarjeta, .linea');
  piezas.forEach((p, i) => {
    // el escalón se corta pronto: con cien versos, esperar cien pasos sería
    // peor que no animar nada
    p.style.setProperty('--retraso', `${Math.min(i, 12) * 28}ms`);
    p.classList.add('entra');
  });
}
