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
    duration: {
      type: 'integer',
      enum: [1, 2, 4, 8, 16],
      description: 'Denominador de la figura: 4 = negra, 8 = corchea, etc.',
    },
    dotted: {
      type: 'boolean',
      description: 'true si la figura va con puntillo',
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
        'Marca expresiva o de tempo sobre la nota: "" (ninguna), o p. ej. "rall.", ' +
        '"a tempo", "accel.", "dolce", "maigi". Úsalo MUY rara vez (cambios de ' +
        'sección/tempo), normalmente "".',
    },
  },
  required: ['rest', 'step', 'alter', 'octave', 'duration', 'dotted', 'lyric', 'dynamic', 'text'],
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
      description: 'Compás, p. ej. "4/4", "3/4", "6/8"',
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

// Duración de una nota en "negras" (quarter notes). 4 -> 1, 8 -> 0.5, etc.
// El puntillo añade la mitad.
export function noteBeats(note) {
  const base = 4 / note.duration;
  return note.dotted ? base * 1.5 : base;
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
];

function makeRest(duration, dotted) {
  return { rest: true, step: 'C', alter: 0, octave: 4, duration, dotted, lyric: '', dynamic: '', text: '' };
}

// Descompone una cantidad de negras en silencios de figuras válidas (greedy).
function beatsToRests(beats) {
  const out = [];
  let rem = Math.round(beats * 4) / 4; // cuantiza a semicorchea (0.25)
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
  const expected = bpm * comp.measures;
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
