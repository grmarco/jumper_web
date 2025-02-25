/**
 * Combina el análisis de métrica y rima en una única tabla.
 * Se asume que ambos análisis corresponden al mismo poema y que
 * los versos se encuentran en el mismo orden.
 *
 * @param {Object[]} analisisMetrica - Array con los datos métricos por verso.
 * @param {Object} analisisRima - Objeto con el esquema de rima y detalles por verso.
 */
function mostrarAnalisisUnificado(analisisMetrica, analisisRima) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "";
  
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
  
    // Encabezados de la tabla
    const headers = [
      "Número", "Verso", "Sílabas", "Acentos", "Tipo Métrica",
      "Recursos Métricos", "Rima Consonante", "Rima Asonante", "Etiqueta de Rima"
    ];
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.style.border = "1px solid #ccc";
      th.style.padding = "5px";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
  
    // Suponemos que analisisMetrica es un array con un objeto por verso
    // y analisisRima.details es un array de la misma longitud con información de rima.
    for (let i = 0; i < analisisMetrica.length; i++) {
      const metrica = analisisMetrica[i];
      const rima = analisisRima.details[i] || {};
  
      const row = document.createElement("tr");
  
      // Columna: Número de verso
      const cellNum = document.createElement("td");
      cellNum.textContent = i + 1;
      cellNum.style.border = "1px solid #ccc";
      cellNum.style.padding = "5px";
      row.appendChild(cellNum);
  
      // Columna: Verso
      const cellVerso = document.createElement("td");
      cellVerso.textContent = metrica.versoOriginal;
      cellVerso.style.border = "1px solid #ccc";
      cellVerso.style.padding = "5px";
      row.appendChild(cellVerso);
  
      // Columna: Sílabas
      const cellSilabas = document.createElement("td");
      cellSilabas.textContent = metrica.silabas;
      cellSilabas.style.border = "1px solid #ccc";
      cellSilabas.style.padding = "5px";
      row.appendChild(cellSilabas);
  
      // Columna: Acentos
      const cellAcentos = document.createElement("td");
      cellAcentos.textContent = metrica.acentos.join(", ");
      cellAcentos.style.border = "1px solid #ccc";
      cellAcentos.style.padding = "5px";
      row.appendChild(cellAcentos);
  
      // Columna: Tipo Métrica
      const cellTipo = document.createElement("td");
      cellTipo.textContent = metrica.clasificacion ? metrica.clasificacion.nombre : "";
      cellTipo.style.border = "1px solid #ccc";
      cellTipo.style.padding = "5px";
      row.appendChild(cellTipo);
  
      // Columna: Recursos Métricos (por ejemplo, sinalefas, diéresis)
      const cellRecursos = document.createElement("td");
      if (metrica.recursosMetricos && metrica.recursosMetricos.length > 0) {
        cellRecursos.textContent = metrica.recursosMetricos
          .map(r => r.tipo + (r.entre ? ` (${r.entre})` : r.palabra ? ` (${r.palabra})` : ""))
          .join(" | ");
      } else {
        cellRecursos.textContent = "Ninguno";
      }
      cellRecursos.style.border = "1px solid #ccc";
      cellRecursos.style.padding = "5px";
      row.appendChild(cellRecursos);
  
      // Columna: Rima Consonante
      const cellRimaCons = document.createElement("td");
      cellRimaCons.textContent = rima.consonante || "";
      cellRimaCons.style.border = "1px solid #ccc";
      cellRimaCons.style.padding = "5px";
      row.appendChild(cellRimaCons);
  
      // Columna: Rima Asonante
      const cellRimaAso = document.createElement("td");
      cellRimaAso.textContent = rima.asonante || "";
      cellRimaAso.style.border = "1px solid #ccc";
      cellRimaAso.style.padding = "5px";
      row.appendChild(cellRimaAso);
  
      // Columna: Etiqueta de Rima (tomada del esquema general)
      const cellEtiqueta = document.createElement("td");
      // Suponemos que analisisRima.scheme es una cadena en la que cada carácter corresponde a un verso.
      cellEtiqueta.textContent = analisisRima.scheme ? analisisRima.scheme[i] : "-";
      cellEtiqueta.style.border = "1px solid #ccc";
      cellEtiqueta.style.padding = "5px";
      row.appendChild(cellEtiqueta);
  
      tbody.appendChild(row);
    }
  
    table.appendChild(tbody);
    resultsDiv.appendChild(table);
  }
  