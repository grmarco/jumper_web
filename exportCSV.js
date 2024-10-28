// exportCSV.js

/**
 * Función para convertir una tabla HTML a CSV
 * @param {HTMLTableElement} table - La tabla HTML que se desea convertir
 * @returns {string} - Cadena de texto en formato CSV
 */
function tableToCSV(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',');
    }).join('\n');
}

/**
 * Función para descargar un archivo dado su contenido y nombre
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo a descargar
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listener para el botón de exportar a CSV
document.getElementById('exportButton').addEventListener('click', () => {
    const table = document.querySelector('#results table');
    if (!table) {
        alert('No hay resultados para exportar.');
        return;
    }
    const csv = tableToCSV(table);
    downloadCSV(csv, 'analisis_metrico_poema.csv');
});
