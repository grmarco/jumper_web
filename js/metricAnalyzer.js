/**
 * Módulo de análisis métrico de poemas en español
 * 
 * Mejoras implementadas:
 * - Separación en secciones (configuración, utilidades, análisis, presentación)
 * - Funciones con nombres descriptivos y comentarios (JSDoc)
 * - Uso de objetos en lugar de arrays “mágicos” en los resultados
 * - Constantes para recursos métricos y uso uniforme del español
 * - Corrección especial para casos de endecasílabo en que se cuenta 10 sílabas y el acento cae en la 5ª
 *   (rompiendo la sinalefa conflictiva y desplazando el acento a la 6ª sílaba).
 */

"use strict";

// ==============================
// Configuración y Datos Estáticos
// ==============================

const nombreVerso = [
    '',
    'Bisílabo',
    'Trisílabo',
    'Tetrasílabo',
    'Pentasílabo',
    'Hexasílabo',
    'Heptasílabo',
    'Octosílabo',
    'Eneasílabo',
    'Decasílabo',
    'Endecasílabo',
    'Dodecasílabo',
    'Tridecasílabo',
    'Alejandrino',
    'Pentadecasílabo',
    'Hexadecasílabo',
    'Heptadecasílabo',
    'Octodecasílabo'
];

const tiposVerso = [
    [['', [1]]],
    [['', [2]]],
    [['', [1, 3]], ['', [3]]],
    // Pentasílabos
    [['heroico', [2, 4]], ['sáfico', [4]], ['dactílico', [1, 4]]],
    // Hexasílabos
    [['heroico', [2, 5]], ['melódico puro', [3, 5]], ['melódico pleno', [1, 3, 5]], ['enfático', [1, 5]], ['vacío', [5]]],
    // Heptasílabos
    [
        ['heroico puro', [2, 6]],
        ['heroico pleno', [2, 4, 6]],
        ['melódico puro', [3, 6]],
        ['melódico puro', [1, 3, 6]],
        ['sáfico puro', [4, 6]],
        ['sáfico pleno', [1, 4, 6]],
        ['enfático', [1, 6]],
        ['vacío', [6]]
    ],
    // Octosílabos
    [
        ['heroico puro', [2, 4, 7]],
        ['heroico pleno', [2, 5, 7]],
        ['heroico difuso', [2, 7]],
        ['melódico puro', [3, 7]],
        ['melódico pleno', [1, 3, 5, 7]],
        ['melódico semipleno', [3, 5, 7]],
        ['melódico corto hemistiquial', [1, 3, 7]],
        ['dactílicos', [1, 4, 7]],
        ['sáfico', [4, 7]],
        ['enfático corto', [1, 5, 7]],
        ['enfático largo', [1, 7]],
        ['vacío corto', [5, 7]],
        ['vacío largo', [7]]
    ],
    // Eneasílabos
    [
        ['heroico puro corto', [2, 4, 8]],
        ['heroico pleno', [2, 4, 6, 8]],
        ['heroico puro largo', [2, 6, 8]],
        ['heroico difuso', [2, 8]],
        ['sáfico puro', [4, 8]],
        ['sáfico pleno', [1, 4, 6, 8]],
        ['sáfico semipleno', [1, 4, 8]],
        ['sáfico largo', [4, 6, 8]],
        ['melódico puro', [3, 5, 8]],
        ['melódico pleno corto', [1, 3, 5, 8]],
        ['melódico corto', [1, 3, 8]],
        ['melódico largo', [3, 6, 8]],
        ['melódico pleno largo', [1, 3, 6, 8]],
        ['melódico difuso', [3, 8]],
        ['dactílico (de gaita gallega)', [2, 5, 8]],
        ['enfático puro', [1, 6, 8]],
        ['enfático corto', [1, 5, 8]],
        ['enfático largo', [1, 8]],
        ['vacío corto', [6, 8]],
        ['vacío largo', [8]],
        ['vacío difuso', [5, 8]]
    ],
    // Decasílabos
    [
        ['heroico hemistiquial puro', [2, 4, 9]],
        ['heroico hemistiquial pleno', [2, 4, 6, 9]],
        ['heroico hemistiquial pleno doble', [2, 4, 7, 9]],
        ['heroico no hemistiquial puro', [2, 6, 9]],
        ['heroico no hemistiquial pleno', [2, 5, 7, 9]],
        ['heroico no hemistiquial largo', [2, 7, 9]],
        ['heroico no hemistiquial corto', [2, 5, 9]],
        ['heroico no hemistiquial difuso', [2, 9]],
        ['melódico puro', [3, 5, 9]],
        ['melódico pleno', [1, 3, 5, 7, 9]],
        ['melódico semipleno corto', [1, 3, 5, 9]],
        ['melódico largo', [3, 7, 9]],
        ['melódico semipleno largo', [1, 3, 7, 9]],
        ['melódico semipleno', [3, 5, 7, 9]],
        ['melódico difuso', [3, 9]],
        ['melódico difuso pleno', [1, 3, 9]],
        ['sáfico puro', [4, 6, 9]],
        ['sáfico dactílico doble (1,4+1,4)', [1, 4, 6, 9]],
        ['sáfico corto', [1, 4, 9]],
        ['sáfico largo', [4, 7, 9]],
        ['sáfico pleno ', [1, 4, 7, 9]],
        ['sáfico doble', [4, 9]],
        ['enfático corto', [1, 5, 9]],
        ['enfático puro', [1, 6, 9]],
        ['enfático pleno', [1, 5, 7, 9]],
        ['enfático largo', [1, 7, 9]],
        ['dactílico puro ', [3, 6, 9]],
        ['dactílico pleno', [1, 3, 6, 9]],
        ['vacío puro', [6, 9]],
        ['vacío difuso', [5, 9]],
        ['vacío largo', [5, 7, 9]]
    ],
    // Endecasílabos
    [
        ['heroico puro', [2, 6, 10]],
        ['heroico pleno', [2, 4, 6, 8, 10]],
        ['heroico corto', [2, 4, 6, 10]],
        ['heroico largo', [2, 6, 8, 10]],
        ['heroico difuso', [2, 4, 10]],
        ['melódico puro', [3, 6, 10]],
        ['melódico pleno', [1, 3, 6, 8, 10]],
        ['melódico largo', [3, 6, 8, 10]],
        ['melódico corto', [1, 3, 6, 10]],
        ['sáfico puro', [4, 8, 10]],
        ['sáfico puro pleno', [1, 4, 8, 10]],
        ['sáfico pleno', [1, 4, 6, 8, 10]],
        ['sáfico corto', [4, 6, 10]],
        ['sáfico corto pleno', [1, 4, 6, 10]],
        ['sáfico largo', [4, 6, 8, 10]],
        ['sáfico largo pleno', [2, 4, 8, 10]],
        ['sáfico difuso', [4, 10]],
        ['sáfico difuso pleno', [1, 4, 10]],
        ['enfático puro', [1, 6, 10]],
        ['enfático pleno', [1, 6, 8, 10]],
        ['vacío puro', [6, 10]],
        ['vacío pleno tipo 1', [6, 8, 10]],
        ['vacío pleno tipo 2', [1, 4, 10]],
        ['vacío heroico', [2, 4, 10]]
    ]
];

// Constantes para recursos métricos
const RECURSOS_METRICOS = {
  SINALEFA: 'Sinalefa',
  DIALEFA: 'Dialefa',
  SINERESIS: 'Sineresis',
  DIERESIS: 'Diéresis'
};

// Factores para clasificación de acentuación
const FACTOR_AGUDA = 1;
const FACTOR_LLANA = 0;
const FACTOR_ESDRUJULA = -1;

// Configuración de vocales, diptongos y palabras átonas
const vocalesNoAcentuadas = ['a', 'e', 'i', 'o', 'u'];
const vocalesAcentuadas = ['á', 'é', 'í', 'ó', 'ú'];
const deNoAcentuadas = {
  'a': 'á',
  'e': 'é',
  'i': 'í',
  'o': 'ó',
  'u': 'ú',
  'ï': 'ï',
  'ü': 'ü'
};
const dieresis = ['ï', 'ü'];
const vocales = [...vocalesNoAcentuadas, ...vocalesAcentuadas, ...dieresis];
const vocalesY = [...vocales, 'y'];
const diptongos = [
  'ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui', 'iu',
  'ia', 'ua', 'ie', 'ue', 'io', 'uo', 'ió', 'ey',
  'oy', 'ié', 'éi', 'ué', 'ái', 'iá', 'uá'
];

const atonasAVecesAcentuadas = {
  'oh': 'ó',
  'quien': 'quién',
  'do': 'dó'
};

const atonas = [
  'el', 'los', 'la', 'las', 'me', 'nos', 'te', 'os', 'lo', 'le', 'les', 'se', 'mi',
  'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestros', 'nuestra', 'nuestras', 'vuestro',
  'vuestra', 'vuestros', 'vuestras', 'que', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos',
  'cuyas', 'cual', 'cuales', 'como', 'cuando', 'do', 'donde', 'adonde', 'cuan', 'tan',
  'cuanto', 'cuanta', 'cuantos', 'cuantas', 'a', 'ante', 'bajo', 'cabe', 'con', 'contra',
  'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por',
  'sin', 'so', 'sobre', 'tras', 'versus', 'aunque', 'conque', 'cuando', 'mas',
  'mientras', 'ni', 'o', 'u', 'pero', 'porque', 'pues', 'que', 'si', 'sino', 'y', 'e',
  'aun', 'excepto', 'hasta', 'incluso', 'don', 'doña', 'fray', 'frey', 'san', 'sor',
  'al', 'del', 'desde'
];

const puntos = [
  ':', ',', '.', ';', '–', '(', ')', '\n', '\r',
  '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-', '/', '//'
];

// ==============================
// Utilidades de Texto y Fonéticas
// ==============================

/**
 * Elimina la puntuación de un texto.
 * @param {string} texto 
 * @returns {string}
 */
function quitarPuntuacion(texto) {
  const caracteresQuitar = [':', ',', '.', ';', '–', '(', ')', '\n', '\r', '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-', '/', '//'];
  caracteresQuitar.forEach(caracter => {
    texto = texto.split(caracter).join('');
  });
  return texto;
}

/**
 * Normaliza el texto: quita puntuación, espacios extra y pasa a minúsculas.
 * @param {string} texto 
 * @returns {string}
 */
function normalizar(texto) {
  return quitarPuntuacion(texto).trim().toLowerCase();
}

/**
 * Normaliza palabras con dígrafos "qu" y "gu".
 * @param {string} palabra 
 * @returns {string}
 */
function normalizarQuGu(palabra) {
  const cambios = [
    { original: 'qu', reemplazo: 'q' },
    { original: 'gue', reemplazo: 'ge' },
    { original: 'gui', reemplazo: 'gi' }
  ];
  cambios.forEach(cambio => {
    palabra = palabra.split(cambio.original).join(cambio.reemplazo);
  });
  return palabra;
}

/**
 * Verifica si la palabra empieza por vocal o por 'h' seguida de vocal.
 * @param {string} palabra 
 * @returns {boolean}
 */
function empiezaPorVocal(palabra) {
  return vocalesY.includes(palabra[0]) || (palabra[0] === 'h' && vocalesY.includes(palabra[1]));
}

/**
 * Verifica si la palabra termina por vocal o 'h' precedida de vocal.
 * @param {string} palabra 
 * @returns {boolean}
 */
function terminaPorVocal(palabra) {
  const len = palabra.length;
  return vocalesY.includes(palabra[len - 1]) || (palabra[len - 1] === 'h' && vocalesY.includes(palabra[len - 2]));
}

/**
 * Verifica si la "y" griega actúa como vocal en la palabra.
 * @param {string} palabra 
 * @returns {boolean}
 */
function esYVocalica(palabra) {
  const primeraDos = palabra.slice(0, 2);
  const primeraTres = palabra.slice(0, 3);
  return (
    vocales.some(v => primeraDos === 'y' + v) ||
    ['hie', 'hue', 'hon'].includes(primeraTres)
  );
}

// ==============================
// Análisis de Palabra: Sílabas y Acentos
// ==============================

/**
 * Analiza una palabra y retorna su número de sílabas, posición del acento y factor (aguda, llana, esdrújula).
 * @param {string} palabra 
 * @returns {{silabas: number, acento: number, factor: number}}
 */
function analizarPalabra(palabra) {
  if (palabra.length === 1) {
    return { silabas: 1, acento: 1, factor: FACTOR_AGUDA };
  }
  let numSilabas = 0;
  let acentoPos = null;
  const palabraNormal = normalizarQuGu(palabra);

  for (let i = 0; i < palabraNormal.length; i++) {
    const c = palabraNormal[i];
    if (vocales.includes(c)) {
      numSilabas++;
      // Verificar diptongo
      if (
        i > 0 &&
        diptongos.includes(palabraNormal[i - 1] + c) &&
        !dieresis.includes(palabraNormal[i - 1]) &&
        numSilabas > 1
      ) {
        numSilabas--;
      }
      if (vocalesAcentuadas.includes(c)) {
        acentoPos = numSilabas;
      }
    }
  }

  // Si no hay tilde, se determina el acento por regla general
  if (acentoPos === null) {
    const ultimaLetra = palabraNormal[palabraNormal.length - 1];
    if (['n', 's', ...vocales].includes(ultimaLetra)) {
      acentoPos = numSilabas - 1;
    } else {
      acentoPos = numSilabas;
    }
  }

  if (numSilabas === 1) {
    acentoPos = 1;
  }

  const diferencia = numSilabas - acentoPos;
  let factorFinal = 0;
  if (diferencia === 0) {
    factorFinal = FACTOR_AGUDA;
  } else if (diferencia === 1) {
    factorFinal = FACTOR_LLANA;
  } else if (diferencia > 1) {
    factorFinal = FACTOR_ESDRUJULA;
  }

  return { silabas: numSilabas, acento: acentoPos, factor: factorFinal };
}

// ==============================
// Ambigüedades: Comparación de Acentos
// ==============================

/**
 * Convierte un vector de acentos a un vector binario.
 * @param {number[]} vector 
 * @returns {boolean[]}
 */
function convertirAVectorBinario(vector) {
  const vecBinario = [];
  const vecOp = [...vector];
  const longitud = vector[vector.length - 1];
  for (let j = 1; j <= longitud; j++) {
    if (vecOp.length > 0 && j === vecOp[0]) {
      vecBinario.push(true);
      vecOp.shift();
    } else {
      vecBinario.push(false);
    }
  }
  return vecBinario;
}

/**
 * Compara dos vectores de acentos y retorna un ratio de coincidencia.
 * @param {number[]} vecAcentos1 
 * @param {number[]} vecAcentos2 
 * @returns {number} Ratio de coincidencia (0 a 1)
 */
function compararAcentos(vecAcentos1, vecAcentos2) {
  if (vecAcentos1[vecAcentos1.length - 1] !== vecAcentos2[vecAcentos2.length - 1]) {
    return 0;
  }
  const comp1 = convertirAVectorBinario(vecAcentos1);
  const comp2 = convertirAVectorBinario(vecAcentos2);
  let puntosVec = 0;
  for (let i = 0; i < comp1.length; i++) {
    if (comp1[i] === comp2[i]) {
      puntosVec++;
    }
  }
  return puntosVec / comp1.length;
}

/**
 * Clasifica un verso según su número de sílabas y acentos.
 * @param {number} numSilabas 
 * @param {number[]} acentos 
 * @returns {{nombre: string, acentosIdeales: number[], ratio: number}}
 */
function clasificarVerso(numSilabas, acentos) {
  const nombre = numSilabas <= 18 ? nombreVerso[numSilabas - 1] : 'versículo';
  let mejorTipo = ['', []];
  let mejorRatio = 0;

  if (numSilabas <= 11) {
    tiposVerso.forEach(tipo => {
      if (tipo[0][1][tipo[0][1].length - 1] === acentos[acentos.length - 1]) {
        tipo.forEach(subtipo => {
          const ratioV = compararAcentos(acentos, subtipo[1]);
          if (ratioV > mejorRatio) {
            mejorRatio = ratioV;
            mejorTipo = subtipo;
          }
        });
      }
    });
  } else {
    return { nombre: nombre, acentosIdeales: [], ratio: 1.0 };
  }

  return {
    nombre: `${nombre} ${mejorTipo[0]}`,
    acentosIdeales: mejorTipo[1],
    ratio: mejorRatio
  };
}

// ==============================
// Tratamiento de Ambigüedades: Hiato, Sineresis y Diéresis
// ==============================

/**
 * Verifica si una palabra contiene un diptongo.
 * @param {string} palabra 
 * @returns {boolean}
 */
function hayDiptongo(palabra) {
  const palabraNorm = normalizarQuGu(palabra);
  return diptongos.some(dip => palabraNorm.includes(dip));
}

/**
 * Verifica si una palabra contiene hiato.
 * @param {string} palabra 
 * @returns {boolean}
 */
function hayHiato(palabra) {
  const palabraSinH = palabra.replace(/h/g, '');
  for (let i = 0; i < palabraSinH.length - 1; i++) {
    const current = palabraSinH[i];
    const next = palabraSinH[i + 1];
    if (vocales.includes(current) && vocales.includes(next) && !diptongos.includes(current + next)) {
      return true;
    }
  }
  return false;
}

/**
 * Elimina el hiato en una palabra aplicando sinéresis y marcándolo con un símbolo.
 * @param {string} palabraOp 
 * @returns {string}
 */
function quitarHiato(palabraOp) {
  const simboloSineresis = '#';
  let palabra = palabraOp.replace(/h/g, '');
  for (let i = 0; i < palabraOp.length - 1; i++) {
    const cActual = palabraOp[i];
    const cSiguiente = palabraOp[i + 1];
    if (
      vocales.includes(cActual) &&
      vocales.includes(cSiguiente) &&
      !diptongos.includes(cActual + cSiguiente)
    ) {
      if (vocalesAcentuadas.includes(cSiguiente)) {
        palabra = palabra.slice(0, i) + palabra.slice(i + 1);
      } else if (vocalesAcentuadas.includes(cActual)) {
        palabra = palabra.slice(0, i + 1) + palabra.slice(i + 2);
      } else {
        palabra = palabra.slice(0, i) + palabra.slice(i + 1);
      }
      if (i === 1 || i === palabra.length - 1) {
        palabra = palabra.slice(0, i) + simboloSineresis + palabra.slice(i);
      }
    }
  }
  return palabra;
}

/**
 * Separa un diptongo en una palabra para aplicar diéresis.
 * @param {string} palabra 
 * @returns {string}
 */
function separarDiptongo(palabra) {
  const palabraNorm = normalizarQuGu(palabra);
  for (let dip of diptongos) {
    const lugarDip = palabraNorm.indexOf(dip);
    if (lugarDip > -1 && !esYVocalica(palabraNorm.slice(lugarDip + 1, lugarDip + 3))) {
      return palabraNorm.slice(0, lugarDip + 1) + '~' + palabraNorm.slice(lugarDip + 1);
    }
  }
  return palabra;
}

/**
 * Combina ambigüedades en versos basándose en un símbolo.
 * @param {string[]} versosAmb 
 * @param {string} simbolo 
 * @returns {string[]} Versos resultantes con la ambigüedad combinada.
 */
function combinarConSimbolo(versosAmb, simbolo) {
  const versosConSimbolo = [];
  const composicionSimbolo = [];

  versosAmb.forEach(verso => {
    const palabras = verso.split(' ');
    palabras.forEach(palabra => {
      if (palabra.includes(simbolo)) {
        versosConSimbolo.push(palabra);
      }
    });
  });

  versosAmb.forEach(verso => {
    const palabras = verso.split(' ');
    palabras.forEach((palabra, pos) => {
      versosConSimbolo.forEach(palabraSimbolo => {
        if (palabra === palabraSimbolo.replace(simbolo, '')) {
          const nuevoVerso = [...palabras];
          nuevoVerso[pos] = palabraSimbolo;
          composicionSimbolo.push(nuevoVerso.join(' '));
        }
      });
    });
  });

  return composicionSimbolo;
}

/**
 * Combina las ambigüedades en versos para generar versiones alternativas.
 * @param {string[]} versosAmb 
 * @param {boolean} incluirHiatos 
 * @param {boolean} incluirAtonas 
 * @param {boolean} incluirDiptongos 
 * @returns {string[]} Array extendido de versos con ambigüedades.
 */
function combinarAmbiguedades(versosAmb, incluirHiatos = false, incluirAtonas = false, incluirDiptongos = false) {
  const composicionSinalefas = [];
  const composicionHiatos = [];
  const composicionDiptongos = [];
  const composicionAtonas = [];
  let versosCombinados = [...versosAmb];

  // Composición de sinalefas
  versosAmb.forEach(versoPadre => {
    const palabrasPadre = versoPadre.split(' ');
    versosAmb.forEach(versoHijo => {
      if (versoPadre !== versoHijo) {
        if (palabrasPadre.includes('')) {
          let desplazamiento = 0;
          const iEspacio = palabrasPadre.indexOf('');
          if (
            versoHijo.split(' ').includes('') &&
            versoHijo.split(' ').indexOf('') < iEspacio
          ) {
            desplazamiento = 2;
          }
          const nuevoVerso = [...versoHijo.split(' ')];
          nuevoVerso.splice(iEspacio + desplazamiento, 0, '', '');
          composicionSinalefas.push(nuevoVerso.join(' '));
        }
      }
    });
  });

  versosCombinados = versosCombinados.concat(composicionSinalefas);

  // Composición de atonas
  if (incluirAtonas) {
    const keysAtonas = Object.keys(atonasAVecesAcentuadas);
    versosCombinados.forEach(versoPadre => {
      const palabras = versoPadre.split(' ');
      palabras.forEach((palabra, pos) => {
        keysAtonas.forEach(aton => {
          if (palabra === aton) {
            const nuevoVerso = [...palabras];
            nuevoVerso[pos] = atonasAVecesAcentuadas[aton];
            composicionAtonas.push(nuevoVerso.join(' '));
          }
        });
      });
    });
    versosCombinados = versosCombinados.concat(composicionAtonas);
  }

  // Composición de diptongos
  if (incluirDiptongos) {
    const compDiptongos = combinarConSimbolo(versosAmb, '#');
    versosCombinados = versosCombinados.concat(compDiptongos);
  }

  // Composición de hiatos
  if (incluirHiatos) {
    const compHiatos = combinarConSimbolo(versosAmb, '~');
    versosCombinados = versosCombinados.concat(compHiatos);
  }

  return versosCombinados;
}


/**
 * Módulo de análisis métrico de poemas en español
 * 
 * ...
 */

"use strict";

// ==============================
// Configuración y Datos Estáticos
// ==============================
const RECURSO_PRIORIDAD = {
    [RECURSOS_METRICOS.SINALEFA]: 1,
    [RECURSOS_METRICOS.DIALEFA]: 1,
    [RECURSOS_METRICOS.SINERESIS]: 2,
    [RECURSOS_METRICOS.DIERESIS]: 4
  };
  
  /**
   * Calcula la “suma de prioridades” de los recursos de un verso,
   * y también el número total de recursos.
   * @param {object[]} recursos 
   * @returns {{resourceCount: number, sumPriority: number}}
   */
  function calcularDatosRecursos(recursos) {
    let resourceCount = recursos.length;
    let sumPriority = 0;
    recursos.forEach(r => {
      // Si no está definido en RECURSO_PRIORIDAD, lo consideramos 0
      sumPriority += RECURSO_PRIORIDAD[r.tipo] || 0;
    });
    return { resourceCount, sumPriority };
  }
  

  function resolverAmbiguedades(versoAnalizado, versosAmb, arte, detectarAmb) {
    const targetSilabas = detectarAmb; // Guardamos el objetivo de sílabas
    const versosAmbCombinados = combinarAmbiguedades(versosAmb);
    const versiones = [];
  
    versosAmbCombinados.forEach(versoAmb => {
      // Evitamos recursión adicional pasando 0 como detectarAmb
      const analisisAmb = analizarVerso(versoAmb, arte, 0);
      if (analisisAmb.silabas === targetSilabas) {
        const clasificacionAmb = clasificarVerso(analisisAmb.silabas, analisisAmb.acentos);
        const ratioAmb = clasificacionAmb.ratio;
        const { resourceCount, sumPriority } = calcularDatosRecursos(analisisAmb.recursosMetricos);
        versiones.push({
          analisis: analisisAmb,
          ratio: ratioAmb,
          resourceCount,
          sumPriority
        });
      }
    });
  
    if (versiones.length === 0) {
      // No hay versiones que cumplan con el objetivo
      return versoAnalizado;
    }
  
    // Orden multi-criterio:
    // 1) Ratio descendente
    // 2) resourceCount ascendente
    // 3) sumPriority ascendente
    versiones.sort((a, b) => {
      if (b.ratio !== a.ratio) {
        return b.ratio - a.ratio;
      }
      if (a.resourceCount !== b.resourceCount) {
        return a.resourceCount - b.resourceCount;
      }
      return a.sumPriority - b.sumPriority;
    });
  
    // La primera es la "mejor"
    const mejor = versiones[0].analisis;
  
    // Se copian sus datos en versoAnalizado
    versoAnalizado.versoProcesado = mejor.versoProcesado;
    versoAnalizado.silabas = mejor.silabas;
    versoAnalizado.acentos = mejor.acentos;
    versoAnalizado.clasificacion = mejor.clasificacion;
    versoAnalizado.recursosMetricos = mejor.recursosMetricos;
  
    // Reanalizamos sin ambigüedades para limpiar duplicados
    if (versoAnalizado.versoProcesado && versoAnalizado.versoProcesado !== versoAnalizado.versoOriginal) {
      const analisisFinal = analizarVerso(versoAnalizado.versoProcesado, 0, 0);
      versoAnalizado.silabas = analisisFinal.silabas;
      versoAnalizado.acentos = analisisFinal.acentos;
      versoAnalizado.clasificacion = analisisFinal.clasificacion;
      versoAnalizado.recursosMetricos = analisisFinal.recursosMetricos;
    }
  
    return versoAnalizado;
  }
  
  
  

// ==============================
// Análisis de Verso
// ==============================


function limpiarRecursosConflicto(recursos, numSilabas) {
    // Copiamos el array para manipularlo
    let filtrado = [...recursos];
  
    // 1) Si el verso quedó en 10 sílabas => se aplicó la sinalefa
    //    => eliminamos la dialefa que afecte a las mismas palabras.
    if (numSilabas === 10) {
      filtrado = filtrado.filter((r, i, arr) => {
        // Eliminamos dialefa si existe una sinalefa para las mismas palabras
        if (r.tipo === RECURSOS_METRICOS.DIALEFA) {
          // Buscamos si hay sinalefa con la misma "entre"
          const haySinalefaIgual = arr.some(
            (rr) => rr.tipo === RECURSOS_METRICOS.SINALEFA && rr.entre === r.entre
          );
          return !haySinalefaIgual; // si hay sinalefa, quitamos la dialefa
        }
        return true;
      });
    }
  
    // 2) Si el verso quedó en 11 => se aplicó la dialefa
    //    => eliminamos la sinalefa que afecte a las mismas palabras
    else if (numSilabas === 11) {
      filtrado = filtrado.filter((r, i, arr) => {
        if (r.tipo === RECURSOS_METRICOS.SINALEFA) {
          // Buscamos si hay dialefa con la misma "entre"
          const hayDialefaIgual = arr.some(
            (rr) => rr.tipo === RECURSOS_METRICOS.DIALEFA && rr.entre === r.entre
          );
          return !hayDialefaIgual; 
        }
        return true;
      });
    }
  
    // 3) Ejemplo de sinéresis vs diéresis (si quisieras filtrar):
    //    Si realmente no se aplicó sinéresis, quitas la sinéresis, etc.
    //    Esto es más complejo de saber en automático. 
    //    Podrías usar la misma lógica de "entre" o "palabra" para no duplicar.
  
    return filtrado;
  }
  

/**
 * Analiza un verso, calculando sus sílabas, acentos, recursos métricos y clasificación.
 * @param {string} verso 
 * @param {number} arte - Total de sílabas (para hemistiquios)
 * @param {number} detectarAmb - Número de sílabas para detectar ambigüedades
 * @returns {object} Objeto con el análisis del verso.
 */
function analizarVerso(verso, arte = 0, detectarAmb = 0) {
  let numSilabas = 0;
  const versoLimpio = quitarPuntuacion(verso.toLowerCase()).trim();
  const palabras = versoLimpio.split(' ');
  const acentos = [];
  const versosAmbiguos = [];
  const recursosMetricos = [];

  // --- Recorremos cada palabra (incluyendo posibles tokens vacíos) ---
  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];
    const palabraAnterior = i > 0 ? palabras[i - 1] : null;
    const palabraSiguiente = i < palabras.length - 1 ? palabras[i + 1] : null;

    // 1) Si la “palabra” es un token vacío (""), interpretamos que
    //    estamos forzando un hiato (Dialefa) entre palabraAnterior y palabraSiguiente.
    if (!palabra) {
      if (palabraAnterior && palabraSiguiente) {
        // Verificamos si realmente es un hiato
        if (terminaPorVocal(palabraAnterior) && empiezaPorVocal(palabraSiguiente)) {
          // Registramos Dialefa como recurso
          recursosMetricos.push({
            tipo: RECURSOS_METRICOS.DIALEFA,
            entre: `${palabraAnterior} - ${palabraSiguiente}`
          });
          // Ojo a la cuenta de sílabas: si normalmente
          // la sinalefa hubiera restado 1, aquí NO restamos nada,
          // con lo cual quedamos con +1 sílaba respecto a la versión con sinalefa.
          // Dependiendo de tu lógica de conteo, ajusta si necesitas.
        }
      }
      // No hacemos más con un token vacío
      continue;
    }

    // 2) Palabra normal: la analizamos
    const analisisPalabra = analizarPalabra(palabra);
    numSilabas += analisisPalabra.silabas;

    // Acento (caso especial adverbios "-mente")
    if (palabra.endsWith('mente') && palabra.length > 5) {
      const sinMente = palabra.replace('mente', '');
      const silabasSinMente = analizarPalabra(sinMente).silabas;

      // Primer acento: parte previa a "mente"
      acentos.push(
        numSilabas - 2 - (silabasSinMente - analizarPalabra(sinMente).acento)
      );
      // Segundo acento: la sílaba del "mente" (penúltima)
      acentos.push(numSilabas - 1);

    } else {
      // Acento normal, salvo que sea palabra átona y no sea la última
      if (!atonas.includes(palabra) || i === palabras.length - 1) {
        const acentoNuevo = numSilabas
          - (analisisPalabra.silabas - analizarPalabra(palabra).acento);
        if (acentos.length === 0 || acentos[acentos.length - 1] !== acentoNuevo) {
          acentos.push(acentoNuevo);
        }
      }
    }

    // 3) Sinalefa: si la palabra termina en vocal y la siguiente empieza en vocal
    if (
      palabraSiguiente &&
      terminaPorVocal(palabra) &&
      empiezaPorVocal(palabraSiguiente) &&
      !esYVocalica(palabraSiguiente)
    ) {
      // Restamos 1 sílaba e indicamos recurso Sinalefa
      numSilabas -= 1;
      recursosMetricos.push({
        tipo: RECURSOS_METRICOS.SINALEFA,
        entre: `${palabra} - ${palabraSiguiente}`
      });

      // Verso alternativo con Dialefa (no se mete en recursos base)
      if (detectarAmb > 0) {
        const versAmb = [...palabras];
        // Insertamos un token vacío para forzar hiato
        versAmb.splice(i + 1, 0, '');
        versosAmbiguos.push(versAmb.join(' '));
      }
    }

    // 4) Ambigüedades Sineresis / Diéresis: creamos solo la versión alternativa
    if (detectarAmb > 0) {
      // Hiato => alternativa con Sinéresis
      if (hayHiato(palabra)) {
        const versAmb = [...palabras];
        versAmb[i] = quitarHiato(palabra);  // reemplazamos la palabra
        versosAmbiguos.push(versAmb.join(' '));
      }
      // Diptongo => alternativa con Diéresis
      if (hayDiptongo(palabra)) {
        const versAmb = [...palabras];
        versAmb[i] = separarDiptongo(palabra);  // reemplazamos la palabra
        versosAmbiguos.push(versAmb.join(' '));
      }
    }

    // 5) Hemistiquio (si arte > 0)
    if (
      arte > 0 &&
      !atonas.includes(palabra) &&
      (numSilabas + analisisPalabra.factor === Math.ceil(arte / 2)
       || numSilabas + analisisPalabra.factor === Math.floor(arte / 2))
    ) {
      numSilabas += analisisPalabra.factor;
    }
  } // fin del for

  // Palabra final para ajuste de aguda/llana/esdrújula
  const palabraFinal = palabras[palabras.length - 1] || '';
  const factorFinal = (palabraFinal.endsWith('mente'))
    ? 0
    : analizarPalabra(palabraFinal).factor;
  numSilabas += factorFinal;

  // Corrección especial endecasílabo: si 10 sílabas y acento en 5ª
  if (numSilabas === 10 && acentos.includes(5)) {
    const idxUltimaSinalefa = recursosMetricos
      .map(r => r.tipo)
      .lastIndexOf(RECURSOS_METRICOS.SINALEFA);
    if (idxUltimaSinalefa !== -1) {
      const ultimaSinalefa = recursosMetricos[idxUltimaSinalefa];
      // Eliminamos esa sinalefa
      recursosMetricos.splice(idxUltimaSinalefa, 1);
      // Insertamos dialefa
      recursosMetricos.push({
        tipo: RECURSOS_METRICOS.DIALEFA,
        entre: ultimaSinalefa.entre
      });
    }
    numSilabas++;
    // Desplazamos acentos >= 5
    for (let i = 0; i < acentos.length; i++) {
      if (acentos[i] >= 5) {
        acentos[i]++;
      }
    }
  }

  // Reanálisis si excede 11 sílabas sin arte
  if (numSilabas > 11 && arte === 0) {
    const reanalisis = analizarVerso(verso, numSilabas, 0);
    numSilabas = reanalisis.silabas;
    acentos.length = 0;
    reanalisis.acentos.forEach(a => acentos.push(a));
  }

  // Clasificación final
  const clasificacion = clasificarVerso(numSilabas, acentos);

  // Construimos el resultado
  let resultado = {
    versoOriginal: verso,
    versoProcesado: verso,
    silabas: numSilabas,
    acentos,
    clasificacion,
    recursosMetricos
  };

  // Resolver ambigüedades si hay detectAmb
  if (detectarAmb > 0) {
    resultado = resolverAmbiguedades(resultado, versosAmbiguos, arte, detectarAmb);
  }

  // Limpieza de conflictos (no mezclar sinalefa y dialefa sobre las mismas palabras, etc.)
  resultado.recursosMetricos = limpiarRecursosConflicto(
    resultado.recursosMetricos,
    resultado.silabas
  );

  return resultado;
}



// ==============================
// Análisis de Poemas
// ==============================

/**
 * Calcula los elementos más frecuentes en una lista (por encima de un umbral).
 * @param {any[]} lista 
 * @param {number} umbral 
 * @returns {object}
 */
function mostFrequent(lista, umbral = 0.15) {
  const frecuencias = {};
  lista.forEach(item => {
    frecuencias[item] = (frecuencias[item] || 0) + 1;
  });
  Object.keys(frecuencias).forEach(item => {
    frecuencias[item] /= lista.length;
  });
  const filtrado = Object.entries(frecuencias)
    .filter(([_, freq]) => freq >= umbral)
    .sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(filtrado);
}

/**
 * Trocea una columna de una matriz en un contexto dado.
 * @param {any[][]} matriz 
 * @param {number} columna 
 * @param {number} indice 
 * @param {number} contexto 
 * @returns {any[]}
 */
function trocearColumna(matriz, columna, indice, contexto) {
  let rodaja;
  if (indice < contexto) {
    rodaja = matriz.slice(0, contexto);
  } else if (indice + contexto >= matriz.length) {
    rodaja = matriz.slice(indice);
  } else {
    rodaja = matriz.slice(indice - contexto, indice + contexto);
  }
  return rodaja.map(verso => verso[columna]);
}

function reanalizarVersoConAmb(versoAnalizado, medida) {
    // Reanalizamos el verso original forzando “detectarAmb = medida”
    const analisisAmb = analizarVerso(versoAnalizado.versoOriginal, 0, medida);
    
    // ¿Logró la métrica?
    if (analisisAmb.silabas === medida) {
      // Comparamos ratio
      const ratioOriginal = versoAnalizado.clasificacion.ratio;
      const ratioNuevo = analisisAmb.clasificacion.ratio;
      // Si el nuevo ratio es >=, nos quedamos con la versión reanalizada
      if (ratioNuevo >= ratioOriginal) {
        return analisisAmb;
      }
    }
    // Si no encaja en la métrica o no mejora ratio, devolvemos null
    return null;
  }
  

/**
 * Devuelve las métricas (número de sílabas) más frecuentes de la lista.
 * @param {number[]} silabasArray - Array con el recuento de sílabas de cada verso.
 * @param {number} minRepeticiones - Mínimo de repeticiones para considerar una métrica dominante.
 * @param {number} maxMetrica - Máximo de métricas a devolver, aunque cumplan la frecuencia.
 * @returns {number[]} Lista de métricas más frecuentes.
 */
function obtenerMetricasFrecuentes(silabasArray, minRepeticiones = 3, maxMetrica = 3) {
  const contador = {};
  // Contamos cuántas veces aparece cada número de sílabas
  silabasArray.forEach(num => {
    contador[num] = (contador[num] || 0) + 1;
  });
  // Ordenamos por frecuencia descendente
  const ordenados = Object.entries(contador).sort((a, b) => b[1] - a[1]);

  // 1) Filtramos por mínimo de repeticiones
  const filtrados = ordenados.filter(([_, freq]) => freq >= minRepeticiones);

  // 2) Si no hay suficientes, cogemos los primeros 'maxMetrica'
  let metricasDominantes = filtrados.map(([num]) => parseInt(num, 10));
  if (metricasDominantes.length === 0) {
    // Si nadie supera minRepeticiones, tomamos las top N frecuencias
    metricasDominantes = ordenados
      .slice(0, maxMetrica)
      .map(([num]) => parseInt(num, 10));
  } else {
    // Si hay suficientes, acotamos a 'maxMetrica'
    metricasDominantes = metricasDominantes.slice(0, maxMetrica);
  }
  return metricasDominantes;
}

/**
 * Reanaliza un verso tratando de “forzar” la métrica dada en 'medidaObjetivo'.
 * Llama a analizarVerso con detectarAmb = medidaObjetivo, y decide si mejora.
 * @param {object} versoAnalizado - Objeto con el análisis original.
 * @param {number} medidaObjetivo - Métrica que queremos forzar (ej: 7, 11, 14).
 * @returns {object|null} Nuevo análisis si es válido/mejora; o null si no vale la pena.
 */
function reanalizarVersoConMetrica(versoAnalizado, medidaObjetivo) {
  // Reanalizamos el verso original con detectarAmb = medidaObjetivo
  const analisisAmb = analizarVerso(versoAnalizado.versoOriginal, 0, medidaObjetivo);

  // ¿Logra esa métrica?
  if (analisisAmb.silabas === medidaObjetivo) {
    // Comparamos ratios
    const ratioOriginal = versoAnalizado.clasificacion.ratio;
    const ratioNuevo = analisisAmb.clasificacion.ratio;

    // Si el nuevo ratio es >=, nos quedamos con la versión reanalizada
    if (ratioNuevo >= ratioOriginal) {
      return analisisAmb;
    }
  }
  return null;
}

/**
 * Analiza la lista de versos y luego intenta “acercar” los versos que no estén
 * en las métricas dominantes a la más cercana.
 * @param {string[]} versos
 * @param {number} minRepeticiones
 * @param {number} maxMetrica
 * @returns {object[]} Array de objetos con el análisis definitivo de cada verso.
 */
function escanearListaVersos(versos, minRepeticiones = 3, maxMetrica = 3) {
  // 1. Análisis inicial sin forzar ambigüedades
  const analisisVersos = [];
  versos.forEach(verso => {
    const v = verso.trim();
    if (!v) return;
    const analisis = analizarVerso(v, 0, 0);
    analisisVersos.push(analisis);
  });

  // 2. Sacamos el array de sílabas
  const silabasArray = analisisVersos.map(d => d.silabas);

  // 3. Obtenemos las métricas dominantes (por ejemplo, [7, 11, 14])
  const metricasDominantes = obtenerMetricasFrecuentes(silabasArray, minRepeticiones, maxMetrica);

  // 4. Para cada verso que no coincida con una de las métricas dominantes,
  //    intentamos reanalizarlo aproximándolo a la más cercana.
  for (let i = 0; i < analisisVersos.length; i++) {
    const versoActual = analisisVersos[i];
    if (!metricasDominantes.includes(versoActual.silabas)) {
      // Buscar la métrica dominante “más cercana” (por ejemplo, por distancia absoluta)
      let mejorMetrica = null;
      let menorDistancia = Infinity;
      metricasDominantes.forEach(metrica => {
        const dist = Math.abs(versoActual.silabas - metrica);
        if (dist < menorDistancia) {
          menorDistancia = dist;
          mejorMetrica = metrica;
        }
      });

      // Si la distancia es “pequeña” (por ejemplo ≤ 1 ó ≤ 2),
      // intentamos reanalizar para esa métrica
      if (menorDistancia <= 2) {
        const reanalizado = reanalizarVersoConMetrica(versoActual, mejorMetrica);
        if (reanalizado) {
          analisisVersos[i] = reanalizado;
        }
      }
    }
  }

  return analisisVersos;
}


/**
 * Escanea un poema completo y analiza cada verso.
 * @param {string} texto 
 * @returns {object[]} Array de objetos con el análisis de cada verso.
 */
function escanearTexto(texto) {
  const versos = texto.split('\n');
  return escanearListaVersos(versos);
}

// ==============================
// Funciones de Presentación
// ==============================

/**
 * Resalta los recursos métricos en un verso.
 * @param {string} versoOriginal 
 * @param {object[]} recursosMetricos 
 * @returns {string} Verso con recursos resaltados en HTML.
 */
function resaltarRecursos(versoOriginal, recursosMetricos) {
  const palabras = versoOriginal.split(' ');
  let palabrasResaltadas = [...palabras];

  recursosMetricos.forEach(recurso => {
    if (recurso.tipo === RECURSOS_METRICOS.SINALEFA) {
      const partes = recurso.entre.split(' - ');
      if (partes.length === 2) {
        const idx1 = palabrasResaltadas.indexOf(partes[0]);
        const idx2 = palabrasResaltadas.indexOf(partes[1], idx1 + 1);
        if (idx1 !== -1 && idx2 !== -1) {
          palabrasResaltadas[idx1] = `<span class="sinalefa">${palabrasResaltadas[idx1]}</span>`;
          palabrasResaltadas[idx2] = `<span class="sinalefa">${palabrasResaltadas[idx2]}</span>`;
        }
      }
    } else if (recurso.tipo === RECURSOS_METRICOS.SINERESIS) {
      const idx = palabrasResaltadas.indexOf(recurso.palabra);
      if (idx !== -1) {
        palabrasResaltadas[idx] = `<span class="sineresis">${palabrasResaltadas[idx]}</span>`;
      }
    } else if (recurso.tipo === RECURSOS_METRICOS.DIERESIS) {
      const idx = palabrasResaltadas.indexOf(recurso.palabra);
      if (idx !== -1) {
        palabrasResaltadas[idx] = `<span class="dieresis">${palabrasResaltadas[idx]}</span>`;
      }
    } else if (recurso.tipo === RECURSOS_METRICOS.DIALEFA) {
      const partes = recurso.entre.split(' - ');
      if (partes.length === 2) {
        const idx1 = palabrasResaltadas.indexOf(partes[0]);
        const idx2 = palabrasResaltadas.indexOf(partes[1], idx1 + 1);
        if (idx1 !== -1 && idx2 !== -1) {
          palabrasResaltadas[idx1] = `<span class="dialefa">${palabrasResaltadas[idx1]}</span>`;
          palabrasResaltadas[idx2] = `<span class="dialefa">${palabrasResaltadas[idx2]}</span>`;
        }
      }
    }
  });

  return palabrasResaltadas.join(' ');
}

/**
 * Muestra el análisis en una tabla HTML.
 * @param {object[]} analisis Array de objetos con el análisis de cada verso.
 */
function mostrarAnalisis(analisis) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (analisis.length === 0) {
    resultsDiv.innerHTML = '<p>No se encontraron versos para analizar.</p>';
    const exportBtn = document.getElementById('exportButton');
    if (exportBtn) exportBtn.disabled = true;
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = [
    'Número',
    'Verso',
    'Sílabas',
    'Acentos',
    'Acentos Ideales',
    'Tipo',
    'Ratio de Coincidencia (%)',
    'Recursos Métricos'
  ];
  headers.forEach(textoEncabezado => {
    const th = document.createElement('th');
    th.textContent = textoEncabezado;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  analisis.forEach((versoAnalisis, index) => {
    const row = document.createElement('tr');

    const cellNumero = document.createElement('td');
    cellNumero.textContent = index + 1;
    row.appendChild(cellNumero);

    const cellVerso = document.createElement('td');
    const versoResaltado = resaltarRecursos(versoAnalisis.versoOriginal, versoAnalisis.recursosMetricos);
    cellVerso.innerHTML = versoResaltado;
    row.appendChild(cellVerso);

    const cellSilabas = document.createElement('td');
    cellSilabas.textContent = versoAnalisis.silabas;
    row.appendChild(cellSilabas);

    const cellAcentos = document.createElement('td');
    cellAcentos.textContent = `[${versoAnalisis.acentos.join(', ')}]`;
    row.appendChild(cellAcentos);

    const cellAcentosIdeales = document.createElement('td');
    const acentosIdealesTexto = Array.isArray(versoAnalisis.clasificacion.acentosIdeales)
      ? `[${versoAnalisis.clasificacion.acentosIdeales.join(', ')}]`
      : versoAnalisis.clasificacion.acentosIdeales;
    cellAcentosIdeales.textContent = acentosIdealesTexto;
    row.appendChild(cellAcentosIdeales);

    const cellTipo = document.createElement('td');
    cellTipo.textContent = versoAnalisis.clasificacion.nombre;
    row.appendChild(cellTipo);

    const cellRatio = document.createElement('td');
    cellRatio.textContent = (versoAnalisis.clasificacion.ratio * 100).toFixed(2);
    row.appendChild(cellRatio);

    const cellRecursos = document.createElement('td');
    if (versoAnalisis.recursosMetricos && versoAnalisis.recursosMetricos.length > 0) {
      versoAnalisis.recursosMetricos.forEach(recurso => {
        if (recurso.tipo === RECURSOS_METRICOS.SINALEFA) {
          cellRecursos.innerHTML += `<strong>Sinalefa:</strong> ${recurso.entre}<br>`;
        } else if (
          recurso.tipo === RECURSOS_METRICOS.SINERESIS ||
          recurso.tipo === RECURSOS_METRICOS.DIERESIS
        ) {
          cellRecursos.innerHTML += `<strong>${recurso.tipo}:</strong> ${recurso.palabra}<br>`;
        } else if (recurso.tipo === RECURSOS_METRICOS.DIALEFA) {
          cellRecursos.innerHTML += `<strong>Dialefa:</strong> ${recurso.entre}<br>`;
        }
      });
    } else {
      cellRecursos.textContent = 'Ninguno';
    }
    row.appendChild(cellRecursos);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  resultsDiv.appendChild(table);

  const exportBtn = document.getElementById('exportButton');
  if (exportBtn) exportBtn.disabled = false;
}

// ==============================
// Event Listener para Análisis
// ==============================

document.getElementById('analyzeButton').addEventListener('click', () => {
  const texto = document.getElementById('poemInput').value;
  if (!texto.trim()) {
    alert('Por favor, introduce un poema para analizar.');
    return;
  }
  const analisis = escanearTexto(texto);
  mostrarAnalisis(analisis);
});
