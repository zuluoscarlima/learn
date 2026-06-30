// Fase 2 del proceso compositivo: realización de las voces sobre el plan armónico.
import { getClient, extractJson } from './llm.js';
import { COMPOSITION_SCHEMA, validateComposition } from './schema.js';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `Eres un compositor coral experto formado en la armonía de
ESTILO SEVERO (tratado de Rimsky-Korsakov). Realizas las voces sobre un plan
armónico dado, con conducción de voces impecable y melodías cantábiles.

PROCESO Y REGLAS (estilo severo, síguelas estrictamente):

1. ADHERENCIA AL PLAN ARMÓNICO Y DUPLICACIONES
   - En cada compás, las notas de los TIEMPOS FUERTES de todas las voces
     pertenecen al acorde indicado. El bajo canta la fundamental o la nota de la
     inversión indicada.
   - Duplicación: en estado fundamental duplica la FUNDAMENTAL; en acorde de sexta
     (1ª inversión) duplica la fundamental o la quinta; en acorde de cuarta y sexta
     (6/4) duplica el BAJO (la quinta del acorde). NUNCA dupliques la SENSIBLE
     (7º grado / 3ª de la dominante).

2. ENLACE Y MOVIMIENTO DE LAS VOCES
   - Mantén el sonido común en la misma voz cuando exista (enlace armónico).
   - Las tres voces superiores NO se mueven más de una TERCERA entre dos acordes.
   - Si dos acordes están a distancia de 2ª (grados conjuntos, sin nota común), las
     tres voces superiores se mueven juntas en dirección CONTRARIA al bajo.
   - Disposición: entre dos voces superiores contiguas, no más de una octava. Evita
     los cruces de voces.

3. SUCESIONES PROHIBIDAS (absolutas)
   - PROHIBIDAS las quintas, octavas y unísonos PARALELOS (consecutivos).
   - Evita las quintas y octavas DIRECTAS (llegar a una 5ª u 8ª justa por
     movimiento directo entre las voces extremas).
   - PROHIBIDOS los intervalos melódicos AUMENTADOS (en especial la 2ª aumentada
     del modo menor/mayor armónico y la 4ª aumentada).

4. RESOLUCIÓN DE DISONANCIAS (clave: NADA sin resolver)
   - La SENSIBLE asciende a la tónica, sobre todo en las voces extremas; en una voz
     interna puede descender a la quinta de la tónica.
   - SÉPTIMA DE DOMINANTE: la 7ª SIEMPRE desciende por grado conjunto a la 3ª de la
     tónica, en estado fundamental y en TODAS las inversiones; la 3ª inversión (7ª
     en el bajo) resuelve en el acorde de sexta de tónica (I6). Cuando se llega desde
     IV o II, la 7ª se PREPARA como sonido común. En la cadencia evitada (V→vi)
     duplica la 3ª del acorde de vi.
   - Toda nota ajena al acorde (de paso, bordadura, apoyatura, retardo) va en tiempo
     DÉBIL, aproximada y abandonada por grado conjunto, y resuelta a una nota del
     acorde. Los retardos resuelven DESCENDIENDO por grado conjunto. No dejes
     ninguna 2ª ni 7ª sin resolver.

5. MELODÍA (líneas cantábiles, no relleno)
   - Cada voz tiene dirección y un único clímax por frase; movimiento
     mayoritariamente por grados conjuntos; los saltos (sobre todo grandes) se
     compensan por grado conjunto en dirección contraria.
   - Evita notas repetidas estáticas y ámbitos excesivos. Encamina las frases a la
     cadencia; el final debe sonar conclusivo, con la TÓNICA en la voz superior
     (soprano) sobre tiempo fuerte (cadencia auténtica perfecta).

6. TEXTURA: respeta la textura solicitada (homofonía, contrapunto, canon, fuga),
   pero SIEMPRE sobre el plan armónico y con las disonancias resueltas.

7. MODULACIÓN: el plan armónico puede modular a tonalidades vecinas. Sigue los
   acordes dados con sus alteraciones exactas y aplica las mismas reglas de
   resolución a la dominante de CADA tonalidad (sensible al alza, 7ª a la baja).

8. Cada voz cuadra exactamente los compases en el compás indicado y permanece en su
   tesitura. Usa silencios para entradas/finales escalonados.

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
    max_tokens: 64000,
    // display:summarized hace que el razonamiento fluya en streaming y evita
    // que la conexión se corte por inactividad durante el "pensar".
    thinking: { type: 'adaptive', display: 'summarized' },
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
