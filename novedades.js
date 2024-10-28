// Función principal para analizar un verso
function versoSilabasAcentosTipo(verso, arte = 0, detectarAmb = 0) {
    let numSilabas = 0;
    const versoOp = quitarPuntuacion(verso.toLowerCase()).trim().split(' ');
    const acentos = [];
    const versosAmb = [];
    const palabraFinal = versoOp[versoOp.length - 1];
    
    // Nuevo: Arreglo para almacenar los recursos métricos
    const recursosMetricos = [];

    versoOp.forEach((palabra, i) => {
        if (palabra) {
            const [silabas, acento, factor] = palabraSilabasAcentos(palabra);
            const palabraSiguiente = i < versoOp.length - 1 ? versoOp[i + 1] : null;

            numSilabas += silabas;

            // Cálculo de los adverbios en -mente (dos acentos)
            if (palabra.endsWith('mente') && palabra.length > 5) {
                const palabraSinMente = palabra.replace('mente', '');
                const silabasMente = 2;
                const acentoMente = 1;
                const [silabasSinMente, acentoSinMente, factorSinMente] = palabraSilabasAcentos(palabraSinMente);
                const nuevoAcentoSinMente = numSilabas - (silabasSinMente - acentoSinMente) - silabasMente;
                acentos.push(acentoSinMente);
                acentos.push(numSilabas - (silabasMente - acentoMente));
            } else {
                // Cálculo del acento para el resto de palabras (un acento)
                if (!atonas.includes(palabra) || i === versoOp.length - 1) {
                    const acentoNuevo = numSilabas - (silabas - acento);
                    if (acentos.length > 0) {
                        if (acentos[acentos.length - 1] !== acentoNuevo) {
                            acentos.push(acentoNuevo);
                        }
                    } else {
                        acentos.push(acentoNuevo);
                    }
                }
            }

            // Sinalefas
            if (
                palabraSiguiente &&
                terminaPorVocal(palabra) &&
                empiezaPorVocal(palabraSiguiente) &&
                !enHemistiquio(numSilabas, factor, arte) &&
                !yeye(palabraSiguiente)
            ) {
                numSilabas -= 1;

                // Nuevo: Registrar sinalefa
                recursosMetricos.push({
                    tipo: 'Sinalefa',
                    entre: `Palabra ${i + 1} y Palabra ${i + 2}`
                });

                // Anotar dialefa (si se detecta)
                if (detectarAmb > 0) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i + 1, 0, ' ');
                    versosAmb.push(vAmb.join(' '));
                    
                    // Registrar dialefa
                    recursosMetricos.push({
                        tipo: 'Dialefa',
                        entre: `Palabra ${i + 1} y Palabra ${i + 2}`
                    });
                }
            }

            // Dieresis y Sineresis
            if (detectarAmb > 0) {
                // Anotar sineresis
                if (hayHiato(palabra)) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i, 1, quitarHiato(palabra));
                    versosAmb.push(vAmb.join(' '));

                    // Nuevo: Registrar sineresis
                    recursosMetricos.push({
                        tipo: 'Sineresis',
                        palabra: `Palabra ${i + 1}`
                    });
                }
                // Anotar dieresis
                if (hayDiptongo(palabra)) {
                    const vAmb = [...versoOp];
                    vAmb.splice(i, 1, separarDiptongo(palabra));
                    versosAmb.push(vAmb.join(' '));

                    // Nuevo: Registrar diéresis
                    recursosMetricos.push({
                        tipo: 'Diéresis',
                        palabra: `Palabra ${i + 1}`
                    });
                }
            }

            // Hemistiquios
            if (arte > 0 && !atonas.includes(palabra) && enHemistiquio(numSilabas, factor, arte)) {
                numSilabas += factor;
            }
        }
    });

    const factorPalabraFinal = palabraFinal.endsWith('mente') ? 0 : palabraSilabasAcentos(palabraFinal)[2];
    numSilabas += factorPalabraFinal;

    // Si es mayor de once, se vuelve a contar teniendo en cuenta el hemistiquio (llamada recursiva)
    if (numSilabas > 11 && arte === 0) {
        const resultado = versoSilabasAcentosTipo(verso, numSilabas, 0);
        numSilabas = resultado[1];
        acentos.length = 0;
        resultado[2].forEach(ac => acentos.push(ac));
    }

    let vFinal = [verso, numSilabas, acentos, clasificar(numSilabas, acentos)];

    // Módulo detección de ambigüedades
    if (detectarAmb > 0) {
        vFinal = resolverAmbiguedades(vFinal, versosAmb, arte, detectarAmb);
    }

    // Añadir los recursos métricos al resultado final
    vFinal.push(recursosMetricos);

    return vFinal;
}