// Traducción determinista de la composición (JSON) a LilyPond y renderizado a
// PDF + MIDI. Un único archivo .ly con bloques \layout y \midi produce ambos.
import { execFile } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { VOICE_NAMES } from './schema.js';

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

function pitchToLily(note) {
  if (note.rest) return 'r' + durString(note);
  const name = note.step.toLowerCase();
  const suffix =
    note.alter > 0 ? 'is'.repeat(note.alter) : 'es'.repeat(-note.alter);
  const n = note.octave - 3;
  const marks = n > 0 ? "'".repeat(n) : ','.repeat(-n);
  return name + suffix + marks + durString(note);
}

function voiceToLily(notes) {
  return notes.map(pitchToLily).join(' ');
}

// Sílabas de la voz principal (soprano) para \lyricsto. Se omiten los
// silencios (LilyPond los salta) y las notas sin texto reciben un "_".
function lyricsToLily(notes) {
  const tokens = [];
  for (const n of notes) {
    if (n.rest) continue;
    const syl = (n.lyric || '').trim();
    if (!syl) {
      tokens.push('_');
    } else {
      tokens.push('"' + syl.replace(/"/g, '\\"') + '"');
    }
  }
  return tokens.join(' ');
}

const KEY_MODE = { major: '\\major', minor: '\\minor' };

// Construye el documento LilyPond completo.
export function jsonToLily(comp) {
  const key = comp.key.toLowerCase();
  const mode = KEY_MODE[comp.mode] || '\\major';
  const [num, den] = comp.timeSignature.split('/');
  const title = (comp.title || 'Pieza coral').replace(/"/g, '\\"');

  const global = `global = {
  \\key ${key} ${mode}
  \\time ${num}/${den}
  \\tempo 4 = ${comp.tempo}
}`;

  const parts = VOICE_NAMES.map(
    (v) => `${v}Music = { \\global ${voiceToLily(comp.voices[v])} }`,
  ).join('\n');

  const sopWords = `sopranoWords = \\lyricmode { ${lyricsToLily(comp.voices.soprano)} }`;

  return `\\version "2.24.0"

\\header {
  title = "${title}"
  tagline = ##f
}

${global}

${parts}

${sopWords}

\\score {
  \\new ChoirStaff <<
    \\new Staff <<
      \\new Voice = "soprano" { \\voiceOne \\sopranoMusic }
      \\new Voice = "alto" { \\voiceTwo \\altoMusic }
    >>
    \\new Lyrics \\lyricsto "soprano" \\sopranoWords
    \\new Staff <<
      \\clef bass
      \\new Voice = "tenor" { \\voiceOne \\tenorMusic }
      \\new Voice = "bass" { \\voiceTwo \\bassMusic }
    >>
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
export async function render(comp, outDir, baseName = 'piece') {
  await mkdir(outDir, { recursive: true });
  const ly = jsonToLily(comp);
  const lyPath = path.join(outDir, `${baseName}.ly`);
  await writeFile(lyPath, ly, 'utf8');

  if (!(await hasLilyPond())) {
    return {
      lyPath,
      pdfPath: null,
      midiPath: null,
      warning:
        'LilyPond no está instalado: se generó solo el archivo .ly. ' +
        'Instálalo (apt-get install lilypond) para obtener PDF y MIDI.',
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
