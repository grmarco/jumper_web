// xlsx.js — escribir una hoja de cálculo sin depender de nada
//
// Un .xlsx es un ZIP con unos cuantos XML dentro. Escribirlo a mano son cien
// líneas; la librería que hacía esto antes venía de un CDN, pesaba casi un mega
// y era la última dependencia externa que quedaba.
//
// Las entradas van sin comprimir (método 0). Excel, LibreOffice y Numbers las
// aceptan igual, y así no hace falta un compresor.

const utf8 = (s) => new TextEncoder().encode(s);

/** CRC-32, que la cabecera de cada entrada del ZIP exige. */
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** ZIP sin comprimir a partir de {nombre: texto}. */
function zip(entradas) {
  const partes = [], central = [];
  let desplazamiento = 0;

  for (const [nombre, texto] of Object.entries(entradas)) {
    const datos = utf8(texto);
    const nom = utf8(nombre);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);   // firma
    local.setUint16(4, 20, true);           // versión mínima
    local.setUint16(6, 0x0800, true);       // los nombres van en UTF-8
    local.setUint16(8, 0, true);            // método: sin comprimir
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nom.length, true);
    partes.push(new Uint8Array(local.buffer), nom, datos);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014B50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, datos.length, true);
    dir.setUint32(24, datos.length, true);
    dir.setUint16(28, nom.length, true);
    dir.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(dir.buffer), nom);

    desplazamiento += 30 + nom.length + datos.length;
  }

  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054B50, true);
  fin.setUint16(8, Object.keys(entradas).length, true);
  fin.setUint16(10, Object.keys(entradas).length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, desplazamiento, true);

  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)],
                  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  // los caracteres de control no son XML válido y algún corpus los trae
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

/** La letra de columna: 1 → A, 27 → AA. */
function columna(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = (n - r - 1) / 26; }
  return s;
}

function celda(ref, valor) {
  // los números van como números, para poder ordenar y sumar en la hoja;
  // todo lo demás como cadena en línea, que evita la tabla de cadenas compartidas
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `<c r="${ref}"><v>${valor}</v></c>`;
  }
  const texto = valor == null ? '' : String(valor);
  if (!texto) return '';
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(texto)}</t></is></c>`;
}

/**
 * Un .xlsx de una hoja.
 *
 * @param columnas  nombres de las columnas, en orden
 * @param filas     objetos con esas claves
 * @param hoja      nombre de la pestaña
 * @returns Blob listo para descargar
 */
export function libro(columnas, filas, hoja = 'Análisis') {
  const cabecera = '<row r="1">'
    + columnas.map((c, i) => celda(`${columna(i + 1)}1`, c)).join('') + '</row>';
  const cuerpo = filas.map((f, n) => '<row r="' + (n + 2) + '">'
    + columnas.map((c, i) => celda(`${columna(i + 1)}${n + 2}`, f[c])).join('') + '</row>').join('');

  return zip({
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
      + '</Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
      + '</Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
      + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + `<sheets><sheet name="${esc(hoja).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
      + '</Relationships>',
    'xl/worksheets/sheet1.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetData>' + cabecera + cuerpo + '</sheetData></worksheet>',
  });
}
