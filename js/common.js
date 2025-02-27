/**
 * common.js
 * 
 * Este módulo contiene funciones reutilizables en varias partes de la aplicación.
 * Funciones incluidas:
 *  - generarTablaVersos: Crea una tabla HTML a partir de un array de objetos (versos analizados).
 *  - contarFrecuencias: Cuenta la frecuencia de valores de un campo en un array de objetos.
 *  - renderChartComparado: Renderiza un gráfico de barras comparativo entre dos frecuencias.
 *  - computeNumericStats: Calcula estadísticas numéricas (media, desviación estándar, percentiles, etc.)
 */

/**
 * Genera una tabla HTML a partir de un array de objetos con datos de versos.
 * @param {Object[]} data - Array de objetos. Cada objeto representa un verso con sus propiedades.
 * @returns {string} HTML de la tabla generada.
 */
export function generarTablaVersos(data) {
    let html = `<table class='tablaVersos'>
      <thead>
        <tr>
          <th>Fichero</th>
          <th>Línea</th>
          <th>Verso</th>
          <th>Sílabas</th>
          <th>Acentos</th>
          <th>Clasificación Métrica</th>
          <th>Recursos Métricos</th>
          <th>Etiqueta de Rima</th>
          <th>Tipo de Rima</th>
          <th>Detalle de Rima</th>
        </tr>
      </thead>
      <tbody>`;
    
    data.forEach(item => {
      html += `<tr>
        <td>${item.fileName || ''}</td>
        <td>${item.lineNumber || ''}</td>
        <td>${item.versoOriginal || ''}</td>
        <td>${item.silabas || ''}</td>
        <td>${(item.acentos || []).join(", ")}</td>
        <td>${item.clasificacion || ''}</td>
        <td>${item.recursos || ''}</td>
        <td>${item.rhymeLabel || ''}</td>
        <td>${item.rhymeType || ''}</td>
        <td>${item.rhymeFragment || ''}</td>
      </tr>`;
    });
  
    html += `</tbody>
    </table>`;
    return html;
  }
  
  /**
   * Cuenta la frecuencia de un determinado campo en un array de objetos.
   * @param {Object[]} data - Array de objetos.
   * @param {string} campo - Nombre del campo a analizar.
   * @returns {Object} Objeto con la frecuencia de cada valor (ejemplo: { "Sinalefa": 5, "Dialefa": 3 }).
   */
  export function contarFrecuencias(data, campo) {
    const freq = {};
    data.forEach(item => {
      const val = item[campo];
      if (val && val !== "-" && val !== undefined) {
        freq[val] = (freq[val] || 0) + 1;
      }
    });
    return freq;
  }
  

/**
 * Función auxiliar para contar frecuencias en campos compuestos (por ejemplo, recursos o detalles de rima)
 * donde el valor es una cadena con varios elementos separados por coma.
 * @param {Object[]} results - Array de resultados.
 * @param {string} campo - El campo a procesar.
 * @param {boolean} resumir - Si true, extrae solo la parte antes de " (" (por ejemplo, "Sinalefa" de "Sinalefa (detalle)").
 * @returns {Object} Objeto con la frecuencia de cada valor.
 */
export function contarFrecuenciasCompuestas(results, campo, resumir = false) {
  const freq = {};
  results.forEach(item => {
    const val = item[campo];
    if (val && val !== "-") {
      // Separamos por comas y eliminamos espacios vacíos
      let partes = val.split(",").map(s => s.trim()).filter(s => s !== "");
      // Si se solicita la versión resumida, quitar lo que esté entre paréntesis
      if (resumir) {
        partes = partes.map(p => {
          const idx = p.indexOf(" (");
          return idx !== -1 ? p.substring(0, idx).trim() : p;
        });
      }
      partes.forEach(p => {
        freq[p] = (freq[p] || 0) + 1;
      });
    }
  });
  return freq;
}


  /**
   * Renderiza un gráfico de barras comparativo entre dos conjuntos de frecuencias.
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas donde se dibuja el gráfico.
   * @param {Object} freq1 - Objeto de frecuencias para el primer conjunto.
   * @param {Object} freq2 - Objeto de frecuencias para el segundo conjunto.
   * @param {string} label1 - Etiqueta para el primer conjunto.
   * @param {string} label2 - Etiqueta para el segundo conjunto.
   * @param {string} chartTitle - Título del gráfico.
   */
  export function renderChartComparado(ctx, freq1, freq2, label1, label2, chartTitle) {
    // Unimos las etiquetas de ambos conjuntos y las ordenamos por uso total (descendente)
    const allLabels = Array.from(new Set([...Object.keys(freq1), ...Object.keys(freq2)]));
    allLabels.sort((a, b) => ((freq2[b] || 0) + (freq1[b] || 0)) - ((freq2[a] || 0) + (freq1[a] || 0)));
    
    const data1 = allLabels.map(label => freq1[label] || 0);
    const data2 = allLabels.map(label => freq2[label] || 0);
  
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: label1,
            data: data1,
            backgroundColor: '#3498db'
          },
          {
            label: label2,
            data: data2,
            backgroundColor: '#e67e22'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: chartTitle },
          legend: { position: 'bottom' }
        },
        scales: {
          x: {
            ticks: { autoSkip: false }
          }
        }
      }
    });
  }
  
  /**
   * Calcula estadísticas numéricas básicas a partir de un array de números.
   * @param {number[]} values - Array de valores numéricos.
   * @returns {Object} Objeto con media, desviación estándar, mínimo, percentiles (25, 50, 75) y máximo.
   */
  export function computeNumericStats(values) {
    // Ordenamos los valores en orden ascendente
    values.sort((a, b) => a - b);
    const n = values.length;
    const avg = values.reduce((acc, val) => acc + val, 0) / n;
    const std = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((acc, val) => acc + val, 0) / n);
    
    // Función para calcular percentil (p en [0,1])
    function percentile(p) {
      const index = Math.floor(p * (n - 1));
      return values[index];
    }
    
    return {
      avg: avg.toFixed(2),
      std: std.toFixed(2),
      min: values[0],
      p25: percentile(0.25),
      p50: percentile(0.50),
      p75: percentile(0.75),
      max: values[n - 1]
    };
  }
  
/**
 * Exporta un array de objetos a un archivo Excel (.xlsx) o CSV (.csv) usando SheetJS.
 * @param {Object[]} data - Array de objetos con los datos a exportar.
 * @param {string} format - 'xlsx' o 'csv'.
 * @param {string} filename - Nombre base del archivo (sin extensión).
 */
export function exportWithSheetJS(data, format, filename) {
  // Mapear los datos asegurando que cada campo tenga un valor (para evitar undefined)
  const dataToExport = data.map(item => ({
    "Corpus": item.corpus || '',
    "Fichero": item.fileName || '',
    "Línea": item.lineNumber || '',
    "Verso": item.versoOriginal || '',
    "Sílabas": item.silabas || '',
    "Acentos": (item.acentos || []).join(", "),
    "Clasificación Métrica": item.clasificacion || '',
    "Recursos Métricos": item.recursos || '',
    "Etiqueta de Rima": item.rhymeLabel || '',
    "Tipo de Rima": item.rhymeType || '',
    "Detalle de Rima": item.rhymeFragment || ''
  }));

  // Crear una hoja de cálculo a partir del array de objetos
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  // Crear un libro (workbook) nuevo y añadir la hoja creada
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Análisis");

  // Generar el nombre final del archivo con la extensión correspondiente
  let finalName = filename || 'analisis_metrica_rimas';
  if (format === 'xlsx') {
    finalName += '.xlsx';
    XLSX.writeFile(workbook, finalName);
  } else if (format === 'csv') {
    finalName += '.csv';
    XLSX.writeFile(workbook, finalName, { bookType: "csv" });
  }
}

/**
 * Cuenta la cantidad de rimas asonantes y consonantes en un array de resultados.
 * Se analiza el campo "rhymeType" (convertido a minúsculas) para determinar el tipo.
 * @param {Object[]} results - Array de resultados.
 * @returns {Object} Objeto con propiedades { consonantes, asonantes }.
 */
export function contarRimasTipo(results) {
  let consonantes = 0;
  let asonantes = 0;
  results.forEach(item => {
    if (item.rhymeType) {
      const tipo = item.rhymeType.toLowerCase();
      if (tipo.includes('consonante')) {
        consonantes++;
      } else if (tipo.includes('asonante')) {
        asonantes++;
      }
    }
  });
  return { consonantes, asonantes };
}
