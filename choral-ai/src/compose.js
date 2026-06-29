// Fase 2 del proceso compositivo: realización de las voces sobre el plan armónico.
import { getClient, extractJson } from './llm.js';
import { COMPOSITION_SCHEMA, validateComposition } from './schema.js';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `Eres un compositor coral experto. Realizas las voces sobre un
plan armónico dado, con conducción de voces impecable y melodías cantábiles, para
el conjunto de voces y la textura solicitados.

PROCESO Y REGLAS (síguelas estrictamente):

1. Adherencia al plan armónico:
   - En cada compás, las notas de los TIEMPOS FUERTES de todas las voces deben
     pertenecer al acorde indicado para ese compás.
   - El bajo canta la nota de bajo indicada (fundamental o la nota de la inversión).
   - Cubre entre todas las voces las notas del acorde (no dupliques en exceso la
     sensible ni la séptima; resuelve la sensible ascendiendo a la tónica y la
     séptima descendiendo por grado conjunto).

2. Tratamiento de las disonancias (clave: NADA de segundas sin resolver):
   - Las notas ajenas al acorde (de paso, bordaduras, apoyaturas, retardos) solo
     en tiempos DÉBILES, SIEMPRE aproximadas y abandonadas por grado conjunto, y
     resueltas a una nota del acorde.
   - Los retardos resuelven DESCENDIENDO por grado conjunto al tiempo siguiente.
   - En los tiempos fuertes, entre voces deben sonar consonancias (3as, 5as, 6as,
     8as, unísonos); evita 2as, 7as y tritones sin preparar ni resolver.
   - Evita quintas y octavas paralelas y directas; prefiere movimiento contrario u oblicuo.

3. Melodía (que sea MELÓDICA, no relleno):
   - Cada voz es una línea cantábile con dirección y un único clímax por frase.
   - Movimiento mayoritariamente por grados conjuntos; los saltos (especialmente
     los grandes) se resuelven por grado conjunto en dirección contraria.
   - Evita notas repetidas estáticas, giros sin sentido y ámbitos demasiado amplios.
   - Encamina cada frase hacia la cadencia; el final debe sonar conclusivo.

4. Respeta la TEXTURA solicitada (homofonía, contrapunto, canon, fuga…): es la que
   gobierna la independencia rítmica y la relación entre las voces, pero SIEMPRE
   sobre el plan armónico y con las disonancias resueltas.

5. Cada voz debe cuadrar exactamente los compases pedidos en el compás indicado, y
   permanecer dentro de su tesitura. Usa silencios para entradas/finales escalonados.

Devuelve ÚNICAMENTE la composición conforme al esquema solicitado.`;

function buildUserPrompt(params, parts, texture, harmonyText) {
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
    .map((p, i) => `  ${i + 1}. ${p.name} (tesitura ${p.low}–${p.high})`)
    .join('\n');

  const lines = [
    `Realiza las voces de una pieza coral sobre el plan armónico dado:`,
    `- Tonalidad: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Tempo: ${tempo} (negra = bpm)`,
    `- Número de compases: ${measures}`,
    `- Voces (${parts.length}), en este orden exacto:`,
    voiceList,
  ];
  if (texture) lines.push(`- Textura / técnica: ${texture.label}\n  ${texture.prompt}`);
  if (theme) lines.push(`- Tema o carácter: ${theme}`);
  if (lyrics) {
    lines.push(`- Letra para cantar:\n"""${lyrics}"""`);
  } else {
    lines.push(`- Sin letra: usa una vocalización (p. ej. "Ah") o silabea con "la".`);
  }
  if (harmonyText) {
    lines.push(`\nPLAN ARMÓNICO (un acorde por compás — respétalo):\n${harmonyText}`);
  }
  lines.push(
    `\nDevuelve un array "voices" con EXACTAMENTE ${parts.length} voces, en ese ` +
      `orden y con esos nombres. Cada voz debe sumar ${measures} compases en ${timeSignature}.`,
  );
  return lines.join('\n');
}

// Realiza las voces sobre el plan armónico. Devuelve el objeto JSON validado.
export async function composeChoral(params, parts, texture, harmonyText) {
  const client = getClient();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: COMPOSITION_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(params, parts, texture, harmonyText) },
    ],
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
