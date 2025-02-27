// js/tabIndividual.js

import { generarTablaVersos } from './common.js';

/**
 * Inicializa la pestaña de Análisis Individual.
 * Lee el poema ingresado, lo analiza y muestra los resultados en forma de tabla.
 */
function initTabIndividual() {
  const poemInput = document.getElementById('poemInput');
  const analyzeButton = document.getElementById('analyzeButton');
  const resultContainer = document.getElementById('resultContainer');
  
  // Variable para almacenar resultados (útil para exportar, si fuera necesario)
  let individualResults = [];

  analyzeButton.addEventListener('click', () => {
    const poem = poemInput.value.trim();
    if (!poem) {
      alert("Por favor, introduce un poema para analizar.");
      return;
    }

    // Llamadas a funciones de análisis:
    // Se asume que escanearTexto devuelve un array de análisis, uno por verso.
    const metricAnalysis = escanearTexto(poem);
    // Se asume que SpanishRhymeAnnotator.getRhymeScheme devuelve un objeto con:
    // scheme (string), details (array) y groups (objeto)
    const rhymeResult = SpanishRhymeAnnotator.getRhymeScheme(poem);
    const schemeArray = rhymeResult.scheme.split('');
    
    // Se crea un array de resultados que combine la métrica y la rima por línea.
    const results = [];
    const numLines = Math.min(metricAnalysis.length, rhymeResult.details.length);
    for (let i = 0; i < numLines; i++) {
      const analysis = metricAnalysis[i];
      const rhymeLabel = schemeArray[i] || '-';
      let rhymeType = '-', rhymeFragment = '-';
      if (rhymeLabel !== '-' && rhymeResult.groups && rhymeResult.groups[rhymeLabel]) {
        rhymeType = rhymeResult.groups[rhymeLabel].tipo;
        rhymeFragment = rhymeResult.groups[rhymeLabel].rima;
      }
      
      results.push({
        fileName: "", // En análisis individual no hay fichero asociado
        lineNumber: i + 1,
        versoOriginal: analysis.versoOriginal,
        silabas: analysis.silabas,
        acentos: analysis.acentos,
        clasificacion: analysis.clasificacion.nombre,
        // Extraemos solo el tipo del recurso para resumir (ejemplo: "Sinalefa")
        recursos: analysis.recursosMetricos ? analysis.recursosMetricos.map(rec => rec.tipo).join(", ") : "-",
        rhymeLabel,
        rhymeType,
        rhymeFragment
      });
    }
    
    individualResults = results;
    // Se genera la tabla utilizando la función común
    resultContainer.innerHTML = generarTablaVersos(results);
  });
}

export { initTabIndividual };
