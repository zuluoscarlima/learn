// Integración con Claude: genera una pieza coral SATB como JSON estructurado.
import Anthropic from '@anthropic-ai/sdk';
import { COMPOSITION_SCHEMA, validateComposition } from './schema.js';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `Eres un compositor coral experto. Compones música a cuatro
voces mixtas (SATB: soprano, contralto, tenor y bajo) con conducción de voces
correcta y de calidad de concierto.

Reglas musicales que DEBES respetar:
- Rangos cómodos por voz (octava científica, C4 = do central):
  soprano C4–A5, contralto G3–D5, tenor C3–G4, bajo E2–C4.
- Cada voz debe sumar exactamente los compases pedidos en el compás indicado.
  Para cada compás, las duraciones de cada voz deben completar el compás sin
  exceso ni defecto.
- Armoniza siguiendo la tonalidad y el modo dados. Usa progresiones funcionales y
  termina con una cadencia clara (típicamente V–I / V–i).
- Conducción de voces: prefiere movimiento por grados conjuntos, evita quintas y
  octavas paralelas entre voces, y evita cruces de voces.
- Si se proporciona una letra, distribúyela en sílabas sobre las notas (campo
  "lyric"); normalmente la melodía superior (soprano) lleva el texto principal.
- Las alturas se expresan de forma abstracta: step (A-G), alter (-1 bemol,
  0 natural, 1 sostenido), octave (octava científica), duration (denominador:
  4=negra, 8=corchea...) y dotted (puntillo). Usa rest=true para silencios.

Devuelve ÚNICAMENTE la composición conforme al esquema solicitado.`;

function buildUserPrompt(params) {
  const {
    theme,
    lyrics,
    key = 'C',
    mode = 'major',
    timeSignature = '4/4',
    tempo = 72,
    measures = 8,
  } = params;

  const lines = [
    `Compón una pieza coral SATB con estas características:`,
    `- Tonalidad: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Tempo: ${tempo} (negra = bpm)`,
    `- Número de compases: ${measures}`,
  ];
  if (theme) lines.push(`- Tema o carácter: ${theme}`);
  if (lyrics) {
    lines.push(`- Letra para cantar:\n"""${lyrics}"""`);
  } else {
    lines.push(`- Sin letra: usa una vocalización (p. ej. "Ah") o silabea con "la".`);
  }
  lines.push(
    `\nAsegúrate de que CADA voz sume exactamente ${measures} compases en ${timeSignature}.`,
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

// Genera la composición. Devuelve el objeto JSON validado.
export async function composeChoral(params) {
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
    messages: [{ role: 'user', content: buildUserPrompt(params) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
  }

  const composition = extractJson(message);
  // Conserva el título pedido si el modelo no propuso uno mejor.
  if (!composition.title && params.theme) composition.title = params.theme;
  validateComposition(composition);
  return composition;
}
