// Prueba la cadena JSON -> LilyPond -> PDF + MIDI sin llamar a Claude.
// Uso: node scripts/test-lily.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComposition } from '../src/schema.js';
import { jsonToLily, render } from '../src/lilypond.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cadencia sencilla en Do mayor: dos acordes de tónica (redondas), 2 compases.
const n = (step, octave, lyric = '') => ({
  rest: false,
  step,
  alter: 0,
  octave,
  duration: 1,
  dotted: false,
  lyric,
});

const sample = {
  title: 'Prueba SATB',
  key: 'C',
  mode: 'major',
  timeSignature: '4/4',
  tempo: 72,
  measures: 2,
  voices: {
    soprano: [n('G', 4, 'A'), n('G', 4, 'men')],
    alto: [n('E', 4), n('E', 4)],
    tenor: [n('C', 4), n('C', 4)],
    bass: [n('C', 3), n('C', 3)],
  },
};

validateComposition(sample);
console.log('✓ Validación OK\n');
console.log('--- LilyPond generado ---');
console.log(jsonToLily(sample));

const outDir = path.join(__dirname, '..', 'output', 'test');
const result = await render(sample, outDir);
console.log('\n--- Resultado del render ---');
console.log(result);
