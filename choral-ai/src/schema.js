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
  },
  required: ['rest', 'step', 'alter', 'octave', 'duration', 'dotted', 'lyric'],
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

// Negras por compás según el numerador/denominador del compás.
// p. ej. 4/4 -> 4, 3/4 -> 3, 6/8 -> 3 (6 corcheas = 3 negras).
export function beatsPerMeasure(timeSignature) {
  const [num, den] = String(timeSignature).split('/').map(Number);
  if (!num || !den) return null;
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

  const expectedBeats = bpm * comp.measures;
  const tolerance = 1e-6;
  comp.voices.forEach((voice, i) => {
    const label = voice.name || `voz ${i + 1}`;
    if (!Array.isArray(voice.notes) || voice.notes.length === 0) {
      throw new Error(`La voz "${label}" está vacía.`);
    }
    const total = voice.notes.reduce((sum, n) => sum + noteBeats(n), 0);
    if (Math.abs(total - expectedBeats) > tolerance) {
      throw new Error(
        `La voz "${label}" suma ${total} negras pero el compás ${comp.timeSignature} ` +
          `con ${comp.measures} compases requiere ${expectedBeats}. Los compases no cuadran.`,
      );
    }
  });
  return comp;
}
