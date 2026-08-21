// app.js — la página
import * as motor from './motor.js';
import * as notacion from './notacion.js';

const $ = (sel) => document.querySelector(sel);
const texto = $('#texto');
const salida = $('#salida');
const aviso = $('#aviso');
const botonAnalizar = $('#analizar');

function estado(mensaje, listo = false) {
  aviso.innerHTML = `<span class="punto"></span>${mensaje}`;
  aviso.classList.toggle('listo', listo);
}

/** Un solo verso: escansión grande, ficha y las lecturas rivales. */
async function mostrarVerso(verso) {
  const [analisis, alts] = await Promise.all([
    motor.escandirVerso(verso),
    motor.alternativas(verso),
  ]);
  salida.innerHTML = `
    <section class="tarjeta">
      <h2>escansión</h2>
      ${notacion.verso(analisis)}
      ${notacion.ficha(analisis)}
    </section>
    <section class="tarjeta">
      <h2>otras lecturas posibles</h2>
      ${notacion.alternativas(alts)}
    </section>`;
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
  salida.innerHTML = `
    <section class="tarjeta">
      <h2>${total} versos</h2>
      <div class="resumen">${forma}${resumen}${esquema}</div>
    </section>
    <section class="tarjeta">
      <h2>escansión y rima</h2>
      <p class="pista">Pincha en un verso para ver su escansión en detalle y las
      demás lecturas que el algoritmo consideró.</p>
      ${notacion.poema(versos, rima)}
    </section>`;
  conectarDetalles(versos);
}

/** Pinchar un verso lo despliega. Se pide al motor la primera vez y se guarda. */
function conectarDetalles(versos) {
  salida.querySelectorAll('.abrir').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const caja = document.getElementById(boton.getAttribute('aria-controls'));
      const abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!abierto));
      caja.hidden = abierto;
      if (abierto || caja.dataset.cargado) return;
      caja.innerHTML = '<p class="pista">calculando…</p>';
      const v = versos[Number(boton.dataset.verso)];
      try {
        // se dibuja la escansión que decidió el poema, no la del verso suelto,
        // y junto a ella las lecturas rivales que se descartaron
        caja.innerHTML = notacion.detalle(v, await motor.alternativas(v.verso));
        caja.dataset.cargado = '1';
      } catch (e) {
        caja.innerHTML = `<p class="pista">no se ha podido calcular: ${e.message}</p>`;
      }
    });
  });
}

async function analizar() {
  const entrada = texto.value.trim();
  if (!entrada) return;
  botonAnalizar.disabled = true;
  guardarEnlace(entrada);
  salida.innerHTML = '<p class="pista">analizando…</p>';
  try {
    await motor.preparar((paso) => estado(paso));
    estado('analizador listo', true);
    const versos = entrada.split('\n').filter((l) => l.trim());
    if (versos.length === 1) await mostrarVerso(versos[0]);
    else await mostrarPoema(entrada);
  } catch (e) {
    salida.innerHTML = `<section class="tarjeta"><h2>no se ha podido analizar</h2>
      <p class="pista">${String(e.message || e)}</p></section>`;
  } finally {
    botonAnalizar.disabled = false;
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
estado('preparando el analizador…');
const inicial = delEnlace();
if (inicial) texto.value = inicial;
motor.preparar((paso) => estado(paso))
  .then(() => {
    estado('analizador listo', true);
    if (inicial) analizar();
  })
  .catch((e) => estado(`no se pudo cargar: ${e.message}`));
