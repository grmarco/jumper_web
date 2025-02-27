// js/tabComparativa.js

import { 
    generarTablaVersos, 
    computeNumericStats, 
    contarFrecuencias, 
    renderChartComparado, 
    exportWithSheetJS,
    contarFrecuenciasCompuestas 
  } from './common.js';
  
  /**
   * Inicializa la pestaña de Comparativa de Lotes.
   */
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
      
      // Mostrar barra de progreso para comparativa
      compareProgressContainer.style.display = 'block';
      compareProgressBar.style.width = '0%';
      compareProgressText.textContent = "Procesando Corpus 1...";
      
      corpus1Results = await analyzeCorpusDetailed(files1);
      compareProgressText.textContent = "Procesando Corpus 2...";
      corpus2Results = await analyzeCorpusDetailed(files2);
      compareProgressText.textContent = "Procesamiento completado.";
      
      // Etiquetar resultados de cada corpus
      corpus1Results.forEach(r => r.corpus = "Corpus 1");
      corpus2Results.forEach(r => r.corpus = "Corpus 2");
      compareResultsExport = corpus1Results.concat(corpus2Results);
      
      // Calcular estadísticas de cada corpus y mostrar resumen
      const stats1 = computeCorpusStats(corpus1Results);
      const stats2 = computeCorpusStats(corpus2Results);
      renderComparisonStats(stats1, stats2, compareStatsContainer, compareSyllableContainer);
      
      // Renderizar tablas comparativas para Recursos Métricos y Detalle de Rima
      renderAdditionalComparisonStats(corpus1Results, corpus2Results, compareResourcesContainer, compareRhymeDetailContainer);
      
      // Comparativa de clasificación métrica:
      const freq1 = contarFrecuencias(corpus1Results, "clasificacion");
      const freq2 = contarFrecuencias(corpus2Results, "clasificacion");
      const ctx = chartClassifCompareCanvas.getContext('2d');
      renderChartComparado(ctx, freq1, freq2, "Corpus 1", "Corpus 2", "Clasificación Métrica");
      
      // Habilitar exportación de la comparativa
      exportFormatCompare.style.display = 'inline-block';
      exportCompareBtn.style.display = 'inline-block';
    });
  
    exportCompareBtn.addEventListener('click', function(event) {
      event.preventDefault();
      const format = exportFormatCompare.value;
      exportWithSheetJS(compareResultsExport, format, 'comparativa_lotes');
    });
    
    /**
     * Procesa un FileList y devuelve un array de resultados a nivel de verso.
     * @param {FileList} fileList 
     * @returns {Promise<Object[]>} Array de objetos con el análisis de cada verso.
     */
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
            // Incluimos detalles completos (por ejemplo, "Sinalefa (entre: palabra1 - palabra2)")
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
    
    /**
     * Agrupa los resultados por fichero y calcula estadísticas del corpus.
     * Retorna un objeto con estadísticas de número de versos y sílabas totales.
     * @param {Object[]} results 
     * @returns {Object} Estadísticas del corpus.
     */
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
     * Renderiza tablas comparativas de estadísticas (versos y sílabas) en los contenedores dados.
     * @param {Object} stats1 - Estadísticas del Corpus 1.
     * @param {Object} stats2 - Estadísticas del Corpus 2.
     * @param {HTMLElement} containerVerses - Contenedor para estadísticas de versos.
     * @param {HTMLElement} containerSyllables - Contenedor para estadísticas de sílabas.
     */
    function renderComparisonStats(stats1, stats2, containerVerses, containerSyllables) {
      let htmlVerses = `<h3>Estadísticas de Versos por Fichero</h3>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Corpus 1</th>
              <th>Corpus 2</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Media</td><td>${stats1.verses.avg}</td><td>${stats2.verses.avg}</td></tr>
            <tr><td>Desviación</td><td>${stats1.verses.std}</td><td>${stats2.verses.std}</td></tr>
            <tr><td>Mínimo</td><td>${stats1.verses.min}</td><td>${stats2.verses.min}</td></tr>
            <tr><td>25%</td><td>${stats1.verses.p25}</td><td>${stats2.verses.p25}</td></tr>
            <tr><td>50%</td><td>${stats1.verses.p50}</td><td>${stats2.verses.p50}</td></tr>
            <tr><td>75%</td><td>${stats1.verses.p75}</td><td>${stats2.verses.p75}</td></tr>
            <tr><td>Máximo</td><td>${stats1.verses.max}</td><td>${stats2.verses.max}</td></tr>
          </tbody>
        </table>`;
      containerVerses.innerHTML = htmlVerses;
    
      let htmlSyll = `<h3>Estadísticas de Sílabas Totales por Fichero</h3>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Corpus 1</th>
              <th>Corpus 2</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Media</td><td>${stats1.syllables.avg}</td><td>${stats2.syllables.avg}</td></tr>
            <tr><td>Desviación</td><td>${stats1.syllables.std}</td><td>${stats2.syllables.std}</td></tr>
            <tr><td>Mínimo</td><td>${stats1.syllables.min}</td><td>${stats2.syllables.min}</td></tr>
            <tr><td>25%</td><td>${stats1.syllables.p25}</td><td>${stats2.syllables.p25}</td></tr>
            <tr><td>50%</td><td>${stats1.syllables.p50}</td><td>${stats2.syllables.p50}</td></tr>
            <tr><td>75%</td><td>${stats1.syllables.p75}</td><td>${stats2.syllables.p75}</td></tr>
            <tr><td>Máximo</td><td>${stats1.syllables.max}</td><td>${stats2.syllables.max}</td></tr>
          </tbody>
        </table>`;
      containerSyllables.innerHTML = htmlSyll;
    }
    
    /**
     * Renderiza tablas comparativas para Recursos Métricos y Detalle de Rima en los contenedores dados.
     * Se muestran los detalles completos en la tabla, pero el conteo se realiza sobre la versión resumida.
     * @param {Object[]} corpus1Results 
     * @param {Object[]} corpus2Results 
     * @param {HTMLElement} containerResources 
     * @param {HTMLElement} containerRhyme 
     */
    function renderAdditionalComparisonStats(corpus1Results, corpus2Results, containerResources, containerRhyme) {
      // Recursos Métricos: se usa contarFrecuenciasCompuestas con resumir = true para el conteo.
      const resourceFreq1 = contarFrecuenciasCompuestas(corpus1Results, "recursos", true);
      const resourceFreq2 = contarFrecuenciasCompuestas(corpus2Results, "recursos", true);
      let resourceHtml = "<h3>Recursos Métricos</h3><table><thead><tr><th>Recurso</th><th>Corpus 1</th><th>Corpus 2</th></tr></thead><tbody>";
      const allResources = Array.from(new Set([...Object.keys(resourceFreq1), ...Object.keys(resourceFreq2)]));
      allResources.forEach(res => {
        resourceHtml += `<tr><td>${res}</td><td>${resourceFreq1[res] || 0}</td><td>${resourceFreq2[res] || 0}</td></tr>`;
      });
      resourceHtml += "</tbody></table>";
      containerResources.innerHTML = resourceHtml;
    
      // Detalle de Rima: se usa contarFrecuenciasCompuestas con resumir = true para el conteo.
      const rhymeFreq1 = contarFrecuenciasCompuestas(corpus1Results, "rhymeFragment", true);
      const rhymeFreq2 = contarFrecuenciasCompuestas(corpus2Results, "rhymeFragment", true);
      let rhymeHtml = "<h3>Detalle de Rima</h3><table><thead><tr><th>Detalle</th><th>Corpus 1</th><th>Corpus 2</th></tr></thead><tbody>";
      const allRhymes = Array.from(new Set([...Object.keys(rhymeFreq1), ...Object.keys(rhymeFreq2)]));
      allRhymes.forEach(det => {
        rhymeHtml += `<tr><td>${det}</td><td>${rhymeFreq1[det] || 0}</td><td>${rhymeFreq2[det] || 0}</td></tr>`;
      });
      rhymeHtml += "</tbody></table>";
      containerRhyme.innerHTML = rhymeHtml;
    }
    
  }
  
  export { initTabComparativa };
  