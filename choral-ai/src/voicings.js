// Catálogo de tipos de voz y agrupaciones corales (voicings).
//
// Cada "tipo" define su tesitura (para guiar a la IA) y su clave de pentagrama
// (para LilyPond). Cada "voicing" es una lista ordenada de partes; cada parte
// referencia un tipo y lleva una etiqueta visible (p. ej. "Soprano 1").

export const VOICE_TYPES = {
  soprano: { label: 'Soprano', clef: 'treble', low: 'C4', high: 'A5' },
  mezzo: { label: 'Mezzosoprano', clef: 'treble', low: 'A3', high: 'F5' },
  alto: { label: 'Contralto', clef: 'treble', low: 'G3', high: 'D5' },
  tenor: { label: 'Tenor', clef: 'treble_8', low: 'C3', high: 'G4' },
  baritone: { label: 'Barítono', clef: 'bass', low: 'A2', high: 'E4' },
  bass: { label: 'Bajo', clef: 'bass', low: 'E2', high: 'C4' },
};

// part = { name, type (clave en VOICE_TYPES), group?: nº de coro, solo?: bool }
const p = (name, type, group, solo = false) => ({ name, type, group, solo });

export const VOICINGS = {
  satb: {
    label: 'SATB · coro mixto a 4',
    parts: [
      p('Soprano', 'soprano'),
      p('Contralto', 'alto'),
      p('Tenor', 'tenor'),
      p('Bajo', 'bass'),
    ],
  },
  ssaattbb: {
    label: 'SSAATTBB · coro mixto a 8',
    parts: [
      p('Soprano 1', 'soprano'),
      p('Soprano 2', 'soprano'),
      p('Contralto 1', 'alto'),
      p('Contralto 2', 'alto'),
      p('Tenor 1', 'tenor'),
      p('Tenor 2', 'tenor'),
      p('Bajo 1', 'baritone'),
      p('Bajo 2', 'bass'),
    ],
  },
  sa: {
    label: 'SA · dúo de voces agudas',
    parts: [p('Soprano', 'soprano'), p('Contralto', 'alto')],
  },
  sab: {
    label: 'SAB · 3 voces',
    parts: [p('Soprano', 'soprano'), p('Contralto', 'alto'), p('Bajo', 'bass')],
  },
  ssa: {
    label: 'SSA · voces iguales agudas',
    parts: [
      p('Soprano 1', 'soprano'),
      p('Soprano 2', 'soprano'),
      p('Contralto', 'alto'),
    ],
  },
  ttbb: {
    label: 'TTBB · voces graves',
    parts: [
      p('Tenor 1', 'tenor'),
      p('Tenor 2', 'tenor'),
      p('Barítono', 'baritone'),
      p('Bajo', 'bass'),
    ],
  },
  satb_doble: {
    label: 'Doble coro SATB · a 8',
    parts: [
      p('Coro I Soprano', 'soprano', 1),
      p('Coro I Contralto', 'alto', 1),
      p('Coro I Tenor', 'tenor', 1),
      p('Coro I Bajo', 'bass', 1),
      p('Coro II Soprano', 'soprano', 2),
      p('Coro II Contralto', 'alto', 2),
      p('Coro II Tenor', 'tenor', 2),
      p('Coro II Bajo', 'bass', 2),
    ],
  },
  unison: {
    label: 'Unísono · 1 voz',
    parts: [p('Melodía', 'soprano')],
  },
  soli_satb: {
    label: 'Solistas (2) + coro SATB',
    parts: [
      p('Solo I', 'soprano', null, true),
      p('Solo II', 'soprano', null, true),
      p('Soprano', 'soprano'),
      p('Contralto', 'alto'),
      p('Tenor', 'tenor'),
      p('Bajo', 'bass'),
    ],
  },
};

export const DEFAULT_VOICING = 'satb';

// Devuelve la lista de partes (con clave y tesitura resueltas) de un voicing.
export function resolveVoicing(id) {
  const voicing = VOICINGS[id] || VOICINGS[DEFAULT_VOICING];
  return voicing.parts.map((part) => {
    const t = VOICE_TYPES[part.type];
    return {
      name: part.name,
      type: part.type,
      group: part.group || null,
      solo: part.solo || false,
      clef: t.clef,
      low: t.low,
      high: t.high,
    };
  });
}

// Lista ligera para poblar el desplegable del frontend.
export function voicingOptions() {
  return Object.entries(VOICINGS).map(([id, v]) => ({
    id,
    label: v.label,
    voices: v.parts.length,
  }));
}
