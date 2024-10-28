// metricAnalyzer.js

// Constantes y Datos Iniciales

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
    // pentasílabos
    [['heroico', [2, 4]], ['sáfico', [4]], ['dactílico', [1, 4]]],
    // hexasílabos
    [['heroico', [2, 5]], ['melódico puro', [3, 5]], ['melódico pleno', [1, 3, 5]], ['enfático', [1, 5]], ['vacío', [5]]],
    // heptasílabos
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
    // octosílabos
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
    // eneasílabos
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
    // decasílabos
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
    // endecasílabos
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

// Definiciones de Vocales y Otros Elementos

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
    ':', ',', '.', ';', '.', '–', '(', ')', '\n', '\r',
    '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-', '/', '//'
];

// Factores de Clasificación de Versos
const FACTOR_AGUDA = 1;
const FACTOR_LLANA = 0;
const FACTOR_ESDRUJULA = -1;

/**
 * MÓDULO DE ANÁLISIS DE PALABRA: CÁLCULO DE SÍLABAS Y ACENTOS DE PALABRAS
 */

// Función para quitar puntuación de un texto
function quitarPuntuacion(texto) {
    const quitar = [
        ':', ',', '.', ';', '.', '–', '(', ')', '\n', '\r',
        '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-', '/', '//'
    ];
    quitar.forEach(q => {
        texto = texto.split(q).join('');
    });
    return texto;
}

// Función para normalizar un texto (quita puntuación, mayúsculas y espacios laterales)
function normalizar(texto) {
    return quitarPuntuacion(texto).trim().toLowerCase();
}

// Función para normalizar palabras con dígrafos "qu" y "gu"
function normalizarQuGu(palabra) {
    const quitar = [
        { original: 'qu', reemplazo: 'q' },
        { original: 'gue', reemplazo: 'ge' },
        { original: 'gui', reemplazo: 'gi' }
    ];
    quitar.forEach(q => {
        palabra = palabra.split(q.original).join(q.reemplazo);
    });
    return palabra;
}

// Función para verificar si una palabra empieza por vocal o "h" seguida de vocal
function empiezaPorVocal(palabra) {
    return vocalesY.includes(palabra[0]) || (palabra[0] === 'h' && vocalesY.includes(palabra[1]));
}

// Función para verificar si una palabra termina por vocal o "h" precedida de vocal
function terminaPorVocal(palabra) {
    const len = palabra.length;
    return vocalesY.includes(palabra[len - 1]) || (palabra[len - 1] === 'h' && vocalesY.includes(palabra[len - 2]));
}

// Función para comprobar si la "y" griega no es vocálica en una palabra
function yeye(palabra) {
    const primeraY = palabra.slice(0, 2);
    const primeraTres = palabra.slice(0, 3);
    return (
        vocales.some(v => primeraY === 'y' + v) ||
        ['hie', 'hue', 'hon'].includes(primeraTres)
    );
}

// Función para calcular sílabas, acentos y factor de una palabra
function palabraSilabasAcentos(palabra) {
    if (palabra.length === 1) {
        return [1, 1, FACTOR_AGUDA];
    }

    let factorFinal = 0;
    let numSilabas = 0;
    let palabraNorm = normalizarQuGu(palabra);
    let acento = null;

    for (let i = 0; i < palabraNorm.length; i++) {
        const c = palabraNorm[i];
        if (vocales.includes(c)) {
            numSilabas += 1;
            if (
                i > 0 &&
                diptongos.includes(palabraNorm[i - 1] + c) &&
                !dieresis.includes(palabraNorm[i - 1]) &&
                numSilabas > 1
            ) {
                numSilabas -= 1;
            }
            if (vocalesAcentuadas.includes(c)) {
                acento = numSilabas;
            }
        }
    }

    // Determinar acento si no hay tilde explícita
    if (acento === null) {
        const ultimaLetra = palabraNorm[palabraNorm.length - 1];
        if (['n', 's', ...vocales].includes(ultimaLetra)) {
            acento = numSilabas - 1;
        } else {
            acento = numSilabas;
        }
    }

    if (numSilabas === 1) {
        acento = 1;
    }

    // Determinar el factor
    const factor = numSilabas - acento;
    if (factor === 0) {
        factorFinal = FACTOR_AGUDA;
    } else if (factor === 1) {
        factorFinal = FACTOR_LLANA;
    } else if (factor > 1) {
        factorFinal = FACTOR_ESDRUJULA;
    }

    return [numSilabas, acento, factorFinal];
}

/**
 * SUBMÓDULO DE AMBIGUEDADES: FUNCIONES PARA LA COMPARACIÓN DE VECTORES DE ACENTOS
 */

// Función para convertir un vector de acentos a vector binario
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

// Función para comparar dos vectores de acentos y devolver un ratio de coincidencia
function compararAcentos(vecAcentos1, vecAcentos2) {
    if (vecAcentos1[vecAcentos1.length - 1] !== vecAcentos2[vecAcentos2.length - 1]) {
        return 0;
    }

    const comp1 = convertirAVectorBinario(vecAcentos1);
    const comp2 = convertirAVectorBinario(vecAcentos2);
    let puntosVec = 0;
    for (let i = 0; i < comp1.length; i++) {
        if (comp1[i] === comp2[i]) {
            puntosVec += 1;
        }
    }
    return puntosVec / comp1.length;
}

// Función para clasificar un verso basado en el número de sílabas y acentos
function clasificar(numSilabas, acentos) {
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
        // Retornar un arreglo vacío para acentosIdeales si no se clasifica
        return [nombre, [], 1.0];
    }

    return [`${nombre} ${mejorTipo[0]}`, mejorTipo[1], mejorRatio];
}

/**
 * SUBMÓDULO DE TRATAMIENTO DE AMBIGUEDADES
 */

// Función para verificar la presencia de un diptongo en una palabra
function hayDiptongo(palabra) {
    const palabraNorm = normalizarQuGu(palabra);
    return diptongos.some(dip => palabraNorm.includes(dip));
}

// Función para verificar la presencia de un hiato en una palabra
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

// Función para eliminar hiato (sineresis) y etiquetarlo
function quitarHiato(palabraOp) {
    const simboloSineresis = '#';
    let palabra = palabraOp.split('').join('').replace(/h/g, '');
    const [sPalabraOp, aPalabraOp, fPalabraOp] = palabraSilabasAcentos(palabraOp);
    let yaTildada = false;

    for (let i = 0; i < palabraOp.length - 1; i++) {
        const cActual = palabraOp[i];
        const cSiguiente = palabraOp[i + 1];
        if (vocales.includes(cActual) && vocales.includes(cSiguiente) && !diptongos.includes(cActual + cSiguiente)) {
            if (vocalesAcentuadas.includes(cSiguiente)) {
                palabra = palabra.slice(0, i) + palabra.slice(i + 1);
            } else if (vocalesAcentuadas.includes(cActual)) {
                palabra = palabra.slice(0, i + 1) + palabra.slice(i + 2);
            } else {
                palabra = palabra.slice(0, i) + palabra.slice(i + 1);
                // Hay que mantener el acento
                const [sPalabra, aPalabra] = palabraSilabasAcentos(palabra);
                // Colocamos el acento cuando la palabra tiene 3 sílabas o menos
                if (!yaTildada && fPalabraOp !== FACTOR_AGUDA && aPalabra !== aPalabraOp && sPalabraOp <= 3) {
                    palabra = palabra.slice(0, i) + deNoAcentuadas[palabra[i]] + palabra.slice(i + 1);
                }
            }
            // Insertamos símbolo para indicar la operación de sineresis
            if (i === 1 || i === palabra.length - 1) {
                palabra = palabra.slice(0, i) + simboloSineresis + palabra.slice(i);
            }
        }
    }

    return palabra;
}

// Función para separar un diptongo en una palabra (dieresis)
function separarDiptongo(palabra) {
    const palabraNorm = normalizarQuGu(palabra);
    for (let dip of diptongos) {
        const lugarDip = palabraNorm.indexOf(dip);
        if (lugarDip > -1 && !yeye(palabraNorm.slice(lugarDip + 1, lugarDip + 3))) {
            return palabraNorm.slice(0, lugarDip + 1) + '~' + palabraNorm.slice(lugarDip + 1);
        }
    }
    return palabra;
}

// Función para combinar versos con un símbolo específico
function combinarConSimbolo(versosAmb, sepVAmb, simbolo) {
    const palabrasConSimbolo = [];
    const composicionSimbolo = [];

    versosAmb.forEach(vPadre => {
        const palabras = vPadre.split(' ');
        palabras.forEach(palabra => {
            if (palabra.includes(simbolo)) {
                palabrasConSimbolo.push(palabra);
            }
        });
    });

    sepVAmb.forEach(vPadre => {
        const palabras = vPadre.split(' ');
        palabras.forEach((palabra, pos) => {
            palabrasConSimbolo.forEach(palabraSimbolo => {
                if (palabra === palabraSimbolo.replace(simbolo, '')) {
                    const vAmbCompuesto = [...palabras];
                    vAmbCompuesto[pos] = palabraSimbolo;
                    composicionSimbolo.push(vAmbCompuesto.join(' '));
                }
            });
        });
    });

    return composicionSimbolo;
}

// Función para combinar ambigüedades en versos
function combinarAmbiguedades(versosAmb, hacerComposicionHiatos = false, hacerComposicionAtonas = false, hacerComposicionDiptongos = false) {
    const composicionAmbSinalefas = [];
    const composicionHiatos = [];
    const composicionDiptongos = [];
    const composicionAtonas = [];
    let sepVAmb = [...versosAmb];

    // Composición de sinalefas
    versosAmb.forEach(vPadre => {
        const padrePalabras = vPadre.split(' ');
        versosAmb.forEach(vHijo => {
            if (vPadre !== vHijo) {
                if (padrePalabras.includes('')) {
                    let desplazamiento = 0;
                    const iEspacio = padrePalabras.indexOf('');
                    if (vHijo.split(' ').includes('') && vHijo.split(' ').indexOf('') < iEspacio) {
                        desplazamiento = 2;
                    }
                    const nuevoVAmb = [...vHijo.split(' ')];
                    nuevoVAmb.splice(iEspacio + desplazamiento, 0, '', '');
                    composicionAmbSinalefas.push(nuevoVAmb.join(' '));
                }
            }
        });
    });

    sepVAmb = [...sepVAmb, ...composicionAmbSinalefas];

    // Composición de atonas
    if (hacerComposicionAtonas) {
        const atonasAVecesAcentuadasKeys = Object.keys(atonasAVecesAcentuadas);
        sepVAmb.forEach(vPadre => {
            const padrePalabras = vPadre.split(' ');
            padrePalabras.forEach((palabra, pos) => {
                atonasAVecesAcentuadasKeys.forEach(aton => {
                    if (palabra === aton) {
                        const vAmbCompuesto = [...padrePalabras];
                        vAmbCompuesto[pos] = atonasAVecesAcentuadas[aton];
                        composicionAtonas.push(vAmbCompuesto.join(' '));
                    }
                });
            });
        });
        sepVAmb = [...sepVAmb, ...composicionAtonas];
    }

    // Composición de diptongos
    if (hacerComposicionDiptongos) {
        const compDiptongos = combinarConSimbolo(versosAmb, sepVAmb, '#');
        sepVAmb = [...sepVAmb, ...compDiptongos];
    }

    // Composición de hiatos
    if (hacerComposicionHiatos) {
        const compHiatos = combinarConSimbolo(versosAmb, sepVAmb, '~');
        sepVAmb = [...sepVAmb, ...compHiatos];
    }

    return [...versosAmb, ...composicionAmbSinalefas, ...composicionHiatos, ...composicionDiptongos];
}

// Función para resolver ambiguedades en versos
function resolverAmbiguedades(vFinal, versosAmb, arte, detectarAmb) {
    let vAmbRatioMejor = 0;
    const versosAmbCombinados = combinarAmbiguedades(versosAmb);

    // Clonar los recursos métricos para cada ambigüedad
    const recursosMetricosOriginal = vFinal[4] || [];
    let recursosMetricosMejor = [...recursosMetricosOriginal];

    versosAmbCombinados.forEach(vAmb => {
        const resultado = versoSilabasAcentosTipo(vAmb, arte, detectarAmb);
        const [_, vAmbSilabas, vAmbAcentos, __, recursosMetricos] = resultado;
        if (vAmbSilabas === detectarAmb) {
            const clasificacion = clasificar(vAmbSilabas, vAmbAcentos);
            const vAmbRatio = clasificacion[2];
            if (vAmbRatioMejor <= vAmbRatio) {
                if (vAmbRatioMejor === vAmbRatio && (vAmb.includes('~') || vAmb.includes('#'))) {
                    return;
                }
                vAmbRatioMejor = vAmbRatio;
                recursosMetricosMejor = recursosMetricos;
                vFinal = [vAmb, vAmbSilabas, vAmbAcentos, clasificacion, recursosMetricos];
            }
        }
    });

    vFinal[4] = recursosMetricosMejor;
    return vFinal;
}

/**
 * MÓDULO DE ANÁLISIS DE VERSO
 */

// Función para verificar si un verso está en hemistiquio
function enHemistiquio(numSilabas, factor, arte) {
    const hemistiquio = arte / 2;
    if (factor === FACTOR_ESDRUJULA) {
        return numSilabas + factor === Math.floor(hemistiquio);
    } else {
        return numSilabas + factor === Math.ceil(hemistiquio);
    }
}

// Función principal para analizar un verso
function versoSilabasAcentosTipo(verso, arte = 0, detectarAmb = 0) {
    let numSilabas = 0;
    const versoOp = quitarPuntuacion(verso.toLowerCase()).trim().split(' ');
    const acentos = [];
    const versosAmb = [];
    const palabraFinal = versoOp[versoOp.length - 1];
    
    // Arreglo para almacenar los recursos métricos
    const recursosMetricos = [];

    versoOp.forEach((palabra, i) => {
        if (palabra) {
            const [silabas, acento, factor] = palabraSilabasAcentos(palabra);
            const palabraSiguiente = i < versoOp.length - 1 ? versoOp[i + 1] : null;

            numSilabas += silabas;

            // Cálculo de los adverbios en -mente (dos acentos)
            if (palabra.endsWith('mente') && palabra.length > 5) {
                const palabraSinMente = palabra.replace('mente', '');
                const silabasMente = 2;
                const acentoMente = 1;
                const [silabasSinMente, acentoSinMente, factorSinMente] = palabraSilabasAcentos(palabraSinMente);
                const nuevoAcentoSinMente = numSilabas - (silabasSinMente - acentoSinMente) - silabasMente;
                acentos.push(acentoSinMente);
                acentos.push(numSilabas - (silabasMente - acentoMente));
            } else {
                // Cálculo del acento para el resto de palabras (un acento)
                if (!atonas.includes(palabra) || i === versoOp.length - 1) {
                    const acentoNuevo = numSilabas - (silabas - acento);
                    if (acentos.length > 0) {
                        if (acentos[acentos.length - 1] !== acentoNuevo) {
                            acentos.push(acentoNuevo);
                        }
                    } else {
                        acentos.push(acentoNuevo);
                    }
                }
            }

            // Sinalefas
            if (
                palabraSiguiente &&
                terminaPorVocal(palabra) &&
                empiezaPorVocal(palabraSiguiente) &&
                !enHemistiquio(numSilabas, factor, arte) &&
                !yeye(palabraSiguiente)
            ) {
                numSilabas -= 1;

                // Registrar sinalefa con las palabras exactas
                const palabraActual = versoOp[i];
                const palabraSig = versoOp[i + 1];
                recursosMetricos.push({
                    tipo: 'Sinalefa',
                    entre: `${palabraActual} y ${palabraSig}`
                });

                // Anotar dialefa
                if (detectarAmb > 0) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i + 1, 0, ' ');
                    versosAmb.push(vAmb.join(' '));

                    // Registrar dialefa con las palabras exactas
                    recursosMetricos.push({
                        tipo: 'Dialefa',
                        entre: `${palabraActual} y ${palabraSig}`
                    });
                }
            }

            // Dieresis y Sineresis
            if (detectarAmb > 0) {
                // Anotar sineresis
                if (hayHiato(palabra)) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i, 1, quitarHiato(palabra));
                    versosAmb.push(vAmb.join(' '));

                    // Registrar sineresis
                    recursosMetricos.push({
                        tipo: 'Sineresis',
                        palabra: palabra
                    });
                }
                // Anotar dieresis
                if (hayDiptongo(palabra)) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i, 1, separarDiptongo(palabra));
                    versosAmb.push(vAmb.join(' '));

                    // Registrar diéresis
                    recursosMetricos.push({
                        tipo: 'Diéresis',
                        palabra: palabra
                    });
                }
            }

            // Hemistiquios
            if (arte > 0 && !atonas.includes(palabra) && enHemistiquio(numSilabas, factor, arte)) {
                numSilabas += factor;
            }
        }
    });

    const factorPalabraFinal = palabraFinal.endsWith('mente') ? 0 : palabraSilabasAcentos(palabraFinal)[2];
    numSilabas += factorPalabraFinal;

    // Si es mayor de once, se vuelve a contar teniendo en cuenta el hemistiquio (llamada recursiva)
    if (numSilabas > 11 && arte === 0) {
        const resultado = versoSilabasAcentosTipo(verso, numSilabas, 0);
        numSilabas = resultado[1];
        acentos.length = 0;
        resultado[2].forEach(ac => acentos.push(ac));
    }

    let vFinal = [verso, numSilabas, acentos, clasificar(numSilabas, acentos)];

    // Módulo detección de ambigüedades
    if (detectarAmb > 0) {
        vFinal = resolverAmbiguedades(vFinal, versosAmb, arte, detectarAmb);
    }

    // Añadir los recursos métricos al resultado final
    vFinal.push(recursosMetricos);

    return vFinal;
}

/**
 * MÓDULO DE ANÁLISIS DE POEMAS ENTEROS
 */

// Función para obtener los elementos más frecuentes de una lista por encima de una constante
function mostFrequent(lista, constante = 0.15) {
    const tablaFrecuencias = {};
    lista.forEach(item => {
        tablaFrecuencias[item] = (tablaFrecuencias[item] || 0) + 1;
    });

    // Convertir las frecuencias a proporciones
    Object.keys(tablaFrecuencias).forEach(item => {
        tablaFrecuencias[item] /= lista.length;
    });

    // Filtrar por la constante y ordenar
    const filtrado = Object.entries(tablaFrecuencias)
        .filter(([_, freq]) => freq >= constante)
        .sort((a, b) => b[1] - a[1]);

    return Object.fromEntries(filtrado);
}

// Función para trocear una columna de una tabla
function trocearColumna(x, c, i, contexto) {
    let rodaja;
    if (i < contexto) {
        rodaja = x.slice(0, contexto);
    } else if (i + contexto >= x.length) {
        rodaja = x.slice(i);
    } else {
        rodaja = x.slice(i - contexto, i + contexto);
    }
    return rodaja.map(verso => verso[c]);
}

// Función para escanear una lista de versos y analizar su métrica
function escandirListaVersos(versos, contexto = 14) {
    const x = [];
    const nuevo = [];

    // Cálculo con módulo de ambigüedades desactivado
    versos.forEach(versoA => {
        const v = versoA.trim().replace(/\n/g, '');
        if (!v) return;
        const resultado = versoSilabasAcentosTipo(versoA, 0, 0);
        const [vFinal, silabasV, acentosV, clasificacionV, recursosMetricos] = resultado;
        const [tipoV, acentosIdealesV, ratioV] = clasificacionV;
        x.push([v, vFinal, silabasV, acentosV, acentosIdealesV, tipoV, ratioV, recursosMetricos]);
    });

    // Cálculo de versos frecuentes
    const columnaSilabasV = x.map(dato => dato[2]);
    let versosFrecuentes = mostFrequent(columnaSilabasV);
    const metricaMixta = Object.keys(versosFrecuentes).length > 1;

    // Cálculo de versos ambiguos
    x.forEach((datoV, i) => {
        const silabasV = datoV[2];
        let desambiguado = false;

        // Si es métrica mixta, se calculan las medidas frecuentes en un contexto n
        let versosFrecuentesLocal = versosFrecuentes;
        if (metricaMixta) {
            const columnaLocal = trocearColumna(x, 2, i, contexto);
            versosFrecuentesLocal = mostFrequent(columnaLocal);
        }

        // Aproximar a los versos más frecuentes
        if (!versosFrecuentesLocal[silabasV]) {
            const resultado = versoSilabasAcentosTipo(datoV[0], 0, silabasV);
            const [vFinal, silabasVNew, acentosVNew, clasificacionVNew, recursosMetricosNew] = resultado;
            const [tipoV, acentosIdealesV, ratioV] = clasificacionVNew;
            if (silabasVNew === silabasV) {
                nuevo.push([datoV[0], vFinal, silabasVNew, acentosVNew, acentosIdealesV, tipoV, ratioV, recursosMetricosNew]);
                desambiguado = true;
            }
        }

        if (!desambiguado) {
            nuevo.push(datoV);
        }
    });

    return nuevo;
}

// Función para escanear un texto completo (poema) y analizar su métrica
function escandirTexto(texto) {
    const versos = texto.split('\n');
    return escandirListaVersos(versos);
}

/**
 * Función para resaltar recursos métricos en el verso
 */
function resaltarRecursos(original, recursosMetricos) {
    // Dividir el verso en palabras
    const palabras = original.split(' ');
    
    // Clonar el arreglo para manipularlo
    let palabrasResaltadas = [...palabras];
    
    // Procesar cada recurso métrico y aplicar resaltados
    recursosMetricos.forEach(recurso => {
        if (recurso.tipo === 'Sinalefa') {
            // Sinalefa entre dos palabras: resaltar ambas palabras
            const entrePalabras = recurso.entre.split(' y ');
            if (entrePalabras.length === 2) {
                const palabra1 = entrePalabras[0];
                const palabra2 = entrePalabras[1];
                const idx1 = palabrasResaltadas.indexOf(palabra1);
                const idx2 = palabrasResaltadas.indexOf(palabra2, idx1 + 1);
                if (idx1 !== -1 && idx2 !== -1) {
                    palabrasResaltadas[idx1] = `<span class="sinalefa">${palabrasResaltadas[idx1]}</span>`;
                    palabrasResaltadas[idx2] = `<span class="sinalefa">${palabrasResaltadas[idx2]}</span>`;
                }
            }
        } else if (recurso.tipo === 'Sineresis') {
            // Sineresis en una palabra: resaltar la palabra
            const palabra = recurso.palabra;
            const idx = palabrasResaltadas.indexOf(palabra);
            if (idx !== -1) {
                palabrasResaltadas[idx] = `<span class="sineresis">${palabrasResaltadas[idx]}</span>`;
            }
        } else if (recurso.tipo === 'Diéresis') {
            // Diéresis en una palabra: resaltar la palabra
            const palabra = recurso.palabra;
            const idx = palabrasResaltadas.indexOf(palabra);
            if (idx !== -1) {
                palabrasResaltadas[idx] = `<span class="dieresis">${palabrasResaltadas[idx]}</span>`;
            }
        } else if (recurso.tipo === 'Dialefa') {
            // Dialefa entre dos palabras: resaltar ambas palabras
            const entrePalabras = recurso.entre.split(' y ');
            if (entrePalabras.length === 2) {
                const palabra1 = entrePalabras[0];
                const palabra2 = entrePalabras[1];
                const idx1 = palabrasResaltadas.indexOf(palabra1);
                const idx2 = palabrasResaltadas.indexOf(palabra2, idx1 + 1);
                if (idx1 !== -1 && idx2 !== -1) {
                    palabrasResaltadas[idx1] = `<span class="dialefa">${palabrasResaltadas[idx1]}</span>`;
                    palabrasResaltadas[idx2] = `<span class="dialefa">${palabrasResaltadas[idx2]}</span>`;
                }
            }
        }
        // Puedes añadir más condiciones para otros tipos de recursos métricos
    });
    
    // Reconstruir el verso con las palabras resaltadas
    return palabrasResaltadas.join(' ');
}

/**
 * Función para mostrar el análisis de manera legible en la página
 */
function mostrarAnalisis(analisis) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Limpiar resultados anteriores

    if (analisis.length === 0) {
        resultsDiv.innerHTML = '<p>No se encontraron versos para analizar.</p>';
        document.getElementById('exportButton').disabled = true;
        return;
    }

    const table = document.createElement('table');

    // Crear encabezados de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Número', 'Verso', 'Sílabas', 'Acentos', 'Acentos Ideales', 'Tipo', 'Ratio de Coincidencia (%)', 'Recursos Métricos'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    analisis.forEach((verso, index) => {
        const [original, etiquetado, silabas, acentos, acentosIdeales, tipo, ratio, recursosMetricos] = verso;
        const row = document.createElement('tr');

        const numeroCell = document.createElement('td');
        numeroCell.textContent = index + 1;
        row.appendChild(numeroCell);

        const originalCell = document.createElement('td');
        // Resaltar recursos métricos en el verso
        const versoResaltado = resaltarRecursos(original, recursosMetricos);
        originalCell.innerHTML = versoResaltado;
        row.appendChild(originalCell);

        const silabasCell = document.createElement('td');
        silabasCell.textContent = silabas;
        row.appendChild(silabasCell);

        const acentosCell = document.createElement('td');
        acentosCell.textContent = `[${acentos.join(', ')}]`;
        row.appendChild(acentosCell);

        const acentosIdealesCell = document.createElement('td');
        // Verificar si acentosIdeales es un arreglo
        const acentosIdealesTexto = Array.isArray(acentosIdeales) ? `[${acentosIdeales.join(', ')}]` : acentosIdeales;
        acentosIdealesCell.textContent = acentosIdealesTexto;
        row.appendChild(acentosIdealesCell);

        const tipoCell = document.createElement('td');
        tipoCell.textContent = tipo;
        row.appendChild(tipoCell);

        const ratioCell = document.createElement('td');
        ratioCell.textContent = (ratio * 100).toFixed(2);
        row.appendChild(ratioCell);

        // Columna para Recursos Métricos
        const recursosCell = document.createElement('td');
        if (recursosMetricos && recursosMetricos.length > 0) {
            recursosMetricos.forEach(recurso => {
                if (recurso.tipo === 'Sinalefa') {
                    recursosCell.innerHTML += `<strong>Sinalefa:</strong> ${recurso.entre}<br>`;
                } else if (recurso.tipo === 'Sineresis' || recurso.tipo === 'Diéresis') {
                    recursosCell.innerHTML += `<strong>${recurso.tipo}:</strong> ${recurso.palabra}<br>`;
                } else if (recurso.tipo === 'Dialefa') {
                    recursosCell.innerHTML += `<strong>Dialefa:</strong> ${recurso.entre}<br>`;
                }
                // Puedes añadir más tipos de recursos aquí
            });
        } else {
            recursosCell.textContent = 'Ninguno';
        }
        row.appendChild(recursosCell);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    resultsDiv.appendChild(table);

    // Habilitar el botón de exportar
    document.getElementById('exportButton').disabled = false;
}

// Event Listener para el botón de análisis
document.getElementById('analyzeButton').addEventListener('click', () => {
    const texto = document.getElementById('poemInput').value;
    if (!texto.trim()) {
        alert('Por favor, introduce un poema para analizar.');
        return;
    }
    const analisis = escandirTexto(texto);
    mostrarAnalisis(analisis);
});
