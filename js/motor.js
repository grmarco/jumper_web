// motor.js — Jumper corriendo en el navegador
//
// El algoritmo NO se reimplementa aquí. Se ejecuta `jumper.py`, el mismo
// fichero que se distribuye y se evalúa, dentro de CPython compilado a
// WebAssembly. Es la única forma de garantizar que la web y el motor no
// vuelvan a divergir: durante años hubo un port a JavaScript que se quedó
// en la versión de 2021 mientras el original seguía mejorando.

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';

let arranque = null;
let py = null;

/** Recoge el poema y lo analiza entero de una vez.
 *
 *  Dos detalles que no son cosméticos. El poema se escande con
 *  `silabas_del_poema` y no verso a verso: en un poema isométrico el algoritmo
 *  impone la medida que la mayoría declara, que es lo que hace un lector al que
 *  ya le han dicho que tiene delante un romance, y es la escansión que se evalúa
 *  contra los corpus anotados. Y las medidas se calculan antes que la rima y se
 *  le pasan, porque hay formas estróficas que no se distinguen sin ellas: el
 *  romance es octosílabo por definición y el soneto se escribe en arte mayor.
 */
const PREAMBULO = `
import sys, json
sys.path.insert(0, '/')
import jumper

def _poema(texto):
    versos = [v for v in texto.split('\\n') if v.strip()]
    escandidos = jumper.silabas_del_poema(versos)
    rima = jumper.analisis_de_rima(versos, [e['medida'] for e in escandidos])
    return {'versos': escandidos, 'rima': rima}
`;

/**
 * Carga el intérprete y el motor. La primera llamada arranca la descarga y las
 * demás esperan a la misma promesa.
 *
 * @param alAvanzar  se llama con cada paso, para poder avisar al usuario
 * @param fuente     el texto de jumper.py; si no se da, se pide por HTTP
 * @param cargador   de dónde sale Pyodide; por defecto, el CDN
 *
 * Los dos últimos existen para la prueba de conformidad, que corre en Node y
 * no tiene ni `fetch` de ficheros locales ni importación desde https.
 */
export function preparar(alAvanzar = () => {}, fuente = null, cargador = null) {
  if (arranque) return arranque;
  arranque = (async () => {
    alAvanzar('descargando el intérprete');
    const { loadPyodide } = cargador
      ? await cargador()
      : await import(`${PYODIDE}pyodide.mjs`);
    py = await loadPyodide(cargador ? {} : { indexURL: PYODIDE });

    alAvanzar('cargando el analizador');
    const codigo = fuente ?? await fetch('jumper.py').then((r) => {
      if (!r.ok) throw new Error(`no se encuentra jumper.py (${r.status})`);
      return r.text();
    });
    py.FS.writeFile('/jumper.py', codigo);
    py.runPython(PREAMBULO);
    alAvanzar('listo');
    return py;
  })();
  return arranque;
}

/** Ejecuta una expresión Python que devuelva algo serializable y lo trae como objeto JS. */
async function pedir(expresion) {
  await preparar();
  return JSON.parse(py.runPython(`json.dumps(${expresion}, ensure_ascii=False, default=str)`));
}

const cita = (s) => JSON.stringify(String(s));

/** Escansión de un verso, sílaba a sílaba, lista para dibujar. */
export const escandirVerso = (verso) =>
  pedir(`jumper.silabas_del_verso(${cita(verso)})`);

/** Las demás lecturas posibles, ordenadas por verosimilitud, con su porqué. */
export const alternativas = (verso, maximo = 5) =>
  pedir(`jumper.alternativas(${cita(verso)}, ${maximo})`);

/** Rima consonante y asonante de una palabra: ['erra', 'ea']. */
export const rimaDe = (palabra) => pedir(`jumper.rima_de(${cita(palabra)})`);

/** La última palabra de un verso, que es la que rima. */
export const rimaDelVerso = (verso) =>
  pedir(`(lambda p: {'palabra': p, 'rima': jumper.rima_de(p)})(`
    + `jumper.quitar_puntuacion(${cita(verso)}).strip().split(' ')[-1])`);

/** Escansión y rima de un poema entero, con la forma estrófica si la tiene. */
export async function analizarPoema(texto) {
  const { versos, rima } = await pedir(`_poema(${cita(texto)})`);
  const medidas = {};
  versos.forEach((v) => { medidas[v.medida] = (medidas[v.medida] || 0) + 1; });
  return { versos, rima, medidas };
}
