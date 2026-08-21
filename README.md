# Jumper web

Escansión de poesía española en el navegador: **https://grmarco.github.io/jumper_web/**

Pega un poema y devuelve, verso a verso, la medida, los acentos, el tipo de
verso y el esquema de rima, con las sinalefas, sinéresis y diéresis dibujadas
como se dibujan en un manual y la cesura en su sitio. **Pincha en cualquier
verso** y se despliegan su numeración de sílabas, su ficha y las demás lecturas
que el algoritmo consideró, con la puntuación de cada una desglosada.

En **por lotes** se escande un corpus entero, un fichero por obra, y se descarga
la tabla en Excel o en CSV con una fila por verso.

## El algoritmo no está aquí

Esta web **no reimplementa** Jumper. Ejecuta `jumper.py` —el mismo fichero que se
distribuye en [grmarco/jumper](https://github.com/grmarco/jumper) y el mismo que
se evalúa contra los corpus anotados— dentro de CPython compilado a WebAssembly,
con [Pyodide](https://pyodide.org).

Esto no es una elección estética. Durante años el repositorio llevaba una
traducción del algoritmo a JavaScript, `metricAnalyzer.js` y `rhymeAnalyzer.js`,
50 KB que se quedaron en la versión de 2021 mientras el original seguía
mejorando: sin el dígrafo con tilde, sin la *h* intervocálica, sin el
desambiguador probabilístico, sin la norma de tonicidad. La página avisaba de que
era menos precisa —87 % frente a 95 %— y cada mejora futura habría habido que
hacerla dos veces. Con el motor de verdad dentro, la divergencia es imposible por
construcción.

El precio es la primera carga: unos megabytes de intérprete, un par de segundos,
y después queda en la caché del navegador. Cada verso se analiza en milisegundos.
No hay servidor, así que nada de lo que se escriba sale del ordenador de quien lo
escribe.

## Ficheros

| ruta | qué es |
|---|---|
| `jumper.py` | el motor, traído de `grmarco/jumper`. **No editar aquí** |
| `js/motor.js` | la fachada: carga Pyodide, mete `jumper.py` dentro y devuelve objetos JS |
| `js/notacion.js` | dibuja la escansión. Ni `~` ni `#` llegan a la pantalla |
| `js/app.js` | la portada: entrada, resultados, enlace compartible |
| `js/lote.js` | muchos ficheros a la vez, con su recuento |
| `js/tabla.js` | el análisis convertido en filas. Sin DOM, para poder probarlo |
| `js/xlsx.js` | escribe el `.xlsx` a mano: es un ZIP de XML, y así no hay CDN |
| `js/tema.js` | claro y oscuro, en las tres páginas |
| `js/estado.js` | los avisos: qué está cargando, qué se está calculando, qué ha caducado |
| `css/styles.css` | los estilos, con tema claro y oscuro |
| `lote.html` | el corpus entero, con exportación a Excel o CSV |
| `how-it-works.html` | cómo cuenta, cómo elige y qué precisión tiene |
| `test/conformidad.mjs` | la prueba que impide que esto vuelva a divergir |

## Pruebas

```bash
npm install        # sólo pyodide, y sólo para la prueba
npm test
```

`test/conformidad.mjs` pasa una lista de versos —uno por licencia métrica y uno
por cada caso que ha costado sangre alguna vez— por el motor del navegador y por
el Python del sistema, y exige que la salida sea **idéntica**. Pyodide corre
también fuera del navegador, así que la prueba no necesita ni navegador ni
Playwright.

Además, `.github/workflows/motor.yml` trae `jumper.py` del repositorio del motor
cada semana y abre un pull request si ha cambiado, sin fundirlo si la
conformidad falla.

## Despliegue

GitHub Pages publica `main` tal cual. No hay compilación: son ficheros estáticos
y un intérprete de Python que se descarga en el navegador.

## Servir en local

```bash
npm run serve      # http://localhost:8000
```

Hace falta un servidor: `jumper.py` se pide con `fetch`, y desde `file://` el
navegador lo bloquea.

---

Investigación del grupo de Procesamiento del Lenguaje Natural y Recuperación de
Información de la UNED: https://sites.google.com/view/nlp-uned/home
