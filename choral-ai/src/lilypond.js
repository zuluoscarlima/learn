// Traducción determinista de la composición (JSON, N voces) a LilyPond y
// renderizado a PDF + MIDI. Un único archivo .ly con bloques \layout y \midi
// produce ambos. Se genera "score abierto": un pentagrama por voz con su clave.
import { execFile } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

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
  pp: '\\pp', p: '\\p', mp: '\\mp', mf: '\\mf', f: '\\f', ff: '\\ff',
  '<': '\\<', '>': '\\>', '!': '\\!',
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
  return name + suffix + marks + durString(note) + dyn;
}

function voiceToLily(notes) {
  return notes.map(pitchToLily).join(' ');
}

// Sílabas de una voz para \lyricsto. Se omiten los silencios (LilyPond los
// salta) y las notas sin texto reciben un "_". Devuelve "" si no hay letra.
function lyricsToLily(notes) {
  const tokens = [];
  let any = false;
  for (const n of notes) {
    if (n.rest) continue;
    const syl = (n.lyric || '').trim();
    if (!syl) {
      tokens.push('_');
    } else {
      any = true;
      tokens.push('"' + syl.replace(/"/g, '\\"') + '"');
    }
  }
  return any ? tokens.join(' ') : '';
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
  const [num, den] = comp.timeSignature.split('/');
  const title = (comp.title || 'Pieza coral').replace(/"/g, '\\"');

  const global = `global = {
  \\key ${key} ${mode}
  \\time ${num}/${den}
  \\tempo 4 = ${comp.tempo}
}`;

  const defs = [];
  const staves = [];

  comp.voices.forEach((voice, i) => {
    const L = letterFor(i);
    const part = parts[i] || {};
    const clef = part.clef || 'treble';
    const name = (part.name || voice.name || `Voz ${i + 1}`).replace(/"/g, '\\"');
    const lyr = lyricsToLily(voice.notes);

    defs.push(`music${L} = { \\global \\clef "${clef}" ${voiceToLily(voice.notes)} }`);
    if (lyr) defs.push(`words${L} = \\lyricmode { ${lyr} }`);

    const lyricsLine = lyr
      ? `\n    \\new Lyrics \\lyricsto "v${L}" \\words${L}`
      : '';
    staves.push(
      `    \\new Staff \\with { instrumentName = "${name} " } <<\n` +
        `      \\new Voice = "v${L}" { \\music${L} }\n` +
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
