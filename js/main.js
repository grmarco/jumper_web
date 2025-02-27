// js/main.js

import { initTabIndividual } from './tabIndividual.js';
import { initTabLote } from './tabLote.js';
import { initTabComparativa } from './tabComparativa.js';

/**
 * Inicializa el comportamiento de las pestañas.
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tabs li');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Quitar la clase 'active' a todos los tabs y contenidos
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Activar el tab clicado y su contenido asociado
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');
    });
  });
}

/**
 * Función principal que inicializa la app.
 */
window.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTabIndividual();
  initTabLote();
  initTabComparativa();
});
