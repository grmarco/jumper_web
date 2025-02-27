// js/tabLote.js

import { 
  generarTablaVersos, 
  computeNumericStats, 
  exportWithSheetJS,
  contarFrecuenciasCompuestas,
  contarRimasTipo
} from './common.js';

function initTabLote() {
  const fileInput = document.getElementById('fileInput');
  const analyzeAllBtn = document.getElementById('analyzeAllBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const statsContainer = document.getElementById('statsContainer');
  const extraStatsContainer = document.getElementById('extraStatsContainer');
  const batchResultContainer = document.getElementById('batchResultContainer');
  const exportFormatBatch = document.getElementById('exportFormatBatch');
  const exportBatchBtn = document.getElementById('exportBatchBtn');

  let totalFiles = 0;
  let processedFiles = 0;
  let startTime = 0;
  let batchResults = [];

  analyzeAllBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Selecciona uno o varios ficheros .txt para analizar.");
      return;
    }
    totalFiles = fileInput.files.length;
    processedFiles = 0;
    startTime = Date.now();
    batchResults = [];
    
    // Ocultar las opciones de exportación al iniciar
    exportFormatBatch.style.display = 'none';
    exportBatchBtn.style.display = 'none';

    // Mostrar la barra de progreso y limpiar contenedores
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = "Progreso: 0%";
    statsContainer.innerHTML = "";
    extraStatsContainer.innerHTML = "";
    batchResultContainer.innerHTML = "";

    // Procesar cada fichero
    for (let i = 0; i < totalFiles; i++) {
      const file = fileInput.files[i];
      const text = await file.text();
      
      // Se asume que escanearTexto y SpanishRhymeAnnotator.getRhymeScheme están definidos globalmente
      const metricAnalysis = escanearTexto(text);
      const rhymeResult = SpanishRhymeAnnotator.getRhymeScheme(text);
      const schemeArray = rhymeResult.scheme.split('');
      const numLines = Math.min(metricAnalysis.length, rhymeResult.details.length);
      
      for (let j = 0; j < numLines; j++) {
        const analysis = metricAnalysis[j];
        const rhymeLabel = schemeArray[j] || '-';
        let rhymeType = '-', rhymeFragment = '-';
        if (rhymeLabel !== '-' && rhymeResult.groups && rhymeResult.groups[rhymeLabel]) {
          rhymeType = rhymeResult.groups[rhymeLabel].tipo;
          rhymeFragment = rhymeResult.groups[rhymeLabel].rima;
        }
        // Generar la cadena de recursos con todos los detalles:
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
        
        batchResults.push({
          corpus: "Corpus Único",
          fileName: file.name,
          lineNumber: j + 1,
          versoOriginal: analysis.versoOriginal,
          silabas: analysis.silabas,
          acentos: analysis.acentos,
          clasificacion: analysis.clasificacion.nombre,
          recursos: recursosStr,
          rhymeLabel: rhymeLabel,
          rhymeType: rhymeType,
          rhymeFragment: rhymeFragment
        });
      }
      processedFiles++;
      updateProgress();
    }
    
    // Mostrar el resumen global y los resúmenes adicionales
    renderGlobalStats(batchResults);
    renderAdditionalStats(batchResults);
    // Mostrar la tabla completa de resultados
    batchResultContainer.innerHTML = generarTablaVersos(batchResults);
    
    // Renderizar gráficos en los canvas
    renderChartRima(batchResults);
    renderChartVerso(batchResults);
    
    // Mostrar la opción de exportación
    exportFormatBatch.style.display = 'inline-block';
    exportBatchBtn.style.display = 'inline-block';
  });

  function updateProgress() {
    const percent = (processedFiles / totalFiles) * 100;
    progressBar.style.width = percent + '%';
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = processedFiles > 0 ? (elapsed / processedFiles) * (totalFiles - processedFiles) : 0;
    progressText.textContent = `Progreso: ${percent.toFixed(1)}% | Tiempo transcurrido: ${elapsed.toFixed(1)}s | Tiempo restante estimado: ${remaining.toFixed(1)}s`;
  }

  /**
   * Agrupa los resultados por fichero y calcula estadísticas globales:
   * - Número de versos por fichero.
   * - Total de sílabas por fichero.
   */
  function renderGlobalStats(results) {
    const filesGroup = {};
    results.forEach(item => {
      if (!filesGroup[item.fileName]) {
        filesGroup[item.fileName] = [];
      }
      filesGroup[item.fileName].push(item);
    });

    const verseCounts = [];
    const syllableTotals = [];
    for (let file in filesGroup) {
      const group = filesGroup[file];
      verseCounts.push(group.length);
      const totalSyll = group.reduce((sum, item) => sum + item.silabas, 0);
      syllableTotals.push(totalSyll);
    }
    
    const verseStats = computeNumericStats(verseCounts);
    const syllStats = computeNumericStats(syllableTotals);
    
    let statsHtml = "<h2>Resumen Global</h2>";
    statsHtml += "<h3>Versos por Fichero</h3>";
    statsHtml += `<table>
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Media</th>
          <th>Desviación</th>
          <th>Mínimo</th>
          <th>25%</th>
          <th>50%</th>
          <th>75%</th>
          <th>Máximo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Versos</td>
          <td>${verseStats.avg}</td>
          <td>${verseStats.std}</td>
          <td>${verseStats.min}</td>
          <td>${verseStats.p25}</td>
          <td>${verseStats.p50}</td>
          <td>${verseStats.p75}</td>
          <td>${verseStats.max}</td>
        </tr>
      </tbody>
    </table>`;

    statsHtml += "<h3>Sílabas Totales por Fichero</h3>";
    statsHtml += `<table>
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Media</th>
          <th>Desviación</th>
          <th>Mínimo</th>
          <th>25%</th>
          <th>50%</th>
          <th>75%</th>
          <th>Máximo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Sílabas</td>
          <td>${syllStats.avg}</td>
          <td>${syllStats.std}</td>
          <td>${syllStats.min}</td>
          <td>${syllStats.p25}</td>
          <td>${syllStats.p50}</td>
          <td>${syllStats.p75}</td>
          <td>${syllStats.max}</td>
        </tr>
      </tbody>
    </table>`;
    
    statsContainer.innerHTML = statsHtml;
  }

  /**
   * Renderiza resúmenes adicionales para:
   * - Recursos Métricos y Detalle de Rima (usando contarFrecuenciasCompuestas)
   * - Tipo de Rimas (Asonante vs Consonante)
   */
  function renderAdditionalStats(results) {
    // Recursos Métricos: se usa contarFrecuenciasCompuestas con resumir = true
    const resourceFreq = contarFrecuenciasCompuestas(results, "recursos", true);
    let resourceHtml = "<h3>Recursos Métricos</h3><table><thead><tr><th>Recurso</th><th>Conteo</th></tr></thead><tbody>";
    Object.keys(resourceFreq).forEach(res => {
      resourceHtml += `<tr><td>${res}</td><td>${resourceFreq[res]}</td></tr>`;
    });
    resourceHtml += "</tbody></table>";
  
    // Detalle de Rima: se usa contarFrecuenciasCompuestas con resumir = true
    const rhymeFreq = contarFrecuenciasCompuestas(results, "rhymeFragment", true);
    let rhymeHtml = "<h3>Detalle de Rima</h3><table><thead><tr><th>Detalle</th><th>Conteo</th></tr></thead><tbody>";
    Object.keys(rhymeFreq).forEach(det => {
      rhymeHtml += `<tr><td>${det}</td><td>${rhymeFreq[det]}</td></tr>`;
    });
    rhymeHtml += "</tbody></table>";
  
    // Tipo de Rimas: asonante vs consonante
    const rimasTipo = contarRimasTipo(results);
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
  
    extraStatsContainer.innerHTML = resourceHtml + rhymeHtml + tipoRimasHtml;
  }

  /**
   * Renderiza un gráfico de pastel en el canvas "chartRima" que muestra la distribución
   * del detalle de rima (usando el campo "rhymeFragment", contado de forma resumida).
   * @param {Object[]} results 
   */
  function renderChartRima(results) {
    const ctx = document.getElementById('chartRima').getContext('2d');
    const rhymeFreq = contarFrecuenciasCompuestas(results, "rhymeFragment", true);
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(rhymeFreq),
        datasets: [{
          data: Object.values(rhymeFreq),
          backgroundColor: generateColors(Object.keys(rhymeFreq).length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Distribución de Detalle de Rima' },
          legend: { position: 'bottom' }
        }
      }
    });
  }

  /**
   * Renderiza un gráfico de barras horizontal en el canvas "chartVerso" que muestra el número
   * de versos por fichero.
   * @param {Object[]} results 
   */
  function renderChartVerso(results) {
    const ctx = document.getElementById('chartVerso').getContext('2d');
    const group = {};
    results.forEach(item => {
      if (!group[item.fileName]) group[item.fileName] = 0;
      group[item.fileName]++;
    });
    const labels = Object.keys(group);
    const data = Object.values(group);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Número de Versos',
          data: data,
          backgroundColor: generateColors(labels.length)
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: { display: true, text: 'Versos por Fichero' },
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Función auxiliar para generar una cantidad "n" de colores pastel usando HSL.
   * @param {number} n - Número de colores a generar.
   * @returns {string[]} Array de colores en formato HSL.
   */
  function generateColors(n) {
    const colors = [];
    for (let i = 0; i < n; i++) {
      const hue = Math.floor(360 * i / n);
      colors.push(`hsl(${hue}, 70%, 70%)`);
    }
    return colors;
  }

  // Exportar resultados al hacer clic en el botón de exportación
  exportBatchBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const format = exportFormatBatch.value;
    exportWithSheetJS(batchResults, format, 'analisis_metrica_rimas_lote');
  });

  // Exponer resultados para exportación global, si se requiere
  window.batchResultsExport = batchResults;
}

export { initTabLote };
