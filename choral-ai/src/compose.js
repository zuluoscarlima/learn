// Integración con Claude: genera una pieza coral (N voces) como JSON estructurado.
import Anthropic from '@anthropic-ai/sdk';
import { COMPOSITION_SCHEMA, validateComposition } from './schema.js';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `Eres un compositor coral experto. Compones música vocal
con conducción de voces correcta y de calidad de concierto, para el conjunto de
voces que se te indique (dúos, tríos, SATB, SSAATTBB, doble coro, voces iguales,
etc.).

Reglas musicales que DEBES respetar:
- Compón EXACTAMENTE las voces solicitadas, en el mismo orden y con los mismos
  nombres que se indican, y mantén cada voz dentro de su tesitura.
- Cada voz debe sumar exactamente los compases pedidos en el compás indicado.
  Para cada compás, las duraciones de cada voz deben completar el compás sin
  exceso ni defecto.
- Armoniza siguiendo la tonalidad y el modo dados. Usa progresiones funcionales y
  termina con una cadencia clara (típicamente V–I / V–i).
- Conducción de voces: prefiere movimiento por grados conjuntos, evita quintas y
  octavas paralelas entre voces, y evita cruces de voces.
- Si hay letra, distribúyela en sílabas sobre las notas (campo "lyric"); en
  textura homofónica todas las voces comparten las mismas sílabas. En doble coro,
  los dos coros pueden dialogar (antifonía).
- Las alturas se expresan de forma abstracta: step (A-G), alter (-1 bemol,
  0 natural, 1 sostenido), octave (octava científica), duration (denominador:
  4=negra, 8=corchea...) y dotted (puntillo). Usa rest=true para silencios.

Devuelve ÚNICAMENTE la composición conforme al esquema solicitado.`;

function buildUserPrompt(params, parts) {
  const {
    theme,
    lyrics,
    key = 'C',
    mode = 'major',
    timeSignature = '4/4',
    tempo = 72,
    measures = 8,
  } = params;

  const voiceList = parts
    .map((p) => `  ${parts.indexOf(p) + 1}. ${p.name} (tesitura ${p.low}–${p.high})`)
    .join('\n');

  const lines = [
    `Compón una pieza coral con estas características:`,
    `- Tonalidad: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Tempo: ${tempo} (negra = bpm)`,
    `- Número de compases: ${measures}`,
    `- Voces (${parts.length}), en este orden exacto:`,
    voiceList,
  ];
  if (theme) lines.push(`- Tema o carácter: ${theme}`);
  if (lyrics) {
    lines.push(`- Letra para cantar:\n"""${lyrics}"""`);
  } else {
    lines.push(`- Sin letra: usa una vocalización (p. ej. "Ah") o silabea con "la".`);
  }
  lines.push(
    `\nDevuelve un array "voices" con EXACTAMENTE ${parts.length} voces, en ese ` +
      `orden y con esos nombres. Cada voz debe sumar ${measures} compases en ${timeSignature}.`,
  );
  return lines.join('\n');
}

// Extrae el JSON de la respuesta del SDK, tolerando structured outputs o texto.
function extractJson(message) {
  if (message.parsed_output) return message.parsed_output;
  for (const block of message.content) {
    if (block.type === 'text') {
      const text = block.text.trim();
      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    }
  }
  throw new Error('No se pudo extraer JSON de la respuesta del modelo.');
}

// Genera la composición. `parts` es la lista de voces resuelta del voicing.
// Devuelve el objeto JSON validado.
export async function composeChoral(params, parts) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en el entorno.');
  }
  const client = new Anthropic();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: COMPOSITION_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(params, parts) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
  }

  const composition = extractJson(message);
  if (!composition.title && params.theme) composition.title = params.theme;
  validateComposition(composition, parts.length);
  return composition;
}
