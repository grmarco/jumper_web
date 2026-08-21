// notacion.js — dibuja la escansión como se dibuja en un manual
//
// Nada de la notación interna del motor (~ para diéresis, # para sinéresis)
// llega a la pantalla. Lo que se ve es lo que un filólogo espera: el arco de
// sinalefa bajo las vocales que se funden, el de sinéresis sobre ellas, la
// diéresis escrita sobre la vocal débil, el acento sobre la sílaba tónica y la
// cesura marcada. Los arcos van en SVG y no como caracteres combinantes,
// cuyo soporte tipográfico es irregular.

const ARCO_ABAJO = '<svg class="arco arco-abajo" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3,1 Q50,15 97,1"/></svg>';
const ARCO_ARRIBA = '<svg class="arco arco-arriba" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3,11 Q50,-3 97,11"/></svg>';

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Nombre legible de cada licencia, para el título emergente. */
const EXPLICA = {
  sinalefa: 'sinalefa: las vocales de dos palabras se pronuncian en una sílaba',
  sineresis: 'sinéresis: dos vocales de la misma palabra se funden en una sílaba',
  dieresis: 'diéresis: un diptongo se deshace y suena en dos sílabas',
};

/** Dibuja un verso escandido. Devuelve el HTML. */
export function verso(analisis, { numeros = true } = {}) {
  const partes = analisis.silabas.map((s, i) => {
    const lic = s.licencias || [];
    const clases = ['sil'];
    if (s.tonica) clases.push('tonica');
    lic.forEach((l) => clases.push(`con-${l}`));
    const titulo = lic.map((l) => EXPLICA[l]).filter(Boolean).join(' · ');
    const cesura = analisis.cesura && s.n === analisis.cesura;
    return `<span class="${clases.join(' ')}"${titulo ? ` title="${escapar(titulo)}"` : ''}>`
      + `<span class="txt">${escapar(s.texto)}</span>`
      + (lic.includes('sinalefa') ? ARCO_ABAJO : '')
      + (lic.includes('sineresis') ? ARCO_ARRIBA : '')
      + (numeros ? `<span class="num">${s.n}</span>` : '')
      + '</span>'
      + (cesura ? '<span class="cesura" title="cesura del verso compuesto">‖</span>' : '');
  });
  const falta = analisis.compensacion_cesura;
  const nota = falta ? `<span class="fantasma" title="sílaba métrica que la compensación añade y el texto no sostiene">+${falta}</span>` : '';
  return `<div class="verso">${partes.join('')}${nota}</div>`;
}

/** Ficha con la medida, el tipo y el esquema acentual. */
export function ficha(analisis) {
  const patron = Array.from({ length: analisis.medida }, (_, i) =>
    analisis.acentos.includes(i + 1) ? '+' : '−').join('');
  return `<dl class="ficha">
    <div><dt>medida</dt><dd class="cifra">${analisis.medida}</dd></div>
    <div><dt>acentos</dt><dd class="cifra">${analisis.acentos.join(' · ') || '—'}</dd></div>
    <div><dt>esquema</dt><dd class="patron">${patron}</dd></div>
    <div><dt>tipo</dt><dd>${escapar(analisis.tipo || '—')}</dd></div>
  </dl>`;
}

/** Las lecturas rivales, con el desglose de por qué ganó la elegida. */
export function alternativas(lista) {
  if (!lista || lista.length < 2) {
    return '<p class="sin-alternativas">Este verso no admite otra lectura: no hay ninguna licencia en juego.</p>';
  }
  const filas = lista.map((a) => {
    const licencias = a.licencias.length
      ? a.licencias.map((d) =>
          `<li><b>${escapar(d.tipo)}</b> <span class="peso">${d.peso.toFixed(2)}</span>`
          + `<span class="porque">${escapar(d.porque.join(', '))}</span></li>`).join('')
      : '<li class="ninguna">sin licencias: el verso se lee como está escrito</li>';
    return `<li class="alternativa${a.elegida ? ' elegida' : ''}">
      <div class="cabeza">
        ${a.elegida ? '<span class="sello">elegida</span>' : ''}
        <span class="cifra">${a.medida} sílabas</span>
        <span class="acentos">${a.acentos.join(' · ')}</span>
        <span class="tipo">${escapar(a.tipo || '')}</span>
      </div>
      <div class="cuenta">
        <span class="total">${a.puntuacion.toFixed(2)}</span>
        <span class="igual">=</span>
        <span title="cuán frecuente es este esquema acentual en la tradición">tradición ${a.patron.toFixed(2)}</span>
        <span class="mas">+</span>
        <span title="cuán probable es cada licencia en su contexto">licencias ${(a.puntuacion - a.patron).toFixed(2)}</span>
      </div>
      <ul class="licencias">${licencias}</ul>
    </li>`;
  });
  const margen = lista[0].puntuacion - lista[1].puntuacion;
  const aviso = margen < 0.5
    ? `<p class="ambiguo">El margen con la segunda lectura es de sólo ${margen.toFixed(2)}: el verso es genuinamente ambiguo y conviene decidirlo a oído.</p>`
    : '';
  return aviso + `<ol class="alternativas">${filas.join('')}</ol>`;
}

/** Poema entero: cada verso con su letra de rima al margen. */
export function poema(versos, rima) {
  const esquema = (rima && rima.esquema) || '';
  const filas = versos.map((v, i) => {
    const letra = esquema[i] || '';
    const clase = letra === '-' ? 'suelto' : (letra && letra === letra.toLowerCase() ? 'asonante' : 'consonante');
    return `<li class="linea" data-n="${i + 1}">
      <span class="rima ${clase}" title="${letra === '-' ? 'sin pareja' : (clase === 'asonante' ? 'rima asonante' : 'rima consonante')}">${escapar(letra || '·')}</span>
      ${verso(v, { numeros: false })}
      <span class="medida cifra">${v.medida}</span>
    </li>`;
  });
  return `<ol class="poema">${filas.join('')}</ol>`;
}
