# -*- coding: utf-8 -*-
"""Jumper — análisis métrico de poesía en español.

Un solo fichero, sin dependencias fuera de la biblioteca estándar.

    import jumper
    jumper.escandir_verso('Cuando la alegre y dulce primavera')
    jumper.escandir_texto(poema)

GENERADO por lab/construir.py — no editar a mano: los cambios se hacen en
lab/jumper_v2.py y en sus módulos, y se regenera.
"""

import collections
import itertools
import json
import math

# ==========================================================================
# NORMA DE TONICIDAD  (ver CRITERIO-TONICIDAD.md)
# ==========================================================================
# ---------------------------------------------------------------------------
# 1. CLASES ÁTONAS  (consenso de los tres corpus: <= 0.05 de apariciones tónicas)
# ---------------------------------------------------------------------------
ARTICULO_DETERMINADO = ['el', 'la', 'lo', 'los', 'las']

PREPOSICIONES = ['a', 'ante', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre',
                 'hacia', 'hasta', 'mediante', 'para', 'por', 'sin', 'so', 'sobre', 'tras',
                 'excepto', 'salvo', 'versus']

CONJUNCIONES = ['y', 'e', 'ni', 'o', 'u', 'que', 'si', 'pero', 'mas', 'sino', 'pues',
                'porque', 'aunque', 'conque', 'como', 'cuando', 'mientras', 'aun']

PRONOMBRES_CLITICOS = ['me', 'te', 'se', 'nos', 'os', 'le', 'les']

POSESIVOS_ANTEPUESTOS = ['mi', 'mis', 'tu', 'tus', 'su', 'sus',
                         'nuestro', 'nuestra', 'nuestros', 'nuestras',
                         'vuestro', 'vuestra', 'vuestros', 'vuestras']

RELATIVOS = ['que', 'quien', 'quienes', 'cual', 'cuales', 'cuyo', 'cuya', 'cuyos', 'cuyas',
             'donde', 'adonde', 'do', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'cuan', 'tan']

TRATAMIENTOS = ['don', 'doña', 'fray', 'frey', 'san', 'sor']

CONTRACCIONES = ['al', 'del']

ATONAS = sorted(set(ARTICULO_DETERMINADO + PREPOSICIONES + CONJUNCIONES +
                    PRONOMBRES_CLITICOS + POSESIVOS_ANTEPUESTOS + RELATIVOS +
                    TRATAMIENTOS + CONTRACCIONES))

# ---------------------------------------------------------------------------
# 2. EXCEPCIONES LÉXICAS  (formas homógrafas que NO son la palabra átona)
# ---------------------------------------------------------------------------
# 'cabe' es el verbo caber en todo el material examinado (n=11, 100% tónica),
# nunca la preposición arcaica. 'incluso' y 'según' son adverbio y preposición
# tónica respectivamente.
TONICAS_SIEMPRE = ['cabe', 'incluso', 'según', 'segun']

# ---------------------------------------------------------------------------
# 3. REGLAS CONTEXTUALES  (homógrafos que sí alternan; todas contrastadas)
# ---------------------------------------------------------------------------
DETERMINANTES = set(ARTICULO_DETERMINADO + POSESIVOS_ANTEPUESTOS + [
    'un', 'una', 'unos', 'unas', 'este', 'esta', 'estos', 'estas',
    'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas'])


def _siguiente(palabras, i):
    return palabras[i + 1] if i + 1 < len(palabras) else ''


def es_atona(palabra, i=0, palabras=None, ctx=None):
    """¿Es átona esta aparición de la palabra?

    Args:
        palabra (str): la palabra, ya normalizada (minúsculas, sin puntuación)
        i (int): su posición en el verso
        palabras (list): el verso completo, para las reglas contextuales
        ctx (dict): contexto del verso original ('interrogativo', 'pausa')
    Returns:
        bool
    """
    palabras = palabras if palabras is not None else [palabra]
    ctx = ctx or {}
    sig = _siguiente(palabras, i)

    # 'do' relativo (= donde) es átono; 'dó' interrogativo es tónico. Los textos
    # áureos no siempre escriben la tilde, pero el signo de interrogación del
    # verso la delata: 0.79 de apariciones tónicas frente a 0.065 en el resto.
    if palabra == 'do':
        return not ctx.get('interrogativo', False)

    if palabra in TONICAS_SIEMPRE:
        return False

    # 'aun' (= incluso) es átona; 'aún' (= todavía) es tónica. Los corpus no
    # siempre escriben la tilde: ante negación la lectura es siempre 'todavía'.
    if palabra == 'aun':
        return sig != 'no'
    if palabra == 'aún':
        return False

    # 'bajo': preposición ante determinante; adjetivo o verbo en los demás casos.
    if palabra == 'bajo':
        return sig in DETERMINANTES

    # 'puesto que' es locución conjuntiva; 'puesto' solo es sustantivo/participio.
    if palabra == 'puesto':
        return sig == 'que'

    # 'luego' conjunción ilativa (átona) sólo en posición inicial absoluta;
    # adverbio temporal (tónico) en el resto. Contraste 0.50 vs 0.97.
    if palabra == 'luego':
        return i == 0

    return palabra in ATONAS


# ---------------------------------------------------------------------------
# 4. DIVERGENCIAS DECLARADAS  (los corpus no coinciden; se fija criterio)
# ---------------------------------------------------------------------------
# palabra -> (criterio adoptado, corpus que se aparta, motivo)
DIVERGENCIAS = {
    'tan':       ('átona',  'Carvajal (0.80)',  'cuantificador proclítico; ADSO n=329 al 0.01'),
    'nuestro*':  ('átona',  'Carvajal (0.86-1.00)', 'posesivo antepuesto = proclítico'),
    'vuestro*':  ('átona',  'ADSO (0.12-0.20)', 'misma clase que nuestro*'),
    'mientras':  ('átona',  'Carvajal (0.75)',  'conjunción'),
    'cuando':    ('átona',  'Carvajal (0.29)',  'conjunción/relativo'),
    'donde':     ('átona',  'Carvajal (0.28)',  'relativo'),
    'cual':      ('átona',  'Carvajal (0.56)',  'relativo'),
    'cuanto':    ('átona',  'Carvajal (0.55)',  'relativo'),
    'cuyo*':     ('átona',  'Carvajal (0.50-1.00)', 'relativo posesivo'),
    'no':        ('tónica', 'Carvajal (0.75)',  'adverbio con acento propio; ADSO n=908 al 1.00'),
    'un/una':    ('tónica', 'Carvajal (0.73/0.89)', 'ADSO n=429 al 1.00'),
    'ti':        ('tónica', 'Carvajal (0.57)',  'pronombre tónico por definición'),
    'cada':      ('tónica', 'Carvajal (0.41)',  'ADSO n=40 al 1.00'),
    'oh':        ('tónica', 'ADSO100 (0.00)',   'SIN RESOLVER: ADSO 0.60, Carvajal 0.63, '
                                                'ADSO100 0.00 uniforme. Ver el criterio.'),
}

# ==========================================================================
# CONTEXTO DE LAS LICENCIAS MÉTRICAS
# ==========================================================================
SIN_TILDE = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ï': 'i', 'ü': 'u'}


def _base(c):
    return SIN_TILDE.get(c, c)


def vocales_de_contacto(jm, palabra, inicio):
    """Secuencia vocálica del extremo de la palabra que participa en la sinalefa."""
    p = jm.sin_marcas(palabra)
    if not p:
        return ''
    if inicio:
        if p[0] == 'h':
            p = p[1:]
        seq = ''
        for c in p:
            if c in jm.vocales_y:
                seq += c
            else:
                break
        return seq
    if p[-1] == 'h':
        p = p[:-1]
    seq = ''
    for c in reversed(p):
        if c in jm.vocales_y:
            seq = c + seq
        else:
            break
    return seq


def clase_fonica(jm, izq, der):
    """Clase fónica del contacto entre dos palabras. Excluyentes entre sí.

    Medido sobre 16 848 contactos: 'iguales' hace la dialefa la MITAD de probable
    (dos vocales idénticas se funden trivialmente), mientras que 'triple' y
    'tonica' la casi duplican.
    """
    vi = vocales_de_contacto(jm, izq, inicio=False)
    vd = vocales_de_contacto(jm, der, inicio=True)
    if not vi or not vd:
        return 'otro'
    if _base(vi[-1]) == _base(vd[0]):
        return 'iguales'
    if len(vi) + len(vd) >= 3:
        return 'triple'
    if vi[-1] in jm.vocales_acentuadas or vd[0] in jm.vocales_acentuadas:
        return 'tonica'
    return 'distintas'


def cohesion(jm, palabras, i):
    """Cohesión sintáctica del contacto, en términos de tonicidad.

    La sinalefa entre un proclítico y su núcleo (*la hermosa*, *y en*) es casi
    obligatoria: deshacerla partiría un grupo fónico. Entre dos palabras plenas,
    en cambio, hay frontera de palabra prosódica y la dialefa es corriente.

    Medido sobre 16 847 contactos, es el rasgo de mayor rango de los tres:
    átona+átona 0.013, átona+tónica 0.047, tónica+tónica 0.070, tónica+átona
    0.099 — un factor 7.6 entre extremos.
    """
    der = palabras[i + 1] if i + 1 < len(palabras) else ''
    izq_atona = jm.es_atona(sin_marcas_de(jm, palabras[i]), i, palabras)
    der_atona = jm.es_atona(sin_marcas_de(jm, der), i + 1, palabras)
    return ('átona' if izq_atona else 'tónica') + '+' + ('átona' if der_atona else 'tónica')


def sin_marcas_de(jm, palabra):
    return jm.sin_marcas(palabra)


def ctx_dialefa(jm, palabras, i, pausa):
    """Factores de una dialefa entre palabras[i] y palabras[i+1].

    Se devuelven por separado en vez de cruzados. Cruzar tres rasgos daba 30
    celdas para 7 727 contactos y el ruido de estimación se comía la señal;
    estimados por separado, cada uno usa todos los datos y se combinan sumando
    sus log-odds (supuesto de independencia condicional).
    """
    der = palabras[i + 1] if i + 1 < len(palabras) else ''
    return ('dialefa', [
        'fon|' + clase_fonica(jm, palabras[i], der),
        'pausa|' + ('sí' if pausa else 'no'),
        'coh|' + cohesion(jm, palabras, i),
    ])


def par_vocalico(palabra, marca):
    """Las dos vocales que la licencia separa o funde.

    No todos los encuentros vocálicos ceden igual: el diptongo de *Diana* se
    deshace con naturalidad y el de *cielo* casi nunca. Como par es una tabla
    diminuta, se estima con muchos datos y no sobreajusta a palabras concretas.
    """
    j = palabra.find(marca)
    if j < 0:
        return '?'
    izq = palabra[j - 1] if j else ''
    der = palabra[j + 1] if j + 1 < len(palabra) else ''
    return (SIN_TILDE.get(izq, izq) + SIN_TILDE.get(der, der)) or '?'


def ctx_dieresis(jm, palabra, es_ultima):
    return ('dieresis', ['pos|' + _posicion_marca(palabra, '~'),
                         'final|' + ('sí' if es_ultima else 'no'),
                         'voc|' + par_vocalico(palabra, '~')])


def ctx_sineresis(jm, palabra, es_ultima):
    # sin rasgo de par vocálico: la sinéresis BORRA una de las dos vocales al
    # fundirlas, así que en la forma marcada ya no se puede recuperar cuál era
    return ('sineresis', ['pos|' + _posicion_marca(palabra, '#'),
                          'final|' + ('sí' if es_ultima else 'no')])


def _posicion_marca(palabra, marca):
    """Dónde cae la marca dentro de la palabra: al principio, en medio o al final."""
    j = palabra.find(marca)
    if j <= 1:
        return 'inicio'
    if j >= len(palabra) - 2:
        return 'final'
    return 'medio'




def licencias_del_candidato(jm, cand, verso):
    """Contextos de todas las licencias que usa un candidato.

    El candidato es la cadena que produce `generar_candidatos`: una cadena vacía
    entre dos tokens marca dialefa, '~' diéresis y '#' sinéresis.
    """
    pausa = jm.contexto_verso(verso)['pausa']
    toks = cand.split(' ')
    palabras = [t for t in toks if t]
    fuera = []
    idx = -1
    for t in toks:
        if t == '':
            p = pausa[idx] if 0 <= idx < len(pausa) else False
            fuera.append(ctx_dialefa(jm, palabras, idx, p))
        else:
            idx += 1
            if '~' in t:
                fuera.append(ctx_dieresis(jm, t, idx == len(palabras) - 1))
            if '#' in t:
                fuera.append(ctx_sineresis(jm, t, idx == len(palabras) - 1))
    return fuera


def claves(ctx):
    """Claves de tabla de un contexto: la base del tipo y cada factor."""
    tipo, factores = ctx
    return [tipo + '|BASE'] + [tipo + '|' + f for f in factores]

# ==========================================================================
# LA TRADICIÓN MÉTRICA, MEDIDA
# ==========================================================================
ALFA = 5.0
BETA = 25.0   # fuerza del respaldo agrupado por distancia al final


def hemistiquios(patron, medida):
    """Parte un patrón de verso compuesto en sus dos hemistiquios.

    La tradición no describe el alejandrino como un patrón de 14 posiciones sino
    como dos heptasílabos (2-6 / 2-6, 3-6 / 1-4-6...). Modelarlo entero fragmenta
    los conteos; modelarlo por hemistiquios los agrupa y además permite que los
    dos hemistiquios se refuercen entre sí, porque son la misma unidad métrica.
    """
    if medida <= 11 or medida % 2:
        return None
    h = medida // 2
    a = tuple(p for p in patron if p <= h)
    b = tuple(p - h for p in patron if p > h)
    return h, a, b


def estimar(corpus):
    """Devuelve el modelo: conteos de patrón y frecuencias por posición, por medida."""
    conteo = collections.defaultdict(collections.Counter)
    total = collections.Counter()
    pos = collections.defaultdict(collections.Counter)
    # respaldo agrupado por distancia al final: el ritmo del verso español se
    # ancla en el acento final, así que las medidas raras pueden aprender de las
    # frecuentes si las posiciones se cuentan desde el final y no desde el principio
    pos_fin = collections.Counter()
    tot_fin = collections.Counter()
    for _verso, gold in corpus:
        if not gold:
            continue
        m = gold[-1] + 1
        conteo[m][tuple(gold)] += 1
        total[m] += 1
        for p in range(1, m):
            pos[m][p] += (p in gold)
            pos_fin[m - p] += (p in gold)
            tot_fin[m - p] += 1
        # los versos compuestos alimentan además el modelo de hemistiquio, donde
        # ambas mitades cuentan como ejemplos de la misma unidad métrica
        hem = hemistiquios(gold, m)
        if hem:
            h, a, b = hem
            for mitad in (a, b):
                conteo[('hemi', h)][mitad] += 1
                total[('hemi', h)] += 1
                for p in range(1, h + 1):
                    pos[('hemi', h)][p] += (p in mitad)
    return {'conteo': conteo, 'total': total, 'pos': pos,
            'pos_fin': pos_fin, 'tot_fin': tot_fin}


def log_prob(modelo, patron, medida):
    """log P(patrón | medida) con respaldo por posición.

    En versos compuestos se factoriza por hemistiquios si hay datos suficientes.
    """
    if not patron:
        return -20.0
    hem = hemistiquios(patron, medida)
    if hem:
        h, a, b = hem
        if modelo['total'].get(('hemi', h), 0) >= 200:
            return (_log_prob_simple(modelo, a, h + 1, ('hemi', h))
                    + _log_prob_simple(modelo, b, h + 1, ('hemi', h)))
    return _log_prob_simple(modelo, patron, medida, medida)


def _log_prob_simple(modelo, patron, medida, clave_modelo):
    total = modelo['total'].get(clave_modelo, 0)
    # respaldo independiente por posición
    q = 0.0
    fp = modelo['pos'].get(clave_modelo)
    pf, tf = modelo.get('pos_fin'), modelo.get('tot_fin')
    for p in range(1, medida):
        d = medida - p
        # interpolación: la frecuencia propia de la medida, respaldada por la
        # frecuencia agrupada a esa misma distancia del final
        f_g = ((pf[d] + 0.5) / (tf[d] + 1.0)) if (pf and tf.get(d)) else 0.5
        n_p = fp[p] if fp else 0
        f = (n_p + BETA * f_g) / (total + BETA)
        q += math.log(min(max(f, 1e-6), 1 - 1e-6) if p in patron
                      else min(max(1.0 - f, 1e-6), 1 - 1e-6))
    n = modelo['conteo'][clave_modelo][tuple(patron)] if total else 0
    return math.log((n + ALFA * math.exp(q)) / (total + ALFA)) if total else q


def guardar(modelo, ruta):
    def cl(m):
        return f'hemi{m[1]}' if isinstance(m, tuple) else str(m)
    json.dump({'total': {cl(k): v for k, v in modelo['total'].items()},
               'conteo': {cl(m): {'-'.join(map(str, k)) or '': v for k, v in c.items()}
                          for m, c in modelo['conteo'].items()},
               'pos': {cl(m): dict(c) for m, c in modelo['pos'].items()},
               'pos_fin': dict(modelo['pos_fin']), 'tot_fin': dict(modelo['tot_fin'])},
              open(ruta, 'w'), ensure_ascii=False)



def log_prob_medida(modelo, medida, plano=False):
    """log P(medida): cuán frecuente es esa medida en la tradición.

    Con `plano=True` se usa una distribución uniforme, para escandir sin ningún
    supuesto sobre qué metro es más común.
    """
    medidas = [k for k in modelo['total'] if not isinstance(k, tuple)]
    if plano:
        return -math.log(max(len(medidas), 1))
    n = modelo['total'].get(medida, 0)
    tot = sum(modelo['total'][k] for k in medidas)
    return math.log((n + 1.0) / (tot + len(medidas) + 1.0))


def cargar(ruta):
    """Carga el modelo desde un JSON generado por `guardar`."""
    return desde_dict(json.load(open(ruta, encoding='utf-8')))


def desde_dict(d):
    """Reconstruye el modelo desde su forma serializable."""
    def dcl(k):
        return ('hemi', int(k[4:])) if k.startswith('hemi') else int(k)
    conteo = collections.defaultdict(collections.Counter)
    for m, c in d['conteo'].items():
        for k, v in c.items():
            conteo[dcl(m)][tuple(int(x) for x in k.split('-')) if k else ()] = v
    pos = collections.defaultdict(collections.Counter)
    for m, c in d['pos'].items():
        for p, v in c.items():
            pos[dcl(m)][int(p)] = v
    return {'conteo': conteo,
            'total': collections.Counter({dcl(k): v for k, v in d['total'].items()}),
            'pos': pos,
            'pos_fin': collections.Counter({int(k): v for k, v in d.get('pos_fin', {}).items()}),
            'tot_fin': collections.Counter({int(k): v for k, v in d.get('tot_fin', {}).items()})}

# ==========================================================================
# ANÁLISIS DE RIMA
# ==========================================================================
YEISMO = True
SIN_TILDE_RIMA = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'}
FUERTES = 'aeoáéó'
DEBILES = 'iuíúïü'


def normalizar_fonemas(jm, palabra):
    """Lleva la grafía al fonema, que es lo que rima.

    *bella* rima con *sevilla* aunque se escriban distinto, y *ahora* con *aora*.
    Se neutralizan b/v, la y consonántica, la h muda y la u muda de qu/gu.
    """
    p = jm.quitar_puntuacion(palabra).strip().lower()
    p = ''.join(c for c in p if not c.isdigit())
    p = jm.normalizar_qu_gu(p)
    p = p.replace('v', 'b').replace('h', '')
    # La y es vocálica cuando no va seguida de vocal (*rey*, *muy*) y consonante
    # en el resto. Como consonante, el yeísmo la iguala a ll, de modo que
    # *batallas* rima con *rayas*. Convertir ll en la vocal i, en cambio, crea
    # diptongos falsos (*sollozo* -> *soiozo*) y descoloca el silabeo.
    # YEISMO es una decisión de época: en el Siglo de Oro ll e y eran fonemas
    # distintos y no rimaban entre sí.
    salida, i = [], 0
    while i < len(p):
        if p[i:i + 2] == 'll':
            salida.append('y' if YEISMO else 'L')
            i += 2
        elif p[i] == 'y':
            siguiente = p[i + 1] if i + 1 < len(p) else ''
            salida.append('y' if siguiente in jm.vocales else 'i')
            i += 1
        else:
            salida.append(p[i])
            i += 1
    return ''.join(salida)


def posicion_vocal_tonica(jm, palabra):
    """Índice del núcleo de la sílaba tónica, no de la primera vocal del grupo.

    En *tierra* el núcleo es la *e*, no la *i*: por eso rima con *guerra*. La
    versión de jumper_web tomaba la primera vocal del diptongo y luego lo
    parcheaba; aquí se busca el núcleo directamente.
    """
    # En un adverbio en -mente la rima la manda siempre la terminación, aunque
    # la base lleve tilde: *fácilmente* rima en -ente, no en -acilmente.
    if palabra.endswith('mente') and len(palabra) > 5:
        return len(palabra) - 4
    silabas, acento, _ = jm.palabra_silabas_acentos(palabra)
    if not silabas or acento is None:
        return None
    # se recorre la palabra contando sílabas igual que el módulo de palabra,
    # y se guardan las vocales de cada una
    grupos, actual, num = [], [], 0
    for i, c in enumerate(palabra):
        if c in jm.vocales:
            num += 1
            if i and palabra[i - 1] + c in jm.diptongos and palabra[i - 1] not in jm.dieresis and num > 1:
                num -= 1
                actual.append(i)
                continue
            if actual:
                grupos.append(actual)
            actual = [i]
    if actual:
        grupos.append(actual)
    if acento - 1 >= len(grupos):
        return grupos[-1][-1] if grupos else None
    grupo = grupos[acento - 1]
    # núcleo: la vocal con tilde; si no, la fuerte; si todas son débiles, la última
    for i in grupo:
        if palabra[i] in 'áéíóú':
            return i
    for i in grupo:
        if palabra[i] in FUERTES:
            return i
    return grupo[-1]


def rima_de_palabra(jm, palabra):
    """(consonante, asonante) de una palabra.

    Returns:
        tuple: la secuencia desde la vocal tónica, y sólo sus vocales
    """
    p = normalizar_fonemas(jm, palabra)
    if not p:
        return '', ''
    pos = posicion_vocal_tonica(jm, p)
    if pos is None:
        return '', ''
    # La tilde se quita: la posición ya indica cuál es la vocal tónica, y
    # conservarla haría que *dónde* y *esconde* no rimasen ('ónde' vs 'onde').
    consonante = ''.join(SIN_TILDE_RIMA.get(c, c) for c in p[pos:])
    vocales = [c for c in consonante if c in jm.vocales]
    if not vocales:
        return consonante, ''
    # la asonancia española es tónica + final: en esdrújulas se ignora la de en medio
    asonante = vocales[0] if len(vocales) == 1 else vocales[0] + vocales[-1]
    return consonante, asonante


def _etiquetas():
    """A, B, ... Z, AA, AB, ... para poemas con más de 26 rimas."""
    n = 0
    while True:
        etiqueta, num = '', n
        while True:
            etiqueta = chr(65 + num % 26) + etiqueta
            num = num // 26 - 1
            if num < 0:
                break
        n += 1
        yield etiqueta


def _canonico(esquema):
    """Reetiqueta por orden de aparición, para poder comparar con un patrón."""
    mapa, salida = {}, []
    for c in esquema:
        if c == '-':
            salida.append('-')
            continue
        if c.upper() not in mapa:
            mapa[c.upper()] = chr(65 + len(mapa))
        salida.append(mapa[c.upper()])
    return ''.join(salida)


def _es_soneto(e, m):
    """Catorce versos: dos cuartetos y dos tercetos.

    Se tolera un verso sin pareja: un soneto con una rima que no se ha resuelto
    sigue siendo un soneto, y exigir el pleno hace perder la hipótesis buena
    frente a un falso soneto asonantado.
    """
    if len(e) != 14 or e[:8].replace('-', '') == '':
        return False
    if e.count('-') > 1:
        return False
    cuartetos = e[:8]
    if not any(cuartetos == patron or
               sum(1 for x, y in zip(cuartetos, patron) if x != y) <= 1
               for patron in ('ABBAABBA', 'ABABABAB')):
        return False
    return 2 <= len(set(e[8:]) - {'-'}) <= 3


def _es_romance(e, m):
    """Pares asonantados con una sola rima, impares libres: -a-a-a-a…"""
    return (len(e) >= 8 and len(e) % 2 == 0
            and all(c == '-' for c in e[::2]) and len(set(e[1::2])) == 1)


def _es_cuartetos(e, m):
    if len(e) < 8 or len(e) % 4:
        return False
    bloques = [_canonico(e[i:i + 4]) for i in range(0, len(e), 4)]
    return all(b in ('ABAB', 'ABBA', 'AABB') for b in bloques)


def _es_pareados(e, m):
    return len(e) >= 4 and len(e) % 2 == 0 and all(
        _canonico(e[i:i + 2]) == 'AA' for i in range(0, len(e), 2))


def _es_terceto_encadenado(e, m):
    """ABA BCB CDC…, la terza rima."""
    if len(e) < 6 or len(e) % 3:
        return False
    for i in range(0, len(e) - 3, 3):
        if e[i] != e[i + 2] or e[i + 1] != e[i + 3]:
            return False
    return True


# Catálogo de formas. Se prueban en orden y se queda la primera que encaje; el
# orden importa porque una forma más específica debe ganar a una más laxa.
FORMAS = [
    ('soneto', 'consonante', _es_soneto),
    ('soneto asonantado', 'asonante', _es_soneto),
    ('romance', 'asonante', _es_romance),
    ('terceto encadenado', 'consonante', _es_terceto_encadenado),
    ('cuartetos', 'consonante', _es_cuartetos),
    ('cuartetos asonantados', 'asonante', _es_cuartetos),
    ('pareados', 'consonante', _es_pareados),
]


def reconocer_forma(esquema, tipo, medidas):
    """Nombre de la forma estrófica que encaja con el esquema, o None."""
    canon = _canonico(esquema)
    for nombre, tipo_forma, prueba in FORMAS:
        if tipo_forma == tipo and prueba(canon, medidas):
            return nombre
    return None


def detectar_romance(detalles, cobertura=0.8):
    """Reconstruye el esquema de un romance, si el poema lo es.

    En un romance los versos pares llevan todos la misma asonancia y los impares
    quedan libres. Los impares pueden compartir asonancia por azar, así que la
    forma no se puede reconocer filtrando el esquema ya construido: hay que
    comprobarla sobre las rimas y reconstruir el esquema desde la forma.

        Args:
            detalles (list of dict): rima de cada verso
            cobertura (float): fracción de versos pares que debe compartir la
                asonancia para aceptar la forma
        Returns:
            list of str: el esquema, o None si el poema no es un romance
    """
    n = len(detalles)
    if n < 8:
        return None
    pares = [i for i in range(1, n, 2)]
    aso = collections.Counter(detalles[i]['asonante'] for i in pares
                              if detalles[i]['asonante'])
    if not aso:
        return None
    rima_dominante, veces = aso.most_common(1)[0]
    if veces / len(pares) < cobertura:
        return None
    impares = [i for i in range(0, n, 2)]
    # los impares no deben compartir esa misma rima, o no habría alternancia
    if sum(1 for i in impares if detalles[i]['asonante'] == rima_dominante) > len(impares) * 0.25:
        return None
    # ni deben rimar entre sí: en un romance van sueltos. Si riman en
    # consonante es un ABAB —un soneto, una cuarteta— cuyos pares asuenan por
    # añadidura, que es lo normal cuando además consuenan.
    con = collections.Counter(detalles[i]['consonante'] for i in impares
                              if detalles[i]['consonante'])
    if con and con.most_common(1)[0][1] > len(impares) * 0.5:
        return None
    return ['a' if i % 2 else '-' for i in range(n)]


def completar_por_forma(jm, esquema, detalles, tipo, medidas):
    """Asigna los versos sueltos que la forma estrófica reclama.

    Un poeta puede permitirse una rima imperfecta: en un soneto ABBA ABBA cuyo
    segundo verso sólo asuena con el grupo B, el verso pertenece a B de todos
    modos, porque la forma lo exige. Un lector lo ve; el agrupamiento por rima,
    solo, no.

    Se completa únicamente cuando (a) queda algún verso suelto, (b) el verso
    asuena con exactamente un grupo existente y (c) al asignarlo el esquema pasa
    a encajar en una forma del catálogo. Sin las tres condiciones no se toca.
    """
    if '-' not in esquema:
        return esquema
    sueltos = [i for i, e in enumerate(esquema) if e == '-']
    propuesta = list(esquema)
    for i in sueltos:
        aso = detalles[i]['asonante']
        if not aso:
            continue
        candidatos = {e for j, e in enumerate(esquema)
                      if e != '-' and detalles[j]['asonante'] == aso}
        if len(candidatos) == 1:
            propuesta[i] = candidatos.pop()
    if propuesta == list(esquema):
        return esquema
    if reconocer_forma(''.join(propuesta), tipo, medidas):
        return ''.join(propuesta)
    return esquema


def esquema_de_rima(jm, versos, medidas=None):
    """El esquema y el detalle de un poema, como par. Véase analisis_completo."""
    a = analisis_completo(jm, versos, medidas)
    return a['esquema'], a['versos']


def analisis_completo(jm, versos, medidas=None):
    """Esquema, forma estrófica y rima verso a verso de un poema.

    Agrupa primero por rima consonante y después por asonante; los versos que no
    riman con ninguno quedan como '-'. Las etiquetas van en mayúscula si el verso
    es de arte mayor (nueve sílabas o más) y en minúscula si es de arte menor,
    que es la convención de la anotación métrica española.

        Args:
            versos (list of str): los versos del poema
            medidas (list of int): sus medidas, sólo informativas
        Returns:
            dict: 'esquema' (cadena), 'forma' (nombre de la forma estrófica
                reconocida, o None) y 'versos' (la rima de cada verso)
    """
    limpios = [v.strip() for v in versos if v and v.strip()]
    medidas = medidas or []

    detalles = []
    for v in limpios:
        ultima = jm.quitar_puntuacion(v).strip().split(' ')[-1] if v.strip() else ''
        con, aso = rima_de_palabra(jm, ultima)
        detalles.append({'palabra': ultima, 'consonante': con, 'asonante': aso})

    def agrupar(tipos):
        """Agrupa los versos usando sólo los tipos de rima indicados, en orden.

        No se limita el alcance de la rima. Parecía que debía limitarse —la rima
        suele ser local, dentro de la estrofa— pero medido empeora en todos los
        valores probados (0.616 con ventana de 16 versos frente a 0.699 sin
        límite): las silvas de este corpus riman a mucha distancia.
        """
        esquema = [''] * len(detalles)
        gen = _etiquetas()
        grupos = {}
        for tipo in tipos:
            for i, actual in enumerate(detalles):
                if esquema[i] or not actual[tipo]:
                    continue
                grupo = [j for j in range(i, len(detalles))
                         if not esquema[j] and detalles[j][tipo] == actual[tipo]]
                if len(grupo) < 2:
                    continue
                letra = next(gen)
                for j in grupo:
                    esquema[j] = letra
                grupos[letra] = {'tipo': tipo, 'rima': actual[tipo],
                                 'versos': [limpios[j] for j in grupo]}
        return [e or '-' for e in esquema], grupos

    # Se prueban las dos hipótesis de rima y gana la que produzca una forma
    # estrófica reconocible. Es lo que faltaba: en un romance la asonancia es
    # una sola y recorre todo el poema, pero resolviendo la consonancia primero
    # se despedaza en pares consonantes sueltos que no significan nada.
    hipotesis = [
        ('consonante', agrupar(('consonante', 'asonante'))),
        ('asonante', agrupar(('asonante',))),
    ]
    elegida, forma = None, None
    for tipo, (esq, grupos) in hipotesis:
        nombre = reconocer_forma(''.join(esq), tipo, medidas)
        if nombre:
            elegida, forma = (tipo, esq, grupos), nombre
            break

    # El romance se comprueba después del catálogo: sus pares asuenan, pero
    # también asuenan los de un ABAB consonante, y ahí manda la forma cerrada.
    if elegida is None:
        romance = detectar_romance(detalles)
        if romance is not None:
            return {'esquema': ''.join(romance), 'forma': 'romance',
                    'versos': detalles}

    if elegida is None:
        # ninguna forma encaja: se conserva la hipótesis general
        tipo, (esq, grupos) = hipotesis[0]
        elegida = (tipo, esq, grupos)

    tipo, esquema, grupos = elegida
    esquema = completar_por_forma(jm, esquema, detalles, tipo, medidas)
    # El caso se decide UNA VEZ para todo el poema: mayúscula si la rima es
    # consonante y minúscula si es asonante. En 81 obras anotadas no hay ni una
    # con mayúsculas y minúsculas mezcladas.
    if tipo == 'asonante':
        esquema = [e.lower() for e in esquema]
    else:
        consonantes = sum(len(g['versos']) for g in grupos.values()
                          if g['tipo'] == 'consonante')
        agrupados = sum(len(g['versos']) for g in grupos.values())
        if agrupados and consonantes * 2 < agrupados:
            esquema = [e.lower() for e in esquema]
    return {'esquema': ''.join(esquema), 'forma': forma, 'versos': detalles}

# ==========================================================================
# TABLAS MEDIDAS  (generadas por estimar_pesos.py y patrones.py)
# ==========================================================================
# log-odds de P(licencia | contexto), medidos sobre la partición de desarrollo
_PESOS_EMBEBIDOS = {'dialefa|BASE': {'n': 7727, 'usada': 520, 'p': 0.06741, 'log_odds': -2.6272}, 'dialefa|coh|tónica+tónica': {'n': 2074, 'usada': 156, 'p': 0.07563, 'log_odds': -2.5033}, 'dialefa|coh|tónica+átona': {'n': 2491, 'usada': 251, 'p': 0.10108, 'log_odds': -2.1852}, 'dialefa|coh|átona+tónica': {'n': 2388, 'usada': 104, 'p': 0.04393, 'log_odds': -3.0802}, 'dialefa|coh|átona+átona': {'n': 774, 'usada': 9, 'p': 0.01289, 'log_odds': -4.3386}, 'dialefa|fon|distintas': {'n': 5080, 'usada': 331, 'p': 0.06533, 'log_odds': -2.6608}, 'dialefa|fon|iguales': {'n': 1617, 'usada': 54, 'p': 0.03397, 'log_odds': -3.3477}, 'dialefa|fon|tonica': {'n': 180, 'usada': 27, 'p': 0.15385, 'log_odds': -1.7047}, 'dialefa|fon|triple': {'n': 850, 'usada': 108, 'p': 0.12793, 'log_odds': -1.9193}, 'dialefa|pausa|no': {'n': 7075, 'usada': 422, 'p': 0.05977, 'log_odds': -2.7556}, 'dialefa|pausa|sí': {'n': 652, 'usada': 98, 'p': 0.15138, 'log_odds': -1.7238}, 'dieresis|BASE': {'n': 5932, 'usada': 97, 'p': 0.01651, 'log_odds': -4.0868}, 'dieresis|final|no': {'n': 4543, 'usada': 61, 'p': 0.01364, 'log_odds': -4.2809}, 'dieresis|final|sí': {'n': 1389, 'usada': 36, 'p': 0.0266, 'log_odds': -3.5999}, 'dieresis|pos|final': {'n': 1124, 'usada': 6, 'p': 0.00622, 'log_odds': -5.0743}, 'dieresis|pos|inicio': {'n': 193, 'usada': 0, 'p': 0.00513, 'log_odds': -5.2679}, 'dieresis|pos|medio': {'n': 4615, 'usada': 91, 'p': 0.01993, 'log_odds': -3.8956}, 'dieresis|voc|ai': {'n': 81, 'usada': 0, 'p': 0.01205, 'log_odds': -4.4067}, 'dieresis|voc|au': {'n': 246, 'usada': 0, 'p': 0.00403, 'log_odds': -5.5094}, 'dieresis|voc|ei': {'n': 79, 'usada': 1, 'p': 0.02469, 'log_odds': -3.6763}, 'dieresis|voc|eu': {'n': 15, 'usada': 1, 'p': 0.11765, 'log_odds': -2.0149}, 'dieresis|voc|ey': {'n': 25, 'usada': 0, 'p': 0.03704, 'log_odds': -3.2581}, 'dieresis|voc|ia': {'n': 588, 'usada': 28, 'p': 0.04915, 'log_odds': -2.9624}, 'dieresis|voc|ie': {'n': 1991, 'usada': 11, 'p': 0.00602, 'log_odds': -5.1065}, 'dieresis|voc|io': {'n': 823, 'usada': 8, 'p': 0.01091, 'log_odds': -4.5072}, 'dieresis|voc|iu': {'n': 17, 'usada': 1, 'p': 0.10526, 'log_odds': -2.1401}, 'dieresis|voc|oi': {'n': 20, 'usada': 0, 'p': 0.04545, 'log_odds': -3.0445}, 'dieresis|voc|ou': {'n': 1, 'usada': 0, 'p': 0.33333, 'log_odds': -0.6931}, 'dieresis|voc|oy': {'n': 110, 'usada': 0, 'p': 0.00893, 'log_odds': -4.7095}, 'dieresis|voc|ua': {'n': 421, 'usada': 14, 'p': 0.03546, 'log_odds': -3.3032}, 'dieresis|voc|ue': {'n': 1402, 'usada': 17, 'p': 0.01282, 'log_odds': -4.3438}, 'dieresis|voc|ui': {'n': 94, 'usada': 10, 'p': 0.11458, 'log_odds': -2.0448}, 'dieresis|voc|uo': {'n': 19, 'usada': 6, 'p': 0.33333, 'log_odds': -0.6931}, 'sineresis|BASE': {'n': 1077, 'usada': 116, 'p': 0.10843, 'log_odds': -2.1068}, 'sineresis|final|no': {'n': 435, 'usada': 107, 'p': 0.24714, 'log_odds': -1.1139}, 'sineresis|final|sí': {'n': 642, 'usada': 9, 'p': 0.01553, 'log_odds': -4.1495}, 'sineresis|pos|final': {'n': 486, 'usada': 29, 'p': 0.06148, 'log_odds': -2.7257}, 'sineresis|pos|inicio': {'n': 416, 'usada': 69, 'p': 0.16746, 'log_odds': -1.6037}, 'sineresis|pos|medio': {'n': 175, 'usada': 18, 'p': 0.10734, 'log_odds': -2.1182}}

# frecuencia de cada patrón acentual y respaldos por posición
_PATRONES_EMBEBIDOS = {'total': {'11': 5700, '14': 369, 'hemi7': 738, '7': 467, '9': 28, '12': 25, 'hemi6': 50, '10': 46, '8': 6, '13': 8, '4': 15, '15': 11, '5': 5, '16': 7, 'hemi8': 14, '17': 3, '20': 2, 'hemi10': 4, '21': 3, '22': 2, 'hemi11': 4, '23': 1, '18': 1, 'hemi9': 2, '25': 1, '3': 1}, 'conteo': {'11': {'4-6-10': 279, '3-6-10': 437, '2-4-8-10': 317, '1-3-4-6-10': 28, '3-4-6-10': 50, '2-4-5-6-9-10': 3, '2-3-6-7-10': 17, '3-4-8-10': 22, '2-4-6-8-10': 247, '1-3-6-8-10': 112, '2-4-6-10': 372, '2-6-8-10': 226, '2-6-10': 396, '1-4-8-10': 178, '1-4-6-8-10': 149, '1-2-6-10': 53, '1-6-10': 86, '4-6-8-10': 164, '2-4-5-8-10': 12, '1-2-6-8-10': 45, '4-5-6-9-10': 1, '4-9-10': 2, '3-6-8-10': 217, '2-4-10': 22, '1-4-6-7-10': 28, '1-4-6-10': 249, '2-6-7-10': 61, '1-4-6-7-8-10': 8, '2-3-6-10': 77, '4-8-10': 169, '1-2-3-6-8-10': 6, '6-7-8-10': 6, '2-3-6-8-10': 51, '1-2-3-6-7-10': 3, '1-2-4-6-8-10': 38, '3-5-6-7-10': 4, '1-6-8-10': 65, '4-6-9-10': 18, '1-2-3-5-6-10': 5, '1-2-4-8-9-10': 2, '2-3-8-9-10': 1, '2-4-7-8-10': 4, '4-6-7-10': 39, '1-2-3-4-6-7-10': 4, '3-6-7-10': 70, '1-2-5-6-7-8-10': 1, '4-7-8-10': 4, '1-5-6-10': 5, '2-4-6-9-10': 26, '1-3-6-10': 186, '2-5-6-8-10': 13, '2-6-8-9-10': 11, '6-7-10': 20, '6-7-9-10': 3, '1-2-4-6-10': 64, '1-3-6-7-10': 34, '1-4-7-8-10': 3, '2-7-8-10': 1, '2-3-4-6-8-10': 20, '1-3-4-6-8-9-10': 3, '1-4-10': 16, '5-6-9-10': 2, '1-3-4-6-8-10': 26, '3-5-6-10': 29, '1-2-8-10': 4, '6-10': 54, '2-3-4-8-10': 14, '1-2-3-4-6-8-10': 3, '1-6-9-10': 5, '3-4-6-7-10': 8, '2-6-9-10': 20, '6-8-10': 25, '1-3-5-6-10': 7, '1-2-5-6-7-10': 1, '2-3-4-8-9-10': 1, '1-3-6-8-9-10': 4, '4-7-9-10': 1, '1-2-4-5-6-9-10': 2, '1-2-6-9-10': 4, '1-2-4-8-10': 31, '2-3-4-6-10': 18, '1-3-4-6-9-10': 2, '3-6-9-10': 32, '1-3-4-8-10': 11, '3-5-6-8-10': 15, '1-2-5-6-10': 6, '3-5-6-8-9-10': 2, '3-4-6-8-10': 27, '2-3-6-7-8-10': 2, '1-4-5-6-10': 8, '1-3-6-9-10': 9, '1-3-5-7-10': 1, '1-2-3-6-10': 11, '2-4-6-8-9-10': 11, '2-8-10': 4, '4-7-10': 6, '2-4-6-7-10': 24, '1-2-3-4-6-7-8-10': 2, '5-6-8-10': 2, '2-4-5-6-8-10': 11, '1-3-7-9-10': 1, '2-3-4-7-10': 1, '1-4-6-9-10': 18, '1-6-7-10': 18, '1-2-4-6-7-8-10': 3, '6-8-9-10': 3, '2-4-5-6-10': 14, '4-5-6-7-8-10': 3, '2-5-6-10': 26, '1-4-5-6-8-9-10': 1, '4-5-6-10': 13, '3-6-7-8-10': 13, '1-2-4-6-7-10': 9, '4-5-7-8-9-10': 1, '3-4-7-8-10': 3, '1-3-5-6-7-8-9-10': 1, '2-5-6-7-10': 4, '3-5-10': 2, '1-2-3-6-7-9-10': 3, '1-2-4-5-6-8-10': 2, '1-2-4-6-7-9-10': 2, '1-2-6-7-10': 7, '1-2-4-5-6-7-10': 3, '1-3-4-10': 2, '2-6-7-8-10': 11, '2-4-6-7-9-10': 4, '3-4-6-9-10': 4, '2-3-6-9-10': 6, '2-4-6-7-8-10': 10, '1-2-5-7-8-10': 1, '1-2-3-4-6-10': 4, '5-6-7-10': 1, '1-2-6-7-8-10': 5, '1-3-5-6-8-10': 7, '1-2-5-6-9-10': 2, '1-4-5-8-10': 13, '3-4-6-8-9-10': 3, '1-2-4-5-6-8-9-10': 1, '3-6-7-8-9-10': 2, '1-3-4-8-9-10': 1, '3-4-7-10': 2, '1-4-5-6-9-10': 1, '1-2-4-5-6-7-9-10': 2, '2-5-6-9-10': 4, '1-3-4-6-7-10': 7, '3-5-6-9-10': 5, '1-4-8-9-10': 6, '1-4-5-6-7-8-10': 1, '2-3-4-5-6-8-10': 5, '4-10': 9, '2-4-9-10': 2, '2-5-8-9-10': 1, '3-8-10': 5, '4-6-7-8-9-10': 3, '4-5-6-8-9-10': 2, '1-2-4-10': 2, '4-8-9-10': 4, '1-3-4-7-9-10': 1, '2-3-5-6-7-9-10': 1, '1-3-5-8-10': 1, '2-3-6-7-9-10': 2, '2-3-5-6-8-10': 3, '3-7-10': 4, '1-3-4-7-8-10': 3, '5-6-10': 1, '1-2-6-7-9-10': 1, '2-3-4-6-8-9-10': 2, '1-3-4-5-8-10': 1, '2-3-5-6-10': 5, '1-3-4-5-6-10': 2, '2-3-5-7-9-10': 1, '1-2-4-7-8-10': 3, '4-6-8-9-10': 5, '1-4-9-10': 4, '3-8-9-10': 2, '5-10': 1, '2-3-4-5-8-10': 1, '1-4-5-6-8-10': 3, '1-2-3-6-8-9-10': 1, '1-3-5-6-7-8-10': 1, '1-2-3-4-8-10': 1, '1-2-4-5-10': 1, '2-4-5-7-10': 1, '2-3-4-6-7-10': 2, '1-4-5-9-10': 1, '1-3-4-7-10': 2, '2-5-6-8-9-10': 1, '1-2-4-9-10': 4, '1-3-4-9-10': 1, '4-5-6-8-10': 6, '1-2-4-7-9-10': 1, '3-4-5-6-7-10': 1, '1-5-8-10': 2, '3-10': 1, '1-7-10': 1, '3-4-6-7-8-10': 2, '3-4-5-6-8-10': 1, '1-3-10': 4, '1-4-6-8-9-10': 4, '2-4-7-10': 6, '4-6-7-8-10': 7, '1-3-6-7-9-10': 1, '3-6-7-9-10': 2, '3-6-8-9-10': 7, '2-3-5-10': 1, '2-10': 3, '2-6-7-9-10': 2, '2-4-5-6-7-10': 1, '1-4-5-6-7-10': 1, '2-4-6-7-8-9-10': 2, '1-2-4-5-8-10': 3, '1-6-7-8-10': 4, '2-3-5-6-9-10': 2, '3-4-6-7-9-10': 1, '1-4-5-8-9-10': 1, '3-4-5-6-10': 3, '2-3-4-6-7-8-9-10': 1, '4-6-7-9-10': 3, '1-2-3-6-9-10': 3, '2-3-4-5-6-10': 1, '1-5-6-7-10': 2, '1-2-4-6-9-10': 3, '3-5-6-7-8-10': 1, '2-3-8-10': 1, '2-4-5-10': 1, '1-3-5-7-8-10': 1, '2-3-4-10': 1, '2-5-10': 4, '1-2-5-8-10': 2, '1-3-7-10': 1, '1-2-3-4-6-7-8-9-10': 1, '1-3-6-7-8-10': 3, '1-4-7-9-10': 1, '1-2-3-4-5-6-8-10': 1, '1-4-7-10': 3, '1-4-5-10': 1, '2-3-6-8-9-10': 1, '1-3-5-6-9-10': 1, '1-2-5-7-10': 1, '1-3-4-5-6-8-10': 1, '1-2-4-6-7-8-9-10': 1, '1-6-7-9-10': 1, '1-2-4-5-6-10': 3, '1-6-8-9-10': 3, '2-4-8-9-10': 3, '3-4-10': 1, '2-3-4-6-9-10': 3, '4-5-8-10': 3, '3-4-5-8-10': 1, '1-2-3-5-6-7-8-10': 1, '1-2-5-6-8-10': 1, '2-5-8-10': 1, '3-4-8-9-10': 1, '4-5-6-7-10': 2, '2-3-5-6-7-10': 1, '1-2-6-8-9-10': 1, '3-5-7-10': 3, '1-3-4-5-6-9-10': 1, '1-5-6-8-10': 1, '3-5-8-10': 1, '1-3-8-10': 1, '4-5-7-10': 1, '2-5-7-10': 1, '1-2-4-7-10': 2, '2-3-5-8-10': 1, '1-3-4-6-7-8-10': 1, '1-4-5-7-8-10': 1}, '14': {'3-6-11-13': 15, '2-4-6-9-13': 8, '4-6-11-13': 6, '2-6-10-13': 25, '6-9-11-13': 1, '1-2-6-9-13': 1, '3-6-9-11-13': 9, '1-4-6-9-11-13': 4, '2-3-4-6-9-13': 2, '4-6-8-11-13': 3, '4-6-8-9-13': 1, '6-9-13': 1, '2-4-6-11-13': 4, '2-5-6-9-10-13': 1, '3-6-8-11-13': 2, '2-4-6-9-11-13': 13, '4-6-8-10-13': 4, '2-4-6-8-11-13': 5, '2-6-11-13': 6, '1-3-6-11-13': 6, '2-5-6-9-13': 1, '3-5-6-9-13': 1, '2-6-9-13': 21, '1-3-6-9-13': 6, '3-6-10-13': 30, '1-3-6-9-10-13': 2, '1-2-6-11-13': 1, '3-4-6-9-13': 2, '1-6-11-13': 1, '1-3-6-10-13': 4, '1-4-6-10-13': 14, '3-6-9-13': 14, '1-4-6-9-13': 19, '2-6-9-10-13': 1, '1-3-4-6-9-11-13': 1, '2-4-6-8-10-13': 3, '1-4-6-8-11-13': 1, '1-6-10-13': 5, '2-4-6-10-13': 12, '1-4-6-11-13': 5, '4-6-9-13': 9, '2-6-8-10-13': 3, '1-2-3-6-9-13': 1, '2-4-6-8-9-11-13': 1, '1-4-6-9-10-13': 1, '4-6-10-13': 7, '1-3-6-10-11-13': 1, '2-3-4-6-10-13': 1, '2-6-9-12-13': 1, '3-5-6-10-13': 2, '4-6-8-9-11-13': 2, '4-6-9-11-13': 2, '3-4-6-9-11-13': 1, '4-6-8-13': 1, '1-6-9-13': 3, '1-2-6-10-13': 3, '1-4-6-8-13': 2, '1-3-6-9-11-13': 2, '2-3-6-9-13': 2, '3-6-9-10-13': 2, '2-6-8-11-13': 1, '4-6-10-11-12-13': 1, '1-3-6-8-11-13': 2, '2-3-6-10-13': 3, '1-2-3-6-8-9-13': 1, '3-5-6-10-12-13': 1, '1-6-8-11-13': 1, '1-2-3-5-6-9-13': 1, '2-3-6-9-10-13': 1, '1-2-3-6-8-10-12-13': 1, '2-3-6-11-13': 1, '2-6-8-9-11-13': 1, '1-2-3-4-6-8-9-10-11-13': 1, '4-6-9-10-13': 2, '4-5-6-10-13': 1, '2-6-9-11-13': 3, '2-5-6-9-11-13': 1, '3-4-6-11-13': 2, '3-4-6-10-13': 1, '3-6-10-12-13': 1, '2-3-4-6-9-11-13': 1, '1-6-9-11-13': 1, '1-2-4-6-9-13': 1, '3-6-13': 3, '2-6-8-9-13': 1, '3-4-6-8-10-13': 1, '3-4-6-8-9-13': 1, '1-3-6-8-10-13': 4, '3-4-5-6-9-10-13': 1, '2-4-6-8-13': 2, '3-4-6-8-13': 1, '1-2-6-8-9-13': 1, '3-6-8-10-11-13': 2, '2-3-6-9-11-13': 1, '1-4-6-9-12-13': 1, '3-5-6-11-13': 1, '1-3-6-8-10-11-13': 1, '4-5-6-9-11-13': 1, '3-6-8-9-11-13': 1, '6-8-10-13': 1, '1-6-8-10-13': 1, '1-3-4-6-9-13': 1, '1-4-5-6-11-13': 1, '1-4-9-13': 1, '5-9-13': 1, '2-4-6-8-9-12-13': 1, '2-3-5-6-9-11-13': 1}, 'hemi7': {'3-6': 187, '4-6': 87, '2-4-6': 91, '2-6': 159, '6': 6, '1-2-6': 11, '1-4-6': 62, '2-3-4-6': 4, '2-5-6': 5, '2-3-6': 19, '1-3-6': 45, '3-5-6': 7, '3-4-6': 10, '1-6': 18, '1-3-4-6': 5, '1-2-3-6': 3, '1-2-4-6': 6, '3-4-5-6': 2, '1-2-3-5-6': 1, '1-3-5-6': 1, '1-2-3-4-6': 2, '4-5-6': 2, '1-4-5-6': 1, '1-4': 1, '5': 1, '1-2-5-6': 1, '2-3-5-6': 1}, '7': {'3-6': 107, '2-3-6': 13, '5-6': 1, '1-6': 11, '4-6': 57, '2-4-6': 50, '1-3-6': 44, '2-6': 91, '1-2-6': 7, '2-3-4-6': 6, '1-2-4-6': 7, '1-4-6': 45, '3-4-6': 3, '2-5-6': 2, '3-5-6': 4, '1-3-4-6': 5, '4-5-6': 2, '6': 2, '2-4-5-6': 2, '1-2-5-6': 2, '3-4-5-6': 2, '1-2-4-5-6': 1, '1-2-3-6': 2, '1-2-3-4-6': 1}, '9': {'2-3-5-6-7-8': 1, '2-6-8': 2, '2-4-8': 1, '4-5-6-8': 1, '1-6-8': 1, '5-6-8': 1, '4-8': 6, '3-6-8': 2, '1-2-4-5-8': 1, '1-4-5-8': 1, '4-5-8': 1, '3-5-8': 3, '5-8': 1, '2-8': 1, '1-4-8': 2, '3-8': 1, '1-4-7-8': 1, '3-4-6-8': 1}, '12': {'3-7-11': 4, '3-7-9-11': 1, '5-7-11': 1, '1-4-7-11': 1, '3-6-9-11': 2, '3-4-6-7-8-11': 1, '1-4-6-11': 1, '2-4-6-8-11': 1, '2-6-9-11': 1, '4-7-11': 2, '1-2-4-6-9-11': 1, '1-4-7-9-11': 1, '2-6-7-11': 1, '1-4-6-8-11': 1, '1-4-9-11': 1, '4-5-6-8-11': 1, '4-8-11': 1, '1-2-3-4-7-11': 1, '4-6-8-9-11': 1, '6-11': 1}, 'hemi6': {'3': 5, '1-5': 10, '1-3-5': 2, '5': 3, '1-4': 3, '3-6': 2, '3-5': 5, '3-4-6': 1, '1-2-5': 1, '1-4-6': 2, '2-4-6': 1, '2-5': 4, '2-6': 2, '4': 3, '1-2-4-6': 1, '4-5-6': 1, '1-2-3-4': 1, '4-6': 1, '2-3-5': 1, '6': 1}, '10': {'3-5-6-7-8-9': 1, '2-4-5-9': 2, '1-5-9': 2, '1-3-6-9': 8, '1-5-7-9': 2, '2-5-9': 1, '3-5-9': 3, '4-9': 1, '1-2-5-9': 1, '3-6-9': 3, '2-3-4-7-9': 1, '1-4-9': 1, '1-4-6-9': 4, '1-3-4-6-9': 1, '6-9': 2, '2-4-7-9': 1, '4-6-9': 1, '3-4-6-9': 1, '3-6-7-9': 1, '1-3-5-7-9': 1, '3-6-8-9': 1, '3-4-5-6-9': 1, '4-7-9': 2, '2-4-6-9': 1, '1-3-5-9': 1, '1-7-9': 1, '2-4-9': 1}, '8': {'2-5-7': 1, '1-4-7': 1, '5-7': 1, '2-4-7': 1, '3-7': 1, '2-3-5-7': 1}, '13': {'4-6-10-12': 1, '1-5-12': 1, '4-8-12': 2, '2-4-6-9-12': 1, '1-4-8-12': 1, '4-6-7-9-12': 1, '3-6-8-12': 1}, '4': {'3': 15}, '15': {'1-4-6-9-11-14': 1, '4-8-12-14': 1, '1-3-6-11-14': 1, '4-8-10-11-14': 1, '4-8-10-12-14': 1, '2-6-9-14': 1, '4-6-10-14': 1, '4-8-10-14': 1, '3-7-11-14': 1, '2-4-8-10-14': 1, '3-4-6-8-10-13-14': 1}, '5': {'4': 3, '2-4': 1, '1-4': 1}, '16': {'2-7-9-11-15': 1, '1-3-8-12-15': 1, '1-4-6-8-11-15': 1, '5-9-11-13-15': 1, '3-6-8-12-15': 1, '2-4-6-8-13-15': 1, '4-8-12-15': 1}, 'hemi8': {'2-7': 1, '1-3-7': 1, '1-3-8': 1, '4-7': 3, '1-4-6-8': 1, '3-7': 1, '5': 1, '1-3-5-7': 1, '3-6-8': 1, '2-4-6-8': 1, '5-7': 1, '4-8': 1}, '17': {'2-7-10-13-14-16': 1, '4-6-8-9-11-13-14-16': 1, '4-6-8-12-16': 1}, '20': {'1-3-6-8-9-10-13-14-16-19': 1, '2-4-6-9-12-17-19': 1}, 'hemi10': {'1-3-6-8-9-10': 1, '3-4-6-9': 1, '2-4-6-9': 1, '2-7-9': 1}, '21': {'2-6-9-13-16-20': 1, '1-3-6-9-13-16-18-20': 1, '4-6-11-13-16-20': 1}, '22': {'4-6-9-11-13-17-21': 1, '6-8-10-13-15-18-21': 1}, 'hemi11': {'4-6-9-11': 1, '2-6-10': 1, '6-8-10': 1, '2-4-7-10': 1}, '23': {'4-9-13-15-17-18-22': 1}, '18': {'4-6-9-11-13-17': 1}, 'hemi9': {'4-6-9': 1, '2-4-8': 1}, '25': {'3-6-10-13-15-18-20-24': 1}, '3': {'2': 1}}, 'pos': {'11': {'1': 1727, '2': 2492, '3': 1745, '4': 3028, '5': 333, '6': 4724, '7': 563, '8': 2503, '9': 326, '10': 5700}, '14': {'1': 103, '2': 140, '3': 142, '4': 156, '5': 15, '6': 367, '7': 0, '8': 54, '9': 163, '10': 145, '11': 117, '12': 7, '13': 369}, 'hemi7': {'1': 157, '2': 303, '3': 287, '4': 273, '5': 22, '6': 736, '7': 0}, '7': {'1': 125, '2': 184, '3': 187, '4': 181, '5': 16, '6': 467}, '9': {'1': 6, '2': 6, '3': 8, '4': 15, '5': 10, '6': 9, '7': 2, '8': 28}, '12': {'1': 7, '2': 5, '3': 9, '4': 14, '5': 2, '6': 12, '7': 13, '8': 6, '9': 8, '10': 0, '11': 25}, 'hemi6': {'1': 20, '2': 11, '3': 17, '4': 14, '5': 27, '6': 12}, '10': {'1': 22, '2': 8, '3': 23, '4': 18, '5': 15, '6': 25, '7': 10, '8': 2, '9': 46}, '8': {'1': 1, '2': 3, '3': 2, '4': 2, '5': 3, '6': 0, '7': 6}, '13': {'1': 2, '2': 1, '3': 1, '4': 6, '5': 1, '6': 4, '7': 1, '8': 4, '9': 2, '10': 1, '11': 0, '12': 8}, '4': {'1': 0, '2': 0, '3': 15}, '15': {'1': 2, '2': 2, '3': 3, '4': 8, '5': 0, '6': 5, '7': 1, '8': 6, '9': 2, '10': 6, '11': 4, '12': 2, '13': 1, '14': 11}, '5': {'1': 1, '2': 1, '3': 0, '4': 5}, '16': {'1': 2, '2': 2, '3': 2, '4': 3, '5': 1, '6': 3, '7': 1, '8': 5, '9': 2, '10': 0, '11': 3, '12': 3, '13': 2, '14': 0, '15': 7}, 'hemi8': {'1': 4, '2': 2, '3': 5, '4': 6, '5': 3, '6': 3, '7': 8, '8': 5}, '17': {'1': 0, '2': 1, '3': 0, '4': 2, '5': 0, '6': 2, '7': 1, '8': 2, '9': 1, '10': 1, '11': 1, '12': 1, '13': 2, '14': 2, '15': 0, '16': 3}, '20': {'1': 1, '2': 1, '3': 1, '4': 1, '5': 0, '6': 2, '7': 0, '8': 1, '9': 2, '10': 1, '11': 0, '12': 1, '13': 1, '14': 1, '15': 0, '16': 1, '17': 1, '18': 0, '19': 2}, 'hemi10': {'1': 1, '2': 2, '3': 2, '4': 2, '5': 0, '6': 3, '7': 1, '8': 1, '9': 4, '10': 1}, '21': {'1': 1, '2': 1, '3': 1, '4': 1, '5': 0, '6': 3, '7': 0, '8': 0, '9': 2, '10': 0, '11': 1, '12': 0, '13': 3, '14': 0, '15': 0, '16': 3, '17': 0, '18': 1, '19': 0, '20': 3}, '22': {'1': 0, '2': 0, '3': 0, '4': 1, '5': 0, '6': 2, '7': 0, '8': 1, '9': 1, '10': 1, '11': 1, '12': 0, '13': 2, '14': 0, '15': 1, '16': 0, '17': 1, '18': 1, '19': 0, '20': 0, '21': 2}, 'hemi11': {'1': 0, '2': 2, '3': 0, '4': 2, '5': 0, '6': 3, '7': 1, '8': 1, '9': 1, '10': 3, '11': 1}, '23': {'1': 0, '2': 0, '3': 0, '4': 1, '5': 0, '6': 0, '7': 0, '8': 0, '9': 1, '10': 0, '11': 0, '12': 0, '13': 1, '14': 0, '15': 1, '16': 0, '17': 1, '18': 1, '19': 0, '20': 0, '21': 0, '22': 1}, '18': {'1': 0, '2': 0, '3': 0, '4': 1, '5': 0, '6': 1, '7': 0, '8': 0, '9': 1, '10': 0, '11': 1, '12': 0, '13': 1, '14': 0, '15': 0, '16': 0, '17': 1}, 'hemi9': {'1': 0, '2': 1, '3': 0, '4': 2, '5': 0, '6': 1, '7': 0, '8': 1, '9': 1}, '25': {'1': 0, '2': 0, '3': 1, '4': 0, '5': 0, '6': 1, '7': 0, '8': 0, '9': 0, '10': 1, '11': 0, '12': 0, '13': 1, '14': 0, '15': 1, '16': 0, '17': 0, '18': 1, '19': 0, '20': 1, '21': 0, '22': 0, '23': 0, '24': 1}, '3': {'1': 0, '2': 1}}, 'pos_fin': {'10': 1897, '9': 2555, '8': 2153, '7': 3077, '6': 559, '5': 5137, '4': 952, '3': 2841, '2': 354, '1': 6701, '13': 110, '12': 154, '11': 164, '14': 9, '15': 7, '16': 3, '19': 4, '18': 3, '17': 2, '20': 1, '21': 0, '22': 1, '24': 0, '23': 0}, 'tot_fin': {'10': 6133, '9': 6179, '8': 6207, '7': 6213, '6': 6680, '5': 6680, '4': 6685, '3': 6700, '2': 6701, '1': 6701, '13': 400, '12': 408, '11': 433, '14': 31, '15': 20, '16': 13, '19': 9, '18': 9, '17': 10, '20': 7, '21': 4, '22': 2, '24': 1, '23': 1}}


# ==========================================================================
# ESCANDIDOR
# ==========================================================================
import re

# ---------------------------------------------------------------------------
# CONFIGURACIÓN DE MEJORAS (banco de pruebas). Cada flag aísla una hipótesis
# para poder medirla por separado con lab/evalkit.py
# ---------------------------------------------------------------------------
MEJORAS = {
    # Única opción que sigue siendo una elección y no un resultado cerrado:
    #   'patron'   desambiguador por log-probabilidades medidas (por defecto)
    #   'original' heurística del artículo de IEEE Access, para reproducirlo
    'politica': 'patron',
}





MODELO_PATRONES = None


def cargar_patrones(ruta):
    """Carga el modelo empírico de la tradición métrica (ver patrones.py)."""
    global MODELO_PATRONES
    MODELO_PATRONES = cargar(ruta)
    return MODELO_PATRONES



# Pesos del desambiguador: log-odds de P(licencia | contexto) medidos sobre una
# partición de desarrollo (ver estimar_pesos.py). No son parámetros ajustados.
PESOS = {}
PESO_LICENCIAS = 1.0     # 1.0 = combinación pura de log-probabilidades
ENCOGE_FACTORES = 0.8    # atempera la suma de factores no independientes


def cargar_pesos(ruta):
    """Carga una tabla de pesos medidos generada por estimar_pesos.py."""
    import json
    global PESOS
    with open(ruta, encoding='utf-8') as f:
        PESOS = {k: v['log_odds'] for k, v in json.load(f).items()}
    return PESOS




_API = None


def _api():
    """Vista mínima del módulo para `rasgos`. El módulo se carga por ruta y no
    está en sys.modules, así que no se puede recuperar por nombre."""
    global _API
    if _API is None:
        import types
        _API = types.SimpleNamespace(
            sin_marcas=sin_marcas, vocales_y=vocales_y,
            vocales_acentuadas=vocales_acentuadas, contexto_verso=contexto_verso,
            es_atona=(lambda p, i=0, ps=None: es_atona(p, i, ps))
            if True else (lambda p, i=0, ps=None: p in atonas))
    return _API


_API_RIMA = None


def _api_rima():
    """Vista del módulo para `rima`, que se carga por ruta y no está en sys.modules."""
    global _API_RIMA
    if _API_RIMA is None:
        import types
        _API_RIMA = types.SimpleNamespace(
            dieresis=dieresis, diptongos=diptongos, vocales=vocales,
            normalizar_qu_gu=normalizar_qu_gu,
            palabra_silabas_acentos=palabra_silabas_acentos,
            quitar_puntuacion=quitar_puntuacion)
    return _API_RIMA


def rima_de(palabra):
    """Rima consonante y asonante de una palabra.

        Args:
            palabra (str): la palabra, tal cual
        Returns:
            tuple: (rima consonante, rima asonante). La consonante es la
            secuencia de fonemas desde la vocal tónica; la asonante, sólo sus
            vocales. *tierra* da ('erra', 'ea').
    """
    return rima_de_palabra(_api_rima(), palabra)


def rima_del_poema(versos, medidas=None):
    """Esquema de rima de un poema.

    Agrupa por rima consonante y después por asonante, reconoce la forma
    estrófica —soneto, romance, cuartetos, terceto encadenado, pareados— y deja
    que la forma complete los versos sueltos que reclama. Mayúscula para la rima
    consonante y minúscula para la asonante; '-' para el verso sin pareja.

        Args:
            versos (list of str): los versos del poema
            medidas (list of int): sus medidas, opcionales
        Returns:
            tuple: (esquema como cadena, detalle de la rima de cada verso)
    """
    return esquema_de_rima(_api_rima(), versos, medidas)


def analisis_de_rima(versos, medidas=None):
    """Rima de un poema con la forma estrófica reconocida.

    Igual que rima_del_poema, pero devolviendo también el nombre de la forma
    —soneto, romance, cuartetos, terceto encadenado, pareados— que el esquema
    ha resultado ser. La reconoce el propio algoritmo al decidir entre la
    hipótesis consonante y la asonante, de modo que aquí sólo se saca a la luz.

    Las medidas son opcionales pero convienen: hay formas que no se distinguen
    sin ellas, porque el romance es octosílabo por definición y el soneto se
    escribe en arte mayor.

        Args:
            versos (list of str): los versos del poema
            medidas (list of int): sus medidas, opcionales
        Returns:
            dict: 'esquema' (cadena), 'forma' (nombre o None) y 'versos'
                (la palabra rimante de cada verso con sus dos rimas)
    """
    return analisis_completo(_api_rima(), versos, medidas)


def log_odds_licencias(cand, verso):
    """Suma de los log-odds de las licencias que usa el candidato.

    Cada término es la probabilidad observada de esa licencia en ese contexto,
    de modo que el criterio sigue siendo auditable línea a línea.
    """
    if not PESOS:
        return 0.0
    total = 0.0
    for tipo, factores in licencias_del_candidato(_api(), cand, verso):
        base = PESOS.get(tipo + '|BASE', 0.0)
        # log-odds de la licencia en su contexto: la base del tipo más lo que
        # aporta cada factor por encima de ella. Los factores NO son
        # independientes, así que sumar sus desviaciones sobrepasa: ENCOGE_FACTORES
        # las atempera. Sin ello, tres factores empujando a la vez llegan a hacer
        # una diéresis más barata que una dialefa, contra lo que dicen las bases.
        total += base + ENCOGE_FACTORES * sum(
            PESOS.get(tipo + '|' + f, base) - base for f in factores)
    return total

# Tope de licencias métricas simultáneas que se permite combinar en un candidato
# y tope duro de candidatos por verso (el producto crece rápido).
MAX_LICENCIAS = 2   # medido: el techo satura en 2; con 3+ sólo entra ruido
MAX_CANDIDATOS = 600

# Costes (en unidades de "ratio de tradición") de cada licencia métrica.
# La hipótesis es que no todas las licencias son igual de probables y que su
# probabilidad depende del contexto fónico y de la posición en el verso.

nombre_verso = ['', 'Bisílabo', 'Trisílabo', 'Tetrasílabo', 'Pentasílabo', 'Hexasílabo', 'Heptasílabo', 'Octosílabo',
                'Eneasílabo', 'Decasílabo', 'Endecasílabo', 'Dodecasílabo', 'Tridecasílabo', 'Alejandrino',
                'Pentadecasílabo', 'Hexadecasílabo', 'Heptadecasílabo', 'Octodecasílabo']
tipos_verso = [
    [['', [1]]],
    [['', [2]]],
    [['', [1, 3]], ['', [3]]],
    # pentasílabos
    [['heroico', [2, 4]], ['sáfico', [4]], ['dactílico', [1, 4]]],
    # hexasílabos
    [['heroico', [2, 5]], ['melódico puro', [3, 5]], ['melódico pleno', [1, 3, 5]], ['enfático', [1, 5]],
     ['vacío', [5]]],
    # heptasilabos
    [['heroico puro', [2, 6]], ['heroico pleno', [2, 4, 6]], ['melódico puro', [3, 6]], ['melódico puro', [1, 3, 6]],
     ['sáfico puro', [4, 6]], ['sáfico pleno', [1, 4, 6]], ['enfático', [1, 6]], ['vacío', [6]]],
    # octosílabos
    [['heroico puro', [2, 4, 7]], ['heroico pleno', [2, 5, 7]], ['heroico difuso', [2, 7]], ['melódico puro', [3, 7]],
     ['melódico pleno', [1, 3, 5, 7]], ['melódico semipleno', [3, 5, 7]], ['melódico corto hemistiquial', [1, 3, 7]],
     ['dactílicos', [1, 4, 7]], ['sáfico', [4, 7]], ['enfático corto', [1, 5, 7]], ['enfático largo', [1, 7]],
     ['vacío corto', [5, 7]], ['vacío largo', [7]]],
    # eneasilabos
    [['heroico puro corto', [2, 4, 8]], ['heroico pleno', [2, 4, 6, 8]], ['heroico puro largo', [2, 6, 8]],
     ['heroico difuso', [2, 8]], ['sáfico puro', [4, 8]], ['sáfico pleno', [1, 4, 6, 8]],
     ['sáfico semipleno', [1, 4, 8]], ['sáfico largo', [4, 6, 8]], ['melódico puro', [3, 5, 8]],
     ['melódico pleno corto', [1, 3, 5, 8]], ['melódico corto', [1, 3, 8]], ['melódico largo', [3, 6, 8]],
     ['melódico pleno largo', [1, 3, 6, 8]], ['melódico difuso', [3, 8]], ['dactílico (de gaita gallega)', [2, 5, 8]],
     ['enfático puro', [1, 6, 8]], ['enfático corto', [1, 5, 8]], ['enfático largo', [1, 8]], ['vacío corto', [6, 8]],
     ['vacío largo', [8]], ['vacío difuso', [5, 8]]],
    # decasílabos
    [['heroico hemistiquial puro', [2, 4, 9]], ['heroico hemistiquial pleno', [2, 4, 6, 9]],
     ['heroico hemistiquial pleno doble', [2, 4, 7, 9]], ['heroico no hemistiquial puro', [2, 6, 9]],
     ['heroico no hemistiquial pleno', [2, 5, 7, 9]], ['heroico no hemistiquial largo', [2, 7, 9]],
     ['heroico no hemistiquial corto', [2, 5, 9]], ['heroico no hemistiquial difuso', [2, 9]],
     ['melódico puro', [3, 5, 9]], ['melódico pleno', [1, 3, 5, 7, 9]], ['melódico semipleno corto', [1, 3, 5, 9]],
     ['melódico largo', [3, 7, 9]], ['melódico semipleno largo', [1, 3, 7, 9]], ['melódico semipleno', [3, 5, 7, 9]],
     ['melódico difuso', [3, 9]], ['melódico difuso pleno', [1, 3, 9]], ['sáfico puro', [4, 6, 9]],
     ['sáfico dactílico doble (1,4+1,4)', [1, 4, 6, 9]], ['sáfico corto', [1, 4, 9]], ['sáfico largo', [4, 7, 9]],
     ['sáfico pleno ', [1, 4, 7, 9]], ['sáfico doble', [4, 9]], ['enfático corto', [1, 5, 9]],
     ['enfático puro', [1, 6, 9]], ['enfático pleno', [1, 5, 7, 9]], ['enfático largo', [1, 7, 9]],
     ['dactílico puro ', [3, 6, 9]], ['dactílico pleno', [1, 3, 6, 9]], ['vacío puro', [6, 9]],
     ['vacío difuso', [5, 9]], ['vacío largo', [5, 7, 9]]],
    # endecasilabos
    [['heroico puro', [2, 6, 10]], ['heroico pleno', [2, 4, 6, 8, 10]], ['heroico corto', [2, 4, 6, 10]],
     ['heroico largo', [2, 6, 8, 10]], ['heroico difuso', [2, 4, 10]], ['melódico puro', [3, 6, 10]],
     ['melódico pleno', [1, 3, 6, 8, 10]], ['melódico largo', [3, 6, 8, 10]], ['melódico corto', [1, 3, 6, 10]],
     ['sáfico puro', [4, 8, 10]], ['sáfico puro pleno', [1, 4, 8, 10]], ['sáfico pleno', [1, 4, 6, 8, 10]],
     ['sáfico corto', [4, 6, 10]], ['sáfico corto pleno', [1, 4, 6, 10]], ['sáfico largo', [4, 6, 8, 10]],
     ['sáfico largo pleno', [2, 4, 8, 10]], ['sáfico difuso', [4, 10]], ['sáfico difuso pleno', [1, 4, 10]],
     ['enfático puro', [1, 6, 10]], ['enfático pleno', [1, 6, 8, 10]], ['vacío puro', [6, 10]],
     ['vacío pleno tipo 1', [6, 8, 10]], ['vacío pleno tipo 2', [1, 4, 10]], ['vacío heroico', [2, 4, 10]]],
     # alejandrinos
    [["heroico puro heroico puro", [2, 6, 9, 13]], ["heroico puro heroico pleno", [2, 6, 9, 11, 13]],
     ["heroico puro melódico puro", [2, 6, 10, 13]], ["heroico puro melódico puro", [2, 6, 8, 10, 13]],
     ["heroico puro sáfico puro", [2, 6, 11, 13]], ["heroico puro sáfico pleno", [2, 6, 8, 11, 13]],
     ["heroico puro enfático", [2, 6, 8, 13]], ["heroico puro vacío", [2, 6, 13]],
     ["heroico pleno heroico puro", [2, 4, 6, 9, 13]], ["heroico pleno heroico pleno", [2, 4, 6, 9, 11, 13]],
     ["heroico pleno melódico puro", [2, 4, 6, 10, 13]], ["heroico pleno melódico puro", [2, 4, 6, 8, 10, 13]],
     ["heroico pleno sáfico puro", [2, 4, 6, 11, 13]], ["heroico pleno sáfico pleno", [2, 4, 6, 8, 11, 13]],
     ["heroico pleno enfático", [2, 4, 6, 8, 13]], ["heroico pleno vacío", [2, 4, 6, 13]],
     ["melódico puro heroico puro", [3, 6, 9, 13]], ["melódico puro heroico pleno", [3, 6, 9, 11, 13]],
     ["melódico puro melódico puro", [3, 6, 10, 13]], ["melódico puro melódico puro", [3, 6, 8, 10, 13]],
     ["melódico puro sáfico puro", [3, 6, 11, 13]], ["melódico puro sáfico pleno", [3, 6, 8, 11, 13]],
     ["melódico puro enfático", [3, 6, 8, 13]], ["melódico puro vacío", [3, 6, 13]],
     ["melódico puro heroico puro", [1, 3, 6, 9, 13]], ["melódico puro heroico pleno", [1, 3, 6, 9, 11, 13]],
     ["melódico puro melódico puro", [1, 3, 6, 10, 13]], ["melódico puro melódico puro", [1, 3, 6, 8, 10, 13]],
     ["melódico puro sáfico puro", [1, 3, 6, 11, 13]], ["melódico puro sáfico pleno", [1, 3, 6, 8, 11, 13]],
     ["melódico puro enfático", [1, 3, 6, 8, 13]], ["melódico puro vacío", [1, 3, 6, 13]],
     ["sáfico puro heroico puro", [4, 6, 9, 13]], ["sáfico puro heroico pleno", [4, 6, 9, 11, 13]],
     ["sáfico puro melódico puro", [4, 6, 10, 13]], ["sáfico puro melódico puro", [4, 6, 8, 10, 13]],
     ["sáfico puro sáfico puro", [4, 6, 11, 13]], ["sáfico puro sáfico pleno", [4, 6, 8, 11, 13]],
     ["sáfico puro enfático", [4, 6, 8, 13]], ["sáfico puro vacío", [4, 6, 13]],
     ["sáfico pleno heroico puro", [1, 4, 6, 9, 13]], ["sáfico pleno heroico pleno", [1, 4, 6, 9, 11, 13]],
     ["sáfico pleno melódico puro", [1, 4, 6, 10, 13]], ["sáfico pleno melódico puro", [1, 4, 6, 8, 10, 13]],
     ["sáfico pleno sáfico puro", [1, 4, 6, 11, 13]], ["sáfico pleno sáfico pleno", [1, 4, 6, 8, 11, 13]],
     ["sáfico pleno enfático", [1, 4, 6, 8, 13]], ["sáfico pleno vacío", [1, 4, 6, 13]],
     ["enfático heroico puro", [1, 6, 9, 13]], ["enfático heroico pleno", [1, 6, 9, 11, 13]],
     ["enfático melódico puro", [1, 6, 10, 13]], ["enfático melódico puro", [1, 6, 8, 10, 13]],
     ["enfático sáfico puro", [1, 6, 11, 13]], ["enfático sáfico pleno", [1, 6, 8, 11, 13]],
     ["enfático enfático", [1, 6, 8, 13]], ["enfático vacío", [1, 6, 13]], ["vacío heroico puro", [6, 9, 13]],
     ["vacío heroico pleno", [6, 9, 11, 13]], ["vacío melódico puro", [6, 10, 13]],
     ["vacío melódico puro", [6, 8, 10, 13]], ["vacío sáfico puro", [6, 11, 13]],
     ["vacío sáfico pleno", [6, 8, 11, 13]], ["vacío enfático", [6, 8, 13]], ["vacío vacío", [6, 13]]]]


vocales_no_acentuadas = ['a', 'e', 'i', 'o', 'u']
vocales_acentuadas = ['á', 'é', 'í', 'ó', 'ú']
de_no_a_si_acentuadas = {'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú', 'ï': 'ï', 'ü': 'ü'}
dieresis = ['ï', 'ü']
vocales = vocales_no_acentuadas + vocales_acentuadas + dieresis
vocales_y = vocales + ['y']
diptongos = ['ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ui', 'iu', 'ia', 'ua', 'ie', 'ue', 'io', 'uo', 'ió', 'ey', 'oy', 'ié',
             'éi', 'ué', 'ái', 'iá', 'uá']

atonas = [
    'el', 'los', 'la', 'las', 'me', 'nos', 'te', 'os', 'lo', 'le', 'les', 'se', 'mi',
    'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestros', 'nuestra', 'nuestras', 'vuestro',
    'vuestra', 'vuestros', 'vuestras', 'que', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos',
    'cuyas', 'cual', 'cuales', 'como', 'cuando', 'do', 'donde', 'adonde', 'cuan', 'tan',
    'cuanto', 'cuanta', 'cuantos', 'cuantas', 'a', 'ante', 'bajo', 'cabe', 'con', 'contra',
    'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por',
    'sin', 'so', 'sobre', 'tras', 'versus', 'aunque', 'conque', 'cuando', 'mas',
    'mientras', 'ni', 'o', 'u', 'pero', 'porque', 'pues', 'que', 'si', 'sino', 'y', 'e',
    'aun', 'excepto', 'hasta', 'incluso', 'don', 'doña', 'fray', 'frey', 'san', 'sor',
    'al', 'del', 'desde']

puntos = [':', ',', '.', ';', '.', '–', '(', ')', '\n', '\r', '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-','/','//']

FACTOR_AGUDA, FACTOR_LLANA, FACTOR_ESDRUJULA = 1, 0, -1

'''
MÓDULO DE ANALISIS DE PALABRA: COMPUTO DE SILABAS Y ACENTOS DE PALABRAS
'''


UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
            'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
            'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
            'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
            'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
DECENAS = {30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta',
           70: 'setenta', 80: 'ochenta', 90: 'noventa'}
CENTENAS = {1: 'ciento', 2: 'doscientos', 3: 'trescientos', 4: 'cuatrocientos',
            5: 'quinientos', 6: 'seiscientos', 7: 'setecientos', 8: 'ochocientos',
            9: 'novecientos'}
ORDINALES = ['', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto',
             'séptimo', 'octavo', 'noveno', 'décimo']
ROMANOS = {'i': 1, 'v': 5, 'x': 10, 'l': 50, 'c': 100, 'd': 500, 'm': 1000}
# palabras españolas que se escriben con letras de numeración romana: en
# mayúsculas son indistinguibles de un romano, así que no se tocan
PARECEN_ROMANOS = {'mi', 'di', 'vi', 'si', 'li', 'mil', 'ci', 'id', 'di', 'cid'}


def numero_a_palabras(n):
    """Escribe un entero en letra, como se lee en español.

        Args:
            n (int): número no negativo
        Returns:
            str: el número deletreado, o '' si queda fuera del rango cubierto
    """
    if n < 0 or n >= 1000000000:
        return ''
    if n < 30:
        return UNIDADES[n]
    if n < 100:
        d, u = divmod(n, 10)
        return DECENAS[d * 10] + (' y ' + UNIDADES[u] if u else '')
    if n < 1000:
        c, r = divmod(n, 100)
        if n == 100:
            return 'cien'
        return CENTENAS[c] + (' ' + numero_a_palabras(r) if r else '')
    if n < 1000000:
        m, r = divmod(n, 1000)
        cabeza = 'mil' if m == 1 else numero_a_palabras(m) + ' mil'
        return cabeza + (' ' + numero_a_palabras(r) if r else '')
    m, r = divmod(n, 1000000)
    cabeza = 'un millón' if m == 1 else numero_a_palabras(m) + ' millones'
    return cabeza + (' ' + numero_a_palabras(r) if r else '')


def _valor_romano(token):
    """Valor de un número romano bien formado, o None si no lo es."""
    t = token.lower()
    if not t or any(c not in ROMANOS for c in t):
        return None
    total, previo = 0, 0
    for c in reversed(t):
        v = ROMANOS[c]
        total += -v if v < previo else v
        previo = max(previo, v)
    # se rechaza lo que no vuelve a escribirse igual: descarta 'iiii', 'vx'...
    return total if total and _a_romano(total) == t else None


def _a_romano(n):
    tabla = [(1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'), (100, 'c'),
             (90, 'xc'), (50, 'l'), (40, 'xl'), (10, 'x'), (9, 'ix'),
             (5, 'v'), (4, 'iv'), (1, 'i')]
    salida = ''
    for valor, letras in tabla:
        while n >= valor:
            salida += letras
            n -= valor
    return salida


def expandir_numeros(texto):
    """Convierte cifras y números romanos en palabras antes de contar sílabas.

    Sin esto `3500 versos` cuenta 2 sílabas y `el siglo XVI` cuenta 5: los
    dígitos no aportan vocales y el romano se lee como si fuera una palabra.

    Los romanos que siguen a un nombre propio se leen como ordinales
    (*Felipe segundo*) y el resto como cardinales (*el siglo dieciséis*), que es
    la lectura española y da un cómputo distinto.

        Args:
            texto (str): el verso tal cual lo escribió el autor
        Returns:
            str: el mismo verso con los números deletreados
    """
    salida = []
    tokens = texto.split(' ')
    for i, token in enumerate(tokens):
        nucleo = token.strip(''.join(puntos) + '¡¿"«»')
        izq = token[:len(token) - len(token.lstrip(''.join(puntos) + '¡¿"«»'))]
        der = token[len(izq) + len(nucleo):]

        if nucleo.isdigit():
            palabras = numero_a_palabras(int(nucleo))
            salida.append(izq + (palabras or nucleo) + der)
            continue

        # romano: sólo en mayúsculas, bien formado, y que no sea palabra española
        if nucleo.isupper() and nucleo.lower() not in PARECEN_ROMANOS:
            valor = _valor_romano(nucleo)
            if valor:
                anterior = tokens[i - 1].strip(''.join(puntos)) if i else ''
                es_nombre_propio = bool(anterior) and anterior[:1].isupper()
                if es_nombre_propio and valor <= 10:
                    palabras = ORDINALES[valor]
                else:
                    palabras = numero_a_palabras(valor)
                salida.append(izq + palabras + der)
                continue

        salida.append(token)
    return ' '.join(salida)


def quitar_puntuacion(texto):
    quitar = [':', ',', '.', ';', '.', '–', '(', ')', '\n', '\r', '¿', '?', '!', '¡', '—', '»', '”', '“', '«', '-','/', '/']
    for q in quitar:
        texto = texto.replace(q, '')
    return texto


def normalizar(texto):
    """Quita puntuación, mayusculas y espacios laterales

        Args:
            texto (str): La palabra a normalizar
        Returns:
            str: palabra sin puntuación, mayusculas y espacios laterales
    """
    return quitar_puntuacion(texto).strip().lower()


def normalizar_qu_gu(palabra):
    """Neutraliza la vocal muda de los dígrafos `qu` y `gu` para el cómputo.

    En *queso* o *guerra* la u no suena y no debe contar como sílaba. Hay que
    cubrir también las formas con tilde (*sanguíneos*, *ungüé...*): si no, la u
    de `guí` cuenta como vocal y la palabra sale con una sílaba de más.

    La diéresis ortográfica de `güe`/`güi` es otra cosa: ahí la u **sí** suena y
    forma diptongo (*un-güen-to*), así que se convierte en u normal DESPUÉS de
    aplicar la regla del dígrafo, para que ésta no se la coma. La diéresis
    poética (*rü-i-na*), que no va tras g ni q, se deja intacta: su función es
    justamente deshacer el diptongo.

        Args:
            palabra (str): La palabra con posible dígrafo
        Returns:
            str: palabra con la vocal muda eliminada
    """
    palabra = palabra.replace('qu', 'q')
    for llana, tildada in (('e', 'é'), ('i', 'í')):
        palabra = palabra.replace('gu' + llana, 'g' + llana)
        palabra = palabra.replace('gu' + tildada, 'g' + tildada)
    # diéresis ortográfica: sólo la que va tras g o q
    for marcada, normal in (('ü', 'u'), ('ï', 'i')):
        for consonante in ('g', 'q'):
            palabra = palabra.replace(consonante + marcada, consonante + normal)
    return palabra


_H_INTERVOCALICA = re.compile('(?<=[%s])h(?=[%s])' % (''.join(vocales), ''.join(vocales)))

MARCAS = ('#', '~')


def sin_marcas(palabra):
    """Quita las marcas de sinéresis/diéresis, que son notación y no fonética.

    Sin esto, un verso etiquetado como '#óra' no "empieza por vocal" y se pierde
    la sinalefa con la palabra anterior.
    """
    for m in MARCAS:
        palabra = palabra.replace(m, '')
    return palabra


def empieza_por_vocal(palabra):
    palabra = sin_marcas(palabra)
    if not palabra:
        return False
    return (palabra[0] in vocales_y) or (palabra[0] == 'h' and palabra[1:2] in vocales_y)


def termina_por_vocal(palabra):
    palabra = sin_marcas(palabra)
    if not palabra:
        return False
    return (palabra[-1] in vocales_y) or (palabra[-1] == 'h' and palabra[-2:-1] in vocales_y)


def yeye(palabra):
    """Comprueba que la palabra que empieza por y griega no tiene un sonido vocálico. Se emplea para no hacer sinalefa

        Args:
            palabra (str): La palabra que puede empezar por y griega
        Returns:
            bool: devuelve True si la y griega no es vocálica en esa palabra
    """
    if (palabra[:2] in ['y' + vocal for vocal in vocales]) or (palabra[:3] == 'hie') or (palabra[:3] == 'hue'):
        return True
    # 'hon-' (honor, honra...) no impide la sinalefa: la h es muda y no hay
    # semiconsonante. Mantener el bloqueo cuesta ~0.3 puntos en ADSO.
    return False


def palabra_silabas_acentos(palabra):
    """Toma una palabra y devuelve el número de síalabas, la posición del acento y un factor
    de palabra aguda(1), llana (0) o esdrújula (-1) por si cae al final del verso

        Args:
            palabra (str): La palabra para contar sus sílabas
        Returns:
            tuple: una tupla con el número de síalabas, donde cae el acento y su clasificación
            (Número_de_sílabas, Sílaba_en_la_que_recae_el_acento, Factor_final_de_verso)
    """
    # si una sola letra
    if len(palabra) == 1:
        return (1, 1, FACTOR_AGUDA) if palabra in vocales_y else (0, None, FACTOR_LLANA)

    factor_final = 0
    num_silabas = 0
    palabra = normalizar_qu_gu(palabra)
    # La h intervocálica es muda y no rompe el diptongo: *sobrehumana* es
    # so-breu-ma-na y *prohibido* es proi-bi-do. Dejarla hacía contar una sílaba
    # de más, y como el par resultante sí es diptongo tampoco se ofrecía la
    # variante con sinéresis: la medida correcta quedaba fuera de alcance.
    palabra = _H_INTERVOCALICA.sub('', palabra)
    acento = None
    for i, c in enumerate(palabra):
        if c in vocales:
            num_silabas += 1
            if palabra[i - 1] + c in diptongos and not palabra[i - 1] in dieresis and num_silabas > 1:
                num_silabas -= 1
            # tilde
            if c in vocales_acentuadas:
                acento = num_silabas
    # Una palabra sin vocales (una interjección como *psst*, una cifra todavía
    # sin expandir) no tiene sílaba tónica. Devolver 0 como posición del acento
    # introduce una sílaba inexistente en el vector, que va desde 1.
    if num_silabas == 0:
        return 0, None, FACTOR_LLANA

    # como todas las esdrújulas se acentúan...
    if acento is None:
        # llana
        if palabra[-1] in ['n', 's'] + vocales:
            acento = num_silabas - 1
        # aguda
        else:
            acento = num_silabas
    
    if num_silabas == 1:
        acento = 1

    factor = num_silabas - acento
    if factor == 0:
        factor_final = FACTOR_AGUDA
    elif factor == 1:
        factor_final = FACTOR_LLANA
    elif factor > 1:
        factor_final = FACTOR_ESDRUJULA

    return num_silabas, acento, factor_final


DIGRAFOS = ('ch', 'll', 'rr')
# grupos de consonantes que no se separan: oclusiva o f + l/r
INSEPARABLES = ('pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr',
                'pl', 'bl', 'cl', 'gl', 'fl')


def nucleos_de_palabra(palabra):
    """Índices de las vocales que son núcleo de sílaba.

    Se deriva del MISMO recorrido que usa `palabra_silabas_acentos` para contar,
    de modo que el número de núcleos y el número de sílabas no pueden discrepar.

        Args:
            palabra (str): palabra ya normalizada
        Returns:
            list of int: posiciones, sobre la palabra normalizada, de cada núcleo
    """
    p = normalizar_qu_gu(palabra)
    p = _H_INTERVOCALICA.sub('', p)
    nucleos, num = [], 0
    for i, c in enumerate(p):
        if c not in vocales:
            continue
        num += 1
        if i and p[i - 1] + c in diptongos and p[i - 1] not in dieresis and num > 1:
            num -= 1
            # en un diptongo el núcleo es la vocal fuerte, o la segunda si ambas
            # son débiles: en *tierra* manda la e, no la i
            if nucleos and (c in 'aeoáéó' or p[nucleos[-1]] not in 'aeoáéó'):
                nucleos[-1] = i
            continue
        nucleos.append(i)
    return nucleos


def silabas_de_palabra(palabra):
    """Divide la palabra en sílabas.

    Reparte las consonantes entre núcleo y núcleo por las reglas de siempre: una
    consonante pasa a la sílaba siguiente; dos se separan salvo que formen
    dígrafo (ch, ll, rr) o grupo inseparable (oclusiva o f más l o r); de tres,
    la primera se queda y las otras pasan si forman grupo.

        Args:
            palabra (str): palabra ya normalizada
        Returns:
            list of str: las sílabas, que concatenadas dan la palabra
    """
    if not palabra:
        return []
    nucleos = nucleos_de_palabra(palabra)
    if len(nucleos) <= 1:
        return [palabra]
    # los índices son sobre la forma normalizada; se trasladan a la original
    # comparando letra a letra, que es lo único que cambia son supresiones
    mapa = _mapa_a_original(palabra)
    cortes = []
    for a, b in zip(nucleos, nucleos[1:]):
        norm = _H_INTERVOCALICA.sub('', normalizar_qu_gu(palabra))
        # sólo se reparten CONSONANTES: la otra vocal de un diptongo pertenece
        # al mismo núcleo y no entra en el reparto
        entre = [j for j in range(a + 1, b) if norm[j] not in vocales]
        if not entre:
            # hiato: el corte va entre las dos vocales
            corte = b
        else:
            # la regla general: a la sílaba siguiente pasa la última consonante,
            # o las dos últimas si forman dígrafo o grupo inseparable
            ultimas = norm[entre[-2]:entre[-1] + 1] if len(entre) >= 2 else ''
            corte = entre[-2] if (ultimas in DIGRAFOS or ultimas in INSEPARABLES) else entre[-1]
        corte = mapa.get(corte, corte)
        # la h es muda pero se escribe, y es ataque: viaja con su sílaba
        while corte > 0 and palabra[corte - 1] == 'h':
            corte -= 1
        cortes.append(corte)
    silabas, previo = [], 0
    for c in cortes:
        silabas.append(palabra[previo:c])
        previo = c
    silabas.append(palabra[previo:])
    return [s for s in silabas if s]


def _mapa_a_original(palabra):
    """Índice normalizado -> índice en la palabra original.

    `normalizar_qu_gu` suprime la vocal muda de los dígrafos y la h intervocálica;
    para dividir sobre el texto real hay que deshacer ese desplazamiento.
    """
    norm = _H_INTERVOCALICA.sub('', normalizar_qu_gu(palabra))
    mapa, j = {}, 0
    for i, c in enumerate(palabra):
        if j < len(norm) and norm[j] == c:
            mapa[j] = i
            j += 1
    mapa[len(norm)] = len(palabra)
    return mapa


'''
SUBMODULO DE AMBIGUEDADES: FUNCIONES PARA LA COMPARACION DE VECTORES DE ACENTOS
'''


def convertir_a_vector_binario(vector):
    """Toma un vector de acentos y lo convierte en vector binario
        Args:
            vector (list): Vector de acentos. Ej.: [2,6,10]
        Returns:
            list: un vector binario. Ej.: [False,True,False,False,False,False,True,False,False,False,True]
    """
    if not vector:
        return []
    vec_binario = []
    vec_op = vector[:]
    for j in range(vector[-1]):
        if j == vec_op[0]:
            vec_binario.append(True)
            vec_op.pop(0)
        else:
            vec_binario.append(False)
    return vec_binario


def comparar_acentos(vec_acentos1, vec_acentos2):
    """Toma dos vectores de acentos y devuelve un ratio de coincidencia

        Args:
            vec_acentos1 (list of ints): esquema acentual del verso a comparar
            vec_acentos2 (list of ints): esquema acentual del verso de referencia
        Returns:
            float: ratio de coincidencia (entre 0 y 1) entre ambos vectores
    """

    # si no son de la misma medida nos vamos
    if vec_acentos1[-1] != vec_acentos2[-1]:
        return 0

    comp1 = convertir_a_vector_binario(vec_acentos1)
    comp2 = convertir_a_vector_binario(vec_acentos2)
    puntos_vec = 0
    for i in range(len(comp1)):
        if comp1[i] == comp2[i]:
            puntos_vec += 1
    return puntos_vec / len(comp1)


def clasificar(num_silabas, acentos):
    """Toma el número de sílabas y acentos, y devuelve el tipo de verso más cercano dentro de la tradición métrica

        Args:
            num_silabas (int): Número de sílabas del verso
            acentos (list): Esquema de los acentos del verso
        Returns:
            tuple: una tupla con la clasificion del verso en la forma:
            (Numbre_del_verso, Acentos_ideales, Ratio_de_coincidencia_con_acentos_ideales)
    """
    if not acentos or num_silabas <= 0:
        return '', [], 0.0
    nombre = nombre_verso[num_silabas - 1] if num_silabas <= 18 else 'versículo'
    mejor_tipo = ['', []]
    mejor_ratio = 0
    if num_silabas <= 11 or num_silabas==14:
        for tipo in tipos_verso:
            if tipo[0][1][-1] == acentos[-1]:
                for subtipo in tipo:
                    ratio_v = comparar_acentos(acentos, subtipo[1])
                    if ratio_v > mejor_ratio:
                        mejor_ratio = ratio_v
                        mejor_tipo = subtipo
    else:
        return nombre, '-', 1.0
    return nombre + ' ' + mejor_tipo[0], mejor_tipo[1], mejor_ratio


'''
SUBMODULO DE TRATAMIENTO DE AMBIGUEDADES 
'''





def _mapa_digrafos(palabra):
    """Forma normalizada (sin la vocal muda de qu/gu) y mapa al índice original."""
    norm, mapa = [], []
    i = 0
    while i < len(palabra):
        par = palabra[i:i + 2]
        if par == 'qu' or (par == 'gu' and palabra[i + 2:i + 3] in ('e', 'i')):
            norm.append(palabra[i])
            mapa.append(i + 1)
        else:
            norm.append(palabra[i])
            mapa.append(i)
        i += 2 if (par == 'qu' or (par == 'gu' and palabra[i + 2:i + 3] in ('e', 'i'))) else 1
    return ''.join(norm), mapa



def posiciones_hiato(palabra):
    """Índices (sobre la palabra sin haches intercaladas) donde hay hiato."""
    p = palabra[:1] + palabra[1:].replace('h', '')
    return [i for i in range(len(p) - 1)
            if p[i] in vocales and p[i + 1] in vocales and p[i:i + 2] not in diptongos]


def quitar_hiato_en(palabra_op, k):
    """Deshace ÚNICAMENTE el k-ésimo hiato de la palabra (sinéresis puntual).

    `quitar_hiato` colapsa todos los hiatos de la palabra a la vez, de modo que
    'aéreo' sólo podía analizarse como bisílabo; aquí cada hiato es una decisión
    independiente y 'a-é-reo' / 'áe-re-o' son candidatos distintos.
    """
    simbolo_sineresis = '#'
    palabra = palabra_op[:1] + palabra_op[1:].replace('h', '')
    s_op, a_op, f_op = palabra_silabas_acentos(palabra_op)
    ya_tildada = any(c in vocales_acentuadas for c in palabra_op)
    pos = posiciones_hiato(palabra_op)
    if k >= len(pos):
        return None
    i = pos[k]
    if palabra[i + 1] in vocales_acentuadas:
        nueva = palabra[:i] + palabra[i + 1:]
    elif palabra[i] in vocales_acentuadas:
        nueva = palabra[:i + 1] + palabra[i + 2:]
    else:
        nueva = palabra[:i] + palabra[i + 1:]
        s_n, a_n, _ = palabra_silabas_acentos(nueva)
        # se mantiene el acento de la palabra original si el colapso lo desplaza
        if not ya_tildada and f_op != 1 and a_n != a_op and s_op <= 3 and nueva[i] in de_no_a_si_acentuadas:
            nueva = nueva[:i] + de_no_a_si_acentuadas[nueva[i]] + nueva[i + 1:]
    return nueva[:i] + simbolo_sineresis + nueva[i:]


def posiciones_diptongo(palabra):
    """Índices, EN EL ORDEN DE LA PALABRA, donde empieza un diptongo deshacible.

    `separar_diptongo` recorre la lista `diptongos` y devuelve el primero que
    encuentra, que no tiene por qué ser el primero del verso ni el único.
    """
    norm, mapa = _mapa_digrafos(palabra)
    out = []
    for i in range(len(norm) - 1):
        if norm[i:i + 2] in diptongos and not yeye(norm[i + 1:i + 3]):
            out.append(mapa[i] + 1)
    return out


def separar_diptongo_en(palabra, k):
    """Marca la diéresis en el k-ésimo diptongo de la palabra."""
    pos = posiciones_diptongo(palabra)
    if k >= len(pos):
        return None
    corte = pos[k]
    return palabra[:corte] + '~' + palabra[corte:]


def variantes_palabra(palabra):
    """Todas las realizaciones métricas alternativas de una palabra.

    La propia forma, más una por cada hiato que pueda deshacerse (sinéresis) y
    por cada diptongo que pueda romperse (diéresis). Cada posición es una
    alternativa independiente: *aéreo* admite `a#éreo` y `aer#o`, y tratarlas
    como una sola decisión hacía inalcanzable el análisis intermedio.

        Args:
            palabra (str): palabra ya normalizada
        Returns:
            list of str: la palabra y sus variantes, sin repetir
    """
    alt = [palabra]
    for k in range(len(posiciones_hiato(palabra))):
        v = quitar_hiato_en(palabra, k)
        if v and v not in alt:
            alt.append(v)
    for k in range(len(posiciones_diptongo(palabra))):
        v = separar_diptongo_en(palabra, k)
        if v and v not in alt:
            alt.append(v)
    return alt



def puntos_de_decision(verso_op, arte):
    """Localiza los puntos donde el verso admite más de un análisis.

    Devuelve (contactos_de_sinalefa, {indice_palabra: [variantes]}). Cada punto
    es una decisión binaria o n-aria independiente; el generador enumera su
    producto en lugar de componer los candidatos a posteriori.
    """
    contactos = []
    num_silabas = 0
    for i, palabra in enumerate(verso_op):
        silabas, acento, factor = palabra_silabas_acentos(palabra)
        sig = None if i == len(verso_op) - 1 else verso_op[i + 1]
        num_silabas += silabas
        cierra = (arte > 0 and palabra not in atonas
                  and en_hemistiquio(num_silabas, factor, arte))
        if sig and termina_por_vocal(palabra) and empieza_por_vocal(sig) \
                and not cierra and not yeye(sig):
            num_silabas -= 1
            contactos.append(i)
        if arte > 0 and palabra not in atonas and en_hemistiquio(num_silabas, factor, arte):
            num_silabas += factor
    alternativas = {}
    for i, palabra in enumerate(verso_op):
        alt = variantes_palabra(palabra)
        if len(alt) > 1:
            alternativas[i] = alt
    return contactos, alternativas


SIGNOS_PAUSA = frozenset(c for signo in puntos for c in signo if not c.isspace())

_cache_contexto = {}
SIN_CONTEXTO = {'pausa': (), 'interrogativo': False}


def contexto_verso(verso):
    """Recupera del verso ORIGINAL lo que el cómputo silábico descarta.

    `quitar_puntuacion` se aplica en la primera línea del análisis, de modo que
    el desambiguador no puede saber si un contacto de sinalefa cae en una pausa
    sintáctica — que es el rasgo que más predice la dialefa (x2.05 medido).
    Aquí se recupera esa información una sola vez, sin tocar el contador.

    Returns:
        dict: {'pausa': [bool]}  pausa[i] indica si hay signo de puntuación
              entre la palabra i y la i+1 del verso ya normalizado.
    """
    if verso in _cache_contexto:
        return _cache_contexto[verso]
    brutos = [t for t in verso.strip().split(' ') if t]
    limpios = [p for p in quitar_puntuacion(verso.lower()).strip().split(' ') if p]
    pausa = [False] * max(len(limpios), 1)
    # si la normalización ha alterado el número de tokens no arriesgamos la
    # alineación: se devuelve una máscara vacía y el rasgo simplemente no aporta
    if len(brutos) == len(limpios):
        for i in range(len(limpios) - 1):
            fin_izq = brutos[i][-1] in SIGNOS_PAUSA if brutos[i] else False
            ini_der = brutos[i + 1][0] in SIGNOS_PAUSA if brutos[i + 1] else False
            pausa[i] = fin_izq or ini_der
    ctx = {'pausa': pausa, 'interrogativo': ('?' in verso or '¿' in verso)}
    _cache_contexto[verso] = ctx
    return ctx


_cache_candidatos = {}


def generar_candidatos(verso, arte=0, max_licencias=None, max_candidatos=None):
    """Enumera los análisis posibles del verso como producto de sus ambigüedades.

    Devuelve una lista de (verso_ambiguo, numero_de_licencias) ordenada por
    número de licencias ascendente: primero el verso tal cual, luego los que
    usan una sola licencia, luego los que combinan dos, etc.
    """
    max_licencias = MAX_LICENCIAS if max_licencias is None else max_licencias
    max_candidatos = MAX_CANDIDATOS if max_candidatos is None else max_candidatos
    clave = (verso, arte, max_licencias, max_candidatos)
    if clave in _cache_candidatos:
        return _cache_candidatos[clave]

    verso_op = [p for p in quitar_puntuacion(verso.lower()).strip().split(' ') if p]
    contactos, alternativas = puntos_de_decision(verso_op, arte)
    puntos = [('d', c) for c in contactos] + [('w', i) for i in sorted(alternativas)]

    candidatos, vistos = [], set()
    for k in range(0, max_licencias + 1):
        if k > len(puntos):
            break
        for combo in itertools.combinations(puntos, k):
            opciones = [[(t, j, None)] if t == 'd' else [(t, j, v) for v in alternativas[j][1:]]
                        for t, j in combo]
            for asignacion in itertools.product(*opciones):
                tokens = verso_op[:]
                for t, j, v in asignacion:
                    if t == 'w':
                        tokens[j] = v
                for t, j, v in sorted(asignacion, key=lambda x: -x[1]):
                    if t == 'd':
                        tokens.insert(j + 1, '')
                cand = ' '.join(tokens)
                if cand in vistos:
                    continue
                vistos.add(cand)
                candidatos.append((cand, k))
                if len(candidatos) >= max_candidatos:
                    _cache_candidatos[clave] = candidatos
                    return candidatos
    _cache_candidatos[clave] = candidatos
    return candidatos


def resolver_ambiguedades(v_final, arte, detectar_amb, ctx=None):
    """Elige, entre todos los análisis posibles del verso, el que mide `detectar_amb`.

    Dos criterios, según `MEJORAS['politica']`:

    * **'patron'** (por defecto): puntúa cada candidato como
      `log P(patrón) + Σ log-odds(licencias)`. Los dos términos son
      log-probabilidades medidas sobre corpus, así que no hay ningún parámetro
      ajustado a mano y cada peso se puede justificar por separado.
    * **'original'**: la heurística publicada en IEEE Access — máximo parecido
      con el verso más próximo de la tradición, y ante empate se prefiere la
      dialefa a la diéresis y a la sinéresis. Se conserva para reproducir el
      artículo.

       Args:
           v_final (tuple): análisis sin desambiguar; se sustituye si hay uno mejor
           arte (int): medida del verso compuesto, para los hemistiquios
           detectar_amb (int): medida hacia la que se resuelve la ambigüedad
           ctx (dict): contexto del verso original, que los candidatos ya no llevan
       Returns:
           tuple: (verso etiquetado, sílabas, acentos, clasificación)
   """
    candidatos = generar_candidatos(v_final[0], arte)

    if MEJORAS['politica'] == 'patron' and MODELO_PATRONES is not None:
        mejor = None
        for v_amb, _n_lic in candidatos:
            _, silabas, acentos, _ = verso_silabas_acentos_tipo(v_amb, arte, 0, ctx)
            if silabas != detectar_amb:
                continue
            clasificacion = clasificar(silabas, acentos)
            puntuacion = (log_prob(MODELO_PATRONES, acentos, silabas)
                          + PESO_LICENCIAS * log_odds_licencias(v_amb, v_final[0]))
            if mejor is None or puntuacion > mejor:
                mejor = puntuacion
                v_final = v_amb, silabas, acentos, clasificacion
        return v_final

    # política 'original'
    mejor_ratio = 0
    for v_amb, _n_lic in candidatos:
        _, silabas, acentos, _ = verso_silabas_acentos_tipo(v_amb, arte, 0, ctx)
        if silabas != detectar_amb:
            continue
        clasificacion = clasificar(silabas, acentos)
        ratio = clasificacion[2]
        if mejor_ratio <= ratio:
            # ante empate se prefiere la dialefa: es la licencia más frecuente
            if mejor_ratio == ratio and ('~' in v_amb or '#' in v_amb):
                continue
            mejor_ratio = ratio
            v_final = v_amb, silabas, acentos, clasificacion
    return v_final


'''
MÓDULO DE ANALISIS DE VERSO
'''


def en_hemistiquio(num_silabas, factor, arte):
    """Toma un verso y devuelve su análisis métrico

        Args:
            num_silabas (int): numero de sílabas contadas hasta la palabra en proceso
            factor (int): factor de compensación de la palabra en proceso
            arte (int) número de silabas del verso de arte mayor cuyo hemistiquio se quiere detectar

        Returns:
            bool: devuelve True si el verso, con la palabra que se está procesando, llega a su hemistiquio, si no False
    """

    hemistiquio = arte / 2
    # para esdrújulas, se redondea hacia arriba
    if factor == FACTOR_ESDRUJULA:
        return num_silabas + factor == math.floor(hemistiquio)
    # para agudas y llanas hacia abajo
    else:
        return num_silabas + factor == math.ceil(hemistiquio)


def verso_silabas_acentos_tipo(verso, arte=0, detectar_amb=0, ctx=None):
    """Toma un verso y devuelve su análisis métrico

        Args:
            verso (str): El verso en forma de cadena de texto
            arte (int): El número de sílabas del verso para computar los hemistiquios (se activa recursivamente)
            detectar_amb (int): Número de sílabas hacia el que se quiere comprobar la ambiguedad del verso
            ctx (dict): contexto del verso original (pausas, interrogación). Los
                candidatos llegan aquí ya sin puntuación y no pueden deducirlo
                por sí mismos, así que lo hereda de quien sí vio el texto original

        Returns:
            list: una lista con el análisis métrico. Consiste en el número de síalabas (int), una lista
            de los acentos del verso (list of ints) y una tupla con la clasificion del verso con la forma
            (Numbre_del_verso, Acentos_ideales, Ratio_de_coincidencia_con_acentos_ideales)
    """

    if ctx is None:
        ctx = contexto_verso(verso) if any(c in verso for c in SIGNOS_PAUSA) else SIN_CONTEXTO

    num_silabas = 0
    # OJO: no se filtran los tokens vacíos. Una cadena vacía entre dos palabras
    # es precisamente la marca de dialefa, y quitarla deshace la licencia.
    verso_op = quitar_puntuacion(verso.lower()).strip().split(' ')
    palabras = [p for p in verso_op if p]
    acentos = []
    # un verso vacío o sólo con signos de puntuación no es un error del usuario:
    # se devuelve un análisis vacío bien formado
    if not palabras:
        return verso, 0, [], clasificar(0, [])
    palabra_final = palabras[-1]

    for i, palabra in enumerate(verso_op):
        if palabra:
            # silabas, acentos y factor de la palabra en proceso
            silabas, acento, factor = palabra_silabas_acentos(palabra)
            palabra_siguiente = None if i == len(verso_op) - 1 else verso_op[i + 1]
            # sumamos las silabas de la palabra en proceso
            num_silabas += silabas

            # cómputo de los abverbios en -mente (dos acentos)
            if palabra[-5:] == "mente" and len(palabra) > 5 and True:
                palabra_sin_mente = palabra.replace('mente', '')
                silabas_mente, acento_mente = 2, 1
                silabas_sin_mente, acento_sin_mente, factor_sin_mente = palabra_silabas_acentos(palabra_sin_mente)
                if acento_sin_mente is None:
                    acento_sin_mente = silabas_sin_mente
                acento_sin_mente = num_silabas - (silabas_sin_mente - acento_sin_mente) - silabas_mente
                # el acento del principio del adbervio
                if acento_sin_mente > 0:
                    acentos.append(acento_sin_mente)
                acentos.append(num_silabas - (silabas_mente - acento_mente))
            else:
                # cómputo del acento para el resto de palabras (un acento)
                if i == len(verso_op) - 1:
                    es_tonica = True
                else:
                    es_tonica = not es_atona(palabra, i, verso_op, ctx)
                # `acento is None` en palabras sin vocales (interjecciones como
                # *psst*): aportan cero sílabas y ninguna posición acentual
                if es_tonica and acento is not None:
                    acento_nuevo = num_silabas - (silabas - acento)
                    if acentos:
                        if acentos[-1] != acento_nuevo:
                            acentos.append(acento_nuevo)
                    else:
                        acentos.append(acento_nuevo)

            # sinalefas
            # La sinalefa no cruza la cesura, pero un hemistiquio NO puede acabar
            # en palabra átona: sin esa guarda, una preposición como *de* daba
            # falsamente por cerrado el hemistiquio, bloqueaba su propia sinalefa
            # y el verso salía con una sílaba de más.
            cierra_hemistiquio = (arte > 0 and palabra not in atonas
                                  and en_hemistiquio(num_silabas, factor, arte))
            if palabra_siguiente and termina_por_vocal(palabra) and empieza_por_vocal(
                    palabra_siguiente) and not cierra_hemistiquio \
                    and not yeye(palabra_siguiente):
                num_silabas -= 1

            # hemistiquios
            if arte > 0 and palabra not in atonas and en_hemistiquio(num_silabas, factor, arte):
                num_silabas += factor

    factor_palabra_final = palabra_silabas_acentos(palabra_final)[2] if palabra_final[-5:] != "mente" else 0
    num_silabas += factor_palabra_final

    # Un verso de más de once sílabas PUEDE ser compuesto: la cláusula rítmica
    # española no da para más, así que se parte en hemistiquios y cada uno lleva
    # su propia compensación final. Pero no todos lo son, y decidirlo por la
    # longitud es un error: medido, la cesura es imprescindible en el alejandrino
    # (0.79 frente a 0.62) y perjudica en 12, 13, 15, 16 y 17.
    # Así que se calculan las DOS lecturas y se queda la más probable, que es
    # para lo que sirve tener un modelo de la tradición.
    if num_silabas > 11 and arte == 0:
        simple = (num_silabas, acentos)
        _, n_comp, a_comp, _ = verso_silabas_acentos_tipo(verso, num_silabas, 0, ctx)
        if CESURA == 'clasica' or MODELO_PATRONES is None or not a_comp or not acentos:
            # Norma clásica: todo verso de más de once sílabas es compuesto,
            # porque la cláusula rítmica española no da para más.
            num_silabas, acentos = n_comp, a_comp
        else:
            def _verosimilitud(medida, patron):
                return (PRIOR_MEDIDA_EN_CESURA * log_prob_medida(MODELO_PATRONES, medida)
                        + log_prob(MODELO_PATRONES, patron, medida))
            if _verosimilitud(n_comp, a_comp) > _verosimilitud(*simple):
                num_silabas, acentos = n_comp, a_comp

    v_final = verso, num_silabas, acentos, clasificar(num_silabas, acentos)

    # módulo de desambiguación: sólo si se pide una medida concreta
    if detectar_amb > 0:
        v_final = resolver_ambiguedades(v_final, arte, detectar_amb, ctx)

    return v_final


'''
MÓDULO DE ANÁLISIS DE POEMAS ENTEROS
'''


def most_frequent(lista, constante=0.15):
    """Recibe una lista y extrae los elementos más frecuentes, por encima de una constante

       Args:
           lista (list): lista de elementos
           constante (float): valor entre 0 y 1 para indicar que no se tenga como frecuente la medida que no supere
                              esa frecuencia. Por defecto, no se consideran frecuentes las medidas por debajo de un 15%
       Returns:
           list: elementos más frecuentes de la lista
   """

    tabla_frecuencias = {}
    for item in lista:
        if item in tabla_frecuencias:
            tabla_frecuencias[item] += 1
        else:
            tabla_frecuencias[item] = 1
    tabla_frecuencias_iter = tabla_frecuencias.copy()
    for item in tabla_frecuencias_iter:
        tabla_frecuencias[item] /= len(lista)
        # si se repite más de un 15% (por defecto) lo consideramos como frecuente
        if tabla_frecuencias[item] < constante:
            tabla_frecuencias.pop(item)
    return dict(sorted(tabla_frecuencias.items(), key=lambda item_sort: item_sort[1], reverse=True))


def trocear_columna(x, c, i, contexto):
    """Recibe una tabla y trocea la columna que se indica desde la posicion i en un contexto del tamaño de 'contexto'.
    Se utiliza para obtener el contexto de un número determinado de versos. Posteriormente, se extraerá el número
    de sílabas más frecuente.

        Args:
            x (list): Lista del analizador de poemas
            c (int): Columna de la tabla
            i (int): posición del vector a partir de la que se quiere trocear
            contexto (int): contexto que se quiere extraer
        Returns:
            list: la rodaja de columna
    """

    if i < contexto:
        rodaja = x[:contexto]
    elif i + contexto >= len(x):
        rodaja = x[i:]
    else:
        rodaja = x[i - contexto:i + contexto]
    return list(map(list, zip(*rodaja)))[c]


def escandir_lista_versos(versos, contexto=14):
    """Toma una lista de versos y devuelve el análisis métrico

        Args:
            versos (list of str): Lista de versos
            contexto (int): en el caso en que se detecte un poema polimétrico, es el contexto para obtener
                            las medidas frecuentes
        Returns:
            list: una lista con el análisis métrico de todos los versos. Forma: [verso, v_etiquetado, silabas_v, acentos_v, acentos_ideales_v, tipo_v, ratio_v]
    """
    x = []
    nuevo = []
    # computo con modulo de ambiguedades desactivado
    for verso_a in versos:
        v = verso_a.strip().replace('\n', '')
        if not v:
            continue
        v_final, silabas_v, acentos_v, clasificacion_v = verso_silabas_acentos_tipo(verso_a, 0, 0)
        tipo_v, acentos_ideales_v, ratio_v = clasificacion_v
        x.append([v, v_final, silabas_v, acentos_v, acentos_ideales_v, tipo_v, ratio_v])

    # cálculo de versos frecuentes
    columna_silabas_v = list(map(list, zip(*x)))[2]
    versos_frecuentes = most_frequent(columna_silabas_v)
    if len(versos_frecuentes) == 1:
        metrica_mixta = False
    else:
        metrica_mixta = True

    # computo de versos ambiguos
    for i, dato_v in enumerate(x):
        silabas_v = dato_v[2]
        desambiguado = False

        # si es metrica mixta, se calculan las medidas frecuentes en un contexto n
        if metrica_mixta:
            columna_silabas_v = trocear_columna(x, 2, i, contexto)
            versos_frecuentes = most_frequent(columna_silabas_v)

        # aproximamos a los versos más frecuentes
        for verso_frecuente in versos_frecuentes:
            if silabas_v not in versos_frecuentes:
                v_final, silabas_v, acentos_v, clasificacion_v = verso_silabas_acentos_tipo(dato_v[0], 0,
                                                                                            verso_frecuente)
                tipo_v, acentos_ideales_v, ratio_v = clasificacion_v
                if silabas_v == verso_frecuente:
                    nuevo.append([dato_v[0], v_final, silabas_v, acentos_v, acentos_ideales_v, tipo_v, ratio_v])
                    desambiguado = True
        if not desambiguado:
            nuevo.append(dato_v)
    return nuevo


PRIOR_MEDIDA_PLANO = False
CESURA = 'clasica'
# 'clasica'  todo verso de más de once sílabas se lee como compuesto, que es la
#            doctrina (Navarro Tomás): la cláusula rítmica española no admite
#            más de once sílabas seguidas sin pausa.
# 'probable' se calculan las dos lecturas, simple y compuesta, y gana la más
#            probable según el modelo de la tradición. Rinde algo más en los
#            corpus medidos, pero es una decisión estadística y no normativa.
PRIOR_MEDIDA_EN_CESURA = 0.5   # el prior de medida empuja todo hacia el alejandrino,
# que es la medida larga más frecuente: se atempera para que no arrastre


def proyectar_marcas(verso_original, candidato):
    """Devuelve el verso del usuario con las marcas de licencia encima.

    El análisis trabaja sobre una forma normalizada (minúsculas, sin puntuación),
    así que devolverla tal cual deja al usuario un verso irreconocible:
    '¡Oh, bella Clori!' salía como 'oh bella clori'. Aquí las marcas de diéresis
    (~) y sinéresis (#) se trasladan a su posición equivalente en el texto
    original, y la dialefa se señala con un espacio doble.

        Args:
            verso_original (str): el verso tal cual lo escribió el autor
            candidato (str): la forma normalizada elegida, con sus marcas
        Returns:
            str: el verso original anotado
    """
    brutos = [t for t in verso_original.strip().split(' ') if t]
    toks = candidato.split(' ')
    salida, i = [], 0
    for tok in toks:
        if tok == '':
            # dialefa: se separa del anterior con un espacio de más
            if salida:
                salida.append('')
            continue
        if i >= len(brutos):
            salida.append(tok)
            continue
        original = brutos[i]
        i += 1
        for marca in MARCAS:
            j = tok.find(marca)
            if j < 0:
                continue
            # Cuántas letras (sin puntuación) preceden a la marca. La sinéresis
            # borra una vocal al fundirla, así que en el texto original la marca
            # va una letra más a la derecha, entre las dos vocales afectadas.
            letras = sum(1 for c in tok[:j] if c not in puntos)
            if marca == '#':
                letras += 1
            vistas, corte = 0, len(original)
            for k, c in enumerate(original):
                if vistas == letras:
                    corte = k
                    break
                if c not in puntos:
                    vistas += 1
            else:
                corte = len(original)
            original = original[:corte] + marca + original[corte:]
        salida.append(original)
    return ' '.join(salida)


def escandir_verso(verso):
    """Escande un verso SOLO, sin mirar el resto del poema.

    El módulo de poemas aproxima cada verso ambiguo a la medida más frecuente de
    su contexto. Es correcto para un poema, pero desconcierta cuando se analiza
    un verso suelto: el mismo verso cambia de análisis según sus vecinos.

    Aquí se elige la lectura más probable del verso en aislamiento:

        log P(medida) + log P(patrón | medida) + Σ log-odds(licencias)

    Los tres términos son log-probabilidades medidas, así que la lectura elegida
    es literalmente "la más probable si el verso se lee solo".

    Returns:
        list: [verso, verso_etiquetado, sílabas, acentos, acentos_ideales, tipo, ratio]
    """
    # las cifras y los romanos no aportan vocales: hay que leerlos antes de contar
    texto = expandir_numeros(verso)
    ctx = contexto_verso(texto)

    mejor, elegido = None, None
    if MODELO_PATRONES is not None:
        for cand, k in generar_candidatos(texto, 0):
            _, silabas, acentos, clas = verso_silabas_acentos_tipo(cand, 0, 0, ctx)
            if not acentos:
                continue
            p = (log_prob_medida(MODELO_PATRONES, silabas, PRIOR_MEDIDA_PLANO)
                 + log_prob(MODELO_PATRONES, acentos, silabas)
                 + PESO_LICENCIAS * log_odds_licencias(cand, texto))
            if mejor is None or p > mejor:
                mejor, elegido = p, (cand, silabas, acentos, clas)
    if elegido is None:
        # verso vacío, sólo puntuación o sin vocales: no hay nada que elegir
        v_f, silabas, acentos, clas = verso_silabas_acentos_tipo(texto, 0, 0, ctx)
        elegido = (v_f, silabas, acentos, clas)
    cand, silabas, acentos, clas = elegido
    return [verso, proyectar_marcas(texto, cand), silabas, acentos,
            clas[1], clas[0], clas[2]]


def escandir_poema(versos, contexto=14):
    """Escande un poema decidiendo primero si conoce su medida.

    * **Isométrico** (una sola medida frecuente): la medida del poema se conoce,
      y conviene imponerla — es lo que hace un lector que sabe que tiene delante
      un soneto. Se usa el módulo de poemas de siempre.
    * **Polimétrico**: imponer una medida estropea más de lo que arregla, así que
      cada verso se escande por sus propios méritos, con `escandir_verso`.

    Medido: en polimétrico esta regla gana 0.59 puntos frente a imponer la medida
    frecuente del contexto; en isométrico no cambia nada.
    """
    limpios = [v.strip().replace('\n', '') for v in versos]
    limpios = [v for v in limpios if v]
    if not limpios:
        return []
    base = [verso_silabas_acentos_tipo(v, 0, 0)[1] for v in limpios]
    if len(most_frequent(base)) == 1:
        return escandir_lista_versos(limpios, contexto)
    return [escandir_verso(v) for v in limpios]


DEBILES = 'iu'
CON_DIERESIS = {'i': 'ï', 'u': 'ü', 'í': 'ï', 'ú': 'ü',
                'a': 'ä', 'e': 'ë', 'o': 'ö'}


def _aplicar_dieresis(token):
    """Convierte la marca interna `~` en la diéresis ortográfica de verdad.

    `ru~ido` pasa a `rüido`, que es como se escribe y como lo divide el
    silabeador. La diéresis recae sobre la vocal débil del diptongo, que es la
    convención; si las dos son fuertes, sobre la primera.
    """
    j = token.find('~')
    if j < 0:
        return token
    limpio = token[:j] + token[j + 1:]
    izq, der = limpio[j - 1:j], limpio[j:j + 1]
    # la diéresis recae sobre la vocal DÉBIL, que es la que dejaría de ser
    # semivocal al deshacerse el diptongo: rüido, vïuda, süave. Si las dos son
    # débiles, sobre la primera, que es la que hace de semivocal.
    if izq.lower() in DEBILES:
        pos, vocal = j - 1, izq
    elif der.lower() in DEBILES:
        pos, vocal = j, der
    else:
        pos, vocal = j - 1, izq
    if not vocal:
        return limpio
    marcada = CON_DIERESIS.get(vocal.lower(), vocal)
    if vocal.isupper():
        marcada = marcada.upper()
    return limpio[:pos] + marcada + limpio[pos + 1:]


def _silabas_con_puntuacion(token):
    """Divide un token conservando mayúsculas y puntuación.

    `silabas_de_palabra` trabaja sobre la forma normalizada; aquí se traslada esa
    división al texto tal cual lo escribió el autor, repartiendo los signos con
    la sílaba a la que van pegados.
    """
    limpio = quitar_puntuacion(token).lower()
    if not limpio:
        return [token]
    trozos = silabas_de_palabra(limpio)
    salida, resto, i = [], token, 0
    for k, tr in enumerate(trozos):
        n = len(tr)
        letras, corte = 0, 0
        for corte, c in enumerate(resto):
            if letras == n and c not in puntos:
                break
            if c not in puntos:
                letras += 1
        else:
            corte = len(resto)
        if k == len(trozos) - 1:
            corte = len(resto)
        salida.append(resto[:corte])
        resto = resto[corte:]
    if resto:
        salida[-1] += resto
    return [x for x in salida if x]


def silabas_del_verso(verso):
    """Escansión del verso sílaba a sílaba, para poder mostrarla.

    Devuelve la división real del verso —la que produce la medida— con el texto
    tal cual lo escribió el autor y, en cada sílaba, qué licencia métrica la
    afecta y en qué punto exacto de su texto se produce la fusión. Es lo que hace falta para dibujar la escansión como se dibuja en un
    manual: el arco de sinalefa bajo las vocales que se funden, la diéresis sobre
    la vocal débil, la cesura en su sitio.

    Ojo: escande el verso por sus propios méritos, sin saber en qué poema está.
    Para dibujar un poema entero está `silabas_del_poema`, que es más fiable
    porque conoce la medida de sus vecinos.

        Args:
            verso (str): el verso tal cual
        Returns:
            dict: con `silabas` (lista), `medida`, `acentos`, `tipo` y `cesura`.
            Cada sílaba trae `texto`, `n`, `tonica`, `licencias` —'sinalefa'
            cuando une dos palabras, 'sineresis' cuando funde dos vocales de una
            misma, 'dieresis' cuando parte un diptongo— y `uniones`, los índices
            dentro de `texto` donde se juntan las vocales que se funden.
            `uniones` es lo que permite marcar la fusión en su sitio en vez de
            sobre la sílaba entera: una sílaba fundida puede ser ancha, y una
            marca estirada sobre toda ella no señala nada.
    """
    return _dibujar(verso, escandir_verso(verso))


def silabas_del_poema(versos):
    """Escansión dibujable de un poema entero, verso a verso.

    Igual que `silabas_del_verso`, pero escandiendo con `escandir_poema`, que en
    un poema isométrico impone la medida que el poema declara con su mayoría.
    Es lo que hace un lector al que ya le han dicho que tiene delante un romance:
    no vuelve a preguntarse cuántas sílabas tiene cada verso.

    La diferencia no es cosmética. La medida del poema es la que se evalúa
    contra los corpus anotados, y verso a verso el algoritmo acierta menos.

        Args:
            versos (list of str): los versos del poema
        Returns:
            list of dict: lo mismo que `silabas_del_verso`, uno por verso
    """
    limpios = [v.strip().replace('\n', '') for v in versos]
    limpios = [v for v in limpios if v]
    return [_dibujar(v, r) for v, r in zip(limpios, escandir_poema(limpios))]


def posicion_metrica(n, cesura, compensacion):
    """De número de sílaba escrita a posición métrica.

    No son lo mismo en cuanto hay compensación de hemistiquio, y los acentos
    vienen siempre en posiciones métricas. En «blandiera el brazo de Hércules, o
    el brazo de Sansón», *Hércules* es esdrújula y su última sílaba no cuenta:
    de ahí en adelante la sílaba escrita 14 —*són*— es la posición métrica 13,
    que es donde el análisis pone el último acento. Aplicarlos sobre la sílaba
    escrita marcaba como tónicas *o el* y *San*, que son átonas.

        Args:
            n (int): número de sílaba escrita, empezando en 1
            cesura (int): sílaba escrita tras la cual va la cesura, o None
            compensacion (int): sílabas métricas que el hemistiquio añade (+) o
                descuenta (-)
        Returns:
            int: la posición métrica, o None si la sílaba es la descontada
    """
    if cesura is None or not compensacion:
        return n
    if n < cesura:
        return n
    if n == cesura:
        # hemistiquio esdrújulo: la última sílaba escrita se descuenta y no
        # ocupa posición métrica ninguna
        return None if compensacion < 0 else n
    return n + compensacion


def _dibujar(verso, escansion):
    """Convierte una escansión ya decidida en sílabas dibujables.

    Se separa de quién la decidió —el verso suelto o el poema entero— porque el
    dibujo es el mismo y la decisión no.

    Va palabra por palabra, y no sílaba por sílaba, porque la cesura obliga: el
    hemistiquio se cierra en frontera de palabra y **la sinalefa no lo cruza**,
    que es exactamente lo que hace el cómputo de la medida. Dibujarlo de otro
    modo producía dos errores a la vez: la marca de cesura caía dentro de una
    palabra, y la sílaba que cerraba el hemistiquio se fundía con la siguiente,
    dejando el verso con una sílaba escrita menos de las que mide.
    """
    _verso, etiquetado, medida, acentos, ideales, tipo, ratio = escansion
    toks = etiquetado.split(' ')

    unidades = []          # (texto, corte de sinéresis, ¿lleva diéresis?) por palabra
    dialefa_tras = set()
    for t in toks:
        if not t:
            if unidades:
                dialefa_tras.add(len(unidades) - 1)
            continue
        # la posición de la marca dice QUÉ dos sílabas funde la sinéresis
        corte_sineresis = t.find('#')
        dieresis = '~' in t
        limpio = _aplicar_dieresis(t).replace('#', '')
        unidades.append((limpio, corte_sineresis, dieresis))

    fundidas = []
    cesura = None
    cierra_aqui = False     # ¿la palabra anterior cerró el hemistiquio?

    for i, (palabra, corte_sineresis, dieresis) in enumerate(unidades):
        trozos = _silabas_con_puntuacion(palabra)
        marca_en = None
        union_sineresis = None
        if corte_sineresis >= 0 and len(trozos) >= 2:
            # la sinéresis funde en una las dos sílabas que la marca separa
            acumulado = 0
            for k, tr in enumerate(trozos):
                acumulado += len(tr)
                if acumulado >= corte_sineresis:
                    break
            if k + 1 < len(trozos):
                # dónde, dentro del texto de la sílaba resultante, quedan pegadas
                # las dos que eran: es el punto que hay que marcar al dibujar
                union_sineresis = len(trozos[k])
                trozos = trozos[:k] + [trozos[k] + trozos[k + 1]] + trozos[k + 2:]
                marca_en = k

        for k, tr in enumerate(trozos):
            lic = ['sineresis'] if k == marca_en else []
            uniones = [union_sineresis] if k == marca_en else []
            if dieresis and any(c in 'ïüäëö' for c in tr):
                lic.append('dieresis')
            s = {'texto': tr, 'licencias': lic, 'uniones': uniones}

            # la sinalefa funde la última sílaba de una palabra con la primera de
            # la siguiente, si hay contacto vocálico, no hay dialefa, y el
            # hemistiquio no se cierra justo ahí
            previa = fundidas[-1] if fundidas else None
            fundible = (k == 0 and previa is not None and not cierra_aqui
                        and (i - 1) not in dialefa_tras)
            if fundible:
                # en minúsculas: las pruebas fonológicas comparan contra listas
                # de vocales minúsculas, y una mayúscula inicial hacía fallar la
                # sinalefa justo donde más se nota (de Amor, que Aníbal)
                izquierda = quitar_puntuacion(previa['texto']).lower()
                derecha = quitar_puntuacion(tr).lower()
                fundible = (izquierda and derecha and termina_por_vocal(izquierda)
                            and empieza_por_vocal(derecha) and not yeye(derecha))
            if fundible:
                # el punto de contacto es justo el espacio que separa las dos
                # palabras dentro de la sílaba fundida
                union = len(previa['texto'])
                previa['texto'] += ' ' + s['texto']
                previa['licencias'] = previa['licencias'] + ['sinalefa'] + s['licencias']
                previa['uniones'] = previa['uniones'] + [union] + \
                    [u + union + 1 for u in s['uniones']]
            else:
                fundidas.append(s)

        # ¿cierra esta palabra el hemistiquio? Misma regla que al medir: en
        # frontera de palabra, con el ajuste final de la palabra, y nunca en
        # átona, porque una preposición no sostiene una pausa
        cierra_aqui = False
        if cesura is None and medida > 11:
            limpia = quitar_puntuacion(palabra.lower()).strip()
            if limpia and limpia not in atonas:
                factor = palabra_silabas_acentos(limpia)[2]
                if en_hemistiquio(len(fundidas), factor, medida):
                    cesura = len(fundidas)
                    cierra_aqui = True

    # La medida no es el número de sílabas del texto: al final del verso se
    # suma una si acaba en aguda y se resta una si acaba en esdrújula, y en los
    # versos compuestos el hemistiquio lleva su propia compensación, que es una
    # sílaba métrica sin texto que la sostenga.
    ultima = quitar_puntuacion(verso.lower()).strip().split(' ')[-1] if verso.strip() else ''
    ajuste = palabra_silabas_acentos(ultima)[2] if ultima else 0
    compensacion = medida - len(fundidas) - ajuste

    for n, s in enumerate(fundidas, 1):
        s['n'] = n
        s['metrica'] = posicion_metrica(n, cesura, compensacion)
        s['tonica'] = s['metrica'] in acentos

    return {'verso': verso, 'silabas': fundidas, 'medida': medida,
            'silabas_reales': len(fundidas), 'acentos': acentos,
            'tipo': tipo, 'cesura': cesura,
            'ajuste_final': ajuste,
            'compensacion_cesura': compensacion}


NOMBRE_LICENCIA = {'dialefa': 'dialefa', 'dieresis': 'diéresis', 'sineresis': 'sinéresis'}
NOMBRE_FACTOR = {
    'fon|iguales': 'las dos vocales son la misma',
    'fon|triple': 'concurren tres o más vocales',
    'fon|tonica': 'una de las vocales es tónica',
    'fon|distintas': 'vocales distintas y átonas',
    'pausa|sí': 'hay pausa de puntuación',
    'pausa|no': 'sin pausa',
    'coh|átona+átona': 'entre dos palabras átonas',
    'coh|átona+tónica': 'palabra átona ante palabra plena',
    'coh|tónica+átona': 'palabra plena ante átona',
    'coh|tónica+tónica': 'entre dos palabras plenas',
    'pos|inicio': 'al principio de la palabra',
    'pos|medio': 'en medio de la palabra',
    'pos|final': 'al final de la palabra',
    'final|sí': 'en la última palabra del verso',
    'final|no': 'dentro del verso',
}


def explicar_factor(factor):
    """Un factor de contexto dicho en castellano llano.

    Los factores son cadenas internas —'coh|átona+tónica'— y ninguna debe
    llegar a una pantalla tal cual. La tabla cubre los cerrados; el par
    vocálico de la diéresis es abierto, hay tantos como diptongos, y se
    compone aquí.

        Args:
            factor (str): el factor, como lo devuelve rasgos.py
        Returns:
            str: la explicación, sin notación interna
    """
    if factor in NOMBRE_FACTOR:
        return NOMBRE_FACTOR[factor]
    if factor.startswith('voc|'):
        return 'sobre el diptongo «%s»' % factor[4:]
    # un factor nuevo sin explicación: mejor decir el nombre a secas que
    # enseñar la barra
    return factor.replace('|', ' ')


def alternativas(verso, maximo=6):
    """Las demás lecturas posibles del verso, ordenadas por verosimilitud.

    El desambiguador puntúa cada candidato como log P(patrón) más la suma de los
    log-odds de sus licencias. Aquí se devuelve esa cuenta desglosada, para poder
    explicar por qué se eligió una lectura y no otra en lugar de limitarse a
    dictarla.

        Args:
            verso (str): el verso tal cual
            maximo (int): cuántas lecturas devolver
        Returns:
            list of dict: cada una con `medida`, `acentos`, `tipo`, `puntuacion`,
            `patron` (el término de tradición), `licencias` (cada una con su
            contexto explicado y su peso) y `elegida`.
    """
    texto = expandir_numeros(verso)
    ctx = contexto_verso(texto)
    elegido = escandir_verso(verso)
    salida = []
    for cand, n_lic in generar_candidatos(texto, 0):
        _v, silabas, acentos, clas = verso_silabas_acentos_tipo(cand, 0, 0, ctx)
        if not acentos:
            continue
        patron = (log_prob_medida(MODELO_PATRONES, silabas)
                  + log_prob(MODELO_PATRONES, acentos, silabas)) \
            if MODELO_PATRONES is not None else 0.0
        detalle = []
        for tipo, factores in licencias_del_candidato(_api(), cand, texto):
            base = PESOS.get(tipo + '|BASE', 0.0)
            peso = base + ENCOGE_FACTORES * sum(
                PESOS.get(tipo + '|' + f, base) - base for f in factores)
            detalle.append({
                'tipo': NOMBRE_LICENCIA.get(tipo, tipo),
                'peso': round(peso, 3),
                'porque': [explicar_factor(f) for f in factores],
            })
        licencias = PESO_LICENCIAS * sum(d['peso'] for d in detalle)
        salida.append({
            'medida': silabas, 'acentos': acentos, 'tipo': clas[0],
            'patron': round(patron, 3), 'licencias': detalle,
            'puntuacion': round(patron + licencias, 3),
            'elegida': acentos == elegido[3] and silabas == elegido[2],
        })
    salida.sort(key=lambda x: -x['puntuacion'])
    vistas, unicas = set(), []
    for a in salida:
        clave = (a['medida'], tuple(a['acentos']))
        if clave in vistas:
            continue
        vistas.add(clave)
        unicas.append(a)
    return unicas[:maximo]


def escandir_texto(texto):
    """Toma un poema y devuelve el análisis métrico.

    Usa `escandir_poema`, que decide solo si conviene imponer la medida del
    contexto (poema isométrico) o escandir cada verso por sus propios méritos
    (poema polimétrico). Para un verso suelto, `escandir_verso`.

        Args:
            texto (str): Poema en forma de cadena de texto
        Returns:
            list: una lista con el análisis métrico de todos los versos
    """
    return escandir_poema(texto.split('\n'))


PESOS = {k: v["log_odds"] for k, v in _PESOS_EMBEBIDOS.items()}
MODELO_PATRONES = desde_dict(_PATRONES_EMBEBIDOS)
