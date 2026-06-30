// Catálogo de texturas / técnicas de escritura coral.
//
// Cada entrada lleva instrucciones musicales que se inyectan en el prompt para
// guiar a la IA. El modelo de datos (voces independientes con su propio ritmo)
// ya soporta contrapunto; aquí definimos QUÉ pedirle.

export const TEXTURES = {
  homofonia: {
    label: 'Homofonía (acordes)',
    prompt:
      'Textura HOMOFÓNICA: todas las voces se mueven prácticamente con el mismo ' +
      'ritmo, formando acordes que armonizan la melodía superior (estilo coral/himno).',
  },
  contrapunto_libre: {
    label: 'Contrapunto libre',
    prompt:
      'Textura de CONTRAPUNTO LIBRE: cada voz es una línea melódica independiente ' +
      'y cantábile, con ritmos distintos entre sí (independencia rítmica: cuando ' +
      'una voz se mueve, otra puede sostener o callar). Combina las voces con buena ' +
      'conducción: trata las disonancias por grado conjunto (notas de paso, ' +
      'bordaduras, retardos que resuelven hacia abajo), evita quintas y octavas ' +
      'paralelas y directas, y prefiere el movimiento contrario u oblicuo entre voces.',
  },
  imitativo: {
    label: 'Contrapunto imitativo',
    prompt:
      'Textura IMITATIVA: una voz presenta un motivo o sujeto y las demás lo imitan ' +
      'poco después (a la octava, la quinta o el unísono), entrando de forma ' +
      'escalonada (usa silencios al principio de las voces que entran más tarde). ' +
      'Mantén la imitación reconocible al inicio de cada entrada y luego continúa con ' +
      'contrapunto libre. Cuida la conducción: evita quintas y octavas paralelas.',
  },
  canon: {
    label: 'Canon (imitación estricta)',
    prompt:
      'Compón un CANON: la(s) voz(ces) seguidora(s) repiten EXACTAMENTE la melodía de ' +
      'la voz guía, desplazada un número fijo de tiempos (p. ej. uno o dos compases) y, ' +
      'si procede, transportada a la octava o a la quinta. Diseña la melodía guía para ' +
      'que las notas que suenan simultáneamente formen una armonía consonante y agradable. ' +
      'Usa silencios al principio de las voces que entran tarde y al final de la guía, de ' +
      'modo que TODAS las voces cuadren el mismo número de compases.',
  },
  solistas_coro: {
    label: 'Solistas sobre coro sostenido',
    prompt:
      'Estratificación en dos capas (estilo Ešenvalds). CAPA SOLISTA: la(s) voz(ces) ' +
      'SUPERIOR(ES) cantan líneas FLORIDAS, ornamentadas y MELISMÁTICAS — ritmos más ' +
      'rápidos y varias notas por sílaba (en un melisma, pon la sílaba en la primera ' +
      'nota y deja VACÍO el campo lyric en las notas siguientes) — flotando por encima; ' +
      'alarga las PALABRAS IMPORTANTES con melismas (text painting). CAPA CORO: las ' +
      'voces restantes forman un COLCHÓN homofónico SOSTENIDO de acordes en notas ' +
      'largas (blancas/redondas), muy suave. Contrasta claramente las dos velocidades. ' +
      'ACUMULACIÓN TEXTURAL: empieza con textura ESCASA (voces agudas + solistas; las ' +
      'graves en silencio) e incorpora las voces graves GRADUALMENTE para crecer hacia ' +
      'un clímax, aclarando luego la textura hacia el final (arco de densidad). Usa ' +
      'silencios para las entradas escalonadas.',
  },
  fuga: {
    label: 'Fuga (exposición)',
    prompt:
      'Compón la EXPOSICIÓN de una fuga: la primera voz expone el SUJETO sola; la ' +
      'segunda responde con la RESPUESTA (el sujeto transportado a la quinta/dominante) ' +
      'mientras la primera realiza un contrasujeto; las voces restantes entran ' +
      'sucesivamente alternando sujeto y respuesta. Emplea silencios para las entradas ' +
      'escalonadas y procura que cada voz cuadre los compases. Conducción rigurosa: ' +
      'prepara y resuelve las disonancias y evita quintas y octavas paralelas.',
  },
};

export const DEFAULT_TEXTURE = 'homofonia';

export function resolveTexture(id) {
  return TEXTURES[id] || TEXTURES[DEFAULT_TEXTURE];
}

export function textureOptions() {
  return Object.entries(TEXTURES).map(([id, t]) => ({ id, label: t.label }));
}
