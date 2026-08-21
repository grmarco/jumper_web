// app.js — la página
import * as motor from './motor.js';
import * as notacion from './notacion.js';
import * as señal from './estado.js';

const $ = (sel) => document.querySelector(sel);
const texto = $('#texto');
const salida = $('#salida');
const aviso = $('#aviso');
const botonAnalizar = $('#analizar');

const estado = señal.crearAviso(aviso);
const caducidad = señal.vigilarCaducidad(texto, salida, () => analizar());

/** Un solo verso: escansión grande, ficha, rima y las lecturas rivales. */
async function mostrarVerso(verso) {
  const [analisis, alts, suRima] = await Promise.all([
    motor.escandirVerso(verso),
    motor.alternativas(verso),
    motor.rimaDelVerso(verso),
  ]);
  // un verso solo no tiene con quién rimar, pero sí tiene rima: su terminación
  // consonante y su asonante son las que decidirían el esquema
  const detalleRima = suRima.palabra
    ? { palabra: suRima.palabra, consonante: suRima.rima[0], asonante: suRima.rima[1] }
    : null;
  salida.innerHTML = `
    <section class="tarjeta">
      <h2>escansión</h2>
      ${notacion.verso(analisis)}
      ${notacion.ficha(analisis)}
      ${notacion.rima(detalleRima)}
    </section>
    <section class="tarjeta">
      <h2>otras lecturas posibles</h2>
      ${notacion.alternativas(alts)}
    </section>`;
  señal.animarEntrada(salida);
}

/** Un poema: cada verso con su letra de rima, y el resumen. */
async function mostrarPoema(entrada) {
  const { versos, rima, medidas } = await motor.analizarPoema(entrada);
  const frecuentes = Object.entries(medidas).sort((a, b) => b[1] - a[1]);
  const total = versos.length;
  const resumen = frecuentes
    .map(([m, n]) => `<span><b>${n}</b> de ${m} sílabas</span>`)
    .join('');
  const esquema = rima.esquema ? `<span>esquema <b>${rima.esquema}</b></span>` : '';
  // el nombre de la forma sólo aparece si el algoritmo la ha reconocido;
  // no se adivina desde la web
  const forma = rima.forma ? `<span><b>${rima.forma}</b></span>` : '';
  const grupos = notacion.gruposDeRima(rima);
  salida.innerHTML = `
    <section class="tarjeta">
      <h2>${total} versos</h2>
      <div class="resumen">${forma}${resumen}${esquema}</div>
    </section>
    ${grupos ? `<section class="tarjeta">
      <h2>grupos de rima</h2>
      <p class="pista">El esquema dice qué versos riman; esto dice en qué.</p>
      ${grupos}
    </section>` : ''}
    <section class="tarjeta">
      <h2>escansión y rima</h2>
      <p class="pista">Pincha en un verso para ver su escansión en detalle y las
      demás lecturas que el algoritmo consideró.</p>
      ${notacion.poema(versos, rima)}
    </section>`;
  conectarDetalles(versos, rima);
  señal.animarEntrada(salida);
}

const ESQUELETO = '<div class="detalle-dentro"><div class="esqueleto">'
  + '<span></span><span></span><span></span><span></span><span></span></div></div>';

/** Con qué otros versos del poema comparte grupo, y con qué letra. */
function suRimaEnElPoema(rima, i) {
  const esquema = (rima && rima.esquema) || '';
  const letra = esquema[i] || '';
  const detalles = (rima && rima.versos) || [];
  if (!detalles[i]) return null;
  const companeros = letra && letra !== '-'
    ? [...esquema].map((l, j) => (l === letra && j !== i ? j + 1 : 0)).filter(Boolean)
    : [];
  const sinGuiones = esquema.replace(/-/g, '');
  return {
    detalle: detalles[i],
    letra,
    tipo: letra && letra !== '-'
      ? (sinGuiones === sinGuiones.toLowerCase() ? 'asonante' : 'consonante')
      : '',
    companeros,
  };
}

/** Pinchar un verso lo despliega. Se pide al motor la primera vez y se guarda. */
function conectarDetalles(versos, rima) {
  salida.querySelectorAll('.abrir').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const linea = boton.closest('.linea');
      const caja = document.getElementById(boton.getAttribute('aria-controls'));
      const abierto = linea.classList.contains('abierta');
      linea.classList.toggle('abierta', !abierto);
      boton.setAttribute('aria-expanded', String(!abierto));
      if (abierto || caja.dataset.cargado) return;

      // el esqueleto ocupa aproximadamente lo que van a ocupar las alternativas,
      // para que la altura no dé un salto cuando lleguen
      caja.innerHTML = ESQUELETO;
      const v = versos[Number(boton.dataset.verso)];
      try {
        // se dibuja la escansión que decidió el poema, no la del verso suelto,
        // y junto a ella las lecturas rivales que se descartaron
        caja.innerHTML = notacion.detalle(v, await motor.alternativas(v.verso),
                                          suRimaEnElPoema(rima, Number(boton.dataset.verso)));
        caja.dataset.cargado = '1';
      } catch (e) {
        caja.innerHTML = `<div class="detalle-dentro"><p class="pista">no se ha podido calcular: ${e.message}</p></div>`;
      }
    });
  });
}

let enCurso = 0;

async function analizar() {
  const entrada = texto.value.trim();
  if (!entrada) { texto.focus(); return; }

  // cada análisis lleva número: si se lanzan dos seguidos, el primero en volver
  // no debe pintar encima del segundo
  const mio = ++enCurso;
  botonAnalizar.disabled = true;
  botonAnalizar.dataset.trabajando = '1';
  señal.trabajando(true);
  // el resultado anterior no se borra: se atenúa. Borrarlo deja la pantalla en
  // blanco justo cuando hace falta algo con lo que comparar
  salida.classList.add('atenuado');
  guardarEnlace(entrada);

  try {
    await motor.preparar(estado);
    if (mio !== enCurso) return;
    estado('listo', 'listo');
    const versos = entrada.split('\n').filter((l) => l.trim());
    if (versos.length === 1) await mostrarVerso(versos[0]);
    else await mostrarPoema(entrada);
    if (mio !== enCurso) return;
    caducidad.fijar(entrada);
  } catch (e) {
    if (mio !== enCurso) return;
    salida.innerHTML = `<section class="tarjeta problema"><h2>no se ha podido analizar</h2>
      <p>${String(e.message || e)}</p></section>`;
  } finally {
    if (mio === enCurso) {
      botonAnalizar.disabled = false;
      delete botonAnalizar.dataset.trabajando;
      señal.trabajando(false);
      salida.classList.remove('atenuado');
    }
  }
}

botonAnalizar.addEventListener('click', analizar);
texto.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analizar();
});
$('#ejemplo').addEventListener('click', () => {
  texto.value = `Cuando la alegre y dulce primavera
a partir sus riquezas comenzaba,
y de los verdes campos desterraba
aquella estéril sequedad primera,`;
  analizar();
});

/** El poema viaja en la propia dirección, para poder enlazar un análisis.
 *  Va en el fragmento y no en la consulta: así no llega al servidor. */
function delEnlace() {
  const h = location.hash.slice(1);
  if (!h) return null;
  try { return decodeURIComponent(h); } catch { return null; }
}

function guardarEnlace(entrada) {
  const nuevo = '#' + encodeURIComponent(entrada);
  if (nuevo !== location.hash) history.replaceState(null, '', nuevo);
}

// el intérprete se va cargando mientras se escribe, para que el primer
// análisis no tenga que esperar a la descarga entera
estado('preparando el analizador');
señal.trabajando(true);
const inicial = delEnlace();
if (inicial) texto.value = inicial;
motor.preparar(estado)
  .then(() => {
    estado('listo', 'listo');
    señal.trabajando(false);
    if (inicial) analizar();
  })
  .catch((e) => {
    señal.trabajando(false);
    estado(`no se pudo cargar: ${e.message}`, 'problema');
  });
