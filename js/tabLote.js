// js/tabLote.js

import { 
  generarTablaVersos, 
  computeNumericStats, 
  exportWithSheetJS, 
  contarFrecuenciasCompuestas, 
  contarRimasTipo 
} from './common.js';
import { renderResumenGlobal, renderResumenAdicional, exportResultados } from './tabResumen.js';

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
    
    // Ocultar exportación al iniciar
    exportFormatBatch.style.display = 'none';
    exportBatchBtn.style.display = 'none';

    // Limpiar contenedores y mostrar barra de progreso
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = "Progreso: 0%";
    statsContainer.innerHTML = "";
    extraStatsContainer.innerHTML = "";
    batchResultContainer.innerHTML = "";

    // Procesamos cada fichero
    for (let i = 0; i < totalFiles; i++) {
      const file = fileInput.files[i];
      const text = await file.text();
      
      // Se asume que las funciones escanearTexto y SpanishRhymeAnnotator.getRhymeScheme están definidas globalmente.
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
        // Construir recursos con detalles completos.
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
    
    // Si se han subido 100 o menos archivos, se generan las tablas y gráficos.
    if (totalFiles <= 100) {
      statsContainer.innerHTML = renderResumenGlobal(batchResults);
      extraStatsContainer.innerHTML = renderResumenAdicional(batchResults);
      batchResultContainer.innerHTML = generarTablaVersos(batchResults);
      
      // Renderizar gráficos en los canvas
      renderChartRima(batchResults);
      renderChartVerso(batchResults);
    } else {
      // Si hay más de 100 archivos, se omite la generación de tablas y gráficos
      statsContainer.innerHTML = "<p>Se han procesado más de 100 archivos, la generación de tablas y gráficos se ha omitido por motivos de rendimiento.</p>";
      extraStatsContainer.innerHTML = "";
      batchResultContainer.innerHTML = "";
    }
    
    // Mostrar opciones de exportación en ambos casos
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
   * Renderiza un gráfico de pastel en el canvas "chartRima" mostrando la distribución de detalle de rima.
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
   * Renderiza un gráfico de barras horizontal en el canvas "chartVerso" mostrando el número de versos por fichero.
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
   * Función auxiliar para generar colores.
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

  exportBatchBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const format = exportFormatBatch.value;
    exportResultados(batchResults, format, 'analisis_metrica_rimas_lote');
  });
  
  // Exponer resultados globalmente para exportación, si se requiere.
  window.batchResultsExport = batchResults;
}

export { initTabLote };
