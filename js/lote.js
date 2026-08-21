// lote.js — analizar muchos poemas de una vez
//
// Un fichero por poema, que es como están los corpus. De cada uno sale la
// escansión verso a verso y su esquema de rima, y de todos juntos, el recuento.
// La exportación es CSV escrito a mano: la hoja de cálculo venía de un CDN y no
// hacía falta para volcar una tabla.

import * as motor from './motor.js';
import { filasDePoema, resumenDe, aCSV, COLUMNAS } from './tabla.js';
import { libro } from './xlsx.js';
import * as señal from './estado.js';

const $ = (sel) => document.querySelector(sel);
const salida = $('#salida');
const aviso = $('#aviso');
const progreso = $('#progreso');

let filas = [];   // una por verso, es lo que se exporta

const estado = señal.crearAviso(aviso);

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function analizarObra(nombre, texto) {
  const analisis = await motor.analizarPoema(texto);
  filas.push(...filasDePoema(nombre, analisis));
  return { nombre, versos: analisis.versos.length, forma: analisis.rima.forma };
}

/** El recuento, dibujado. */
function resumen(obras) {
  const r = resumenDe(filas, obras);
  const barra = (cuenta, total, limite = 8) => {
    const orden = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
    const visibles = orden.slice(0, limite);
    const resto = orden.slice(limite).reduce((s, [, n]) => s + n, 0);
    if (resto) visibles.push([`otros (${orden.length - limite})`, resto]);
    return `<ul class="reparto">${visibles.map(([k, n]) => `
      <li><span class="clave">${escapar(k)}</span>
        <span class="tira"><i style="width:${(100 * n / total).toFixed(1)}%"></i></span>
        <span class="n">${n}</span>
        <span class="pct">${(100 * n / total).toFixed(1)} %</span></li>`).join('')}</ul>`;
  };
  return `
    <section class="tarjeta">
      <h2>${r.obras} obra${r.obras === 1 ? '' : 's'}, ${r.versos} versos</h2>
      <div class="resumen">
        <span><b>${r.consonantes}</b> de rima consonante</span>
        <span><b>${r.asonantes}</b> asonante</span>
        <span><b>${r.sueltos}</b> sueltos</span>
      </div>
    </section>
    <div class="rejilla">
      <section class="tarjeta"><h2>medidas</h2>${barra(r.medidas, r.versos)}</section>
      <section class="tarjeta"><h2>tipos de verso</h2>${barra(r.tipos, r.versos)}</section>
      <section class="tarjeta"><h2>licencias</h2>${barra(r.licencias, r.versos, 6)}</section>
      <section class="tarjeta"><h2>formas estróficas</h2>${
        Object.keys(r.formas).length ? barra(r.formas, r.obras, 6)
          : '<p class="sin-alternativas">ninguna forma del catálogo encaja con estas obras</p>'}</section>
    </div>`;
}

/** Las primeras filas, para ver que lo analizado es lo que se esperaba. */
function muestra() {
  const cabeceras = ['obra', 'nº', 'verso', 'medida', 'acentos', 'tipo', 'licencias', 'rima'];
  const cuerpo = filas.slice(0, 200).map((f) => `<tr>
    <td>${escapar(f.obra)}</td><td class="n">${f.n}</td>
    <td class="verso-crudo">${escapar(f.verso)}</td>
    <td class="n">${f.medida}</td><td class="n">${escapar(f.acentos)}</td>
    <td>${escapar(f.tipo)}</td><td>${escapar(f.recursos)}</td>
    <td class="n">${escapar(f.rima)}</td></tr>`).join('');
  const cola = filas.length > 200
    ? `<p class="fuente">Se muestran los 200 primeros de ${filas.length}. La exportación los lleva todos.</p>` : '';
  return `<section class="tarjeta">
    <h2>versos</h2>
    <table class="tabla"><thead><tr>${cabeceras.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${cuerpo}</tbody></table>${cola}</section>`;
}

function guardar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Aquí el progreso sí se sabe: hay tantos ficheros como hay. */
function avance(hechos, total, nombre) {
  const pct = Math.round((hechos / total) * 100);
  progreso.hidden = false;
  progreso.innerHTML = `
    <div class="barra"><i style="width:${pct}%"></i></div>
    <p class="detalle-progreso">
      <span>${hechos} de ${total}</span>
      <span class="nombre">${nombre}</span>
      <span class="cifra">${filas.length} versos</span>
    </p>`;
}

async function analizarFicheros(ficheros) {
  filas = [];
  $('#exportacion').hidden = true;
  salida.innerHTML = '';
  señal.trabajando(true);
  const lista = [...ficheros];
  const obras = [];
  try {
    for (const [i, f] of lista.entries()) {
      avance(i, lista.length, f.name);
      estado(`analizando ${f.name}`);
      const texto = await f.text();
      if (!texto.trim()) continue;
      obras.push(await analizarObra(f.name.replace(/\.[^.]+$/, ''), texto));
      // un respiro entre ficheros para que el navegador pinte el avance; sin
      // esto la barra se queda congelada hasta el final y no sirve de nada
      await new Promise((r) => setTimeout(r, 0));
    }
    avance(lista.length, lista.length, 'listo');
    if (!filas.length) {
      salida.innerHTML = '<section class="tarjeta"><h2>nada que analizar</h2>'
        + '<p class="pista">Los ficheros estaban vacíos, o no tenían versos.</p></section>';
      estado('listo', 'listo');
      return;
    }
    salida.innerHTML = resumen(obras) + muestra();
    señal.animarEntrada(salida);
    $('#exportacion').hidden = false;
    estado(`${filas.length} versos de ${obras.length} obra${obras.length === 1 ? '' : 's'}`, 'listo');
  } catch (e) {
    salida.innerHTML = `<section class="tarjeta problema"><h2>no se ha podido analizar</h2>
      <p>${String(e.message || e)}</p></section>`;
    estado('algo ha fallado', 'problema');
  } finally {
    señal.trabajando(false);
    setTimeout(() => { progreso.hidden = true; }, 900);
  }
}

async function recibir(ficheros) {
  if (!ficheros.length) return;
  señal.trabajando(true);
  await motor.preparar(estado);
  await analizarFicheros(ficheros);
}

$('#ficheros').addEventListener('change', (e) => recibir(e.target.files));
/** Descarga con acuse de recibo: el navegador no siempre lo da y parece que
 *  no ha pasado nada. */
function conAcuse(boton, hacer) {
  boton.addEventListener('click', () => {
    hacer();
    const antes = boton.textContent;
    boton.textContent = 'descargado ✓';
    boton.disabled = true;
    setTimeout(() => { boton.textContent = antes; boton.disabled = false; }, 1600);
  });
}
conAcuse($('#excel'), () => guardar(libro(COLUMNAS, filas, 'Escansión'), 'escansion.xlsx'));
conAcuse($('#csv'), () => guardar(new Blob([aCSV(filas)], { type: 'text/csv;charset=utf-8' }), 'escansion.csv'));

const zona = $('#zona');
['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => {
  e.preventDefault(); zona.classList.add('encima');
}));
['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => {
  e.preventDefault(); zona.classList.remove('encima');
}));
zona.addEventListener('drop', (e) => recibir(e.dataTransfer.files));

estado('preparando el analizador');
señal.trabajando(true);
motor.preparar(estado)
  .then(() => { estado('listo', 'listo'); señal.trabajando(false); })
  .catch((e) => {
    señal.trabajando(false);
    estado(`no se pudo cargar: ${e.message}`, 'problema');
  });
