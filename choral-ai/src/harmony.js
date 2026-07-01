// Fase 1 del proceso compositivo: planificación armónica.
//
// La IA diseña una progresión funcional (un acorde por compás) con una cadencia
// final clara. Las notas de cada acorde se calculan de forma DETERMINISTA aquí
// (deletreo diatónico correcto), para dar a la fase 2 un esqueleto exacto sobre
// el que realizar las voces.
import { getClient, extractJson } from './llm.js';
import {
  QUARTAL_HARMONY_SYSTEM,
  CONTEMPORARY_HARMONY_SYSTEM,
  IMPRESSIONIST_HARMONY_SYSTEM,
  PERSICHETTI_HARMONY_SYSTEM,
  TERTIAN_HARMONY_SYSTEM,
  ADDED_HARMONY_SYSTEM,
  SECUNDAL_HARMONY_SYSTEM,
  MIXTO_HARMONY_SYSTEM,
  resolveSystems,
} from './systems.js';

const MODEL = 'claude-opus-4-8';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Calidades de acorde: pares [salto de letra, intervalo en semitonos] desde la fundamental.
const QUALITIES = {
  major: [[0, 0], [2, 4], [4, 7]],
  minor: [[0, 0], [2, 3], [4, 7]],
  diminished: [[0, 0], [2, 3], [4, 6]],
  augmented: [[0, 0], [2, 4], [4, 8]],
  dominant7: [[0, 0], [2, 4], [4, 7], [6, 10]],
  minor7: [[0, 0], [2, 3], [4, 7], [6, 10]],
  major7: [[0, 0], [2, 4], [4, 7], [6, 11]],
  half_diminished7: [[0, 0], [2, 3], [4, 6], [6, 10]],
  diminished7: [[0, 0], [2, 3], [4, 6], [6, 9]],
  // Séptimas adicionales (apilado de terceras may/men) — armonía terciaria del s.XX.
  minor_major7: [[0, 0], [2, 3], [4, 7], [6, 11]], // menor + 7ª mayor (C-E♭-G-B)
  augmented7: [[0, 0], [2, 4], [4, 8], [6, 10]], // aumentada + 7ª menor (C-E-G♯-B♭)
  augmented_major7: [[0, 0], [2, 4], [4, 8], [6, 11]], // aumentada + 7ª mayor (C-E-G♯-B)
  // Acordes de novena (cinco sonidos; en coro a 4 voces se omite un miembro).
  dominant9: [[0, 0], [2, 4], [4, 7], [6, 10], [1, 2]], // novena mayor (C-E-G-B♭-D)
  dominant9min: [[0, 0], [2, 4], [4, 7], [6, 10], [1, 1]], // novena menor (C-E-G-B♭-D♭)
  major9: [[0, 0], [2, 4], [4, 7], [6, 11], [1, 2]], // 9ª con 7ª mayor (C-E-G-B-D)
  minor9: [[0, 0], [2, 3], [4, 7], [6, 10], [1, 2]], // menor 9ª (C-E♭-G-B♭-D)
  dominant7b5: [[0, 0], [2, 4], [4, 6], [6, 10]], // 7ª con 5ª rebajada (C-E-G♭-B♭)
  // Acordes por cuartas (siglo XX): superposición de cuartas justas.
  // El de 5 sonidos tiene sabor pentáfono (contiene una escala pentatónica).
  quartal3: [[0, 0], [3, 5], [6, 10]], // justa-justa
  quartal4: [[0, 0], [3, 5], [6, 10], [9, 15]],
  quartal5: [[0, 0], [3, 5], [6, 10], [9, 15], [12, 20]],
  // Acordes de 3 sonidos con una cuarta aumentada (variedad, encaje modal).
  quartal3ja: [[0, 0], [3, 5], [6, 11]], // justa-aumentada (p. ej. C-F-B)
  quartal3aj: [[0, 0], [3, 6], [6, 11]], // aumentada-justa (p. ej. C-F♯-B)
  // Tríadas con sonidos AÑADIDOS / suspensiones (estilo coral contemporáneo).
  major_add9: [[0, 0], [2, 4], [4, 7], [1, 2]], // p. ej. C-E-G-D
  minor_add9: [[0, 0], [2, 3], [4, 7], [1, 2]],
  major_add6: [[0, 0], [2, 4], [4, 7], [5, 9]], // p. ej. C-E-G-A
  sus2: [[0, 0], [1, 2], [4, 7]], // p. ej. C-D-G
  sus4: [[0, 0], [3, 5], [4, 7]], // p. ej. C-F-G
  // Acordes por SEGUNDAS (tres sonidos) — armonía secundal del s.XX.
  secundal_MM: [[0, 0], [1, 2], [2, 4]], // 2ª mayor + mayor (C-D-E)
  secundal_Mm: [[0, 0], [1, 2], [2, 3]], // mayor + menor (C-D-E♭)
  secundal_mM: [[0, 0], [1, 1], [2, 3]], // menor + mayor (C-D♭-E♭)
  secundal_mm: [[0, 0], [1, 1], [2, 2]], // menor + menor (C-D♭-E♭♭)
};

const QUALITY_LABEL = {
  major: ' mayor',
  minor: ' menor',
  diminished: ' dis',
  augmented: ' aum',
  dominant7: '7',
  minor7: 'm7',
  major7: 'maj7',
  half_diminished7: 'ø7',
  diminished7: 'º7',
  dominant9: '9',
  dominant9min: '7♭9',
  dominant7b5: '7♭5',
  minor_major7: 'm(maj7)',
  augmented7: '+7',
  augmented_major7: '+maj7',
  major9: 'maj9',
  minor9: 'm9',
  secundal_MM: ' (2ª M+M)',
  secundal_Mm: ' (2ª M+m)',
  secundal_mM: ' (2ª m+M)',
  secundal_mm: ' (2ª m+m)',
  quartal3: ' (4ª·3 J-J)',
  quartal4: ' (4ª·4)',
  quartal5: ' (4ª·5, pentáfono)',
  quartal3ja: ' (4ª·3 J-A)',
  quartal3aj: ' (4ª·3 A-J)',
  major_add9: ' add9',
  minor_add9: 'm add9',
  major_add6: ' 6',
  sus2: ' sus2',
  sus4: ' sus4',
};

// Deletrea un grado del acorde con la letra y alteración correctas.
function spell(rootLetter, rootAlter, letterOffset, semitone) {
  const rootIdx = LETTERS.indexOf(rootLetter);
  const rootPc = (NATURAL_PC[rootLetter] + rootAlter + 120) % 12;
  const targetLetter = LETTERS[(rootIdx + letterOffset) % 7];
  const targetPc = (rootPc + semitone) % 12;
  let d = (targetPc - NATURAL_PC[targetLetter]) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return { step: targetLetter, alter: d };
}

// Notas (step+alter) de un acorde en estado fundamental.
export function chordTones(root, alter, quality) {
  const spec = QUALITIES[quality] || QUALITIES.major;
  return spec.map(([lo, si]) => spell(root, alter, lo, si));
}

function noteName(t) {
  const acc = t.alter > 0 ? '♯'.repeat(t.alter) : '♭'.repeat(-t.alter);
  return t.step + acc;
}

// Representa el plan armónico como texto para la fase 2.
export function harmonyToText(chords) {
  const lines = chords.map((c) => {
    const tones = chordTones(c.root, c.alter || 0, c.quality);
    const bass = tones[Math.min(c.inversion || 0, tones.length - 1)];
    const names = tones.map(noteName).join('–');
    const label = QUALITY_LABEL[c.quality] || '';
    return `  Compás ${c.measure}: ${c.roman} — ${noteName({ step: c.root, alter: c.alter || 0 })}${label} (${names}), bajo ${noteName(bass)}`;
  });
  return lines.join('\n');
}

const HARMONY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    chords: {
      type: 'array',
      description: 'Un acorde por compás, en orden',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          measure: { type: 'integer' },
          roman: { type: 'string', description: 'Cifrado funcional, p. ej. I, V7, ii6, IV' },
          root: { type: 'string', enum: LETTERS },
          alter: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          quality: { type: 'string', enum: Object.keys(QUALITIES) },
          inversion: {
            type: 'integer',
            enum: [0, 1, 2, 3],
            description: '0 fundamental, 1 primera inv., 2 segunda, 3 tercera',
          },
        },
        required: ['measure', 'roman', 'root', 'alter', 'quality', 'inversion'],
      },
    },
    cadence: { type: 'string', description: 'Descripción de la cadencia final' },
  },
  required: ['chords', 'cadence'],
};

const SYSTEM_PROMPT = `Eres un armonista de ESTILO SEVERO (tratado de
Rimsky-Korsakov). Diseñas progresiones funcionales claras, con buena conducción y
un bajo melódico.

Reglas:
- Armonía funcional T–S–D–T. Un acorde por compás, empezando y terminando en la
  tónica. Usa I, ii, iii, IV, V, vi y la dominante con séptima (V7) para reforzar la
  dirección; puedes emplear alguna dominante secundaria.
- MODULACIONES PASAJERAS (tonizaciones): puedes tonizar brevemente un grado con su
  dominante secundaria (V7/x → x) y volver enseguida, para dar color sin abandonar
  la tonalidad. Son momentáneas (a veces un solo acorde).
- Disonancias funcionales opcionales para más color: séptima de SENSIBLE (VII7,
  calidad half_diminished7 en modo mayor o diminished7 en menor armónico, función
  dominante); séptima del II grado (ii7 = minor7, función predominante, con la 7ª
  preparada); y el acorde de NOVENA de dominante (dominant9 / dominant9min) SOLO
  sobre el V grado.
- Acordes ALTERADOS cromáticos (uso moderado, color avanzado): NAPOLITANA (tríada
  mayor sobre el II rebajado = ♭II, normalmente como acorde de sexta ♭II6, función
  subdominante); tríada AUMENTADA (augmented, #5); acordes de SEXTA AUMENTADA
  (italiana/francesa/alemana, bajo en el ♭6 — puedes cifrarlos enarmónicamente como
  una 7ª de dominante o dominant7b5). Todos resuelven en la DOMINANTE (V) o en el
  6/4 cadencial.
- Diseña tensión creciente hacia el final.
- Cadencia FINAL: auténtica perfecta — penúltimo acorde V o V7 y último I/i, ambos
  en estado fundamental. Para reforzarla puedes precederla con el 6/4 CADENCIAL
  (tónica en 2ª inversión sobre tiempo fuerte): I6/4 → V(7) → I/i. Evita terminar
  en semicadencia.
- La cadencia auténtica perfecta NO debe aparecer en mitad de la pieza: resérvala
  para el final. En el interior usa semicadencias (reposo en V), cadencias rotas
  (V→vi) o evitadas para mantener el discurso; la cadencia rota nunca como final.
- Bajo melódico: usa inversiones (acordes de sexta, y de cuarta y sexta de paso)
  para que el bajo se mueva por grados conjuntos en lugar de saltar siempre.
- Procura un esquema que evite quintas y octavas paralelas; en el paso IV→V (sin
  nota común) las voces se moverán en dirección contraria al bajo (lo realizará la
  fase 2).`;

function buildUserPrompt(params) {
  const {
    theme,
    key = 'C',
    mode = 'major',
    timeSignature = '4/4',
    measures = 8,
    modulate = false,
  } = params;
  const lines = [
    `Diseña la progresión armónica de una pieza coral:`,
    `- Tonalidad de partida: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Número de compases: ${measures} (un acorde por compás → ${measures} acordes)`,
  ];
  if (theme) lines.push(`- Carácter: ${theme}`);
  const systems = resolveSystems(params.systems ?? params.system);
  const isMixto = systems.includes('mixto');
  const multi = isMixto || systems.length > 1;
  const only = (id) => !multi && systems[0] === id;
  const isQuartal = only('cuartal');
  const isContemporary = only('contemporaneo');
  const isImpressionist = only('impresionista');
  const isPersichetti = only('sigloxx');
  const isTertian = only('terceras');
  const isAdded = only('anadidos');
  const isSecundal = only('segundas');
  const isTonal = only('tonal');
  // Solo la tonal pura es funcional; cualquier técnica del s.XX o combinación no lo es.
  const nonFunctional = !isTonal;
  if (multi) {
    lines.push(
      '- SISTEMA: ' +
        (isMixto
          ? 'COMBINA TODAS las técnicas del siglo XX (triádico por ciclos, por cuartas, ' +
            'pandiatónico, modal/impresionista y control de tensión) con libertad, según ' +
            'convenga a cada pasaje.'
          : 'COMBINACIÓN de varias técnicas del siglo XX seleccionadas; intégralas con ' +
            'coherencia.') +
        ' Discurso NO funcional; centro por reiteración.',
    );
  } else if (isQuartal) {
    lines.push(
      '- SISTEMA: armonía POR CUARTAS (no funcional). Usa calidades quartal3/quartal4/' +
        'quartal5 (y mixtas quartal3ja/quartal3aj). Sin cadencias tonales.',
    );
  } else if (isContemporary) {
    lines.push(
      '- SISTEMA: armonía CONTEMPORÁNEA pandiatónica (añadidos y suspensiones). Usa ' +
        'calidades major_add9/minor_add9/major_add6/sus2/sus4 además de major/minor. ' +
        'Ritmo armónico lento, no funcional; reposo final en la tónica con añadidos.',
    );
  } else if (isImpressionist) {
    lines.push(
      '- SISTEMA: armonía IMPRESIONISTA modal (no funcional). Color modal y ' +
        'PARALELISMO (planing); usa major/minor/major7/minor7/major_add9/sus2/sus4. ' +
        'Ritmo armónico lento; cierre suspendido, no por dominante.',
    );
  } else if (isPersichetti) {
    lines.push(
      '- SISTEMA: SIGLO XX por CONTROL DE TENSIÓN (Persichetti, no funcional). Diseña ' +
        'una CURVA DE TENSIÓN por el contenido interválico: sonoridades poco tensas ' +
        '(major/minor, quartal3/4/5) al principio, INTENSIFICA hacia el clímax con ' +
        '2as/7as/tritones (sus2/add9/minor7 → major7/dominant7b5/diminished7/' +
        'half_diminished7/augmented) y RELAJA al final. Sin cadencias tonales; centro ' +
        'por reiteración. Cierre por distensión (regreso a consonancia abierta/blanda).',
    );
  } else if (isTertian) {
    lines.push(
      '- SISTEMA: TRIÁDICO POR CICLOS (Persichetti). Organiza las TRÍADAS por un CICLO ' +
        'de fundamentales elegido —2as, 3as o 5as— alrededor del centro. Primarios: ' +
        'ciclo de 3as → I/III/VI (mandan III–I, VI–I); ciclo de 2as → I/II/VII (mandan ' +
        'II–I, VII–I); ciclo de 5as → I/IV/V. Confirma el centro con movimientos de ' +
        'paso y cadenciales del ciclo; puedes MEZCLAR ciclos para libertad de ' +
        'fundamentales. Válido en cualquier escala (mayor, modal o sintética); indica ' +
        'la calidad real de cada tríada (major/minor/diminished/augmented).',
    );
  } else if (isAdded) {
    lines.push(
      '- SISTEMA: SONIDOS AÑADIDOS (Persichetti, no funcional). Parte de acordes básicos y ' +
        'pégales 2as mayores/menores como MIEMBROS DE COLOR (no adornos): usa las calidades ' +
        'major_add9/minor_add9/major_add6/sus2/sus4 (y major/minor de base). Cuanto más ' +
        'grave el añadido, menos resonante. El color manda; centro por reiteración; reposo ' +
        'por permanencia.',
    );
  } else if (isSecundal) {
    lines.push(
      '- SISTEMA: POR SEGUNDAS / clusters (Persichetti, no funcional). Acordes de tres ' +
        'sonidos por 2as: usa las calidades secundal_MM/secundal_Mm/secundal_mM/' +
        'secundal_mm (de consonante a disonante). Dispón las notas ABIERTAS (en 7as/9as) ' +
        'para líneas cantábiles; el cluster cerrado, solo como efecto percusivo. Centro ' +
        'por reiteración; reposo por permanencia.',
    );
  }
  if (!nonFunctional && modulate && measures >= 8) {
    lines.push(
      '- MODULACIÓN (estilo severo): en el desarrollo, modula a una tonalidad VECINA ' +
        '(1er grado de vecindad: relativo, dominante, subdominante o sus relativos). ' +
        'Procedimiento: reinterpreta el acorde de tónica como un grado del nuevo tono ' +
        '(acorde PIVOTE común) y confírmalo con una cadencia en el nuevo tono (su V7 ' +
        'y/o 6/4 cadencial). Puedes modular de forma DIATÓNICA (acorde pivote común) ' +
        'o CROMÁTICA (alterando una voz por semitono, breve y espontánea, con el ' +
        'cromatismo en la MISMA voz para no crear falsas relaciones). AFIRMA el nuevo ' +
        'tono con una cadencia (no termines la modulación en un acorde de sexta). ' +
        'Para tonos más LEJANOS (2º grado de vecindad), modula por TONOS INTERMEDIOS ' +
        'vecinos (cada paso a una tonalidad vecina); evita encadenar tres tonos del ' +
        'mismo modo seguidos (interpón uno del modo contrario). ' +
        'También puedes usar la modulación ENARMÓNICA: reinterpreta un acorde de ' +
        'sexta aumentada como séptima de dominante (o una séptima disminuida) para ' +
        'girar a un tono lejano. ' +
        'Luego REGRESA a la tonalidad de partida para la cadencia FINAL ' +
        '(auténtica perfecta en el tono de partida). Usa los grados (roman) referidos ' +
        'a la tonalidad vigente en cada momento.',
    );
  }
  // Continuación (Opción B): el plan debe partir del final de la parte 1 y
  // conducir a un cierre conclusivo de toda la obra.
  if (params.continuation) {
    lines.push('\n' + params.continuation);
    lines.push(
      'Empieza la progresión enlazando con el acorde final de la primera parte y ' +
        'reserva la cadencia conclusiva para el final de ESTA parte.',
    );
  }
  const closing = multi
    ? 'el cierre (reposo o permanencia)'
    : isQuartal
      ? 'el gesto de cierre'
      : isPersichetti
        ? 'el cierre por distensión'
        : isTertian
          ? 'la confirmación del centro (cadencia del ciclo)'
          : isContemporary || isImpressionist || isAdded || isSecundal
            ? 'el reposo final'
            : 'la cadencia final';
  lines.push(`\nDevuelve exactamente ${measures} acordes (measure 1..${measures}) y ${closing}.`);
  return lines.join('\n');
}

// Ajusta la longitud de la progresión al número de compases pedido.
function normalize(chords, measures) {
  const out = chords.slice(0, measures);
  while (out.length < measures) {
    const last = out[out.length - 1] || { roman: 'I', root: 'C', alter: 0, quality: 'major', inversion: 0 };
    out.push({ ...last, measure: out.length + 1 });
  }
  return out.map((c, i) => ({ ...c, measure: i + 1 }));
}

// Selecciona (o COMBINA) el prompt de sistema de la fase 1 según los ids elegidos.
function selectHarmonySystem(ids) {
  const map = {
    tonal: SYSTEM_PROMPT,
    cuartal: QUARTAL_HARMONY_SYSTEM,
    contemporaneo: CONTEMPORARY_HARMONY_SYSTEM,
    impresionista: IMPRESSIONIST_HARMONY_SYSTEM,
    sigloxx: PERSICHETTI_HARMONY_SYSTEM,
    terceras: TERTIAN_HARMONY_SYSTEM,
    anadidos: ADDED_HARMONY_SYSTEM,
    segundas: SECUNDAL_HARMONY_SYSTEM,
  };
  if (ids.includes('mixto')) return MIXTO_HARMONY_SYSTEM;
  if (ids.length === 1) return map[ids[0]] || SYSTEM_PROMPT;
  // Varias técnicas: se concatenan con una cabecera que pide integrarlas con criterio.
  const header =
    'Eres un compositor del SIGLO XX. COMBINA con criterio las siguientes aproximaciones, ' +
    'eligiendo en cada pasaje la que mejor sirva a la música y reconciliándolas con ' +
    'coherencia. Discurso NO funcional; centro por reiteración.\n\n';
  return (
    header +
    ids.map((id, i) => `=== TÉCNICA ${i + 1} ===\n${map[id] || ''}`).join('\n\n')
  );
}

// Llama a Claude para planificar la armonía. Devuelve { chords, cadence, text }.
export async function planHarmony(params) {
  const client = getClient();
  const measures = params.measures || 8;

  const systemPrompt = selectHarmonySystem(resolveSystems(params.systems ?? params.system));

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 5000,
    // La progresión es una tarea acotada: sin "pensar" para ir rápido. En alta
    // calidad subimos un poco el esfuerzo del plan armónico.
    thinking: { type: 'disabled' },
    output_config: {
      effort: params.quality === 'alta' ? 'medium' : 'low',
      format: { type: 'json_schema', schema: HARMONY_SCHEMA },
    },
    system: systemPrompt,
    messages: [{ role: 'user', content: buildUserPrompt(params) }],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') {
    throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
  }
  const plan = extractJson(message);
  const chords = normalize(plan.chords || [], measures);
  return { chords, cadence: plan.cadence || '', text: harmonyToText(chords) };
}
