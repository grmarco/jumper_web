// conformidad.mjs — el motor del navegador debe dar exactamente lo mismo que Python
//
// La web ejecuta jumper.py dentro de Pyodide. Que sea el mismo fichero no basta
// como garantía: hay que comprobar que el mismo fichero, en los dos intérpretes,
// da la misma respuesta. Pyodide corre también fuera del navegador, así que la
// prueba no necesita ni navegador ni Playwright.
//
//     node test/conformidad.mjs

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as motor from '../js/motor.js';
import { filasDePoema, aCSV, resumenDe, COLUMNAS } from '../js/tabla.js';
import { libro } from '../js/xlsx.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Un verso por cada licencia y por cada caso que ha costado sangre alguna vez.
const VERSOS = [
  'Cuando la alegre y dulce primavera',           // sinalefas encadenadas
  'No fue el primero ardor el que ahora siento,', // sinéresis en «aho»
  'ni me viene del cielo esta rüina.',            // diéresis marcada
  'Envuelto en seda y nardos, encajes y rubíes,', // verso compuesto, con cesura
  'en 1605 Cervantes publicó',                    // cifra leída, no contada
  '¡Oh, bella Clori! ¿Dónde vas?',                // puntuación y mayúsculas
  'de Amor la red y el lazo dulcemente',          // sinalefa ante mayúscula
  'la sanguínea corriente del ungüento',          // dígrafo con tilde, ü ortográfica
  'sobrehumana virtud, prohibido intento',        // h intervocálica
  '...',                                          // sin vocales: no debe reventar
];

const POEMA = [
  'Que por mayo era, por mayo,',
  'cuando hace la calor,',
  'cuando los trigos encañan',
  'y están los campos en flor,',
  'cuando canta la calandria',
  'y responde el ruiseñor,',
  'cuando los enamorados',
  'van a servir al amor,',
].join('\n');

/** Lo mismo, pedido al Python del sistema. */
function enPython(codigo) {
  return JSON.parse(execFileSync('python3', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(raiz)})
import jumper
${codigo}
`], { encoding: 'utf8' }));
}

const fallos = [];
function comparar(que, aqui, alli) {
  const a = JSON.stringify(aqui), b = JSON.stringify(alli);
  if (a === b) console.log(`  ok    ${que}`);
  else {
    console.log(`  FALLA ${que}\n    pyodide: ${a}\n    python3: ${b}`);
    fallos.push(que);
  }
}

console.log('cargando Pyodide…');
await motor.preparar(() => {}, readFileSync(join(raiz, 'jumper.py'), 'utf8'),
                     () => import('pyodide'));

for (const v of VERSOS) {
  comparar(`escansión  ${JSON.stringify(v)}`,
    await motor.escandirVerso(v),
    enPython(`print(json.dumps(jumper.silabas_del_verso(${JSON.stringify(v)}), ensure_ascii=False, default=str))`));
  comparar(`alternativas ${JSON.stringify(v)}`,
    await motor.alternativas(v),
    enPython(`print(json.dumps(jumper.alternativas(${JSON.stringify(v)}, 5), ensure_ascii=False, default=str))`));
}

// El poema entero: escansión y rima. Se compara todo, no sólo la rima,
// porque un poema no se escande igual que sus versos por separado.
const poemaAqui = await motor.analizarPoema(POEMA);
const poemaAlli = enPython(`
versos = [v for v in ${JSON.stringify(POEMA)}.split('\\n') if v.strip()]
escandidos = jumper.silabas_del_poema(versos)
rima = jumper.analisis_de_rima(versos, [e['medida'] for e in escandidos])
print(json.dumps({'versos': escandidos, 'rima': rima}, ensure_ascii=False, default=str))`);
comparar('escansión del poema', poemaAqui.versos, poemaAlli.versos);
comparar('rima del poema', poemaAqui.rima, poemaAlli.rima);

// Y que la medida del poema mande sobre la del verso suelto: es la diferencia
// entre lo que se evalúa contra los corpus y lo que sale de leer un verso solo.
const sueltas = [];
for (const v of POEMA.split('\n')) sueltas.push((await motor.escandirVerso(v)).medida);
console.log(`  info  medidas del poema  ${poemaAqui.versos.map((v) => v.medida).join(' ')}`);
console.log(`  info  verso a verso      ${sueltas.join(' ')}`);

// La tabla que se exporta: que salga una fila por verso, con las columnas
// declaradas y el CSV bien entrecomillado.
const filas = filasDePoema('romance', poemaAqui);
comparar('filas por verso', filas.length, poemaAqui.versos.length);
comparar('columnas de la fila', Object.keys(filas[0]).sort(), [...COLUMNAS].sort());
comparar('recuento', resumenDe(filas, [{ forma: poemaAqui.rima.forma }]).versos, filas.length);
const lineas = aCSV(filas).split('\r\n');
comparar('líneas del CSV', lineas.length, filas.length + 1);
// con marca de orden de bytes delante, que es lo que hace que Excel lo abra en UTF-8
comparar('cabecera del CSV', lineas[0], '\ufeff' + COLUMNAS.join(','));
const conComillas = aCSV([{ ...filas[0], verso: 'dijo «no», y "calló"' }]);
comparar('comillas escapadas', conComillas.includes('""calló""'), true);

// El .xlsx que se escribe a mano: que sea un ZIP con las cinco partes que Excel
// espera, y que los versos con & < > no rompan el XML.
const xlsx = new Uint8Array(await libro(COLUMNAS,
  [...filas, { ...filas[0], verso: 'signos & raros <sueltos>' }], 'Escansión').arrayBuffer());
comparar('firma del ZIP', [...xlsx.slice(0, 4)], [0x50, 0x4B, 0x03, 0x04]);
// latin1 para poder buscar los nombres de las entradas del ZIP tal cual
const dentro = new TextDecoder('latin1').decode(xlsx);
for (const parte of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml',
                     'xl/_rels/workbook.xml.rels', '_rels/.rels'])
  comparar(`el xlsx trae ${parte}`, dentro.includes(parte), true);
comparar('XML escapado en el xlsx', dentro.includes('signos &amp; raros &lt;sueltos&gt;'), true);

console.log(fallos.length
  ? `\n${fallos.length} comprobación(es) fallida(s): ${fallos.join(', ')}`
  : `\n${VERSOS.length * 2 + 15} comprobaciones, ninguna diferencia.`);
process.exit(fallos.length ? 1 : 0);
