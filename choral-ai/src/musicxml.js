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
import { noteBeats, beatsPerMeasure, metersOf, keyChangesOf, TUPLET_RATIO } from './schema.js';

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
  eighth: 8, '16th': 16, '32nd': 32, '64th': 32, '128th': 32,
};

// Figuras representables [negras, denominador, conPuntillo] de mayor a menor.
const FIGS = [
  [4, 1, false], [3, 2, true], [2, 2, false], [1.5, 4, true], [1, 4, false],
  [0.75, 8, true], [0.5, 8, false], [0.375, 16, true], [0.25, 16, false],
  [0.1875, 32, true], [0.125, 32, false],
];

// Descompone una cantidad de negras en silencios de figuras válidas (greedy).
// Se usa para rellenar la anacrusa por delante.
function restsForBeats(beats) {
  const out = [];
  let rem = Math.round(beats * 8) / 8; // cuantiza a fusa (0.125)
  while (rem > 1e-6) {
    const f = FIGS.find(([b]) => b <= rem + 1e-6);
    if (!f) break;
    out.push({
      rest: true, step: 'C', alter: 0, octave: 4, duration: f[1], dotted: f[2],
      tie: false, tuplet: 1, lyric: '', dynamic: '', text: '',
    });
    rem -= f[0];
  }
  return out;
}

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

  // Grupo irregular (tresillo/seisillo…): <time-modification><actual-notes>.
  // Guardamos el número de "actual-notes" si es uno de los soportados; si no,
  // 1 (nota normal) y la duración ya quedó aproximada por <duration>/<divisions>.
  let tuplet = 1;
  const tm = noteEl['time-modification'];
  if (tm) {
    const actual = num(tm['actual-notes']);
    if (actual && [2, 3, 4, 5, 6, 7, 9].includes(actual)) tuplet = actual;
  }

  // Ligadura de valor: <tie type="start"> une esta nota con la siguiente (misma
  // altura). Puede venir una (start o stop) o dos (stop y start). Nos interesa si
  // ARRANCA una ligadura hacia la nota siguiente.
  const ties = asArray(noteEl.tie);
  const tie = ties.some((t) => t && t['@_type'] === 'start');

  const note = {
    rest: isRest,
    step: 'C',
    alter: 0,
    octave: 4,
    duration,
    dotted,
    tie,
    tuplet,
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
  const parts = asArray(score && score.part);
  if (!parts.length) throw new Error('El MusicXML no contiene pistas (parts).');

  // Nombres de pista (para preferir la voz/melodía frente a piano/cuerdas).
  const partList = score['part-list'];
  const nameById = {};
  for (const sp of asArray(partList && partList['score-part'])) {
    nameById[sp['@_id']] = String(textOf(sp['part-name']) || '');
  }
  const VOCAL_RE = /voc|voz|cant|melod|sopran|lead|tiple|descant|vox/i;
  const PIANO_RE = /pian|keyb|teclad|organ|órgano|guitar|string|cuerda|bass|bajo el/i;

  // Un MusicXML puede traer VARIAS pistas (voz + piano + cuerdas…). Elegimos la
  // línea MELÓDICA: preferimos la pista cuyo nombre parece de VOZ/canto; si no,
  // la que tiene más notas con altura. Descartamos pistas sin ninguna nota.
  let part = null;
  let bestScore = -1;
  for (const pt of parts) {
    let count = 0;
    for (const m of asArray(pt.measure)) {
      for (const ne of asArray(m.note)) {
        if (ne.chord === undefined && ne.rest === undefined && ne.pitch) count++;
      }
    }
    if (count === 0) continue;
    const name = nameById[pt['@_id']] || '';
    // Puntuación: gran bonus si el nombre es de voz, penalización si es piano/etc.
    const bonus = VOCAL_RE.test(name) ? 1e7 : PIANO_RE.test(name) ? -1e6 : 0;
    const sc = bonus + count;
    if (sc > bestScore) {
      bestScore = sc;
      part = pt;
    }
  }
  if (!part) throw new Error('No se encontró ninguna pista con notas en el MusicXML.');
  const measureEls = asArray(part.measure);
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

  // ANACRUSA (pickup): si el PRIMER compás es más corto que su cifra (típico
  // upbeat), rellenamos por DELANTE con silencios hasta completarlo. Así la
  // anacrusa queda como final de un primer compás completo y toda la pieza es
  // uniforme (sin cifras de compás raras por barra ni desalineación).
  const firstBeats = bars[0].reduce((s, n) => s + noteBeats(n), 0);
  const nominal0 = beatsPerMeasure(meters[0]);
  if (nominal0 && firstBeats > 0 && firstBeats < nominal0 - 1e-6) {
    bars[0] = [...restsForBeats(nominal0 - firstBeats), ...bars[0]];
  }

  const notes = bars.flat();
  if (!notes.some((n) => !n.rest)) {
    throw new Error('No se encontró ninguna melodía (notas) en la primera voz del MusicXML.');
  }

  const { tonalityName, keyLetter, mode } = keyFromFifths(fifths, keyMode);
  const timeSignature = meters[0];
  // Ajuste por CONTENIDO REAL: si un compás no suma lo que dice su cifra (compás
  // de ANACRUSA/pickup incompleto, o restos que no cuadran), le damos un compás
  // que refleje su duración real, para que el render y el cuadre NO se desalineen.
  const realMeters = bars.map((bar, i) => {
    const actual = bar.reduce((s, n) => s + noteBeats(n), 0);
    const nominalBeats = beatsPerMeasure(meters[i]);
    if (nominalBeats != null && Math.abs(actual - nominalBeats) < 1e-6) return meters[i];
    return beatsToMeter(actual) || meters[i];
  });
  // meters solo si el compás CAMBIA a lo largo de la pieza (o hay pickups).
  const changing = realMeters.some((mt) => mt !== timeSignature);

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
    meters: changing ? realMeters : null,
    tempo,
    measures: bars.length,
    notes,
    bars,
  };
}

// Expresa una duración en negras como cifra de compás "num/den" (den ∈ 4,8,16),
// para dar a un compás incompleto (pickup) su longitud real. P. ej. 1 → "1/4",
// 2.5 → "5/8". Devuelve null si no se puede representar de forma limpia.
function beatsToMeter(beats) {
  for (const den of [4, 8, 16]) {
    const num = (beats * den) / 4;
    if (num > 0 && Math.abs(num - Math.round(num)) < 1e-6) return `${Math.round(num)}/${den}`;
  }
  return null;
}

// Nombre legible de una nota (p. ej. "Eb5", "F#4").
function noteName(n) {
  if (n.rest) return 'silencio';
  const acc = n.alter > 0 ? '#'.repeat(n.alter) : n.alter < 0 ? 'b'.repeat(-n.alter) : '';
  return `${n.step}${acc}${n.octave}`;
}

// ===========================================================================
//  EXPORTACIÓN: composición (JSON de N voces) → MusicXML "partwise" 4.0
// ---------------------------------------------------------------------------
//  Traducción DETERMINISTA para abrir la pieza en MuseScore/Sibelius/Finale.
//  Una PARTE por voz; soporta divisi (acordes en el pentagrama), tresillos/
//  seisillos, ligaduras de valor, letra, métrica cambiante y cambios de
//  armadura. Reparte las notas en compases y PARTE las que cruzan la barra en
//  notas ligadas (las voces bien formadas rara vez la cruzan).
// ===========================================================================

// Divisiones por negra. 5040 = LCM(16,9,7,5) → deja enteras TODAS nuestras
// figuras (hasta fusa), con puntillo y grupos irregulares (2,3,4,5,6,7,9).
const XML_DIVISIONS = 5040;

const XML_TYPE = { 1: 'whole', 2: 'half', 4: 'quarter', 8: 'eighth', 16: '16th', 32: '32nd' };

// Fifths (posición en el ciclo de quintas) por tónica natural + modo, para la
// armadura. La tónica del esquema es una letra A–G sin alteración.
const MAJOR_FIFTHS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, F: -1 };
const MINOR_FIFTHS = { A: 0, E: 1, B: 2, D: -1, G: -2, C: -3, F: -4 };

function fifthsOf(keyLetter, mode) {
  const k = String(keyLetter || 'C').toUpperCase();
  const table = mode === 'minor' ? MINOR_FIFTHS : MAJOR_FIFTHS;
  return table[k] != null ? table[k] : 0;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Figuras [negras, denominador, conPuntillo] de mayor a menor, para descomponer
// el trozo de una nota que cruza la barra en figuras válidas ligadas.
const XML_FIGS = [
  [4, 1, false], [3, 2, true], [2, 2, false], [1.5, 4, true], [1, 4, false],
  [0.75, 8, true], [0.5, 8, false], [0.375, 16, true], [0.25, 16, false],
  [0.1875, 32, true], [0.125, 32, false],
];

function beatsToFigures(beats) {
  const out = [];
  let rem = Math.round(beats * 8) / 8;
  while (rem > 1e-6) {
    const f = XML_FIGS.find(([b]) => b <= rem + 1e-6);
    if (!f) break;
    out.push({ duration: f[1], dotted: f[2], beats: f[0] });
    rem -= f[0];
  }
  return out;
}

// Marca el inicio/fin de cada grupo irregular (para el corchete de tresillo).
function annotateTuplets(notes) {
  const ev = notes.map((note) => ({ note, tStart: false, tStop: false }));
  let i = 0;
  while (i < ev.length) {
    const t = ev[i].note.tuplet;
    if (t && t > 1) {
      const ratio = TUPLET_RATIO[t];
      const actual = ratio ? ratio.actual : t;
      let j = i;
      while (j < ev.length && ev[j].note.tuplet === t) j++;
      for (let k = i; k < j; k += actual) {
        ev[k].tStart = true;
        ev[Math.min(k + actual - 1, j - 1)].tStop = true;
      }
      i = j;
    } else i++;
  }
  return ev;
}

// Alturas de una nota (principal + divisi), o [] si es silencio.
function pitchesOf(note) {
  if (note.rest) return [];
  const main = { step: note.step, alter: Number(note.alter) || 0, octave: note.octave };
  const extra = Array.isArray(note.chord)
    ? note.chord.filter((c) => c && c.step).map((c) => ({ step: c.step, alter: Number(c.alter) || 0, octave: c.octave }))
    : [];
  return [main, ...extra];
}

// Reparte los eventos de una voz en compases (array de arrays de "renderNotes").
// Un renderNote = { rest, pitches, duration, dotted, tuplet, tStart, tStop,
// tieStart, tieStop, lyric, dynamic, text }.
function splitVoiceIntoMeasures(events, meters) {
  const measures = [];
  let cur = [];
  let mi = 0;
  let remain = beatsPerMeasure(meters[0]) || 4;
  const advance = () => {
    measures.push(cur);
    cur = [];
    mi += 1;
    remain = beatsPerMeasure(meters[mi]) || remain;
  };

  for (const ev of events) {
    const beats = noteBeats(ev.note);
    const pitches = pitchesOf(ev.note);
    const isTuplet = ev.note.tuplet && ev.note.tuplet > 1;
    // Cabe en el compás (o es un grupo irregular: no se parte nunca).
    if (isTuplet || beats <= remain + 1e-6) {
      cur.push({
        rest: Boolean(ev.note.rest), pitches, duration: ev.note.duration,
        dotted: Boolean(ev.note.dotted), tuplet: ev.note.tuplet || 1,
        tStart: ev.tStart, tStop: ev.tStop,
        tieStart: Boolean(ev.note.tie), tieStop: false,
        lyric: ev.note.lyric || '', dynamic: ev.note.dynamic || '', text: ev.note.text || '',
      });
      remain -= beats;
      if (remain <= 1e-6 && measures.length < meters.length - 1) advance();
      continue;
    }
    // Cruza la barra: parte en figuras ligadas por compás.
    let left = beats;
    let first = true;
    while (left > 1e-6) {
      const chunk = Math.min(left, remain);
      const figs = beatsToFigures(chunk);
      figs.forEach((f, idx) => {
        const isLastPieceOverall = left - f.beats <= 1e-6 && idx === figs.length - 1;
        cur.push({
          rest: Boolean(ev.note.rest), pitches, duration: f.duration, dotted: f.dotted,
          tuplet: 1, tStart: false, tStop: false,
          // Encadena las ligaduras; la última hereda el tie original de la nota.
          tieStart: !isLastPieceOverall || Boolean(ev.note.tie),
          tieStop: !first || idx > 0,
          lyric: first && idx === 0 ? ev.note.lyric || '' : '',
          dynamic: first && idx === 0 ? ev.note.dynamic || '' : '',
          text: first && idx === 0 ? ev.note.text || '' : '',
        });
      });
      left -= chunk;
      remain -= chunk;
      first = false;
      if (remain <= 1e-6 && left > 1e-6) advance();
    }
    if (remain <= 1e-6 && measures.length < meters.length - 1) advance();
  }
  measures.push(cur);
  // Asegura una entrada por compás pedido (rellena vacíos por si acaso).
  while (measures.length < meters.length) measures.push([]);
  return measures;
}

// Clave MusicXML a partir del identificador interno.
function clefXml(clef) {
  if (clef === 'bass') return '<clef><sign>F</sign><line>4</line></clef>';
  if (clef === 'treble_8')
    return '<clef><sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change></clef>';
  return '<clef><sign>G</sign><line>2</line></clef>';
}

// Elemento <time> (admite compases aditivos "3+3+2/8").
function timeXml(meter) {
  const [num, den] = String(meter).split('/');
  return `<time><beats>${esc(num)}</beats><beat-type>${esc(den)}</beat-type></time>`;
}

function renderNoteToXml(rn, voiceNum) {
  const dur = Math.max(1, Math.round(noteBeatsOfRender(rn) * XML_DIVISIONS));
  const type = XML_TYPE[rn.duration] || 'quarter';
  const dots = rn.dotted ? '<dot/>' : '';
  const ratio = rn.tuplet > 1 ? TUPLET_RATIO[rn.tuplet] : null;
  const timeMod = ratio
    ? `<time-modification><actual-notes>${ratio.actual}</actual-notes><normal-notes>${ratio.normal}</normal-notes></time-modification>`
    : '';
  const out = [];

  if (rn.rest) {
    const notat = rn.tStart || rn.tStop
      ? `<notations>${rn.tStart ? '<tuplet type="start" bracket="yes"/>' : ''}${rn.tStop ? '<tuplet type="stop"/>' : ''}</notations>`
      : '';
    out.push(
      `<note><rest/><duration>${dur}</duration><voice>${voiceNum}</voice>` +
        `<type>${type}</type>${dots}${timeMod}${notat}</note>`,
    );
    return out.join('');
  }

  const [main, ...extra] = rn.pitches;
  const pitchXml = (p) =>
    `<pitch><step>${esc(p.step)}</step>${p.alter ? `<alter>${p.alter}</alter>` : ''}<octave>${p.octave}</octave></pitch>`;
  const tieSound =
    (rn.tieStop ? '<tie type="stop"/>' : '') + (rn.tieStart ? '<tie type="start"/>' : '');
  // Notaciones: ligaduras (visual) + corchete de grupo irregular.
  const tiedVis = (rn.tieStop ? '<tied type="stop"/>' : '') + (rn.tieStart ? '<tied type="start"/>' : '');
  const tupVis = (rn.tStart ? '<tuplet type="start" bracket="yes"/>' : '') + (rn.tStop ? '<tuplet type="stop"/>' : '');
  const notations = tiedVis || tupVis ? `<notations>${tiedVis}${tupVis}</notations>` : '';
  const lyric = rn.lyric
    ? `<lyric><syllabic>single</syllabic><text>${esc(rn.lyric)}</text></lyric>`
    : '';

  out.push(
    `<note>${pitchXml(main)}<duration>${dur}</duration>${tieSound}` +
      `<voice>${voiceNum}</voice><type>${type}</type>${dots}${timeMod}${notations}${lyric}</note>`,
  );
  // Divisi: las alturas adicionales van como notas <chord/> (mismo ritmo).
  for (const p of extra) {
    out.push(
      `<note><chord/>${pitchXml(p)}<duration>${dur}</duration>` +
        `<voice>${voiceNum}</voice><type>${type}</type>${dots}${timeMod}</note>`,
    );
  }
  return out.join('');
}

// Duración en negras de un renderNote (aplica puntillo y grupo irregular).
function noteBeatsOfRender(rn) {
  const base = 4 / rn.duration;
  const withDot = rn.dotted ? base * 1.5 : base;
  const ratio = rn.tuplet > 1 ? TUPLET_RATIO[rn.tuplet] : null;
  return ratio ? withDot * (ratio.normal / ratio.actual) : withDot;
}

// Convierte la composición a una cadena MusicXML 4.0 partwise.
export function compositionToMusicXML(comp, parts = []) {
  const meters = metersOf(comp);
  const keyChanges = keyChangesOf(comp);
  const keyAt = new Map(keyChanges.map((kc) => [kc.measure, kc]));
  const baseFifths = fifthsOf(comp.key, comp.mode);

  const partIds = comp.voices.map((_, i) => `P${i + 1}`);
  const scoreParts = comp.voices
    .map((voice, i) => {
      const name = (parts[i] && parts[i].name) || voice.name || `Voz ${i + 1}`;
      return `    <score-part id="${partIds[i]}"><part-name>${esc(name)}</part-name></score-part>`;
    })
    .join('\n');

  const partsXml = comp.voices
    .map((voice, i) => {
      const clef = (parts[i] && parts[i].clef) || 'treble';
      const events = annotateTuplets(Array.isArray(voice.notes) ? voice.notes : []);
      const measures = splitVoiceIntoMeasures(events, meters);
      let prevMeter = null;
      let prevFifths = null;

      const measuresXml = measures
        .map((rns, m) => {
          const attrs = [];
          const kc = keyAt.get(m + 1);
          const meter = meters[m];
          const fifths = kc ? fifthsOf(kc.key, kc.mode) : baseFifths;
          if (m === 0) {
            attrs.push(`<divisions>${XML_DIVISIONS}</divisions>`);
            attrs.push(`<key><fifths>${fifths}</fifths><mode>${comp.mode === 'minor' ? 'minor' : 'major'}</mode></key>`);
            attrs.push(timeXml(meter));
            attrs.push(clefXml(clef));
          } else {
            if (fifths !== prevFifths) {
              const md = kc ? (kc.mode === 'minor' ? 'minor' : 'major') : comp.mode === 'minor' ? 'minor' : 'major';
              attrs.push(`<key><fifths>${fifths}</fifths><mode>${md}</mode></key>`);
            }
            if (meter !== prevMeter) attrs.push(timeXml(meter));
          }
          prevMeter = meter;
          prevFifths = fifths;
          const attrXml = attrs.length ? `<attributes>${attrs.join('')}</attributes>` : '';
          // Tempo: al principio de la primera parte, primer compás.
          const tempoXml =
            i === 0 && m === 0
              ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${comp.tempo || 72}</per-minute></metronome></direction-type><sound tempo="${comp.tempo || 72}"/></direction>`
              : '';
          const notesXml = rns.length
            ? rns.map((rn) => renderNoteToXml(rn, 1)).join('')
            : `<note><rest measure="yes"/><duration>${Math.round((beatsPerMeasure(meter) || 4) * XML_DIVISIONS)}</duration><voice>1</voice></note>`;
          return `    <measure number="${m + 1}">${attrXml}${tempoXml}${notesXml}</measure>`;
        })
        .join('\n');

      return `  <part id="${partIds[i]}">\n${measuresXml}\n  </part>`;
    })
    .join('\n');

  const title = esc(comp.title || 'Pieza coral');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n' +
    '<score-partwise version="4.0">\n' +
    `  <work><work-title>${title}</work-title></work>\n` +
    '  <identification><encoding><software>ChorAI</software></encoding></identification>\n' +
    '  <part-list>\n' +
    scoreParts +
    '\n  </part-list>\n' +
    partsXml +
    '\n</score-partwise>\n'
  );
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
