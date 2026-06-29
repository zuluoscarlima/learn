// Servidor de la app de composición coral con IA.
import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeChoral } from './src/compose.js';
import { render, hasLilyPond } from './src/lilypond.js';

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

// Genera una composición coral y la renderiza a PDF + MIDI.
app.post('/api/compose', async (req, res) => {
  try {
    const params = req.body || {};
    const composition = await composeChoral(params);

    const id = randomUUID();
    const outDir = path.join(OUTPUT_DIR, id);
    const result = await render(composition, outDir);

    const url = (p) => (p ? `/output/${id}/${path.basename(p)}` : null);
    res.json({
      composition,
      pdfUrl: url(result.pdfPath),
      midiUrl: url(result.midiPath),
      lyUrl: url(result.lyPath),
      warning: result.warning,
    });
  } catch (err) {
    console.error('Error en /api/compose:', err);
    const status = /ANTHROPIC_API_KEY|cuadran|inválid|rechazó/i.test(err.message)
      ? 400
      : 500;
    res.status(status).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Choral AI escuchando en http://localhost:${PORT}`);
});
