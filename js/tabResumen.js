// js/tabResumen.js

import { generarTablaVersos, computeNumericStats, contarFrecuenciasCompuestas, contarRimasTipo, exportWithSheetJS } from './common.js';

/**
 * Genera y retorna un HTML con el resumen global (estadísticas de versos y sílabas) de un array de resultados.
 * @param {Object[]} results - Array de objetos con los análisis.
 * @returns {string} HTML con el resumen.
 */
export function renderResumenGlobal(results) {
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
  
  let html = "<h2>Resumen Global</h2>";
  html += "<h3>Versos por Fichero</h3>";
  html += `<table>
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

  html += "<h3>Sílabas Totales por Fichero</h3>";
  html += `<table>
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
  return html;
}

/**
 * Genera y retorna un HTML con resúmenes adicionales:
 * - Recursos Métricos (se cuenta usando la versión resumida)
 * - Detalle de Rima (se cuenta usando la versión resumida)
 * - Tipo de Rimas (Asonante vs Consonante)
 * @param {Object[]} results - Array de objetos con el análisis.
 * @returns {string} HTML con el resumen adicional.
 */
export function renderResumenAdicional(results) {
  // Recursos Métricos
  const resourceFreq = contarFrecuenciasCompuestas(results, "recursos", true);
  let resourceHtml = "<h3>Recursos Métricos</h3><table><thead><tr><th>Recurso</th><th>Conteo</th></tr></thead><tbody>";
  Object.keys(resourceFreq).forEach(res => {
    resourceHtml += `<tr><td>${res}</td><td>${resourceFreq[res]}</td></tr>`;
  });
  resourceHtml += "</tbody></table>";
  
  // Detalle de Rima
  const rhymeFreq = contarFrecuenciasCompuestas(results, "rhymeFragment", true);
  let rhymeHtml = "<h3>Detalle de Rima</h3><table><thead><tr><th>Detalle</th><th>Conteo</th></tr></thead><tbody>";
  Object.keys(rhymeFreq).forEach(det => {
    rhymeHtml += `<tr><td>${det}</td><td>${rhymeFreq[det]}</td></tr>`;
  });
  rhymeHtml += "</tbody></table>";
  
  // Tipo de Rimas (Asonante vs Consonante)
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
  return resourceHtml + rhymeHtml + tipoRimasHtml;
}

/**
 * Función para exportar los resultados usando SheetJS.
 * @param {Object[]} results - Array de objetos con los análisis.
 * @param {string} format - 'xlsx' o 'csv'.
 * @param {string} filename - Nombre base del archivo.
 */
export function exportResultados(results, format, filename) {
  exportWithSheetJS(results, format, filename);
}
