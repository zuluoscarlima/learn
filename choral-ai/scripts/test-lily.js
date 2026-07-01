// Prueba la cadena JSON -> LilyPond -> PDF + MIDI sin llamar a Claude.
// Uso: node scripts/test-lily.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComposition } from '../src/schema.js';
import { jsonToLily, render } from '../src/lilypond.js';
import { resolveVoicing } from '../src/voicings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const n = (step, octave, lyric = '') => ({
  rest: false,
  step,
  alter: 0,
  octave,
  duration: 1,
  dotted: false,
  tuplet: 1,
  lyric,
});

// Cadencia sencilla en Do mayor: dos acordes de tónica (redondas), 2 compases.
const sample = {
  title: 'Prueba SATB',
  key: 'C',
  mode: 'major',
  timeSignature: '4/4',
  tempo: 72,
  measures: 2,
  voices: [
    { name: 'Soprano', notes: [n('G', 4, 'A'), n('G', 4, 'men')] },
    { name: 'Contralto', notes: [n('E', 4, 'A'), n('E', 4, 'men')] },
    { name: 'Tenor', notes: [n('C', 4, 'A'), n('C', 4, 'men')] },
    { name: 'Bajo', notes: [n('C', 3, 'A'), n('C', 3, 'men')] },
  ],
};

const parts = resolveVoicing('satb');
validateComposition(sample, parts.length);
console.log('✓ Validación OK (4 voces)\n');
console.log('--- LilyPond generado ---');
console.log(jsonToLily(sample, parts));

const outDir = path.join(__dirname, '..', 'output', 'test');
const result = await render(sample, parts, outDir);
console.log('\n--- Resultado del render ---');
console.log(result);

// Prueba extra: un dúo (SA) con solo 2 voces, para confirmar N voces.
const duo = {
  title: 'Prueba dúo SA',
  key: 'C',
  mode: 'major',
  timeSignature: '4/4',
  tempo: 80,
  measures: 1,
  voices: [
    { name: 'Soprano', notes: [n('E', 5, 'la')] },
    { name: 'Contralto', notes: [n('C', 5, 'la')] },
  ],
};
const duoParts = resolveVoicing('sa');
validateComposition(duo, duoParts.length);
console.log('\n✓ Validación OK (dúo SA, 2 voces)');
