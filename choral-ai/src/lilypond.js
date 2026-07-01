// Traducción determinista de la composición (JSON, N voces) a LilyPond y
// renderizado a PDF + MIDI. Un único archivo .ly con bloques \layout y \midi
// produce ambos. Se genera "score abierto": un pentagrama por voz con su clave.
import { execFile } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { metersOf, keyChangesOf, TUPLET_RATIO } from './schema.js';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Binario instalado por `npm run setup:lilypond` (sin tocar el PATH).
const LILY_EXE = process.platform === 'win32' ? 'lilypond.exe' : 'lilypond';
const VENDOR_LILYPOND = path.join(
  __dirname,
  '..',
  'vendor',
  'lilypond',
  'bin',
  LILY_EXE,
);

// Usa el binario vendored si existe; si no, busca `lilypond` en el PATH.
function lilypondBin() {
  return existsSync(VENDOR_LILYPOND) ? VENDOR_LILYPOND : 'lilypond';
}

// --- Traducción de una nota abstracta a notación LilyPond absoluta ---
// LilyPond absoluto: `c` = C3; cada ' sube una octava, cada , la baja.
// Por tanto C4 (do central) = c'.
function durString(note) {
  return String(note.duration) + (note.dotted ? '.' : '');
}

// Matices y reguladores admitidos → sintaxis LilyPond.
const DYN = {
  ppp: '\\ppp', pp: '\\pp', p: '\\p', mp: '\\mp', mf: '\\mf', f: '\\f',
  ff: '\\ff', fff: '\\fff', '<': '\\<', '>': '\\>', '!': '\\!',
};

function pitchToLily(note) {
  if (note.rest) return 'r' + durString(note);
  const name = note.step.toLowerCase();
  const suffix =
    note.alter > 0 ? 'is'.repeat(note.alter) : 'es'.repeat(-note.alter);
  const n = note.octave - 3;
  const marks = n > 0 ? "'".repeat(n) : ','.repeat(-n);
  // Las dinámicas solo se adjuntan a notas reales (no a silencios).
  const dyn = note.dynamic && DYN[note.dynamic] ? DYN[note.dynamic] : '';
  const t = (note.text || '').trim().replace(/"/g, '');
  const txt = t ? `^\\markup { \\italic "${t}" }` : '';
  // Ligadura de valor: '~' une esta nota con la siguiente (misma altura).
  const tie = note.tie ? '~' : '';
  return name + suffix + marks + durString(note) + tie + dyn + txt;
}

// Directiva de compás: simple (\time 3/4) o aditivo/compuesto (\compoundMeter).
function timeDirective(timeSignature) {
  const [num, den] = String(timeSignature).split('/');
  if (num.includes('+')) {
    const groups = num.split('+').map((x) => x.trim());
    return `\\compoundMeter #'((${groups.join(' ')} ${den}))`;
  }
  return `\\time ${num}/${den}`;
}

// Skip (silencio invisible) que rellena EXACTAMENTE un compás del compás dado.
// La duración de un compás num/den como fracción de redonda es num/den (los
// términos aditivos se suman). P. ej. "3/4" -> s1*3/4; "2+3+3/8" -> s1*8/8.
function measureSpacer(meter) {
  const [numStr, den] = String(meter).split('/');
  const num = numStr.split('+').reduce((s, x) => s + Number(x), 0);
  return `s1*${num}/${den}`;
}

// Notas de una voz. Dos capas de agrupación, independientes:
//  1) MELISMAS: una sílaba sostenida sobre varias notas (nota con letra seguida
//     de notas sin letra) se liga con un slur ( ... ) para que \lyricsto alinee
//     una sola sílaba sobre el grupo.
//  2) GRUPOS IRREGULARES (tresillos/seisillos): las notas con el mismo `tuplet`
//     se envuelven en \tuplet actual/normal { ... }, en tramos del tamaño del
//     grupo (3 para tresillo, 6 para seisillo…). Los slurs pueden cruzar la llave
//     del tuplet sin problema (LilyPond lo admite).
function voiceToLily(notes) {
  // 1) String base de cada nota.
  const toks = notes.map(pitchToLily);

  // 2) Slurs de melisma: '(' en la nota con letra, ')' en la última sin letra.
  let i = 0;
  while (i < notes.length) {
    if (notes[i].rest || !(notes[i].lyric || '').trim()) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < notes.length && !notes[j].rest && !(notes[j].lyric || '').trim()) j++;
    if (j - i > 1) {
      toks[i] += '(';
      toks[j - 1] += ')';
    }
    i = j;
  }

  // 3) Envoltura de grupos irregulares (tresillos, seisillos…).
  const out = [];
  i = 0;
  while (i < notes.length) {
    const tup = notes[i].tuplet;
    const ratio = TUPLET_RATIO[tup];
    if (!ratio) {
      out.push(toks[i]);
      i++;
      continue;
    }
    // Tramo contiguo con el mismo valor de tuplet; se corta cada `actual` notas
    // para que cada grupo lleve su propio corchete (p. ej. cada 3 en un tresillo).
    let j = i;
    while (j < notes.length && notes[j].tuplet === tup && j - i < ratio.actual) j++;
    out.push(`\\tuplet ${ratio.actual}/${ratio.normal} { ${toks.slice(i, j).join(' ')} }`);
    i = j;
  }
  return out.join(' ');
}

// Sílabas de una voz para \lyricsto: UNA sílaba por nota con texto. Las notas de
// continuación del melisma (sin letra) se omiten: el slur las absorbe. Devuelve ""
// si la voz no tiene letra.
function lyricsToLily(notes) {
  const tokens = [];
  for (const n of notes) {
    if (n.rest) continue;
    const syl = (n.lyric || '').trim();
    if (syl) tokens.push('"' + syl.replace(/"/g, '\\"') + '"');
  }
  return tokens.length ? tokens.join(' ') : '';
}

const KEY_MODE = { major: '\\major', minor: '\\minor' };

// Identificadores LilyPond solo admiten letras: índice 0 -> A, 1 -> B, ...
function letterFor(i) {
  return String.fromCharCode(65 + i);
}

// Construye el documento LilyPond completo.
// `parts` (del voicing) aporta clave y nombre por voz; se empareja por índice.
export function jsonToLily(comp, parts = []) {
  const key = comp.key.toLowerCase();
  const mode = KEY_MODE[comp.mode] || '\\major';
  const title = (comp.title || 'Pieza coral').replace(/"/g, '\\"');

  // Usamos una línea temporal `global` en PARALELO a las voces cuando hay
  // MÉTRICA CAMBIANTE (comp.meters) o CAMBIOS DE ARMADURA (comp.keyChanges):
  // el `global` coloca directivas (\time, \key) con skips por compás. Sin
  // ninguna de las dos, se mantiene el `global` simple embebido en cada voz.
  const list = metersOf(comp);
  const changing = Array.isArray(comp.meters) && comp.meters.length > 0;
  const keyChanges = keyChangesOf(comp);
  const useTimeline = changing || keyChanges.length > 0;

  let global;
  if (useTimeline) {
    const keyAt = new Map(keyChanges.map((kc) => [kc.measure, kc]));
    const head = [`\\key ${key} ${mode}`, `\\tempo 4 = ${comp.tempo}`];
    // Con métrica fija, el compás se fija una vez al principio.
    if (!changing) head.push(timeDirective(comp.timeSignature));
    const bars = [];
    for (let i = 0; i < list.length; i++) {
      const seg = [];
      const kc = keyAt.get(i + 1);
      if (kc) seg.push(`\\key ${kc.key.toLowerCase()} ${KEY_MODE[kc.mode] || '\\major'}`);
      if (changing) seg.push(timeDirective(list[i]));
      seg.push(measureSpacer(list[i]));
      bars.push(seg.join(' '));
    }
    global = `global = {\n  ${head.join('\n  ')}\n  ${bars.join('\n  ')}\n}`;
  } else {
    global = `global = {
  \\key ${key} ${mode}
  ${timeDirective(comp.timeSignature)}
  \\tempo 4 = ${comp.tempo}
}`;
  }

  const defs = [];
  const staves = [];

  comp.voices.forEach((voice, i) => {
    const L = letterFor(i);
    const part = parts[i] || {};
    const clef = part.clef || 'treble';
    const name = (part.name || voice.name || `Voz ${i + 1}`).replace(/"/g, '\\"');
    const lyr = lyricsToLily(voice.notes);

    // Con línea temporal, \global va en paralelo a la voz (no dentro de ella).
    const inlineGlobal = useTimeline ? '' : '\\global ';
    defs.push(`music${L} = { ${inlineGlobal}\\clef "${clef}" ${voiceToLily(voice.notes)} }`);
    if (lyr) defs.push(`words${L} = \\lyricmode { ${lyr} }`);

    const lyricsLine = lyr
      ? `\n    \\new Lyrics \\lyricsto "v${L}" \\words${L}`
      : '';
    const voiceBody = useTimeline
      ? `\\global \\new Voice = "v${L}" { \\music${L} }`
      : `\\new Voice = "v${L}" { \\music${L} }`;
    staves.push(
      `    \\new Staff \\with { instrumentName = "${name} " } <<\n` +
        `      ${voiceBody}\n` +
        `    >>${lyricsLine}`,
    );
  });

  return `\\version "2.24.0"

\\header {
  title = "${title}"
  tagline = ##f
}

${global}

${defs.join('\n')}

\\score {
  \\new ChoirStaff <<
${staves.join('\n')}
  >>
  \\layout { }
  \\midi { }
}
`;
}

// ¿Está disponible el binario lilypond?
export async function hasLilyPond() {
  try {
    await execFileAsync(lilypondBin(), ['--version']);
    return true;
  } catch {
    return false;
  }
}

// Renderiza el .ly a PDF + MIDI dentro de outDir. Devuelve rutas absolutas.
// Si lilypond no está instalado, devuelve pdf/midi = null con un aviso.
export async function render(comp, parts, outDir, baseName = 'piece') {
  await mkdir(outDir, { recursive: true });
  const ly = jsonToLily(comp, parts);
  const lyPath = path.join(outDir, `${baseName}.ly`);
  await writeFile(lyPath, ly, 'utf8');

  if (!(await hasLilyPond())) {
    return {
      lyPath,
      pdfPath: null,
      midiPath: null,
      warning:
        'LilyPond no está instalado: se generó solo el archivo .ly. ' +
        'Instálalo (npm run setup:lilypond) para obtener PDF y MIDI.',
    };
  }

  const outBase = path.join(outDir, baseName);
  // -dno-point-and-click hace el PDF más limpio y reproducible.
  await execFileAsync(lilypondBin(), [
    '-dno-point-and-click',
    '-o',
    outBase,
    lyPath,
  ]);

  const pdfPath = `${outBase}.pdf`;
  // LilyPond escribe MIDI como .midi (a veces .mid en versiones antiguas).
  let midiPath = `${outBase}.midi`;
  if (!existsSync(midiPath) && existsSync(`${outBase}.mid`)) {
    midiPath = `${outBase}.mid`;
  }

  return {
    lyPath,
    pdfPath: existsSync(pdfPath) ? pdfPath : null,
    midiPath: existsSync(midiPath) ? midiPath : null,
    warning: null,
  };
}

// Utilidad para pruebas: lee un .ly de vuelta (no usado en producción).
export async function readLy(lyPath) {
  return readFile(lyPath, 'utf8');
}
