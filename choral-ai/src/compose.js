// Fase 2 del proceso compositivo: realización de las voces sobre el plan armónico.
import { getClient, extractJson, effortForQuality } from './llm.js';
import { COMPOSITION_SCHEMA, validateComposition, repairRhythm, noteBeats } from './schema.js';
import { EXPRESSIVE_PALETTE } from './expressive.js';
import { MOTIVE_DEVELOPMENT } from './motive.js';
import { PHRASE_CONSTRUCTION } from './phrase.js';
import {
  QUARTAL_COMPOSE_SYSTEM,
  CONTEMPORARY_COMPOSE_SYSTEM,
  IMPRESSIONIST_COMPOSE_SYSTEM,
  PERSICHETTI_COMPOSE_SYSTEM,
  TERTIAN_COMPOSE_SYSTEM,
  ADDED_COMPOSE_SYSTEM,
  SECUNDAL_COMPOSE_SYSTEM,
  POLYCHORD_COMPOSE_SYSTEM,
  COMPOSITE_COMPOSE_SYSTEM,
  MIXTO_COMPOSE_SYSTEM,
  CHORD_CONNECTION,
  resolveSystems,
} from './systems.js';
import { melodyByMeasures } from './musicxml.js';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `Eres un compositor coral experto formado en la armonía de
ESTILO SEVERO (tratado de Rimsky-Korsakov). Realizas las voces sobre un plan
armónico dado, con conducción de voces impecable y melodías cantábiles.

PROCESO Y REGLAS (estilo severo, síguelas estrictamente):

1. ADHERENCIA AL PLAN ARMÓNICO Y DUPLICACIONES
   - En cada compás, las notas de los TIEMPOS FUERTES de todas las voces
     pertenecen al acorde indicado. El bajo canta la fundamental o la nota de la
     inversión indicada.
   - Duplicación: en estado fundamental duplica la FUNDAMENTAL; en acorde de sexta
     (1ª inversión) duplica la fundamental o la quinta; en acorde de cuarta y sexta
     (6/4) duplica el BAJO (la quinta del acorde). NUNCA dupliques la SENSIBLE
     (7º grado / 3ª de la dominante).

2. ENLACE Y MOVIMIENTO DE LAS VOCES
   - Mantén el sonido común en la misma voz cuando exista (enlace armónico).
   - Las tres voces superiores NO se mueven más de una TERCERA entre dos acordes.
   - Si dos acordes están a distancia de 2ª (grados conjuntos, sin nota común), las
     tres voces superiores se mueven juntas en dirección CONTRARIA al bajo.
   - Disposición: entre dos voces superiores contiguas, no más de una octava. Evita
     los cruces de voces.

3. SUCESIONES PROHIBIDAS (absolutas)
   - PROHIBIDAS las quintas, octavas y unísonos PARALELOS (consecutivos).
   - Evita las quintas y octavas DIRECTAS (llegar a una 5ª u 8ª justa por
     movimiento directo entre las voces extremas).
   - PROHIBIDOS los intervalos melódicos AUMENTADOS (en especial la 2ª aumentada
     del modo menor/mayor armónico y la 4ª aumentada).
   - El cromatismo debe ocurrir en la MISMA voz: si la nota natural y su alteración
     (p. ej. fa y fa♯) aparecen en VOCES DISTINTAS en acordes contiguos, surge una
     FALSA RELACIÓN, prohibida.

4. RESOLUCIÓN DE DISONANCIAS (clave: NADA sin resolver)
   - La SENSIBLE asciende a la tónica, sobre todo en las voces extremas; en una voz
     interna puede descender a la quinta de la tónica.
   - SÉPTIMA DE DOMINANTE: la 7ª SIEMPRE desciende por grado conjunto a la 3ª de la
     tónica, en estado fundamental y en TODAS las inversiones; la 3ª inversión (7ª
     en el bajo) resuelve en el acorde de sexta de tónica (I6). Cuando se llega desde
     IV o II, la 7ª se PREPARA como sonido común. En la cadencia evitada (V→vi)
     duplica la 3ª del acorde de vi.
   - SÉPTIMA DE SENSIBLE (VII7): resuelve en la tónica con la 3ª DUPLICADA — la
     sensible asciende a la tónica y la 7ª desciende a la 5ª de la tónica.
   - SÉPTIMA DEL II GRADO (ii7, predominante): la 7ª va PREPARADA (sonido común desde
     I/I6/IV/IV6/VI); al seguir V o V7 desciende un semitono; si sigue el 6/4
     cadencial, permanece fija formando su cuarta.
   - ACORDE DE NOVENA (V9): la novena desciende por grado conjunto al resolver; las
     demás voces, como en la séptima de dominante.
   - NAPOLITANA (♭II6): se usa con la 3ª duplicada; el ♭2 (su fundamental) desciende
     al resolver a V o al 6/4 cadencial.
   - SEXTA AUMENTADA (italiana/francesa/alemana): la 6ª aumentada se EXPANDE hacia
     afuera (a la octava de la dominante) y nunca se duplica; resuelve en V o en el
     6/4 cadencial.
   - Estilo CORAL: prefiere las INVERSIONES de la 7ª de dominante (6/5, 2); evita el
     V7 en estado fundamental con la 7ª en la voz superior (salvo séptima de paso).
   - NOTAS EXTRAÑAS al acorde: notas de PASO y BORDADURAS por grado conjunto en
     tiempo débil; APOYATURAS (notas extrañas acentuadas, en tiempo fuerte) que
     resuelven por grado conjunto; RETARDOS preparados que resuelven DESCENDIENDO por
     grado conjunto; ANTICIPACIONES (una nota del acorde SIGUIENTE sonada antes, en
     tiempo débil); y notas CAMBIADAS/escapadas (dejadas por salto, justificadas por
     la nota de paso omitida o por pertenecer al acorde siguiente). No dejes 2ª ni 7ª
     sin sentido ni sin resolver.
   - PEDAL (nota pedal / bajo de órgano): una voz —normalmente el bajo— puede
     SOSTENER la tónica o la dominante mientras las demás voces se mueven con otras
     armonías por encima; empieza y termina el pedal en consonancia.

5. MELODÍA (líneas cantábiles, no relleno)
   - Cada voz tiene dirección y un único clímax por frase; movimiento
     mayoritariamente por grados conjuntos; los saltos (sobre todo grandes) se
     compensan por grado conjunto en dirección contraria.
   - RITMO REALISTA: el canto expresivo NO es todo binario. Usa TRESILLOS
     ("tuplet":3) y a veces seisillos con frecuencia en la voz melódica — es lo que
     da naturalidad; una melodía sin ningún tresillo suena mecánica. Recuerda que un
     tresillo de 3 corcheas ocupa 1 negra (el espacio de 2 corcheas), no 1½, para que
     el compás siga cuadrando.
   - Evita notas repetidas estáticas y ámbitos excesivos. Encamina las frases a la
     cadencia; el final debe sonar conclusivo, con la TÓNICA en la voz superior
     (soprano) sobre tiempo fuerte (cadencia auténtica perfecta).
   - Moldea las frases con DINÁMICAS (campo dynamic), con moderación: regulador "<"
     hacia el punto culminante y ">" al relajar; matiz al inicio de cada sección.

6. TEXTURA: respeta la textura solicitada (homofonía, contrapunto, canon, fuga),
   pero SIEMPRE sobre el plan armónico y con las disonancias resueltas.

7. MODULACIÓN: el plan armónico puede modular a tonalidades vecinas. Sigue los
   acordes dados con sus alteraciones exactas y aplica las mismas reglas de
   resolución a la dominante de CADA tonalidad (sensible al alza, 7ª a la baja).

8. Cada voz cuadra exactamente los compases en el compás indicado y permanece en su
   tesitura. Usa silencios para entradas/finales escalonados.

Devuelve ÚNICAMENTE la composición conforme al esquema solicitado.`;

function buildUserPrompt(params, parts, texture, harmonyText) {
  const {
    theme,
    lyrics,
    key = 'C',
    mode = 'major',
    timeSignature = '4/4',
    tempo = 72,
    measures = 8,
  } = params;

  const hasSoloists = parts.some((p) => p.solo);
  const voiceList = parts
    .map((p, i) => {
      const role = p.solo ? ' [SOLISTA: línea florida/melismática por encima]' : '';
      return `  ${i + 1}. ${p.name} (tesitura ${p.low}–${p.high})${role}`;
    })
    .join('\n');

  const lines = [
    `Realiza las voces de una pieza coral sobre el plan armónico dado:`,
    `- Tonalidad: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Tempo: ${tempo} (negra = bpm)`,
    `- Número de compases: ${measures}`,
    `- Voces (${parts.length}), en este orden exacto:`,
    voiceList,
  ];
  if (hasSoloists) {
    lines.push(
      '- Hay SOLISTAS: esas voces cantan líneas floridas, ornamentadas y melismáticas ' +
        'que flotan por encima; las demás voces forman el coro/colchón sostenido.',
    );
  }
  if (texture) lines.push(`- Textura / técnica: ${texture.label}\n  ${texture.prompt}`);
  if (theme) lines.push(`- Tema o carácter: ${theme}`);
  if (lyrics) {
    lines.push(`- Letra para cantar:\n"""${lyrics}"""`);
  } else {
    lines.push(`- Sin letra: usa una vocalización (p. ej. "Ah") o silabea con "la".`);
  }
  if (harmonyText) {
    lines.push(`\nPLAN ARMÓNICO (un acorde por compás — respétalo):\n${harmonyText}`);
  }
  // Modo "armonizar melodía dada": la voz 1 es la melodía del usuario, INTOCABLE.
  if (params.melody) {
    const mainName = parts[0] ? parts[0].name : 'voz superior';
    lines.push(
      `\nMELODÍA FIJA DEL USUARIO — tu tarea es SOLO ARMONIZARLA:\n` +
        `- La VOZ 1 (${mainName}) YA está dada: es esta melodía. Cópiala EXACTAMENTE nota ` +
        `por nota (misma altura, octava, ritmo y letra); NO añadas, quites ni cambies ` +
        `ninguna nota de la voz 1.\n` +
        `- Tu trabajo es COMPONER las demás voces por DEBAJO para armonizarla siguiendo el ` +
        `plan armónico, con conducción de voces impecable (evita 5as/8as paralelas, resuelve ` +
        `las disonancias, buen bajo).\n` +
        `- RESPETA LA TEXTURA elegida${texture ? ` ("${texture.label}")` : ''} en las voces de ` +
        `acompañamiento: NO las conviertas por defecto en un colchón de redondas. Si la ` +
        `textura es de CONTRAPUNTO, cada voz de acompañamiento debe ser una LÍNEA melódica ` +
        `INDEPENDIENTE, con su propio ritmo y movimiento (corcheas, negras, notas de paso, ` +
        `imitaciones del motivo de la melodía), dialogando con la melodía; si es homofonía, ` +
        `acordes homorrítmicos; si es colchón/tarareo, notas largas sostenidas. Da VIDA ` +
        `rítmica al acompañamiento acorde a la textura.\n` +
        `- Melodía compás por compás (nota+octava/figura; 4=negra, 8=corchea, 2=blanca, ` +
        `"."=puntillo):\n` +
        melodyByMeasures(params.melody, { withDuration: true }),
    );
    if (params.melody.meters) {
      lines.push(
        `- El COMPÁS cambia por compás (respeta estos compases exactos en TODAS las voces): [` +
          params.melody.meters.join(', ') + `].`,
      );
    }
  }
  // OPCIÓN "escritura coherente con la soprano": solo si el usuario la elige, y
  // nunca en texturas de COLCHÓN (sustained). El movimiento se logra DENTRO de las
  // reglas de armonía y conducción de voces (notas extrañas legítimas), sin
  // transgredir ninguna prohibición del sistema/contrapunto activo.
  if (params.voiceRhythm === 'coherente' && !(texture && texture.sustained)) {
    lines.push(
      '\nESCRITURA COHERENTE CON LA SOPRANO (opción elegida por el usuario): TODAS las voces ' +
        'deben tener VIDA rítmica comparable a la de la soprano — el contralto, el tenor y el ' +
        'BAJO no van en solo redondas y blancas.\n' +
        '- MUY IMPORTANTE: esto NO cambia ni relaja NINGUNA regla armónica ni de conducción de ' +
        'voces. El movimiento se consigue DENTRO de las reglas, con los recursos que la propia ' +
        'armonía permite: notas de PASO, BORDADURAS, RETARDOS (suspensiones), ANTICIPACIONES, ' +
        'notas cambiadas/escapadas y ARPEGIOS del acorde vigente. Sigue estando PROHIBIDO todo ' +
        'lo prohibido (5as/8as paralelas y directas, disonancias sin preparar/resolver, falsas ' +
        'relaciones, 2as aumentadas melódicas, duplicar la sensible…).\n' +
        '- BAJO: se mueve como una LÍNEA (grados conjuntos, arpegio de las notas del acorde, ' +
        'notas de paso hacia el acorde siguiente), NO como un pedal; pero en los TIEMPOS ' +
        'FUERTES sigue cantando la fundamental o la nota de la inversión indicada por el plan.\n' +
        '- IMITACIÓN (en CONTRAPUNTO): las voces RETOMAN las FIGURAS rítmico-melódicas de la ' +
        'soprano/contralto (eco/pregunta-respuesta). En HOMOFONÍA se mueven JUNTAS con ese ' +
        'mismo ritmo activo. Reserva las notas largas para reposos y cadencias.',
    );
  }
  // Cambio de armadura solo en modulaciones LARGAS (no en tonicizaciones breves).
  // Con melodía fija, la tonalidad la manda el archivo: no invitamos a modular.
  if (!params.melody) {
    lines.push(
      '\nARMADURA: si la pieza MODULA a una nueva tonalidad que se SOSTIENE varios ' +
        'compases (aprox. 4 o más), declara el cambio de armadura en "keyChanges" con el ' +
        'compás donde empieza la nueva tonalidad, su tónica y su modo (puede haber varios). ' +
        'Mantén "key"/"mode" como la tonalidad INICIAL. Para tonicizaciones o desvíos ' +
        'BREVES (1–2 compases) NO cambies la armadura: deja las alteraciones sueltas en las ' +
        'notas. Si no hay modulación prolongada, omite "keyChanges".',
    );
  }
  // La métrica cambiante es un recurso del s.XX; NO se ofrece si hay base tonal
  // (ni tonal pura ni tonal+color): con centro tonal el compás se mantiene estable.
  const systems = resolveSystems(params.systems ?? params.system);
  const nonTonal = !systems.includes('tonal');
  if (nonTonal && !params.melody) {
    lines.push(
      `\nMÉTRICA CAMBIANTE (opcional, estilo báltico/impresionista): si la prosodia ` +
        `del texto lo pide, puedes devolver además un campo "meters" con UN compás ` +
        `por cada uno de los ${measures} compases (longitud exacta = ${measures}), ` +
        `mezclando compases simples y aditivos según el acento natural de las ` +
        `palabras (p. ej. ["3/4","2+3+3/8","2+3/8","2+2/8"]). El primero de la lista ` +
        `debe coincidir con "timeSignature". Si la pieza mantiene un compás fijo, ` +
        `omite "meters".`,
    );
  }
  // Artesanía melódica: lo que separa una melodía lograda de una plana. Aplica a
  // TODOS los sistemas (a la voz que lleva el canto y, en lo posible, a todas).
  // Con melodía FIJA del usuario, este bloque no aplica (la melodía no se inventa):
  // se omite junto al motivo, el fraseo y el melisma; solo se conserva la paleta
  // expresiva (matices/carácter) para las voces de acompañamiento.
  if (!params.melody) {
  lines.push(
    '\nMELODÍA (ARTESANÍA — esto es lo que evita melodías planas; aplícalo sobre todo a la ' +
      'voz que lleva el canto):\n' +
      '- MOTIVO: crea al principio una CÉLULA melódico-rítmica breve y reconocible y ' +
      'DESARRÓLLALA a lo largo de la pieza (repetición, secuencia/transposición, inversión, ' +
      'ampliación, fragmentación). NO inventes material nuevo y sin relación en cada compás.\n' +
      '- FRASEO en ARCO: agrupa en frases (2, 4 u 8 compases), cada una con UNA sola cima a ' +
      'la que se asciende y desde la que se relaja; encadena antecedente–consecuente ' +
      '(pregunta/respuesta) y RESPIRA entre frases (silencios o notas largas). La pieza ' +
      'entera tiene UN clímax, preparado y luego liberado.\n' +
      '- CONTORNO: mayormente por grados conjuntos, pero con algún SALTO EXPRESIVO (6ª, 8ª o ' +
      'un intervalo llamativo) en el punto emotivo, COMPENSADO después por grado conjunto en ' +
      'dirección contraria (rellena el hueco). Evita el vagar sin rumbo y las notas ' +
      'repetidas estáticas.\n' +
      '- RITMO con VIDA: no muevas todas las voces con el MISMO ritmo ni todo en negras. ' +
      'Contrasta notas LARGAS sostenidas con figuras que fluyen; usa anacrusas, síncopas, ' +
      'puntillos, ligaduras y GRUPOS IRREGULARES (tresillos "tuplet":3, seisillos "tuplet":6, ' +
      'quintillos "tuplet":5) para floreos y melismas ágiles al estilo báltico; aprovecha el ' +
      'vaivén de la métrica. Evita el "una nota por pulso" monótono.\n' +
      '- NOTAS EXTRAÑAS expresivas: usa apoyaturas, RETARDOS (suspensiones), notas de paso y ' +
      'bordaduras para dar anhelo y dirección; la melodía NO debe limitarse a arpegiar el ' +
      'acorde (respeta las reglas de resolución del sistema activo).\n' +
      '- TEXTO: coloca la CIMA melódica y las notas largas sobre las sílabas ACENTUADAS o ' +
      'palabras importantes; usa MELISMAS para resaltar palabras clave (text painting); ' +
      'respeta el acento natural del texto.',
  );
  // Grado de MELISMA (control del usuario): cuántas notas por sílaba.
  const melisma = params.melisma || 'moderado';
  if (melisma === 'melismatico') {
    lines.push(
      '\nMELISMA (MUY FLORIDO): escribe líneas MUY melismáticas — con FRECUENCIA varias ' +
        'notas por sílaba (grupos de 2 a 6 notas), sobre todo en la VOZ QUE LLEVA EL CANTO / ' +
        'solista, en las PALABRAS IMPORTANTES y en las CIMAS de frase; adorna con giros por ' +
        'grado conjunto, bordaduras y pequeñas escalas (text painting). Usa TRESILLOS ' +
        '("tuplet":3) y SEISILLOS ("tuplet":6) para las floritures ágiles (así se logra el ' +
        'fraseo ondulante báltico, no todo binario). MUY IMPORTANTE para ' +
        'la letra: pon la sílaba SOLO en la PRIMERA nota del grupo y deja el campo "lyric" ' +
        'VACÍO ("") en las notas restantes del melisma. Alterna los pasajes floridos con ' +
        'momentos más silábicos para que el texto siga entendiéndose y para dar respiro.',
    );
  } else if (melisma === 'silabico') {
    lines.push(
      '\nMELISMA (SILÁBICO): escribe UNA sílaba por nota (estilo silábico, tipo himno/coral). ' +
        'Evita los melismas salvo un adorno muy puntual en una cadencia o en la palabra más ' +
        'importante. Prioriza la claridad e inteligibilidad del texto.',
    );
  } else {
    lines.push(
      '\nMELISMA (MODERADO): mayormente silábico, PERO con MELISMAS expresivos (2–4 notas por ' +
        'sílaba) en las sílabas ACENTUADAS, las palabras clave y las CIMAS de frase (text ' +
        'painting). En cada melisma pon la sílaba en la PRIMERA nota y deja el "lyric" VACÍO ' +
        'en las notas siguientes.',
    );
  }
  // VARIEDAD RÍTMICA (anti-monotonía). El fallo típico es repetir la MISMA célula
  // (p. ej. negra–tresillo–blanca) compás tras compás. Se exige paleta amplia y
  // NO repetir el mismo patrón; el tresillo es UN color entre varios, no un molde.
  lines.push(
    '\nVARIEDAD RÍTMICA (MUY IMPORTANTE — evita la monotonía): el error más grave es REPETIR la ' +
      'MISMA célula rítmica compás tras compás (p. ej. "negra + tresillo + blanca" una y otra ' +
      'vez). PROHIBIDO. Cada frase debe tener un PERFIL rítmico DISTINTO al de la anterior. Usa ' +
      'una PALETA AMPLIA y combínala con naturalidad:\n' +
      '- figuras variadas: redondas, blancas, negras, corcheas, SEMICORCHEAS, y sus PUNTILLOS ' +
      '(negra con puntillo + corchea, corchea con puntillo + semicorchea);\n' +
      '- SÍNCOPAS y notas a CONTRATIEMPO; ANACRUSAS (empezar la frase en anacrusa); LIGADURAS de ' +
      'valor que cruzan el pulso; SILENCIOS expresivos (respiraciones) que separan las frases;\n' +
      '- NOTAS LARGAS de reposo al final de frase y en las cadencias, contrastando con pasajes ' +
      'más ágiles: alterna DENSIDAD (compases movidos) y CALMA (compases sostenidos).\n' +
      '- DESARROLLO: cuando repitas un motivo, VÁRIALO rítmicamente (aumentación, disminución, ' +
      'desplazamiento del acento), no lo calques.\n' +
      'GRUPOS IRREGULARES: el TRESILLO (y a veces el seisillo) es UN color MÁS para dar soltura ' +
      '—NO un molde—: úsalo SOLO de vez en cuando (alguna anacrusa, algún giro florido), NUNCA ' +
      'en todos los compases ni siempre en el mismo sitio. Muchos compases NO llevan ningún ' +
      'tresillo. CÓMO: marca cada nota del grupo con "tuplet":3 (o 6), en figuras iguales y en ' +
      'número igual al grupo. CONTEO (para que cuadre el compás): un tresillo de 3 corcheas ' +
      '("duration":8,"tuplet":3) ocupa 1 NEGRA (no 1½); un tresillo de 3 negras ("duration":4,' +
      '"tuplet":3) ocupa 2 negras.\n' +
      'EJEMPLO de VARIEDAD (cuatro compases en 4/4, cada uno DISTINTO): ' +
      'c1 negra con puntillo + corchea + blanca; c2 cuatro corcheas + dos negras; c3 blanca + ' +
      'tresillo de negras; c4 corchea (anacrusa ligada) + semicorcheas + negra + silencio. ' +
      'Fíjate en que NINGÚN compás repite el patrón del anterior.',
  );
  lines.push('\n' + MOTIVE_DEVELOPMENT);
  lines.push('\n' + PHRASE_CONSTRUCTION);
  }
  lines.push('\n' + EXPRESSIVE_PALETTE);
  // DIVISI: cualquier voz puede dividirse en un acorde en su propio pentagrama.
  // Lo controla el usuario (params.divisi): auto (con criterio) / generoso / no.
  const divisi = params.divisi || 'auto';
  const divisiExample =
    'EJEMPLO — una soprano en La4 dividida a2 con Re5: {"step":"A","alter":0,"octave":4,' +
    '"chord":[{"step":"D","alter":0,"octave":5}], …}.';
  if (divisi === 'no') {
    lines.push(
      '\nDIVISI: NO dividas las voces. UNA sola nota por voz en toda la pieza (no uses el campo ' +
        '"chord").',
    );
  } else if (divisi === 'generoso') {
    lines.push(
      '\nDIVISI GENEROSO (¡ÚSALO A MENUDO Y A LO LARGO DE TODA LA OBRA!): ENRIQUECE la armonía ' +
        'DIVIDIENDO las voces en acordes con el campo "chord" de la nota (alturas ADICIONALES ' +
        'simultáneas, mismo ritmo). Busca sonoridades AMPLIAS de 6 a 8 sonidos reales repartiendo ' +
        'divisi entre varias voces (la S, la A, el T y el B pueden dividirse a2 o a3). ' +
        'REPARTE el divisi por VARIOS momentos DISTINTOS de la pieza (NO SOLO en el acorde final): ' +
        'úsalo en el primer TERCIO, en el CENTRO y en el ÚLTIMO tercio, en cada clímax de frase, en ' +
        'las aperturas de sección y en los colchones sostenidos. Como mínimo divide alguna voz en ' +
        'VARIOS compases interiores repartidos, no solo al cerrar. Cada divisi respeta la tesitura ' +
        'de su voz. ' +
        divisiExample,
    );
  } else {
    lines.push(
      '\nDIVISI (úsalo con criterio, pero ÚSALO EN VARIOS PUNTOS): para ENRIQUECER la armonía, ' +
        'DIVIDE alguna voz en un acorde con el campo "chord" (alturas ADICIONALES simultáneas, ' +
        'mismo ritmo). REPÁRTELO a lo largo de la obra —en distintos CLÍMAX de frase, APERTURAS de ' +
        'sección y COLCHONES sostenidos del interior— y NO SOLO en el acorde final: que haya divisi ' +
        'también en compases INTERIORES. CUALQUIER voz (S/A/T/B) puede dividirse, respetando su ' +
        'tesitura. ' +
        divisiExample,
    );
  }
  // COHERENCIA HASTA EL FINAL: evita el error de que, cuando la melodía ya
  // terminó, las voces sigan con cromatismo sin criterio hasta rellenar los
  // compases pedidos. La pieza debe cerrar con lógica, no con "relleno".
  lines.push(
    '\nCOHERENCIA HASTA EL ÚLTIMO COMPÁS (¡MUY IMPORTANTE!): TODA nota de TODOS los compases ' +
      'pertenece al acorde vigente del PLAN ARMÓNICO o es una nota extraña (paso, bordadura, ' +
      'retardo, apoyatura, anticipación) que RESUELVE. PROHIBIDO el "relleno" cromático sin ' +
      'criterio: nada de notas sueltas ni acordes que no salgan del plan, sobre todo al final.\n' +
      '- SI LA PIEZA ES MÁS LARGA que el material temático, NO improvises un tramo de relleno: ' +
      'DESARROLLA el material (repetición, secuencia/transposición, variación, imitación entre ' +
      'voces) manteniéndote SIEMPRE dentro del plan armónico.\n' +
      '- CIERRE: los ÚLTIMOS 1–2 compases deben REPOSAR en una sonoridad CLARA y estable (la ' +
      'tónica/centro), preparada con lógica (cadencia en tonal; reposo/permanencia en s.XX). ' +
      'El acorde final es limpio y reconocible, NUNCA un amontonamiento cromático.\n' +
      '- Cuando una voz calla o sostiene, las demás siguen dibujando el MISMO acorde del plan; ' +
      'ninguna voz "se va por libre" con notas ajenas.',
  );
  lines.push(
    `\nDevuelve un array "voices" con EXACTAMENTE ${parts.length} voces, en ese ` +
      `orden y con esos nombres. Cada voz debe sumar ${measures} compases (usando ` +
      `"meters" si lo incluyes, o "${timeSignature}" en todos si no).`,
  );
  return lines.join('\n');
}

// Selecciona (o COMBINA) el prompt de sistema de la fase 2 según los ids elegidos.
// A toda selección con técnicas del s.XX se añade el bloque transversal de
// CONEXIÓN DE LOS ACORDES (Persichetti cap. 9); el tonal severo puro queda intacto.
function selectComposeSystem(ids) {
  const base = selectComposeSystemBase(ids);
  const onlyTonal = ids.length === 1 && ids[0] === 'tonal';
  if (onlyTonal) return base;
  return `${base}\n\n=== CONEXIÓN DE LOS ACORDES (transversal, Persichetti cap. 9) ===\n${CHORD_CONNECTION}`;
}

function selectComposeSystemBase(ids) {
  const map = {
    tonal: SYSTEM_PROMPT,
    cuartal: QUARTAL_COMPOSE_SYSTEM,
    contemporaneo: CONTEMPORARY_COMPOSE_SYSTEM,
    impresionista: IMPRESSIONIST_COMPOSE_SYSTEM,
    sigloxx: PERSICHETTI_COMPOSE_SYSTEM,
    terceras: TERTIAN_COMPOSE_SYSTEM,
    anadidos: ADDED_COMPOSE_SYSTEM,
    segundas: SECUNDAL_COMPOSE_SYSTEM,
    policordes: POLYCHORD_COMPOSE_SYSTEM,
    compuesta: COMPOSITE_COMPOSE_SYSTEM,
  };
  if (ids.includes('mixto')) return MIXTO_COMPOSE_SYSTEM;
  if (ids.length === 1) return map[ids[0]] || SYSTEM_PROMPT;
  // TONAL + técnicas del s.XX = realiza sobre BASE TONAL FUNCIONAL con color.
  if (ids.includes('tonal')) {
    const others = ids.filter((id) => id !== 'tonal');
    const header =
      'Eres un compositor coral de ESTILO SEVERO (tonal, funcional) que ENRIQUECE la ' +
      'sonoridad con color del siglo XX. Realiza las voces con la CONDUCCIÓN y las ' +
      'RESOLUCIONES tonales del estilo severo como base (sensibles y séptimas resueltas, sin ' +
      '5as/8as paralelas, cadencias), y AÑADE con criterio el color de la(s) técnica(s) ' +
      'indicada(s) (acordes enriquecidos, cuartas, 2as, añadidos, poliacordes…) como matiz, ' +
      'sin abandonar el centro tonal:\n\n';
    return (
      header +
      '=== BASE TONAL (manda) ===\n' +
      SYSTEM_PROMPT +
      '\n\n' +
      others
        .map((id, i) => `=== COLOR ${i + 1} (técnica del siglo XX, como matiz) ===\n${map[id] || ''}`)
        .join('\n\n')
    );
  }
  const header =
    'Eres un compositor coral del SIGLO XX que domina y COMBINA varias técnicas. ' +
    'Realiza las voces mezclando con criterio, según convenga a cada pasaje, y buscando ' +
    'una textura coral coherente y cantábile. Discurso NO funcional; centro por ' +
    'reiteración. Aplica las reglas de cada técnica:\n\n';
  return (
    header +
    ids.map((id, i) => `=== TÉCNICA ${i + 1} ===\n${map[id] || ''}`).join('\n\n')
  );
}

// Realiza las voces sobre el plan armónico. Devuelve el objeto JSON validado.
export async function composeChoral(params, parts, texture, harmonyText) {
  const client = getClient();

  const systemPrompt = selectComposeSystem(resolveSystems(params.systems ?? params.system));

  // Techo de salida ADAPTATIVO (Opus 4.8 admite hasta 128k con streaming). Cada
  // compás × voz genera un bloque de JSON extenso; escalamos con el tamaño de la
  // pieza para que las obras LARGAS se compongan COMPLETAS de una sola vez sin
  // cortarse. Las texturas MELISMÁTICAS/floridas y el divisi multiplican las notas
  // por compás, así que aumentamos el presupuesto en esos casos. Suelo 72k, techo 128k.
  const measures = Number(params.measures) || 8;
  let perCell = 900;
  if (params.melisma === 'melismatico') perCell *= 1.6; // muchas notas por sílaba
  if (texture && texture.sustained) perCell *= 1.15; // solistas floridos + colchón
  if (params.divisi === 'generoso') perCell *= 1.15; // acordes de divisi = más datos
  const budget = Math.round(measures * parts.length * perCell);
  const maxTokens = Math.min(128000, Math.max(72000, budget));

  const userContent = buildUserPrompt(params, parts, texture, harmonyText);

  // Lanza una petición de realización. `effort` controla cuánto "piensa" (menos
  // pensar = más tokens libres para el JSON de salida).
  const runOnce = async (maxOut, effort) => {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: maxOut,
      // display:summarized hace que el razonamiento fluya en streaming y evita
      // que la conexión se corte por inactividad durante el "pensar".
      thinking: { type: 'adaptive', display: 'summarized' },
      output_config: {
        effort,
        format: { type: 'json_schema', schema: COMPOSITION_SCHEMA },
      },
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });
    return stream.finalMessage();
  };

  let message = await runOnce(maxTokens, effortForQuality(params.quality));
  if (message.stop_reason === 'refusal') {
    throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
  }
  // REINTENTO automático si se cortó por longitud: sube el presupuesto al máximo
  // (128k) y baja el esfuerzo a "low" para dejar el máximo de tokens al JSON.
  if (message.stop_reason === 'max_tokens' && maxTokens < 128000) {
    message = await runOnce(128000, 'low');
    if (message.stop_reason === 'refusal') {
      throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
    }
  }

  const composition = extractJson(message);
  if (!composition.title && params.theme) composition.title = params.theme;
  // Modo "armonizar mi melodía": la voz superior la manda el usuario, no la IA.
  // Sobrescribimos la voz 1 con la melodía dada EXACTA y fijamos la metadata
  // (tonalidad/compás/tempo/compases) desde el archivo, para que nada la altere.
  if (params.melody) applyGivenMelody(composition, params.melody, parts, params.tempo);
  validateComposition(composition, parts.length);
  // Repara descuadres rítmicos menores (recorta/rellena) en vez de fallar.
  repairRhythm(composition);
  // GARANTÍA de divisi repartido: si el usuario pidió divisi (auto/generoso) y el
  // modelo lo concentró solo al final (o no lo puso), inyectamos divisi en varios
  // puntos INTERIORES doblando notas del propio acorde (nunca notas ajenas).
  distributeDivisi(composition, parts, params.divisi || 'auto', Boolean(params.melody));
  return composition;
}

// --- Reparto DETERMINISTA de divisi a lo largo de la obra ---
const LETTER_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchMidi(p) {
  return 12 * ((Number(p.octave) || 4) + 1) + (LETTER_SEMI[String(p.step).toUpperCase()] || 0) + (Number(p.alter) || 0);
}

function rangeMidi(s) {
  const m = String(s || '').match(/^([A-Ga-g])(#|b)?(-?\d+)$/);
  if (!m) return null;
  const semi = LETTER_SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 12 * (Number(m[3]) + 1) + semi;
}

// Segmentos [inicio,fin) en negras de cada nota de una voz.
function voiceSegments(notes) {
  let t = 0;
  return notes.map((note) => {
    const s = t;
    t += noteBeats(note);
    return { note, s, e: t };
  });
}

// Inyecta divisi (campo "chord") en varias notas LARGAS interiores, repartidas por
// toda la pieza. La altura añadida es SIEMPRE una nota que ya suena en el acorde
// (la toma de otra voz) colocada por debajo, a distancia consonante y en tesitura.
export function distributeDivisi(comp, parts, mode, melodyFixed) {
  if (mode === 'no' || !Array.isArray(comp.voices) || comp.voices.length < 2) return 0;
  const target = mode === 'generoso' ? 8 : 3;

  const segsByVoice = comp.voices.map((v) => voiceSegments(v.notes || []));
  const ranges = parts.map((p) => ({ low: rangeMidi(p && p.low), high: rangeMidi(p && p.high) }));

  // Candidatos: notas largas (≥ negra con puntillo), sin divisi previo, no la última.
  const cands = [];
  comp.voices.forEach((v, vi) => {
    if (melodyFixed && vi === 0) return; // no dividir la melodía fija del usuario
    const segs = segsByVoice[vi];
    segs.forEach((seg, ni) => {
      const n = seg.note;
      if (n.rest) return;
      if (Array.isArray(n.chord) && n.chord.length) return; // ya tiene divisi
      if (ni === segs.length - 1) return; // deja la última al modelo
      if (noteBeats(n) < 1.5) return; // solo notas sostenidas
      cands.push({ vi, ni, s: seg.s });
    });
  });
  if (!cands.length) return 0;

  // Reparto uniforme por el eje temporal (evita amontonar).
  cands.sort((a, b) => a.s - b.s || a.vi - b.vi);
  const chosen = [];
  const N = Math.min(target, cands.length);
  const used = new Set();
  for (let i = 0; i < N; i++) {
    let idx = Math.round((i * (cands.length - 1)) / Math.max(1, N - 1));
    while (used.has(idx) && idx < cands.length) idx++;
    if (idx >= cands.length) break;
    used.add(idx);
    chosen.push(cands[idx]);
  }

  let added = 0;
  for (const c of chosen) {
    const seg = segsByVoice[c.vi][c.ni];
    const main = seg.note;
    const mainMidi = pitchMidi(main);
    // Alturas que YA suenan en ese instante en las OTRAS voces (tonos del acorde).
    const pool = [];
    comp.voices.forEach((_, oi) => {
      if (oi === c.vi) return;
      const s = segsByVoice[oi].find((g) => g.s <= seg.s + 1e-6 && g.e > seg.s + 1e-6);
      if (!s || s.note.rest) return;
      pool.push({ step: s.note.step, alter: Number(s.note.alter) || 0, octave: s.note.octave });
      (Array.isArray(s.note.chord) ? s.note.chord : []).forEach((ch) => {
        if (ch && ch.step) pool.push({ step: ch.step, alter: Number(ch.alter) || 0, octave: ch.octave });
      });
    });
    if (!pool.length) continue;
    const range = ranges[c.vi] || {};

    // Busca la mejor altura POR DEBAJO de la principal (3ª a 6ª ≈ 3–9 semitonos),
    // dentro de la tesitura, tomada de un tono real del acorde.
    let best = null;
    for (const cand of pool) {
      for (let oct = 1; oct <= 7; oct++) {
        const pitch = { step: cand.step, alter: cand.alter, octave: oct };
        const midi = pitchMidi(pitch);
        const below = mainMidi - midi;
        if (below < 2 || below > 12) continue; // ni unísono ni más de una octava
        if (range.low != null && midi < range.low) continue;
        if (range.high != null && midi > range.high) continue;
        // Puntuación: preferimos 3ª–6ª (3–9 st); penalizamos extremos.
        const score = Math.abs(below - 6);
        if (!best || score < best.score) best = { pitch, score };
      }
    }
    if (best) {
      main.chord = [best.pitch];
      added++;
    }
  }
  return added;
}

// Fija la melodía del usuario como voz 1 (intacta) y alinea la metadata de la
// composición con el MusicXML. La IA solo aporta las voces de acompañamiento.
function applyGivenMelody(composition, melody, parts, tempo) {
  composition.key = melody.keyLetter;
  composition.mode = melody.mode;
  composition.timeSignature = melody.timeSignature;
  composition.measures = melody.measures;
  // El tempo lo decide el formulario (params.tempo); el del archivo es solo informativo.
  if (tempo) composition.tempo = tempo;
  if (melody.meters) composition.meters = melody.meters;
  else delete composition.meters;
  if (melody.title && !composition.title) composition.title = melody.title;

  if (!Array.isArray(composition.voices)) composition.voices = [];
  const mainName = parts[0] ? parts[0].name : 'Soprano';
  // Copia profunda de las notas para no compartir referencias con params.
  const notes = melody.notes.map((n) => ({ ...n }));
  composition.voices[0] = { name: mainName, notes };
}
