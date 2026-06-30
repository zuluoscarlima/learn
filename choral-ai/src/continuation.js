// Continuación de una obra (Opción B): a partir de la pieza ya compuesta (la
// "parte 1"), construye un BRIEF en texto que se inyecta en las dos fases para
// que la siguiente parte mantenga COHERENCIA — mismo material temático, misma
// tonalidad y enlace por el acorde final, en lugar de inventar una pieza nueva.

const FIG = { 1: 'redonda', 2: 'blanca', 4: 'negra', 8: 'corchea', 16: 'semicorchea' };

function noteName(n) {
  const acc = n.alter > 0 ? '♯'.repeat(n.alter) : n.alter < 0 ? '♭'.repeat(-n.alter) : '';
  return `${n.step}${acc}${n.octave}`;
}

// Primeras notas REALES (sin silencios) de una voz: el motivo/tema a desarrollar.
function leadMotif(notes, count = 8) {
  const out = [];
  for (const n of notes) {
    if (n.rest) continue;
    out.push(noteName(n));
    if (out.length >= count) break;
  }
  return out.join(' ');
}

// Acorde final: la última nota real de cada voz (el "enlace" o costura).
function finalSonority(comp) {
  const tones = [];
  for (const v of comp.voices) {
    for (let i = v.notes.length - 1; i >= 0; i--) {
      if (!v.notes[i].rest) {
        tones.push(`${v.name} ${noteName(v.notes[i])}`);
        break;
      }
    }
  }
  return tones.join(', ');
}

// Brief de continuación inyectable en los prompts de fase 1 y fase 2.
// Devuelve '' si la composición previa no es válida.
export function continuationBrief(comp) {
  if (!comp || !Array.isArray(comp.voices) || comp.voices.length === 0) return '';
  const lead = comp.voices.find((v) => Array.isArray(v.notes) && v.notes.length) || comp.voices[0];
  const modeEs = comp.mode === 'minor' ? 'menor' : 'mayor';
  return [
    'CONTINUACIÓN: esta es la SEGUNDA PARTE de una obra ya compuesta. Debe sonar como ' +
      'continuación natural de la primera, NO como una pieza nueva e independiente.',
    `- Tonalidad en la que TERMINÓ la primera parte (empieza aquí): ${comp.key} ${modeEs}.`,
    `- MOTIVO/TEMA principal a RETOMAR y DESARROLLAR (comienzo de la voz "${lead.name}"): ` +
      `${leadMotif(lead.notes)}.`,
    `- ENLACE: la primera parte terminó en este acorde — ${finalSonority(comp)}. Empieza la ` +
      'segunda parte de forma consonante y coherente con él, como si la música no se hubiera detenido.',
    '- Reutiliza y VARÍA el motivo (transposición, inversión, fragmentación, ampliación); ' +
      'conserva el mismo carácter, textura y densidad. No copies la primera parte literalmente.',
    '- Construye un ARCO hasta un CIERRE conclusivo y definitivo de TODA la obra (cadencia ' +
      'auténtica perfecta en la tónica si el sistema es tonal).',
  ].join('\n');
}
