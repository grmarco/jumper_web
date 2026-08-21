// tabla.js — el análisis por lotes convertido en filas
//
// Sin DOM: aquí sólo se transforma lo que devuelve el motor en la tabla que se
// muestra, se cuenta y se exporta. Separado para poder probarlo fuera del
// navegador, junto con el resto.

const NOMBRE_LICENCIA = { sinalefa: 'sinalefa', sineresis: 'sinéresis', dieresis: 'diéresis' };

/** Las licencias que un verso usa, contadas y dichas en una palabra cada una. */
export function recursos(analisis) {
  const cuenta = {};
  analisis.silabas.forEach((s) => (s.licencias || []).forEach((l) => {
    cuenta[l] = (cuenta[l] || 0) + 1;
  }));
  return Object.entries(cuenta)
    .map(([k, n]) => `${NOMBRE_LICENCIA[k] || k}${n > 1 ? ` ×${n}` : ''}`)
    .join(', ');
}

/** Una fila por verso, con todo lo que se exporta. */
export function filasDePoema(obra, { versos, rima }) {
  return versos.map((v, i) => {
    const letra = rima.esquema[i] || '';
    return {
      obra,
      n: i + 1,
      verso: v.verso,
      medida: v.medida,
      acentos: v.acentos.join(' '),
      tipo: v.tipo,
      recursos: recursos(v),
      rima: letra,
      // el caso de la letra dice el tipo de rima: es la convención de la
      // anotación métrica española, y el motor la decide una vez por poema
      tipo_rima: letra === '-' || !letra ? ''
        : (letra === letra.toLowerCase() ? 'asonante' : 'consonante'),
      terminacion: (rima.versos[i] || {}).consonante || '',
      forma: rima.forma || '',
    };
  });
}

/** El recuento de todo lo analizado: medidas, tipos, licencias, formas y rima. */
export function resumenDe(filas, obras) {
  const medidas = {}, tipos = {}, formas = {}, licencias = {};
  let consonantes = 0, asonantes = 0, sueltos = 0;
  for (const f of filas) {
    medidas[f.medida] = (medidas[f.medida] || 0) + 1;
    tipos[f.tipo] = (tipos[f.tipo] || 0) + 1;
    if (f.tipo_rima === 'consonante') consonantes++;
    else if (f.tipo_rima === 'asonante') asonantes++;
    else sueltos++;
    for (const r of f.recursos.split(', ').filter(Boolean)) {
      const clave = r.split(' ×')[0];
      licencias[clave] = (licencias[clave] || 0) + 1;
    }
  }
  for (const o of obras) if (o.forma) formas[o.forma] = (formas[o.forma] || 0) + 1;
  return { medidas, tipos, licencias, formas, consonantes, asonantes, sueltos,
           versos: filas.length, obras: obras.length };
}

export const COLUMNAS = ['obra', 'n', 'verso', 'medida', 'acentos', 'tipo',
                         'recursos', 'rima', 'tipo_rima', 'terminacion', 'forma'];

/**
 * CSV según RFC 4180: todo entrecomillado y las comillas dobladas, porque los
 * versos traen comas y comillas. Con marca de orden de bytes al principio, que
 * es lo que hace que Excel lo abra en UTF-8 y no destroce los acentos.
 */
export function aCSV(filas) {
  const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [COLUMNAS.join(','),
    ...filas.map((f) => COLUMNAS.map((c) => celda(f[c])).join(','))].join('\r\n');
}
