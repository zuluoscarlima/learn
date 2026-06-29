// Servidor de la app de composición coral con IA.
import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeChoral } from './src/compose.js';
import { planHarmony } from './src/harmony.js';
import { render, hasLilyPond } from './src/lilypond.js';
import { resolveVoicing, voicingOptions, DEFAULT_VOICING } from './src/voicings.js';
import { resolveTexture, textureOptions, DEFAULT_TEXTURE } from './src/textures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(OUTPUT_DIR));

// Estado del entorno (¿hay lilypond, hay API key?).
app.get('/api/health', async (_req, res) => {
  res.json({
    lilypond: await hasLilyPond(),
    apiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

// Catálogo de agrupaciones de voces para poblar el desplegable.
app.get('/api/voicings', (_req, res) => {
  res.json({ voicings: voicingOptions(), default: DEFAULT_VOICING });
});

// Catálogo de texturas / técnicas.
app.get('/api/textures', (_req, res) => {
  res.json({ textures: textureOptions(), default: DEFAULT_TEXTURE });
});

// Genera una composición coral y la renderiza a PDF + MIDI.
app.post('/api/compose', async (req, res) => {
  try {
    const params = req.body || {};
    const parts = resolveVoicing(params.voicing || DEFAULT_VOICING);
    const texture = resolveTexture(params.texture || DEFAULT_TEXTURE);

    // Fase 1: plan armónico. Fase 2: realización de las voces sobre él.
    const harmony = await planHarmony(params);
    const composition = await composeChoral(params, parts, texture, harmony.text);

    const id = randomUUID();
    const outDir = path.join(OUTPUT_DIR, id);
    const result = await render(composition, parts, outDir);

    const url = (p) => (p ? `/output/${id}/${path.basename(p)}` : null);
    res.json({
      composition,
      voices: parts.map((p) => p.name),
      texture: texture.label,
      harmony: { progression: harmony.chords.map((c) => c.roman), cadence: harmony.cadence },
      pdfUrl: url(result.pdfPath),
      midiUrl: url(result.midiPath),
      lyUrl: url(result.lyPath),
      warning: result.warning,
    });
  } catch (err) {
    console.error('Error en /api/compose:', err);
    const status = /ANTHROPIC_API_KEY|cuadran|inválid|rechazó|esperaban/i.test(
      err.message,
    )
      ? 400
      : 500;
    res.status(status).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Choral AI escuchando en http://localhost:${PORT}`);
});
