// js/tabIndividual.js

import { generarTablaVersos } from './common.js';
import { renderResumenGlobal, renderResumenAdicional, exportResultados } from './tabResumen.js';

function initTabIndividual() {
  const poemInput = document.getElementById('poemInput');
  const analyzeButton = document.getElementById('analyzeButton');
  const resultContainer = document.getElementById('resultContainer');
  const summaryContainer = document.getElementById('individualSummary');
  const exportFormatIndividual = document.getElementById('exportFormatIndividual');
  const exportButtonIndividual = document.getElementById('exportButtonIndividual');

  let individualResults = [];

  analyzeButton.addEventListener('click', () => {
    const poem = poemInput.value.trim();
    if (!poem) {
      alert("Por favor, introduce un poema para analizar.");
      return;
    }

    const metricAnalysis = escanearTexto(poem);
    const rhymeResult = SpanishRhymeAnnotator.getRhymeScheme(poem);
    const schemeArray = rhymeResult.scheme.split('');
    
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
      
      let recursosStr = "-";
      if (analysis.recursosMetricos && analysis.recursosMetricos.length > 0) {
        recursosStr = analysis.recursosMetricos.map(rec => {
          let detail = "";
          if (rec.entre) {
            detail = " (" + rec.entre + ")";
          } else if (rec.palabra) {
            detail = " (" + rec.palabra + ")";
          }
          return rec.tipo + detail;
        }).join(", ");
      }
      
      results.push({
        fileName: "",
        lineNumber: i + 1,
        versoOriginal: analysis.versoOriginal,
        silabas: analysis.silabas,
        acentos: analysis.acentos,
        clasificacion: analysis.clasificacion.nombre,
        recursos: recursosStr,
        rhymeLabel,
        rhymeType,
        rhymeFragment
      });
    }
    
    individualResults = results;
    resultContainer.innerHTML = generarTablaVersos(results);
    summaryContainer.innerHTML = renderResumenGlobal(results) + renderResumenAdicional(results);
  });

  exportButtonIndividual.addEventListener('click', (event) => {
    event.preventDefault();
    const format = exportFormatIndividual.value;
    exportResultados(individualResults, format, 'analisis_individual');
  });
}

export { initTabIndividual };
