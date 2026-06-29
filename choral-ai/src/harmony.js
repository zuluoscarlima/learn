// Fase 1 del proceso compositivo: planificación armónica.
//
// La IA diseña una progresión funcional (un acorde por compás) con una cadencia
// final clara. Las notas de cada acorde se calculan de forma DETERMINISTA aquí
// (deletreo diatónico correcto), para dar a la fase 2 un esqueleto exacto sobre
// el que realizar las voces.
import { getClient, extractJson } from './llm.js';

const MODEL = 'claude-opus-4-8';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Calidades de acorde: pares [salto de letra, intervalo en semitonos] desde la fundamental.
const QUALITIES = {
  major: [[0, 0], [2, 4], [4, 7]],
  minor: [[0, 0], [2, 3], [4, 7]],
  diminished: [[0, 0], [2, 3], [4, 6]],
  augmented: [[0, 0], [2, 4], [4, 8]],
  dominant7: [[0, 0], [2, 4], [4, 7], [6, 10]],
  minor7: [[0, 0], [2, 3], [4, 7], [6, 10]],
  major7: [[0, 0], [2, 4], [4, 7], [6, 11]],
  half_diminished7: [[0, 0], [2, 3], [4, 6], [6, 10]],
  diminished7: [[0, 0], [2, 3], [4, 6], [6, 9]],
};

const QUALITY_LABEL = {
  major: ' mayor',
  minor: ' menor',
  diminished: ' dis',
  augmented: ' aum',
  dominant7: '7',
  minor7: 'm7',
  major7: 'maj7',
  half_diminished7: 'ø7',
  diminished7: 'º7',
};

// Deletrea un grado del acorde con la letra y alteración correctas.
function spell(rootLetter, rootAlter, letterOffset, semitone) {
  const rootIdx = LETTERS.indexOf(rootLetter);
  const rootPc = (NATURAL_PC[rootLetter] + rootAlter + 120) % 12;
  const targetLetter = LETTERS[(rootIdx + letterOffset) % 7];
  const targetPc = (rootPc + semitone) % 12;
  let d = (targetPc - NATURAL_PC[targetLetter]) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return { step: targetLetter, alter: d };
}

// Notas (step+alter) de un acorde en estado fundamental.
export function chordTones(root, alter, quality) {
  const spec = QUALITIES[quality] || QUALITIES.major;
  return spec.map(([lo, si]) => spell(root, alter, lo, si));
}

function noteName(t) {
  const acc = t.alter > 0 ? '♯'.repeat(t.alter) : '♭'.repeat(-t.alter);
  return t.step + acc;
}

// Representa el plan armónico como texto para la fase 2.
export function harmonyToText(chords) {
  const lines = chords.map((c) => {
    const tones = chordTones(c.root, c.alter || 0, c.quality);
    const bass = tones[Math.min(c.inversion || 0, tones.length - 1)];
    const names = tones.map(noteName).join('–');
    const label = QUALITY_LABEL[c.quality] || '';
    return `  Compás ${c.measure}: ${c.roman} — ${noteName({ step: c.root, alter: c.alter || 0 })}${label} (${names}), bajo ${noteName(bass)}`;
  });
  return lines.join('\n');
}

const HARMONY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    chords: {
      type: 'array',
      description: 'Un acorde por compás, en orden',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          measure: { type: 'integer' },
          roman: { type: 'string', description: 'Cifrado funcional, p. ej. I, V7, ii6, IV' },
          root: { type: 'string', enum: LETTERS },
          alter: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          quality: { type: 'string', enum: Object.keys(QUALITIES) },
          inversion: {
            type: 'integer',
            enum: [0, 1, 2, 3],
            description: '0 fundamental, 1 primera inv., 2 segunda, 3 tercera',
          },
        },
        required: ['measure', 'roman', 'root', 'alter', 'quality', 'inversion'],
      },
    },
    cadence: { type: 'string', description: 'Descripción de la cadencia final' },
  },
  required: ['chords', 'cadence'],
};

const SYSTEM_PROMPT = `Eres un armonista experto. Diseñas progresiones funcionales
claras, con buena conducción y direccionalidad hacia una cadencia.

Reglas:
- Un acorde por compás, empezando y terminando en la tónica.
- Usa armonía funcional (T–S–D–T): grados como I, ii, iii, IV, V, vi y dominantes
  con séptima cuando refuercen la dirección. Puedes usar dominantes secundarias.
- Diseña una progresión con sentido y tensión creciente hacia el final.
- Termina con una cadencia auténtica perfecta convincente (V o V7 → I/i), o una
  cadencia rota seguida de auténtica; evita terminar en semicadencia.
- Usa inversiones para lograr un bajo melódico (movimiento por grados conjuntos).`;

function buildUserPrompt(params) {
  const { theme, key = 'C', mode = 'major', timeSignature = '4/4', measures = 8 } = params;
  const lines = [
    `Diseña la progresión armónica de una pieza coral:`,
    `- Tonalidad: ${key} ${mode === 'minor' ? 'menor' : 'mayor'}`,
    `- Compás: ${timeSignature}`,
    `- Número de compases: ${measures} (un acorde por compás → ${measures} acordes)`,
  ];
  if (theme) lines.push(`- Carácter: ${theme}`);
  lines.push(`\nDevuelve exactamente ${measures} acordes (measure 1..${measures}) y la cadencia final.`);
  return lines.join('\n');
}

// Ajusta la longitud de la progresión al número de compases pedido.
function normalize(chords, measures) {
  const out = chords.slice(0, measures);
  while (out.length < measures) {
    const last = out[out.length - 1] || { roman: 'I', root: 'C', alter: 0, quality: 'major', inversion: 0 };
    out.push({ ...last, measure: out.length + 1 });
  }
  return out.map((c, i) => ({ ...c, measure: i + 1 }));
}

// Llama a Claude para planificar la armonía. Devuelve { chords, cadence, text }.
export async function planHarmony(params) {
  const client = getClient();
  const measures = params.measures || 8;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 6000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: HARMONY_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(params) }],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') {
    throw new Error('El modelo rechazó la solicitud por motivos de seguridad.');
  }
  const plan = extractJson(message);
  const chords = normalize(plan.chords || [], measures);
  return { chords, cadence: plan.cadence || '', text: harmonyToText(chords) };
}
