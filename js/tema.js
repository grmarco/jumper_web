// tema.js — claro y oscuro
//
// Mientras nadie lo toque, la página sigue al sistema. En cuanto se elige, la
// elección manda y se recuerda. Se aplica antes de pintar para que no haya
// destello: por eso este módulo va en el <head>, no al final del <body>.

const raiz = document.documentElement;

const guardado = localStorage.getItem('tema');
if (guardado === 'claro' || guardado === 'oscuro') raiz.dataset.tema = guardado;

addEventListener('DOMContentLoaded', () => {
  const boton = document.querySelector('#tema');
  if (!boton) return;
  boton.addEventListener('click', () => {
    const oscuroAhora = raiz.dataset.tema
      ? raiz.dataset.tema === 'oscuro'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const elegido = oscuroAhora ? 'claro' : 'oscuro';
    raiz.dataset.tema = elegido;
    localStorage.setItem('tema', elegido);
  });
});
