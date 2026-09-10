// Servidor de la app de composición coral con IA.
import express from 'express';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeChoral } from './src/compose.js';
import { planHarmony } from './src/harmony.js';
import { render, hasLilyPond } from './src/lilypond.js';
import { resolveVoicing, voicingOptions, DEFAULT_VOICING } from './src/voicings.js';
import { resolveTexture, textureOptions, DEFAULT_TEXTURE } from './src/textures.js';
import { SYSTEMS, systemOptions, resolveSystems, DEFAULT_SYSTEM } from './src/systems.js';
import { parseMelody, compositionToMusicXML } from './src/musicxml.js';
import { beatsPerMeasure } from './src/schema.js';

// Cuenta APROXIMADA de sílabas de un texto (grupos de vocales por palabra; al
// menos 1 por palabra). Sirve para estimar cuánta letra hay que repartir.
function countSyllables(text) {
  const words = String(text || '').toLowerCase().match(/[a-záéíóúüñ]+/gi) || [];
  let syl = 0;
  for (const w of words) {
    const groups = w.match(/[aeiouáéíóúü]+/g);
    syl += groups ? groups.length : 1;
  }
  return syl;
}

// Nº de compases NECESARIOS para que quepa la letra con holgura cantable, según
// el compás y la densidad (melisma y textura). Devuelve 0 si no hay letra.
function measuresForLyrics(lyrics, timeSignature, { melisma, sustained } = {}) {
  const syl = countSyllables(lyrics);
  if (!syl) return 0;
  const bpm = beatsPerMeasure(timeSignature) || 4;
  let perBeat = 1; // ~1 sílaba por pulso en un canto fluido
  if (melisma === 'melismatico') perBeat *= 0.6; // varias notas por sílaba → menos texto/compás
  else if (melisma === 'silabico') perBeat *= 1.2;
  if (sustained) perBeat *= 0.7; // colchones/solistas reparten menos texto por compás
  const perMeasure = Math.max(1, bpm * perBeat);
  return Math.ceil(syl / perMeasure);
}

// Tope de seguridad para la expansión automática por letra (evita cortes por
// longitud en piezas enormes; el usuario puede dividir el texto si hace falta).
const MAX_AUTO_MEASURES = 64;

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
      // El TEMPO lo manda el FORMULARIO (el usuario decide): no lo pisamos con el
      // del archivo. El del archivo (si lo trae) se ofrece solo como información.
      // Con melodía fija no tiene sentido modular libremente ni continuar.
      params.modulate = false;
    }
    delete params.melodyXml;

    // AJUSTE AUTOMÁTICO por LETRA: si el texto no cabe en los compases pedidos,
    // ampliamos el nº de compases para que quepa (solo fuera del modo melodía).
    let lyricsFit = null;
    if (!params.melody && params.lyrics && String(params.lyrics).trim()) {
      const needed = measuresForLyrics(params.lyrics, params.timeSignature, {
        melisma: params.melisma,
        sustained: Boolean(texture.sustained),
      });
      const current = Number(params.measures) || 8;
      if (needed > current) {
        const to = Math.min(needed, MAX_AUTO_MEASURES);
        params.measures = to;
        lyricsFit = { from: current, to, needed, capped: needed > MAX_AUTO_MEASURES };
      }
    }

    // Fase 1: plan armónico. Fase 2: realización de las voces sobre él.
    const harmony = await planHarmony(params);
    const composition = await composeChoral(params, parts, texture, harmony.text);

    const id = randomUUID();
    const outDir = path.join(OUTPUT_DIR, id);
    const result = await render(composition, parts, outDir);

    // Exportación a MusicXML (determinista, independiente de LilyPond): permite
    // abrir y editar la pieza en MuseScore/Sibelius/Finale.
    let xmlPath = null;
    try {
      const xml = compositionToMusicXML(composition, parts);
      xmlPath = path.join(outDir, 'piece.musicxml');
      await writeFile(xmlPath, xml, 'utf8');
    } catch (e) {
      console.error('No se pudo generar el MusicXML:', e);
      xmlPath = null;
    }

    const url = (p) => (p ? `/output/${id}/${path.basename(p)}` : null);
    res.json({
      composition,
      voices: parts.map((p) => p.name),
      system: params.systems.map((id) => SYSTEMS[id].label).join(' + '),
      texture: texture.label,
      harmony: { progression: harmony.chords.map((c) => c.roman), cadence: harmony.cadence },
      // Aviso si se AMPLIARON los compases automáticamente para que quepa la letra.
      lyricsFit,
      // Confirmación de que se armonizó la melodía SUBIDA por el usuario (para que
      // se vea claramente en la UI si el modo "armonizar mi melodía" se aplicó).
      harmonized: Boolean(params.melody),
      melodyInfo: params.melody
        ? {
            measures: params.melody.measures,
            tonality: params.melody.tonalityName,
            notes: params.melody.notes.filter((n) => !n.rest).length,
            fileTempo: params.melody.tempo || null,
            usedTempo: params.tempo,
          }
        : null,
      pdfUrl: url(result.pdfPath),
      midiUrl: url(result.midiPath),
      lyUrl: url(result.lyPath),
      xmlUrl: url(xmlPath),
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
