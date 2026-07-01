// Fase 2 del proceso compositivo: realización de las voces sobre el plan armónico.
import { getClient, extractJson, effortForQuality } from './llm.js';
import { COMPOSITION_SCHEMA, validateComposition, repairRhythm } from './schema.js';
import {
  QUARTAL_COMPOSE_SYSTEM,
  CONTEMPORARY_COMPOSE_SYSTEM,
  IMPRESSIONIST_COMPOSE_SYSTEM,
  PERSICHETTI_COMPOSE_SYSTEM,
  TERTIAN_COMPOSE_SYSTEM,
} from './systems.js';

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
   - El cromatismo debe ocurrir en la MISMA voz: si la nota natural y su alteración
     (p. ej. fa y fa♯) aparecen en VOCES DISTINTAS en acordes contiguos, surge una
     FALSA RELACIÓN, prohibida.

4. RESOLUCIÓN DE DISONANCIAS (clave: NADA sin resolver)
   - La SENSIBLE asciende a la tónica, sobre todo en las voces extremas; en una voz
     interna puede descender a la quinta de la tónica.
   - SÉPTIMA DE DOMINANTE: la 7ª SIEMPRE desciende por grado conjunto a la 3ª de la
     tónica, en estado fundamental y en TODAS las inversiones; la 3ª inversión (7ª
     en el bajo) resuelve en el acorde de sexta de tónica (I6). Cuando se llega desde
     IV o II, la 7ª se PREPARA como sonido común. En la cadencia evitada (V→vi)
     duplica la 3ª del acorde de vi.
   - SÉPTIMA DE SENSIBLE (VII7): resuelve en la tónica con la 3ª DUPLICADA — la
     sensible asciende a la tónica y la 7ª desciende a la 5ª de la tónica.
   - SÉPTIMA DEL II GRADO (ii7, predominante): la 7ª va PREPARADA (sonido común desde
     I/I6/IV/IV6/VI); al seguir V o V7 desciende un semitono; si sigue el 6/4
     cadencial, permanece fija formando su cuarta.
   - ACORDE DE NOVENA (V9): la novena desciende por grado conjunto al resolver; las
     demás voces, como en la séptima de dominante.
   - NAPOLITANA (♭II6): se usa con la 3ª duplicada; el ♭2 (su fundamental) desciende
     al resolver a V o al 6/4 cadencial.
   - SEXTA AUMENTADA (italiana/francesa/alemana): la 6ª aumentada se EXPANDE hacia
     afuera (a la octava de la dominante) y nunca se duplica; resuelve en V o en el
     6/4 cadencial.
   - Estilo CORAL: prefiere las INVERSIONES de la 7ª de dominante (6/5, 2); evita el
     V7 en estado fundamental con la 7ª en la voz superior (salvo séptima de paso).
   - NOTAS EXTRAÑAS al acorde: notas de PASO y BORDADURAS por grado conjunto en
     tiempo débil; APOYATURAS (notas extrañas acentuadas, en tiempo fuerte) que
     resuelven por grado conjunto; RETARDOS preparados que resuelven DESCENDIENDO por
     grado conjunto; ANTICIPACIONES (una nota del acorde SIGUIENTE sonada antes, en
     tiempo débil); y notas CAMBIADAS/escapadas (dejadas por salto, justificadas por
     la nota de paso omitida o por pertenecer al acorde siguiente). No dejes 2ª ni 7ª
     sin sentido ni sin resolver.
   - PEDAL (nota pedal / bajo de órgano): una voz —normalmente el bajo— puede
     SOSTENER la tónica o la dominante mientras las demás voces se mueven con otras
     armonías por encima; empieza y termina el pedal en consonancia.

5. MELODÍA (líneas cantábiles, no relleno)
   - Cada voz tiene dirección y un único clímax por frase; movimiento
     mayoritariamente por grados conjuntos; los saltos (sobre todo grandes) se
     compensan por grado conjunto en dirección contraria.
   - Evita notas repetidas estáticas y ámbitos excesivos. Encamina las frases a la
     cadencia; el final debe sonar conclusivo, con la TÓNICA en la voz superior
     (soprano) sobre tiempo fuerte (cadencia auténtica perfecta).
   - Moldea las frases con DINÁMICAS (campo dynamic), con moderación: regulador "<"
     hacia el punto culminante y ">" al relajar; matiz al inicio de cada sección.

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

  const hasSoloists = parts.some((p) => p.solo);
  const voiceList = parts
    .map((p, i) => {
      const role = p.solo ? ' [SOLISTA: línea florida/melismática por encima]' : '';
      return `  ${i + 1}. ${p.name} (tesitura ${p.low}–${p.high})${role}`;
    })
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
  if (hasSoloists) {
    lines.push(
      '- Hay SOLISTAS: esas voces cantan líneas floridas, ornamentadas y melismáticas ' +
        'que flotan por encima; las demás voces forman el coro/colchón sostenido.',
    );
  }
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
  // Continuación (Opción B): material temático y enlace con la parte 1.
  if (params.continuation) {
    lines.push('\n' + params.continuation);
  }
  // En estilos báltico/impresionista la métrica suele CAMBIAR de compás a compás.
  if (
    params.system === 'impresionista' ||
    params.system === 'contemporaneo' ||
    params.system === 'sigloxx'
  ) {
    lines.push(
      `\nMÉTRICA CAMBIANTE (opcional, estilo báltico/impresionista): si la prosodia ` +
        `del texto lo pide, puedes devolver además un campo "meters" con UN compás ` +
        `por cada uno de los ${measures} compases (longitud exacta = ${measures}), ` +
        `mezclando compases simples y aditivos según el acento natural de las ` +
        `palabras (p. ej. ["3/4","2+3+3/8","2+3/8","2+2/8"]). El primero de la lista ` +
        `debe coincidir con "timeSignature". Si la pieza mantiene un compás fijo, ` +
        `omite "meters".`,
    );
  }
  lines.push(
    `\nDevuelve un array "voices" con EXACTAMENTE ${parts.length} voces, en ese ` +
      `orden y con esos nombres. Cada voz debe sumar ${measures} compases (usando ` +
      `"meters" si lo incluyes, o "${timeSignature}" en todos si no).`,
  );
  return lines.join('\n');
}

// Realiza las voces sobre el plan armónico. Devuelve el objeto JSON validado.
export async function composeChoral(params, parts, texture, harmonyText) {
  const client = getClient();

  const systemPrompt =
    params.system === 'cuartal'
      ? QUARTAL_COMPOSE_SYSTEM
      : params.system === 'contemporaneo'
        ? CONTEMPORARY_COMPOSE_SYSTEM
        : params.system === 'impresionista'
          ? IMPRESSIONIST_COMPOSE_SYSTEM
          : params.system === 'sigloxx'
            ? PERSICHETTI_COMPOSE_SYSTEM
            : params.system === 'terceras'
              ? TERTIAN_COMPOSE_SYSTEM
              : SYSTEM_PROMPT;

  const stream = client.messages.stream({
    model: MODEL,
    // Techo alto de salida (Opus 4.8 admite hasta 128k con streaming). Las
    // piezas largas a varias voces generan un JSON muy extenso; 64k da margen
    // para evitar que la respuesta se corte por longitud. Aun así, piezas muy
    // grandes (32 compases × 4+ voces) pueden necesitar dividirse.
    max_tokens: 64000,
    // display:summarized hace que el razonamiento fluya en streaming y evita
    // que la conexión se corte por inactividad durante el "pensar".
    thinking: { type: 'adaptive', display: 'summarized' },
    output_config: {
      // El esfuerzo lo decide el selector de calidad/velocidad: low (rápida),
      // medium (equilibrada) o high (alta calidad, más lento y preciso).
      effort: effortForQuality(params.quality),
      format: { type: 'json_schema', schema: COMPOSITION_SCHEMA },
    },
    system: systemPrompt,
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
  // Repara descuadres rítmicos menores (recorta/rellena) en vez de fallar.
  repairRhythm(composition);
  return composition;
}
