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
import { SYSTEMS, systemOptions, resolveSystems, DEFAULT_SYSTEM } from './src/systems.js';
import { continuationBrief } from './src/continuation.js';
import { parseMelody } from './src/musicxml.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const PORT = process.env.PORT || 3000;

const app = express();
// Los MusicXML (sin comprimir) pueden ocupar bastante; damos margen holgado.
app.use(express.json({ limit: '12mb' }));
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

// Catálogo de sistemas armónicos.
app.get('/api/systems', (_req, res) => {
  res.json({ systems: systemOptions(), default: DEFAULT_SYSTEM });
});

// Genera una composición coral y la renderiza a PDF + MIDI.
app.post('/api/compose', async (req, res) => {
  try {
    const params = req.body || {};
    // Uno o varios sistemas (o "mixto" = combinar todo). Se normaliza a un array.
    params.systems = resolveSystems(params.systems ?? params.system);
    const parts = resolveVoicing(params.voicing || DEFAULT_VOICING);
    const texture = resolveTexture(params.texture || DEFAULT_TEXTURE);

    // Modo "armonizar mi melodía": si llega un MusicXML, extraemos la melodía del
    // usuario y la fijamos como voz superior; su tonalidad/compás/tempo/nº de
    // compases MANDAN sobre lo que diga el formulario (la fija el archivo).
    if (params.melodyXml) {
      const melody = parseMelody(params.melodyXml);
      params.melody = melody;
      params.key = melody.keyLetter;
      params.mode = melody.mode;
      params.timeSignature = melody.timeSignature;
      params.measures = melody.measures;
      if (melody.tempo) params.tempo = melody.tempo;
      // Con melodía fija no tiene sentido modular libremente ni continuar.
      params.modulate = false;
    }
    delete params.melodyXml;

    // Continuación (Opción B): si llega la pieza anterior, deriva el brief de
    // coherencia y fuerza el enlace musical — misma tonalidad y compás que la
    // parte 1, para que la costura no chirríe. El resto (voces, sistema,
    // textura, tempo, nº de compases) lo decide el formulario.
    const prev = params.continueFrom;
    if (prev && Array.isArray(prev.voices) && prev.voices.length) {
      params.continuation = continuationBrief(prev);
      if (prev.key) params.key = prev.key;
      if (prev.mode) params.mode = prev.mode;
      if (prev.timeSignature) params.timeSignature = prev.timeSignature;
    }
    delete params.continueFrom;

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
      system: params.systems.map((id) => SYSTEMS[id].label).join(' + '),
      texture: texture.label,
      harmony: { progression: harmony.chords.map((c) => c.roman), cadence: harmony.cadence },
      pdfUrl: url(result.pdfPath),
      midiUrl: url(result.midiPath),
      lyUrl: url(result.lyPath),
      warning: result.warning,
    });
  } catch (err) {
    console.error('Error en /api/compose:', err);
    let message = err.message;
    // Cortes de conexión / timeout: mensaje claro y accionable.
    if (/terminated|timeout|ETIMEDOUT|ECONNRESET|aborted/i.test(message)) {
      message =
        'La conexión con el servicio se interrumpió (la pieza era larga). ' +
        'Vuelve a intentarlo; si se repite, reduce el número de compases o de voces.';
    }
    const status = /ANTHROPIC_API_KEY|cuadran|inválid|rechazó|esperaban|cortó|longitud|interrumpió|MusicXML|melodía|comprimido/i.test(
      message,
    )
      ? 400
      : 500;
    res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Choral AI escuchando en http://localhost:${PORT}`);
});
