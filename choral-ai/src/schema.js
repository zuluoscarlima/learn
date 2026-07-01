// JSON schema de la composición coral (N voces) y utilidades de validación.
//
// Claude devuelve una representación ABSTRACTA de la música (altura por
// nombre de nota + octava, duración por denominador), nunca sintaxis LilyPond.
// Así evitamos depender de que el modelo escriba `.ly` sin errores: la
// traducción a LilyPond es determinista (ver lilypond.js).

// Schema compatible con structured outputs (`output_config.format`):
// requiere additionalProperties:false y `required` en cada objeto.
const noteSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    rest: {
      type: 'boolean',
      description: 'true si es silencio; en ese caso step/alter/octave se ignoran',
    },
    step: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      description: 'Nombre de la nota (ignorado si rest=true)',
    },
    alter: {
      type: 'integer',
      enum: [-2, -1, 0, 1, 2],
      description: 'Alteración: -1 bemol, 0 natural, 1 sostenido',
    },
    octave: {
      type: 'integer',
      description: 'Octava científica (C4 = do central)',
    },
    chord: {
      type: 'array',
      description:
        'DIVISI (OBLIGATORIO, casi siempre VACÍO []). Alturas ADICIONALES que suenan A LA VEZ ' +
        'que esta nota (mismo ritmo), para DIVIDIR la voz en un acorde dentro de SU pentagrama. ' +
        'CUALQUIER voz (S, A, T o B) puede dividirse. Cada elemento es {step, alter, octave}. ' +
        'En la GRAN MAYORÍA de las notas va VACÍO ([]) = una sola nota. Para hacer DIVISI, añade ' +
        'aquí la(s) nota(s) inferior(es): p. ej. una soprano divisi a 2 lleva su nota principal + ' +
        'chord=[{"step":"E","alter":0,"octave":5}]. Úsalo para enriquecer acordes (divisi a2/a3) ' +
        'en clímax o colchones, respetando la tesitura de la voz.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          step: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
          alter: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          octave: { type: 'integer' },
        },
        required: ['step', 'alter', 'octave'],
      },
    },
    duration: {
      type: 'integer',
      enum: [1, 2, 4, 8, 16, 32],
      description: 'Denominador de la figura: 1 = redonda, 2 = blanca, 4 = negra, 8 = corchea, 16 = semicorchea, 32 = fusa.',
    },
    dotted: {
      type: 'boolean',
      description: 'true si la figura va con puntillo',
    },
    tie: {
      type: 'boolean',
      description:
        'true si esta nota se LIGA (ligadura de valor) a la siguiente nota, que debe ser la ' +
        'MISMA altura: el sonido se prolonga sin volver a atacar. Úsalo para sostener una nota ' +
        'más allá del pulso o del compás. En la GRAN MAYORÍA de las notas es false.',
    },
    tuplet: {
      type: 'integer',
      enum: [1, 2, 3, 4, 5, 6, 7, 9],
      description:
        'Grupo irregular (tresillo/seisillo…). 1 = nota NORMAL (lo habitual). 3 = TRESILLO ' +
        '(3 en el tiempo de 2), 6 = SEISILLO, 5 = quintillo, 7 = septillo, 2 = dosillo, 4 = ' +
        'cuatrillo, 9 = nonillo. En un tresillo de corcheas escribe 3 notas con duration=8 y ' +
        'tuplet=3 (juntas duran una negra). Todas las notas de un mismo grupo llevan el mismo ' +
        'valor de tuplet, en figuras iguales y en número igual al del grupo (3 para tresillo, ' +
        '6 para seisillo…). Los silencios dentro del grupo también llevan su tuplet.',
    },
    lyric: {
      type: 'string',
      description: 'Sílaba cantada en esta nota (vacío si no aplica o es silencio)',
    },
    dynamic: {
      type: 'string',
      description:
        'Matiz en esta nota: "" (ninguno), ppp, pp, p, mp, mf, f, ff, fff, o ' +
        'reguladores "<" (crescendo), ">" (diminuendo), "!" (fin de regulador). Úsalo ' +
        'con MODERACIÓN: solo en inicios de frase, clímax y cierres. No en silencios.',
    },
    text: {
      type: 'string',
      description:
        'Marca expresiva o de tempo sobre la nota: "" (ninguna), o p. ej. "dolce", ' +
        '"cantabile", "appassionato", "morendo", "rall.", "a tempo", "accel.", "maigi". ' +
        'Úsalo en INICIOS de frase, cambios de sección/tempo y en el CLÍMAX (ver la paleta ' +
        'expresiva); VARÍA el término y no lo pongas en cada nota (la mayoría van con "").',
    },
  },
  required: ['rest', 'step', 'alter', 'octave', 'chord', 'duration', 'dotted', 'tie', 'tuplet', 'lyric', 'dynamic', 'text'],
};

const voiceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: 'Nombre de la voz (p. ej. "Soprano", "Tenor 1", "Bajo")',
    },
    notes: {
      type: 'array',
      items: noteSchema,
      description: 'Secuencia de notas/silencios de la voz, en orden',
    },
  },
  required: ['name', 'notes'],
};

export const COMPOSITION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    key: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      description: 'Tónica de la tonalidad',
    },
    mode: { type: 'string', enum: ['major', 'minor'] },
    timeSignature: {
      type: 'string',
      description: 'Compás por defecto, p. ej. "4/4", "3/4", "6/8", o aditivo "3+3+2/8"',
    },
    meters: {
      type: 'array',
      items: { type: 'string' },
      description:
        'OPCIONAL. Lista de compases, UNO por cada compás (longitud = measures), ' +
        'para MÉTRICA CAMBIANTE/aditiva estilo báltico (p. ej. ' +
        '["3/4","2+3+3/8","2+3/8","2+2/8"]). Si se omite, se usa timeSignature para ' +
        'todos los compases.',
    },
    keyChanges: {
      type: 'array',
      description:
        'OPCIONAL. Cambios de ARMADURA para modulaciones LARGAS (la nueva tonalidad ' +
        'dura varios compases, ~4 o más). Cada entrada indica el compás donde EMPIEZA ' +
        'la nueva armadura, su tónica y su modo. Para tonicizaciones o cambios BREVES ' +
        '(1–2 compases) NO añadas cambios: deja las alteraciones sueltas en las notas. ' +
        'Omite el array si la pieza no modula de forma prolongada.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          measure: {
            type: 'integer',
            description: 'Compás (2..measures) donde empieza la nueva armadura',
          },
          key: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
          mode: { type: 'string', enum: ['major', 'minor'] },
        },
        required: ['measure', 'key', 'mode'],
      },
    },
    tempo: { type: 'integer', description: 'Pulsos por minuto (negra = bpm)' },
    measures: { type: 'integer', description: 'Número de compases' },
    voices: {
      type: 'array',
      items: voiceSchema,
      description: 'Lista ordenada de voces, una por parte solicitada',
    },
  },
  required: ['title', 'key', 'mode', 'timeSignature', 'tempo', 'measures', 'voices'],
};

// Grupos irregulares: número escrito → { actual, normal } (actual notas en el
// tiempo de "normal"). El factor de duración real de cada nota es normal/actual.
// P. ej. tresillo 3:2 → cada nota dura 2/3 de su figura escrita.
export const TUPLET_RATIO = {
  2: { actual: 2, normal: 3 }, // dosillo (2 en el tiempo de 3)
  3: { actual: 3, normal: 2 }, // tresillo
  4: { actual: 4, normal: 3 }, // cuatrillo
  5: { actual: 5, normal: 4 }, // quintillo
  6: { actual: 6, normal: 4 }, // seisillo
  7: { actual: 7, normal: 4 }, // septillo
  9: { actual: 9, normal: 8 }, // nonillo
};

// Factor por el que se multiplica la duración escrita si la nota va en un grupo
// irregular (1 = nota normal). tuplet ausente o 1 → sin efecto.
export function tupletFactor(note) {
  const r = note && TUPLET_RATIO[note.tuplet];
  return r ? r.normal / r.actual : 1;
}

// Duración de una nota en "negras" (quarter notes). 4 -> 1, 8 -> 0.5, etc.
// El puntillo añade la mitad; los grupos irregulares aplican su factor.
export function noteBeats(note) {
  const base = 4 / note.duration;
  return (note.dotted ? base * 1.5 : base) * tupletFactor(note);
}

// Negras por compás. Admite compases simples (4/4), de subdivisión (6/8) y
// ADITIVOS (p. ej. "3+3+2/8" = 8 corcheas = 4 negras; "5/8" = 2.5 negras).
export function beatsPerMeasure(timeSignature) {
  const [numStr, denStr] = String(timeSignature).split('/');
  const den = Number(denStr);
  if (!den) return null;
  const num = String(numStr)
    .split('+')
    .reduce((sum, x) => sum + Number(x), 0);
  if (!num) return null;
  return num * (4 / den);
}

// Lista de compases efectiva: usa comp.meters si viene (métrica cambiante,
// uno por compás), recortada/rellenada a comp.measures; si no, repite
// timeSignature en todos los compases. Devuelve siempre un array de longitud
// comp.measures.
export function metersOf(comp) {
  const n = Number(comp.measures) || 0;
  const def = comp.timeSignature;
  const list = Array.isArray(comp.meters) && comp.meters.length ? comp.meters : null;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(list ? list[i] || list[list.length - 1] || def : def);
  }
  return out;
}

// Total de negras de la pieza, sumando el cuadre de CADA compás. Soporta
// métrica cambiante (comp.meters) y compases simples/aditivos.
export function totalBeats(comp) {
  return metersOf(comp).reduce((sum, m) => sum + (beatsPerMeasure(m) || 0), 0);
}

// Cambios de armadura VÁLIDOS y ordenados: compás en 2..measures, tónica A–G,
// modo major/minor, uno por compás (el último gana). Para render de modulaciones.
export function keyChangesOf(comp) {
  const n = Number(comp.measures) || 0;
  const list = Array.isArray(comp.keyChanges) ? comp.keyChanges : [];
  const byMeasure = new Map();
  for (const kc of list) {
    const m = Number(kc && kc.measure);
    const key = kc && String(kc.key || '').toUpperCase();
    const mode = kc && kc.mode === 'minor' ? 'minor' : 'major';
    if (!Number.isInteger(m) || m < 2 || m > n) continue;
    if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(key)) continue;
    byMeasure.set(m, { measure: m, key, mode });
  }
  return [...byMeasure.values()].sort((a, b) => a.measure - b.measure);
}

// Valida estructura y cuadre rítmico. Lanza Error con mensaje legible.
// expectedVoices: nº de voces esperado (del voicing elegido); opcional.
export function validateComposition(comp, expectedVoices) {
  if (!comp || typeof comp !== 'object') {
    throw new Error('La composición no es un objeto válido.');
  }
  if (!Array.isArray(comp.voices) || comp.voices.length === 0) {
    throw new Error('La composición no contiene voces.');
  }
  if (expectedVoices && comp.voices.length !== expectedVoices) {
    throw new Error(
      `Se esperaban ${expectedVoices} voces pero la composición trae ${comp.voices.length}.`,
    );
  }

  const bpm = beatsPerMeasure(comp.timeSignature);
  if (!bpm) throw new Error(`Compás inválido: "${comp.timeSignature}".`);
  // Si hay métrica cambiante, cada compás de la lista debe ser válido.
  if (Array.isArray(comp.meters)) {
    for (const m of comp.meters) {
      if (!beatsPerMeasure(m)) throw new Error(`Compás inválido en la lista: "${m}".`);
    }
  }

  comp.voices.forEach((voice, i) => {
    const label = voice.name || `voz ${i + 1}`;
    if (!Array.isArray(voice.notes) || voice.notes.length === 0) {
      throw new Error(`La voz "${label}" está vacía.`);
    }
  });
  return comp;
}

// Figuras válidas: [negras, denominador, conPuntillo], de mayor a menor.
const FIGURES = [
  [4, 1, false], [3, 2, true], [2, 2, false], [1.5, 4, true], [1, 4, false],
  [0.75, 8, true], [0.5, 8, false], [0.375, 16, true], [0.25, 16, false],
  [0.1875, 32, true], [0.125, 32, false],
];

function makeRest(duration, dotted) {
  return { rest: true, step: 'C', alter: 0, octave: 4, chord: [], duration, dotted, tie: false, tuplet: 1, lyric: '', dynamic: '', text: '' };
}

// Descompone una cantidad de negras en silencios de figuras válidas (greedy).
function beatsToRests(beats) {
  const out = [];
  let rem = Math.round(beats * 8) / 8; // cuantiza a fusa (0.125)
  const tol = 1e-6;
  while (rem > tol) {
    const fig = FIGURES.find(([b]) => b <= rem + tol);
    if (!fig) break;
    out.push(makeRest(fig[1], fig[2]));
    rem -= fig[0];
  }
  return out;
}

// Ajusta cada voz para que sume EXACTAMENTE los compases pedidos: recorta lo que
// sobra y rellena lo que falta con silencios. Evita el fallo "los compases no
// cuadran" reparando descuadres menores del modelo. Devuelve true si reparó algo.
export function repairRhythm(comp) {
  const bpm = beatsPerMeasure(comp.timeSignature);
  if (!bpm || !Array.isArray(comp.voices)) return false;
  // Total esperado = suma del cuadre de cada compás (soporta métrica cambiante).
  const expected = totalBeats(comp);
  const tol = 1e-6;
  let repaired = false;

  for (const voice of comp.voices) {
    if (!Array.isArray(voice.notes)) voice.notes = [];
    const total = voice.notes.reduce((s, n) => s + noteBeats(n), 0);
    if (Math.abs(total - expected) <= tol) continue;
    repaired = true;

    if (total > expected) {
      // Recorta: conserva notas hasta llegar a expected; rellena el resto.
      const kept = [];
      let run = 0;
      for (const n of voice.notes) {
        const nb = noteBeats(n);
        if (run + nb <= expected + tol) {
          kept.push(n);
          run += nb;
        } else break;
      }
      if (expected - run > tol) kept.push(...beatsToRests(expected - run));
      voice.notes = kept;
    } else {
      // Alarga: añade silencios al final.
      voice.notes.push(...beatsToRests(expected - total));
    }
  }
  return repaired;
}
