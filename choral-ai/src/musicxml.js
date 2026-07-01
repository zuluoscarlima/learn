// Lectura de MusicXML → melodía dada por el usuario.
//
// Modo "armonizar mi melodía": el usuario sube un MusicXML (exportado de
// MuseScore, Sibelius, Finale…). Aquí extraemos SU melodía (una sola voz: notas,
// ritmo y letra) de forma DETERMINISTA, para fijarla EXACTA en la voz superior y
// que la IA compona solo las demás voces por debajo (ver compose.js / harmony.js).
//
// Alcance v1: partitura MusicXML "partwise" SIN comprimir (.musicxml / .xml).
// Se toma la PRIMERA parte y su PRIMERA voz; se ignoran acordes (solo la línea
// melódica), notas de adorno y tresillos exóticos. Evita compases de anacrusa.
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  // Fuerza array en los elementos que pueden repetirse, para recorrerlos en orden.
  isArray: (name) =>
    ['part', 'measure', 'note', 'attributes', 'direction', 'lyric', 'dot'].includes(name),
});

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const textOf = (v) => (v && typeof v === 'object' ? v['#text'] : v);
const num = (v) => {
  const n = Number(textOf(v));
  return Number.isFinite(n) ? n : null;
};

// Figura (denominador LilyPond) por tipo MusicXML. Se recorta a nuestro enum
// [1,2,4,8,16]: figuras más rápidas que la semicorchea → 16; más lentas → 1.
const TYPE_DENOM = {
  maxima: 1, long: 1, breve: 1, whole: 1, half: 2, quarter: 4,
  eighth: 8, '16th': 16, '32nd': 16, '64th': 16, '128th': 16,
};

// Figuras representables [negras, denominador, conPuntillo] de mayor a menor.
const FIGS = [
  [4, 1, false], [3, 2, true], [2, 2, false], [1.5, 4, true], [1, 4, false],
  [0.75, 8, true], [0.5, 8, false], [0.375, 16, true], [0.25, 16, false],
];

// Aproxima una duración en negras a la figura representable más cercana.
function figureFromQuarters(q) {
  let best = FIGS[FIGS.length - 1];
  let diff = Infinity;
  for (const f of FIGS) {
    const d = Math.abs(f[0] - q);
    if (d < diff) {
      diff = d;
      best = f;
    }
  }
  return { duration: best[1], dotted: best[2] };
}

// Tónica de la tonalidad por el número de alteraciones (círculo de quintas).
const MAJOR_KEYS = {
  '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb',
  '-1': 'F', 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
};
const MINOR_KEYS = {
  '-7': 'Ab', '-6': 'Eb', '-5': 'Bb', '-4': 'F', '-3': 'C', '-2': 'G',
  '-1': 'D', 0: 'A', 1: 'E', 2: 'B', 3: 'F#', 4: 'C#', 5: 'G#', 6: 'D#', 7: 'A#',
};

function keyFromFifths(fifths, mode) {
  const f = Number.isInteger(fifths) ? Math.max(-7, Math.min(7, fifths)) : 0;
  const isMinor = mode === 'minor';
  const tonic = (isMinor ? MINOR_KEYS : MAJOR_KEYS)[f] || 'C';
  return { tonalityName: `${tonic} ${isMinor ? 'menor' : 'mayor'}`, keyLetter: tonic[0], mode: isMinor ? 'minor' : 'major' };
}

// Convierte una nota MusicXML a nuestra nota abstracta (o null si se ignora).
function convertNote(noteEl, divisions) {
  // Notas de adorno: sin valor rítmico → se ignoran en v1.
  if (noteEl.grace !== undefined) return null;

  const isRest = noteEl.rest !== undefined;
  const dots = asArray(noteEl.dot).length;
  const type = textOf(noteEl.type);

  let duration;
  let dotted;
  if (type && TYPE_DENOM[type]) {
    duration = TYPE_DENOM[type];
    dotted = dots >= 1;
  } else {
    // Sin <type> legible: deducir de <duration>/<divisions> (negras).
    const d = num(noteEl.duration);
    const q = d && divisions ? d / divisions : 1;
    ({ duration, dotted } = figureFromQuarters(q));
  }

  const note = {
    rest: isRest,
    step: 'C',
    alter: 0,
    octave: 4,
    duration,
    dotted,
    lyric: '',
    dynamic: '',
    text: '',
  };

  if (!isRest && noteEl.pitch) {
    const p = noteEl.pitch;
    note.step = String(textOf(p.step) || 'C').toUpperCase();
    const a = num(p.alter);
    note.alter = a == null ? 0 : Math.max(-2, Math.min(2, Math.round(a)));
    const oct = num(p.octave);
    note.octave = oct == null ? 4 : oct;
  }

  // Letra: MusicXML pone <lyric> solo en la nota que ABRE la sílaba; las notas de
  // continuación de un melisma no llevan <lyric> — coincide con nuestro modelo.
  if (!isRest) {
    const lyr = asArray(noteEl.lyric)[0];
    const syl = lyr && textOf(lyr.text);
    if (syl != null && String(syl).trim()) note.lyric = String(syl).trim();
  }
  return note;
}

// Busca un tempo (negra = bpm) en las <direction> de un compás. Prioriza
// <sound tempo="…">; si no, un <metronome> negra = N.
function tempoInMeasure(measureEl) {
  for (const dir of asArray(measureEl.direction)) {
    const sound = dir.sound;
    if (sound && sound['@_tempo']) return Math.round(Number(sound['@_tempo']));
    const mtype = dir['direction-type'];
    const metro = mtype && mtype.metronome;
    if (metro) {
      const unit = textOf(metro['beat-unit']);
      const per = num(metro['per-minute']);
      if (per) {
        const factor = { half: 2, quarter: 1, eighth: 0.5 }[unit] ?? 1;
        return Math.round(per * factor);
      }
    }
  }
  const sound = measureEl.sound;
  if (sound && sound['@_tempo']) return Math.round(Number(sound['@_tempo']));
  return null;
}

// Extrae la melodía del MusicXML. Devuelve la estructura que consumen las fases
// de armonización. Lanza Error con mensaje claro si el archivo no sirve.
export function parseMelody(xmlText) {
  const raw = String(xmlText || '');
  if (raw.startsWith('PK')) {
    throw new Error(
      'El archivo parece MusicXML COMPRIMIDO (.mxl). Vuelve a exportarlo SIN comprimir ' +
        '(en MuseScore: Archivo → Exportar → MusicXML sin comprimir; extensión .musicxml o .xml).',
    );
  }
  if (!/<score-partwise/i.test(raw)) {
    if (/<score-timewise/i.test(raw)) {
      throw new Error('MusicXML "timewise" no soportado; exporta el formato normal "partwise".');
    }
    throw new Error('El archivo no parece un MusicXML válido (falta <score-partwise>).');
  }

  let doc;
  try {
    doc = parser.parse(raw);
  } catch (e) {
    throw new Error('No se pudo leer el MusicXML: ' + e.message);
  }

  const score = doc['score-partwise'];
  const part = asArray(score && score.part)[0];
  const measureEls = asArray(part && part.measure);
  if (!measureEls.length) throw new Error('El MusicXML no contiene compases.');

  const bars = [];
  const meters = [];
  let divisions = 1;
  let fifths = 0;
  let keyMode = 'major';
  let beats = 4;
  let beatType = 4;
  let tempo = null;
  let melodyVoice = null; // nos ceñimos a la primera voz que traiga notas

  for (const m of measureEls) {
    // Atributos (pueden cambiar a mitad de pieza).
    for (const attr of asArray(m.attributes)) {
      const dv = num(attr.divisions);
      if (dv) divisions = dv;
      const keyEl = asArray(attr.key)[0];
      if (keyEl) {
        const f = num(keyEl.fifths);
        if (f != null) fifths = f;
        const md = textOf(keyEl.mode);
        if (md) keyMode = String(md).toLowerCase();
      }
      const timeEl = asArray(attr.time)[0];
      if (timeEl) {
        const b = num(timeEl.beats);
        const bt = num(timeEl['beat-type']);
        if (b) beats = b;
        if (bt) beatType = bt;
      }
    }
    if (tempo == null) {
      const t = tempoInMeasure(m);
      if (t) tempo = t;
    }

    const barNotes = [];
    for (const noteEl of asArray(m.note)) {
      // Los acordes (nota con <chord/>) son sonidos simultáneos: solo la línea
      // melódica principal, así que se descartan las notas de acorde.
      if (noteEl.chord !== undefined) continue;
      const v = textOf(noteEl.voice);
      if (melodyVoice == null && noteEl.rest === undefined) melodyVoice = v;
      // Nos quedamos con la voz melódica elegida (o notas sin voz declarada).
      if (v != null && melodyVoice != null && v !== melodyVoice) continue;
      const converted = convertNote(noteEl, divisions);
      if (converted) barNotes.push(converted);
    }
    bars.push(barNotes);
    meters.push(`${beats}/${beatType}`);
  }

  const notes = bars.flat();
  if (!notes.some((n) => !n.rest)) {
    throw new Error('No se encontró ninguna melodía (notas) en la primera voz del MusicXML.');
  }

  const { tonalityName, keyLetter, mode } = keyFromFifths(fifths, keyMode);
  const timeSignature = meters[0];
  // meters solo si el compás CAMBIA a lo largo de la pieza.
  const changing = meters.some((mt) => mt !== meters[0]);

  const title =
    textOf(score.work && score.work['work-title']) ||
    textOf(score['movement-title']) ||
    '';

  return {
    title: title ? String(title).trim() : '',
    tonalityName,
    keyLetter,
    mode,
    timeSignature,
    meters: changing ? meters : null,
    tempo,
    measures: bars.length,
    notes,
    bars,
  };
}

// Nombre legible de una nota (p. ej. "Eb5", "F#4").
function noteName(n) {
  if (n.rest) return 'silencio';
  const acc = n.alter > 0 ? '#'.repeat(n.alter) : n.alter < 0 ? 'b'.repeat(-n.alter) : '';
  return `${n.step}${acc}${n.octave}`;
}

// Melodía dada, listada compás por compás, para inyectar en los prompts.
// withDuration añade la figura (p. ej. "Eb5/2." = blanca con puntillo).
export function melodyByMeasures(melody, { withDuration = false } = {}) {
  return melody.bars
    .map((bar, i) => {
      const toks = bar.map((n) => {
        const name = noteName(n);
        return withDuration && !n.rest ? `${name}/${n.duration}${n.dotted ? '.' : ''}` : name;
      });
      return `Compás ${i + 1}: ${toks.join(' ') || '(vacío)'}`;
    })
    .join('\n');
}
