// js/tabComparativa.js

import { generarTablaVersos, computeNumericStats, contarFrecuenciasCompuestas, contarRimasTipo, renderChartComparado, exportWithSheetJS } from './common.js';
import { renderResumenGlobal, renderResumenAdicional, exportResultados } from './tabResumen.js';

function initTabComparativa() {
  const fileInputCompare1 = document.getElementById('fileInputCompare1');
  const fileInputCompare2 = document.getElementById('fileInputCompare2');
  const analyzeCompareBtn = document.getElementById('analyzeCompareBtn');
  const compareProgressContainer = document.getElementById('compareProgressContainer');
  const compareProgressBar = document.getElementById('compareProgressBar');
  const compareProgressText = document.getElementById('compareProgressText');
  const compareStatsContainer = document.getElementById('compareStatsContainer');
  const compareSyllableContainer = document.getElementById('compareSyllableContainer');
  const compareResourcesContainer = document.getElementById('compareResourcesContainer');
  const compareRhymeDetailContainer = document.getElementById('compareRhymeDetailContainer');
  const chartClassifCompareCanvas = document.getElementById('chartClassifCompare');
  const exportFormatCompare = document.getElementById('exportFormatCompare');
  const exportCompareBtn = document.getElementById('exportCompareBtn');

  let compareResultsExport = [];
  let corpus1Results = [];
  let corpus2Results = [];

  analyzeCompareBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const files1 = fileInputCompare1.files;
    const files2 = fileInputCompare2.files;
    if (!files1.length || !files2.length) {
      alert("Selecciona archivos en ambos corpus.");
      return;
    }
    
    compareProgressContainer.style.display = 'block';
    compareProgressBar.style.width = '0%';
    compareProgressText.textContent = "Procesando Corpus 1...";
    
    corpus1Results = await analyzeCorpusDetailed(files1);
    compareProgressText.textContent = "Procesando Corpus 2...";
    corpus2Results = await analyzeCorpusDetailed(files2);
    compareProgressText.textContent = "Procesamiento completado.";
    
    corpus1Results.forEach(r => r.corpus = "Corpus 1");
    corpus2Results.forEach(r => r.corpus = "Corpus 2");
    compareResultsExport = corpus1Results.concat(corpus2Results);
    
    // Estadísticas globales para cada corpus:
    const stats1 = computeCorpusStats(corpus1Results);
    const stats2 = computeCorpusStats(corpus2Results);
    let htmlStats = "<h3>Estadísticas de Versos</h3>" + generateComparisonTable(stats1.verses, stats2.verses, "Versos");
    let htmlSyll = "<h3>Estadísticas de Sílabas</h3>" + generateComparisonTable(stats1.syllables, stats2.syllables, "Sílabas");
    compareStatsContainer.innerHTML = htmlStats;
    compareSyllableContainer.innerHTML = htmlSyll;
    
    // Estadísticas adicionales (Recursos Métricos y Detalle de Rima)
    renderAdditionalComparisonStats(corpus1Results, corpus2Results, compareResourcesContainer, compareRhymeDetailContainer);
    
    // Gráfico comparativo de clasificación métrica
    const freq1 = contarFrecuenciasCompuestas(corpus1Results, "clasificacion", false);
    const freq2 = contarFrecuenciasCompuestas(corpus2Results, "clasificacion", false);
    const ctx = chartClassifCompareCanvas.getContext('2d');
    renderChartComparado(ctx, freq1, freq2, "Corpus 1", "Corpus 2", "Clasificación Métrica");
    
    exportFormatCompare.style.display = 'inline-block';
    exportCompareBtn.style.display = 'inline-block';
  });

  exportCompareBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const format = exportFormatCompare.value;
    exportResultados(compareResultsExport, format, 'comparativa_lotes');
  });

  async function analyzeCorpusDetailed(fileList) {
    let results = [];
    let processed = 0;
    for (let file of fileList) {
      const text = await file.text();
      const metricAnalysis = escanearTexto(text);
      const rhymeResult = SpanishRhymeAnnotator.getRhymeScheme(text);
      const schemeArray = rhymeResult.scheme.split('');
      const numLines = Math.min(metricAnalysis.length, rhymeResult.details.length);
      for (let i = 0; i < numLines; i++) {
        const m = metricAnalysis[i];
        const rhymeLabel = schemeArray[i] || '-';
        let rhymeType = '-', rhymeFragment = '-';
        if (rhymeLabel !== '-' && rhymeResult.groups && rhymeResult.groups[rhymeLabel]) {
          rhymeType = rhymeResult.groups[rhymeLabel].tipo;
          rhymeFragment = rhymeResult.groups[rhymeLabel].rima;
        }
        let recursosStr = "-";
        if (m.recursosMetricos && m.recursosMetricos.length > 0) {
          recursosStr = m.recursosMetricos.map(rec => {
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
          corpus: "",
          fileName: file.name,
          lineNumber: i + 1,
          versoOriginal: m.versoOriginal,
          silabas: m.silabas,
          acentos: m.acentos,
          clasificacion: m.clasificacion.nombre,
          recursos: recursosStr,
          rhymeLabel: rhymeLabel,
          rhymeType: rhymeType,
          rhymeFragment: rhymeFragment
        });
      }
      processed++;
      compareProgressBar.style.width = ((processed / fileList.length) * 100) + '%';
    }
    return results;
  }

  function computeCorpusStats(results) {
    const group = {};
    results.forEach(item => {
      if (!group[item.fileName]) group[item.fileName] = [];
      group[item.fileName].push(item);
    });
    const verseCounts = [];
    const syllableTotals = [];
    for (let file in group) {
      const arr = group[file];
      verseCounts.push(arr.length);
      const totalSyll = arr.reduce((sum, item) => sum + item.silabas, 0);
      syllableTotals.push(totalSyll);
    }
    return {
      verses: computeNumericStats(verseCounts),
      syllables: computeNumericStats(syllableTotals)
    };
  }

  /**
   * Genera una tabla comparativa simple a partir de dos objetos de estadísticas.
   * @param {Object} stats1 - Estadísticas del primer corpus.
   * @param {Object} stats2 - Estadísticas del segundo corpus.
   * @param {string} label - Etiqueta de la métrica (ej. "Versos" o "Sílabas").
   * @returns {string} HTML de la tabla comparativa.
   */
  function generateComparisonTable(stats1, stats2, label) {
    return `<table>
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Corpus 1</th>
          <th>Corpus 2</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Media</td><td>${stats1.avg}</td><td>${stats2.avg}</td></tr>
        <tr><td>Desviación</td><td>${stats1.std}</td><td>${stats2.std}</td></tr>
        <tr><td>Mínimo</td><td>${stats1.min}</td><td>${stats2.min}</td></tr>
        <tr><td>25%</td><td>${stats1.p25}</td><td>${stats2.p25}</td></tr>
        <tr><td>50%</td><td>${stats1.p50}</td><td>${stats2.p50}</td></tr>
        <tr><td>75%</td><td>${stats1.p75}</td><td>${stats2.p75}</td></tr>
        <tr><td>Máximo</td><td>${stats1.max}</td><td>${stats2.max}</td></tr>
      </tbody>
    </table>`;
  }

  /**
   * Renderiza tablas adicionales para comparar Recursos Métricos y Detalle de Rima.
   * @param {Object[]} corpus1Results 
   * @param {Object[]} corpus2Results 
   * @param {HTMLElement} containerResources 
   * @param {HTMLElement} containerRhyme 
   */
  function renderAdditionalComparisonStats(corpus1Results, corpus2Results, containerResources, containerRhyme) {
    const resourceFreq1 = contarFrecuenciasCompuestas(corpus1Results, "recursos", true);
    const resourceFreq2 = contarFrecuenciasCompuestas(corpus2Results, "recursos", true);
    let resourceHtml = "<h3>Recursos Métricos</h3><table><thead><tr><th>Recurso</th><th>Corpus 1</th><th>Corpus 2</th></tr></thead><tbody>";
    const allResources = Array.from(new Set([...Object.keys(resourceFreq1), ...Object.keys(resourceFreq2)]));
    allResources.forEach(res => {
      resourceHtml += `<tr><td>${res}</td><td>${resourceFreq1[res] || 0}</td><td>${resourceFreq2[res] || 0}</td></tr>`;
    });
    resourceHtml += "</tbody></table>";
  
    const rhymeFreq1 = contarFrecuenciasCompuestas(corpus1Results, "rhymeFragment", true);
    const rhymeFreq2 = contarFrecuenciasCompuestas(corpus2Results, "rhymeFragment", true);
    let rhymeHtml = "<h3>Detalle de Rima</h3><table><thead><tr><th>Detalle</th><th>Corpus 1</th><th>Corpus 2</th></tr></thead><tbody>";
    const allRhymes = Array.from(new Set([...Object.keys(rhymeFreq1), ...Object.keys(rhymeFreq2)]));
    allRhymes.forEach(det => {
      rhymeHtml += `<tr><td>${det}</td><td>${rhymeFreq1[det] || 0}</td><td>${rhymeFreq2[det] || 0}</td></tr>`;
    });
    rhymeHtml += "</tbody></table>";
  
    const rimasTipo = contarRimasTipo(corpus1Results.concat(corpus2Results));
    let tipoRimasHtml = `<h3>Tipo de Rimas</h3>
       <table>
         <thead>
           <tr><th>Tipo</th><th>Conteo</th></tr>
         </thead>
         <tbody>
           <tr><td>Consonante</td><td>${rimasTipo.consonantes}</td></tr>
           <tr><td>Asonante</td><td>${rimasTipo.asonantes}</td></tr>
         </tbody>
       </table>`;
  
    containerResources.innerHTML = resourceHtml;
    containerRhyme.innerHTML = rhymeHtml + tipoRimasHtml;
  }

  exportCompareBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const format = exportFormatCompare.value;
    exportResultados(compareResultsExport, format, 'comparativa_lotes');
  });

  async function analyzeCorpusDetailed(fileList) {
    let results = [];
    let processed = 0;
    for (let file of fileList) {
      const text = await file.text();
      const metricAnalysis = escanearTexto(text);
      const rhymeResult = SpanishRhymeAnnotator.getRhymeScheme(text);
      const schemeArray = rhymeResult.scheme.split('');
      const numLines = Math.min(metricAnalysis.length, rhymeResult.details.length);
      for (let i = 0; i < numLines; i++) {
        const m = metricAnalysis[i];
        const rhymeLabel = schemeArray[i] || '-';
        let rhymeType = '-', rhymeFragment = '-';
        if (rhymeLabel !== '-' && rhymeResult.groups && rhymeResult.groups[rhymeLabel]) {
          rhymeType = rhymeResult.groups[rhymeLabel].tipo;
          rhymeFragment = rhymeResult.groups[rhymeLabel].rima;
        }
        let recursosStr = "-";
        if (m.recursosMetricos && m.recursosMetricos.length > 0) {
          recursosStr = m.recursosMetricos.map(rec => {
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
          corpus: "",
          fileName: file.name,
          lineNumber: i + 1,
          versoOriginal: m.versoOriginal,
          silabas: m.silabas,
          acentos: m.acentos,
          clasificacion: m.clasificacion.nombre,
          recursos: recursosStr,
          rhymeLabel: rhymeLabel,
          rhymeType: rhymeType,
          rhymeFragment: rhymeFragment
        });
      }
      processed++;
      compareProgressBar.style.width = ((processed / fileList.length) * 100) + '%';
    }
    return results;
  }

  function computeCorpusStats(results) {
    const group = {};
    results.forEach(item => {
      if (!group[item.fileName]) group[item.fileName] = [];
      group[item.fileName].push(item);
    });
    const verseCounts = [];
    const syllableTotals = [];
    for (let file in group) {
      const arr = group[file];
      verseCounts.push(arr.length);
      const totalSyll = arr.reduce((sum, item) => sum + item.silabas, 0);
      syllableTotals.push(totalSyll);
    }
    return {
      verses: computeNumericStats(verseCounts),
      syllables: computeNumericStats(syllableTotals)
    };
  }

  /**
   * Genera una tabla comparativa simple a partir de dos objetos de estadísticas.
   * @param {Object} stats1 - Estadísticas del primer corpus.
   * @param {Object} stats2 - Estadísticas del segundo corpus.
   * @param {string} label - Etiqueta de la métrica (ej. "Versos" o "Sílabas").
   * @returns {string} HTML de la tabla comparativa.
   */
  function generateComparisonTable(stats1, stats2, label) {
    return `<table>
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Corpus 1</th>
          <th>Corpus 2</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Media</td><td>${stats1.avg}</td><td>${stats2.avg}</td></tr>
        <tr><td>Desviación</td><td>${stats1.std}</td><td>${stats2.std}</td></tr>
        <tr><td>Mínimo</td><td>${stats1.min}</td><td>${stats2.min}</td></tr>
        <tr><td>25%</td><td>${stats1.p25}</td><td>${stats2.p25}</td></tr>
        <tr><td>50%</td><td>${stats1.p50}</td><td>${stats2.p50}</td></tr>
        <tr><td>75%</td><td>${stats1.p75}</td><td>${stats2.p75}</td></tr>
        <tr><td>Máximo</td><td>${stats1.max}</td><td>${stats2.max}</td></tr>
      </tbody>
    </table>`;
  }

  // Renderiza las estadísticas comparativas para Versos y Sílabas
  const corpusStats = computeCorpusStats(compareResultsExport);
  compareStatsContainer.innerHTML = "<h3>Estadísticas de Versos</h3>" + generateComparisonTable(corpusStats.verses, corpusStats.verses, "Versos");
  compareSyllableContainer.innerHTML = "<h3>Estadísticas de Sílabas</h3>" + generateComparisonTable(corpusStats.syllables, corpusStats.syllables, "Sílabas");
  
  exportCompareBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const format = exportFormatCompare.value;
    exportResultados(compareResultsExport, format, 'comparativa_lotes');
  });
}

export { initTabComparativa };
