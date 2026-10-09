# Jumper web

Interfaz web de Jumper, un algoritmo de escansión automática de poesía española:
**https://grmarco.github.io/jumper_web/**

Para cada verso, la web muestra la medida, los acentos, el tipo de verso y las
licencias métricas (sinalefa, sinéresis, diéresis), además de la cesura de los
versos compuestos. Para cada poema muestra el esquema de rima y la forma
estrófica. Al seleccionar un verso se despliegan su numeración silábica, su rima
(palabra rimante, terminaciones consonante y asonante, versos del mismo grupo) y
las lecturas alternativas consideradas, con el desglose de su puntuación.

Las fusiones vocálicas se marcan con una ligadura entre las dos vocales
afectadas, en la posición que indica el motor.

La página **Por lotes** analiza un corpus completo, un fichero por obra, y
exporta los resultados en Excel o CSV, con una fila por verso.

## Motor

Esta web no reimplementa el algoritmo. Ejecuta `jumper.py`, el fichero que se
distribuye en [grmarco/jumper](https://github.com/grmarco/jumper) y que se evalúa
contra los corpus anotados, sobre CPython compilado a WebAssembly con
[Pyodide](https://pyodide.org).

Las versiones anteriores de la web usaban una traducción del algoritmo a
JavaScript (`metricAnalyzer.js`, `rhymeAnalyzer.js`) correspondiente a la versión
de 2021, con una exactitud del 87 % frente al 95 % del motor actual. Ejecutar el
fichero original elimina la divergencia entre ambas implementaciones.

La primera carga descarga el intérprete (unos megabytes, unos segundos); después
queda en la caché del navegador. Cada verso se analiza en milisegundos. El
análisis se realiza en el navegador y el texto no se envía a ningún servidor.

## Ficheros

| ruta | qué es |
|---|---|
| `jumper.py` | el motor, copiado de `grmarco/jumper`. No se edita en este repositorio |
| `js/motor.js` | interfaz con el motor: carga Pyodide y `jumper.py` y devuelve objetos JS |
| `js/notacion.js` | representación de la escansión y la rima |
| `js/app.js` | página principal: entrada, resultados, enlace compartible |
| `js/lote.js` | análisis por lotes |
| `js/tabla.js` | conversión del análisis en filas, sin dependencia del DOM |
| `js/xlsx.js` | generación de `.xlsx` sin dependencias externas |
| `js/tema.js` | tema claro y oscuro |
| `js/estado.js` | mensajes de estado: carga, cálculo, resultado desactualizado |
| `css/styles.css` | hoja de estilos |
| `lote.html` | análisis por lotes, con exportación a Excel o CSV |
| `how-it-works.html` | descripción del método y evaluación |
| `test/conformidad.mjs` | prueba de conformidad entre el motor del navegador y el de Python |

## Pruebas

```bash
npm install        # instala Pyodide para la prueba
npm test
```

`test/conformidad.mjs` analiza una lista de versos (al menos uno por licencia
métrica y uno por cada error corregido) con el motor del navegador y con el
Python del sistema, y exige que ambas salidas sean idénticas. Pyodide también se
ejecuta en Node, por lo que la prueba no requiere navegador.

`.github/workflows/motor.yml` comprueba semanalmente si `jumper.py` ha cambiado
en el repositorio del motor y, en ese caso, abre un pull request, que no se
integra si la prueba de conformidad falla.

## Despliegue

GitHub Pages publica la rama `main` directamente. No hay paso de compilación.

## Servir en local

```bash
npm run serve      # http://localhost:8000
```

Se necesita un servidor local, porque `jumper.py` se carga con `fetch` y el
navegador bloquea esa petición desde `file://`.

---

Grupo de Procesamiento del Lenguaje Natural y Recuperación de Información de la
UNED: https://sites.google.com/view/nlp-uned/home
