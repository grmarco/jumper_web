// notacion.js — dibuja la escansión como se dibuja en un manual
//
// Nada de la notación interna del motor (~ para diéresis, # para sinéresis)
// llega a la pantalla. Lo que se ve es lo que un filólogo espera: la ligadura
// entre las vocales que se funden, la diéresis escrita sobre la vocal débil, el
// acento sobre la sílaba tónica y la cesura marcada.
//
// La ligadura sustituye al arco que había antes. El arco se estiraba sobre la
// sílaba entera con preserveAspectRatio="none", y una sílaba fundida puede ser
// muy ancha —«que aho» son seis letras—: el arco salía largo y plano y no
// señalaba las dos vocales, que es lo único que importa. Ahora el motor dice en
// qué punto exacto del texto se juntan (`uniones`) y ahí va una ligadura de
// tamaño fijo, dentro del flujo del texto. Al no estar posicionada de forma
// absoluta ni estirarse, no se puede descuadrar.

const LIGADURA = '<svg class="liga" viewBox="0 0 12 6" aria-hidden="true">'
  + '<path d="M1,0.6 C1,5 11,5 11,0.6"/></svg>';

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Nombre legible de cada licencia, para el título emergente. */
const EXPLICA = {
  sinalefa: 'sinalefa: las vocales de dos palabras se pronuncian en una sílaba',
  sineresis: 'sinéresis: dos vocales de la misma palabra se funden en una sílaba',
  dieresis: 'diéresis: un diptongo se deshace y suena en dos sílabas',
};

/**
 * El texto de una sílaba con la ligadura puesta en cada punto de fusión.
 *
 * En la sinalefa el punto de fusión es el espacio que separaba las dos
 * palabras, y la ligadura lo sustituye: «la a» se ve como la‿a. En la sinéresis
 * no hay espacio que quitar y la ligadura se intercala entre las dos vocales.
 */
function conLigaduras(silaba) {
  const texto = silaba.texto;
  const uniones = silaba.uniones || [];
  if (!uniones.length) return escapar(texto);
  let salida = '';
  let desde = 0;
  for (const u of uniones) {
    salida += escapar(texto.slice(desde, u)) + LIGADURA;
    // el espacio de la sinalefa lo ocupa la ligadura; la sinéresis no tiene
    // espacio que consumir y el carácter sigue
    desde = texto[u] === ' ' ? u + 1 : u;
  }
  return salida + escapar(texto.slice(desde));
}

/**
 * El número que va bajo la sílaba: su posición MÉTRICA, no la escrita.
 *
 * Es a lo que se refiere la lista de acentos. Cuando el hemistiquio acaba en
 * esdrújula, su última sílaba escrita se descuenta y no ocupa ninguna: se marca
 * con un punto, porque «no cuenta» es información, no un hueco.
 */
function numero(s) {
  if (s.metrica == null) {
    return '<span class="num descontada" title="Esta sílaba no cuenta: el hemistiquio acaba en esdrújula y se descuenta la última.">·</span>';
  }
  return `<span class="num">${s.metrica}</span>`;
}

/** Dibuja un verso escandido. Devuelve el HTML. */
export function verso(analisis, { numeros = true, etiqueta = 'div' } = {}) {
  const partes = analisis.silabas.map((s, i) => {
    const lic = s.licencias || [];
    const clases = ['sil'];
    if (s.tonica) clases.push('tonica');
    lic.forEach((l) => clases.push(`con-${l}`));
    const titulo = lic.map((l) => EXPLICA[l]).filter(Boolean).join(' · ');
    const cesura = analisis.cesura && s.n === analisis.cesura;
    return `<span class="${clases.join(' ')}"${titulo ? ` title="${escapar(titulo)}"` : ''}>`
      + `<span class="txt">${conLigaduras(s)}</span>`
      + (numeros ? numero(s) : '')
      + '</span>'
      + (cesura ? '<span class="cesura" title="cesura del verso compuesto">‖</span>' : '');
  });
  // La medida no es el número de sílabas escritas: el hemistiquio agudo suma
  // una sílaba métrica que ninguna letra sostiene. Se dice, para que nadie crea
  // que se ha perdido algo por el camino.
  const falta = analisis.compensacion_cesura;
  const nota = falta > 0
    ? `<span class="fantasma" title="El hemistiquio acaba en aguda: la cesura añade ${falta} sílaba${falta > 1 ? 's' : ''} métrica${falta > 1 ? 's' : ''} que el texto no escribe.">+${falta} de cesura</span>`
    : (falta < 0
      ? `<span class="fantasma" title="El hemistiquio acaba en esdrújula: la cesura resta ${-falta} sílaba${falta < -1 ? 's' : ''} métrica${falta < -1 ? 's' : ''}.">${falta} de cesura</span>`
      : '');
  // dentro de un <button> sólo cabe contenido de frase, y el poema mete el
  // verso dentro de uno: por eso se puede pedir <span>
  return `<${etiqueta} class="verso">${partes.join('')}${nota}</${etiqueta}>`;
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

/** Poema entero: cada verso con su letra de rima al margen.
 *
 *  Cada verso es un botón que se despliega: los detalles y las lecturas rivales
 *  se piden al motor cuando hace falta y no antes. Calcularlas para un poema
 *  entero por si acaso cuesta mucho más de lo que se aprovecha.
 *
 *  El panel plegado no lleva `hidden`: ganaría a la animación de altura. Ya
 *  mide cero y no tiene nada enfocable dentro, y el estado lo dice
 *  `aria-expanded` en el botón.
 */
export function poema(versos, rima) {
  const esquema = (rima && rima.esquema) || '';
  const filas = versos.map((v, i) => {
    const letra = esquema[i] || '';
    const clase = letra === '-' ? 'suelto'
      : (letra && letra === letra.toLowerCase() ? 'asonante' : 'consonante');
    // la terminación en el título: la letra sola dice que dos versos riman,
    // no en qué. El detalle lo desarrolla, pero al pasar por encima ya se ve
    const d = ((rima && rima.versos) || [])[i];
    const terminacion = d ? (clase === 'asonante' ? d.asonante : d.consonante) : '';
    const explica = letra === '-'
      ? `${d ? `«${d.palabra}» ` : ''}no rima con ningún otro verso`
      : `rima ${clase} en -${terminacion}${d ? `, en «${d.palabra}»` : ''}`;
    return `<li class="linea" data-n="${i + 1}">
      <button class="abrir" type="button" data-verso="${i}" aria-expanded="false"
              aria-controls="detalle-${i}">
        <span class="rima ${clase}" title="${explica}">${escapar(letra || '·')}</span>
        ${verso(v, { etiqueta: 'span' })}
        <span class="medida cifra">${v.medida}</span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      <div class="detalle" id="detalle-${i}"></div>
    </li>`;
  });
  return `<ol class="poema">${filas.join('')}</ol>`;
}

/**
 * La rima de un verso, dicha entera.
 *
 * El esquema pone una letra al margen y ya está; esto dice de dónde sale esa
 * letra: qué palabra rima, cuál es su terminación consonante y cuál la
 * asonante, y con qué otros versos comparte una y otra.
 */
export function rima(detalle, { letra = '', tipo = '', companeros = [] } = {}) {
  if (!detalle || !detalle.palabra) return '';
  const { palabra, consonante, asonante } = detalle;
  const con = companeros.length
    ? `<dd class="con-quien">con ${companeros.length === 1 ? 'el verso' : 'los versos'} `
      + companeros.map((n) => `<b>${n}</b>`).join(', ') + '</dd>'
    : '<dd class="con-quien">no rima con ningún otro verso de este poema</dd>';
  return `<div class="rima-detalle">
    <h3 class="sub">rima</h3>
    <dl class="ficha">
      <div><dt>palabra</dt><dd class="palabra-rima">${escapar(palabra)}</dd></div>
      <div><dt>consonante</dt><dd class="terminacion${tipo === 'consonante' ? ' manda' : ''}">-${escapar(consonante || '—')}</dd></div>
      <div><dt>asonante</dt><dd class="terminacion${tipo === 'asonante' ? ' manda' : ''}">-${escapar(asonante || '—')}</dd></div>
      ${letra && letra !== '-' ? `<div><dt>grupo</dt><dd class="cifra">${escapar(letra)}</dd></div>` : ''}
    </dl>
    ${con}
  </div>`;
}

/**
 * Los grupos de rima del poema: qué letra, qué terminación y con qué palabras.
 *
 * Es la lectura que el esquema por sí solo no da. «ABBA» dice que el primero y
 * el cuarto riman; no dice en qué.
 */
export function gruposDeRima(rimaPoema) {
  const esquema = (rimaPoema && rimaPoema.esquema) || '';
  const detalles = (rimaPoema && rimaPoema.versos) || [];
  if (!esquema) return '';
  const asonante = esquema.replace(/-/g, '') === esquema.replace(/-/g, '').toLowerCase();
  const clave = asonante ? 'asonante' : 'consonante';

  const grupos = new Map();
  [...esquema].forEach((letra, i) => {
    if (letra === '-') return;
    if (!grupos.has(letra)) grupos.set(letra, { versos: [], palabras: [], rima: '' });
    const g = grupos.get(letra);
    g.versos.push(i + 1);
    if (detalles[i]) {
      g.palabras.push(detalles[i].palabra);
      g.rima = g.rima || detalles[i][clave];
    }
  });
  const sueltos = [...esquema].map((l, i) => (l === '-' ? i + 1 : 0)).filter(Boolean);
  if (!grupos.size) return '';

  const filas = [...grupos].map(([letra, g]) => `<li>
    <span class="letra ${clave}">${escapar(letra)}</span>
    <span class="terminacion">-${escapar(g.rima || '—')}</span>
    <span class="palabras">${g.palabras.map(escapar).join(' · ')}</span>
    <span class="cuantos">${g.versos.length}</span>
  </li>`).join('');
  const cola = sueltos.length
    ? `<p class="fuente">${sueltos.length === 1 ? 'Queda suelto el verso' : 'Quedan sueltos los versos'}
       ${sueltos.join(', ')}.</p>` : '';
  return `<ul class="grupos-rima">${filas}</ul>${cola}`;
}

/** Lo que se despliega al pinchar un verso del poema.
 *
 *  Sin repetir el verso: el de la fila de arriba es el mismo, y al desplegarse
 *  aparece además su numeración de sílabas, que plegado no cabe.
 */
export function detalle(analisis, alts, rimaDelVerso = null) {
  return `<div class="detalle-dentro">
    ${ficha(analisis)}
    ${rimaDelVerso ? rima(rimaDelVerso.detalle, rimaDelVerso) : ''}
    <h3 class="sub">otras lecturas posibles</h3>
    ${alternativas(alts)}
  </div>`;
}
