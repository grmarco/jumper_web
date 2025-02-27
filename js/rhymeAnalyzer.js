// rhymeAnalyzer.js
// Versión simplificada para extraer el esquema de rima de un poema

// Constantes y configuraciones
const vocalesRhymeNoAcentuadasRhyme = ['a', 'e', 'i', 'o', 'u'];
const vocalesRhymeAcentuadasRhyme = ['á', 'é', 'í', 'ó', 'ú'];
const dieresisRhyme = ['ï', 'ü'];
const vocalesRhyme = [...vocalesRhymeNoAcentuadasRhyme, ...vocalesRhymeAcentuadasRhyme, ...dieresisRhyme];

const deNoASiAcentuadasRhyme = {
  a: 'á',
  e: 'é',
  i: 'í',
  o: 'ó',
  u: 'ú',
  'ï': 'ï',
  'ü': 'ü'
};
const deSiANoAcentuadasRhyme = {};
for (let k in deNoASiAcentuadasRhyme) {
  deSiANoAcentuadasRhyme[deNoASiAcentuadasRhyme[k]] = k;
}

const diptongosRhyme = [
  'ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui', 'iu',
  'ia', 'ua', 'ie', 'ue', 'io', 'uo',
  'ió', 'ey', 'oy', 'ié', 'éi', 'ué', 'ái', 'iá', 'uá'
];
const diptongoArtificialRhyme = {
  ai: 'ái',
  au: 'áu',
  ei: 'éi',
  eu: 'éu',
  oi: 'ói',
  ou: 'óu',
  ui: 'uí',
  iu: 'iú',
  ia: 'iá',
  ua: 'uá',
  ie: 'ié',
  ue: 'ué',
  io: 'ió',
  uo: 'uó'
};

// Clase para el análisis de rimas en español
class SpanishRhymeAnnotator {
  /* --- Utilidades de texto --- */
  static removeDots(text) {
    const quitar = [':', '\'', ',', '.', ';', '–', '(', ')', '\n', '\r', '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-', '/', '…'];
    let res = text;
    quitar.forEach((q) => {
      res = res.split(q).join(' ');
    });
    return res;
  }

  static removeNums(text) {
    return text.replace(/\d/g, '');
  }

  static normalize(text) {
    return SpanishRhymeAnnotator.removeDots(SpanishRhymeAnnotator.removeNums(text))
      .trim()
      .toLowerCase();
  }

  // Normaliza dígrafos "qu", "gue" y "gui" para simplificar la comparación de rimas
  static normalizeQuGu(word) {
    const cambios = [
      { orig: 'qu', repl: 'q' },
      { orig: 'gue', repl: 'ge' },
      { orig: 'gui', repl: 'gi' }
    ];
    let res = word;
    cambios.forEach(({ orig, repl }) => {
      res = res.replace(new RegExp(orig, 'g'), repl);
    });
    return res;
  }

  // Reemplaza algunos fonemas para homogeneizar (por ejemplo, 'v' por 'b', 'y' por 'i')
  static normalizeFonemas(word) {
    return word.replace(/v/g, 'b').replace(/y/g, 'i');
  }

  /* --- Cálculo de la rima --- */
  // Retorna la posición (índice en la palabra) donde se encuentra la vocal acentuada.
  static getStressPosition(word) {
    if (word.length <= 1) return 0;
    word = SpanishRhymeAnnotator.normalizeQuGu(word);
    let numSilabas = 0;
    let acento = null;
    let posAcento = 0;
    let posvocalesRhyme = [];
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (vocalesRhyme.includes(c)) {
        numSilabas++;
        if (
          i > 0 &&
          diptongosRhyme.includes(word[i - 1] + c) &&
          !dieresisRhyme.includes(word[i - 1]) &&
          numSilabas > 1
        ) {
          numSilabas--; // No contar doble en diptongo
        } else {
          posvocalesRhyme.push(i);
        }
        if (vocalesRhymeAcentuadasRhyme.includes(c)) {
          posAcento = i;
          acento = numSilabas;
        }
      }
    }
    if (acento === null) {
      if (posvocalesRhyme.length === 0) {
        posAcento = 0;
      } else if (posvocalesRhyme.length === 1) {
        posAcento = posvocalesRhyme[0];
      } else {
        const lastChar = word[word.length - 1];
        if (['n', 's', ...vocalesRhyme].includes(lastChar)) {
          acento = numSilabas - 1;
          posAcento = posvocalesRhyme[posvocalesRhyme.length - 2];
        } else {
          acento = numSilabas;
          posAcento = posvocalesRhyme[posvocalesRhyme.length - 1];
        }
      }
    }
    return posAcento;
  }

  static getRhymeData(originalWord) {
    // 1. Normaliza completamente la palabra (puntuación, minúsculas, qu->q, etc.)
    let word = SpanishRhymeAnnotator.normalize(originalWord);          // quita tildes, signos, pasa a minúsculas, etc.
    word = SpanishRhymeAnnotator.normalizeFonemas(word);              // reemplaza v->b, y->i, etc.
    word = SpanishRhymeAnnotator.normalizeQuGu(word);                 // qu->q, gue->ge, etc.
  
    // 2. Calcula la posición del acento usando la palabra ya normalizada
    //    Asegúrate de que dentro de getStressPosition ya NO llames de nuevo a normalizeQuGu
    const posAcento = SpanishRhymeAnnotator.getStressPosition(word);
  
    // 3. Extrae la parte consonántica desde la vocal acentuada
    let consonante = word.slice(posAcento);
    //  Copia para la versión que usaremos al calcular la asonancia
    let consonanteAso = consonante;

    console.log("Palabra normalizada: ", word);
    console.log("Posición de la vocal acentuada: ", posAcento);
    console.log("Rima consonante: ", consonante);
  
    // 4. Si la primera letra es vocal sin acento, cámbiala por la vocal acentuada equivalente
    if (consonante && vocalesRhymeNoAcentuadasRhyme.includes(consonante[0])) {
      consonante = deNoASiAcentuadasRhyme[consonante[0]] + consonante.slice(1);
    }
  
    // 5. Reemplaza diptongos en la cadena "consonanteAso" por su versión "artificial"
    for (let key in diptongoArtificialRhyme) {
      if (consonanteAso.includes(key)) {
        consonanteAso = consonanteAso.replace(key, diptongoArtificialRhyme[key]);
        const idx = consonanteAso.indexOf(diptongoArtificialRhyme[key]);
        consonante = consonanteAso.slice(idx-1 + diptongoArtificialRhyme[key].length);
      }
    }
  
    // 6. Calcula la rima asonante (extraer solo las vocales de consonanteAso)
    let asonancia = "";
    let primera = true;
    for (let i = 0; i < consonanteAso.length; i++) {
      const c = consonanteAso[i];
      if (vocalesRhyme.includes(c)) {
        if (primera) {
          // Si es la primera vocal, fuerza a que sea acentuada (si era sin tilde)
          asonancia += vocalesRhymeNoAcentuadasRhyme.includes(c)
            ? deNoASiAcentuadasRhyme[c]
            : c;
          primera = false;
        } else {
          asonancia += c;
        }
      }
    }
    // Simplifica si hay más de dos vocales
    if (asonancia.length > 2) {
      asonancia = asonancia[0] + asonancia[asonancia.length - 1];
    }
    // Ajuste de la última vocal si ambas fueran acentuadas
    if (asonancia.length === 2) {
      const [v1, v2] = asonancia;
      if (vocalesRhymeAcentuadasRhyme.includes(v1) && vocalesRhymeAcentuadasRhyme.includes(v2)) {
        asonancia = v1 + deSiANoAcentuadasRhyme[v2];
      }
    }
  
    // (Opcional) Logs de comprobación
    console.log("Palabra normalizada: ", word);
    console.log("Posición de la vocal acentuada: ", posAcento);
    console.log("Rima consonante: ", consonante);
    console.log("Rima asonante: ", asonancia);
  
    // 7. Devuelve los datos de rima
    return {
      palabra: word,      // palabra ya normalizada
      posAcento,          // índice de la vocal acentuada
      consonante,         // rima consonante
      asonante: asonancia // rima asonante
    };
  }
  
  
  

  // Método auxiliar para obtener la rima de una palabra
  static getRhymes(word) {
    return SpanishRhymeAnnotator.getRhymeData(word);
  }

  /* --- Esquema de rima del poema --- */
  // Generador de etiquetas de rima (A, B, C, …, AA, AB, …)
  static createLabelGenerator() {
    let current = 0;
    return function nextLabel() {
      let label = "";
      let num = current;
      do {
        label = String.fromCharCode(65 + (num % 26)) + label;
        num = Math.floor(num / 26) - 1;
      } while (num >= 0);
      current++;
      return label;
    };
  }

  /**
   * Obtiene el esquema de rima de un poema.
   * Separa el poema en líneas, extrae la última palabra de cada línea y calcula su rima.
   * Luego, asigna etiquetas a las rimas que se repiten (se ignoran versos sin pareja).
   *
   * @param {string} poem - El poema completo (con saltos de línea).
   * @returns {object} { scheme: string, details: Array } donde "scheme" es la secuencia de etiquetas y "details" es el arreglo con los datos de cada línea.
   */
  static getRhymeScheme(poem) {
    // Separamos líneas y filtramos versos vacíos
    const lines = poem.split('\n').map(line => line.trim()).filter(line => line);
    const details = [];
    // Para cada línea, obtenemos la última palabra y su información de rima
    lines.forEach((line) => {
      const words = line.split(/\s+/);
      const lastWord = words[words.length - 1];
      // Normalizamos fonéticamente la palabra para rima
      const wordForRhyme = SpanishRhymeAnnotator.normalizeFonemas(lastWord);
      const rhymeData = SpanishRhymeAnnotator.getRhymes(wordForRhyme);
      // Conservamos también la palabra original para referencia
      rhymeData.palabraOriginal = lastWord.toLowerCase();
      details.push(rhymeData);
    });

    // Creamos el esquema de rima (un arreglo de la misma longitud que lines)
    const scheme = new Array(details.length).fill('');
    const labelGen = SpanishRhymeAnnotator.createLabelGenerator();
    const rhymeGroups = {}; // Aquí guardaremos la info de cada grupo etiquetado

    // Asignamos etiquetas basándonos en rima consonante (primero) y luego asonante
    for (let i = 0; i < details.length; i++) {
      if (scheme[i]) continue; // Ya asignado
      const current = details[i];

      // Buscamos versos que rimen consonantemente con el actual
      let groupConsonant = [];
      for (let j = i; j < details.length; j++) {
        if (details[j].consonante === current.consonante) {
          groupConsonant.push(j);
        }
      }
      if (groupConsonant.length >= 2) {
        const label = labelGen();
        groupConsonant.forEach(idx => (scheme[idx] = label));
        rhymeGroups[label] = {
          tipo: 'consonante',
          rima: current.consonante,
          versos: groupConsonant.map(idx => lines[idx])
        };
        continue;
      }

      // Si no hay grupo por consonancia, buscamos por asonancia
      let groupAsonant = [];
      for (let j = i; j < details.length; j++) {
        if (details[j].asonante === current.asonante) {
          groupAsonant.push(j);
        }
      }
      if (groupAsonant.length >= 2) {
        const label = labelGen();
        groupAsonant.forEach(idx => (scheme[idx] = label));
        rhymeGroups[label] = {
          tipo: 'asonante',
          rima: current.asonante,
          versos: groupAsonant.map(idx => lines[idx])
        };
        continue;
      }

      // Si el verso no rima con ningún otro, lo dejamos sin etiqueta (o lo marcamos con un guión)
      if (!scheme[i]) {
        scheme[i] = '-';
      }
    }

    return {
      scheme: scheme.join(''),
      details,
      groups: rhymeGroups
    };
  }
}

