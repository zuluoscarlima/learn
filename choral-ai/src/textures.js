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
      'Textura de CONTRAPUNTO LIBRE con IMITACIÓN: cada voz es una línea melódica ' +
      'independiente y cantábile, con ritmos distintos entre sí (independencia rítmica: ' +
      'cuando una voz se mueve, otra puede sostener o callar). IMITACIÓN entre las voces ' +
      'superiores: cuando UNA voz presenta un MOTIVO o diseño melódico característico, ' +
      'haz que OTRA voz lo IMITE poco después (a la octava, la quinta, la tercera o el ' +
      'unísono, uno o dos tiempos más tarde) — un juego de eco/pregunta-respuesta que ' +
      'recorre la pieza; no hace falta que la imitación sea estricta como en un canon, ' +
      'basta con que el diseño se RECONOZCA al reaparecer en otra voz. El BAJO es una VOZ ' +
      'MÁS, con su propia línea INDEPENDIENTE y cantábile, más libre que las demás y sin ' +
      'obligación de imitarlas. Combina las voces con buena conducción: trata ' +
      'las disonancias por grado conjunto (notas de paso, bordaduras, retardos que ' +
      'resuelven hacia abajo), evita quintas y octavas paralelas y directas, y prefiere ' +
      'el movimiento contrario u oblicuo entre voces.',
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
  tarareo: {
    label: 'Coro con tarareo (Mm / Oh / Ah)',
    sustained: true,
    prompt:
      'Textura báltica/impresionista de COLCHÓN con tarareo: ALGUNAS voces (p. ej. ' +
      'las graves o las internas) sostienen notas largas sin texto silábico cantadas ' +
      'sobre una VOCAL/SÍLABA abierta o cerrada — alterna "Mm" (cerrado), "Oh", "Oo" o ' +
      '"Ah" (abiertos) según el color buscado: cerrado y velado en lo íntimo, abierto y ' +
      'sonoro al crecer hacia el clímax — formando un colchón armónico muy suave (pon la ' +
      'sílaba en la primera nota del grupo y deja VACÍO el lyric en las siguientes para ' +
      'sostenerla). Las DEMÁS voces llevan el TEXTO de forma más activa por encima. ' +
      'Entradas escalonadas; dinámicas muy tenues (ppp/pp) que abren el color de la ' +
      'vocal al crecer; las capas se superponen y se intercambian.',
  },
  duo_solistas_imitacion: {
    label: 'Dúo de solistas en imitación sobre colchón (Ešenvalds)',
    sustained: true,
    prompt:
      'Textura estilo Ešenvalds ("O Salutaris Hostia"). DOS voces SOLISTAS agudas (las dos ' +
      'primeras voces, o las marcadas como solistas) cantan por encima líneas MUY floridas y ' +
      'melismáticas, con TRESILLOS y SEISILLOS ("tuplet":3 y 6), ritmos con puntillo y ' +
      'anacrusas, en contorno de ONDA (rubato, "Con sentimento"). Trabaja la IMITACIÓN: la ' +
      'SOLISTA 1 propone un giro/motivo y la SOLISTA 2 lo RESPONDE (eco) uno o dos tiempos ' +
      'después; tras el juego imitativo, las dos solistas se funden cantando en PARALELO por ' +
      'TERCERAS (a veces sextas). Debajo, el CORO forma un COLCHÓN homofónico SOSTENIDO en ' +
      'notas largas (blancas/redondas), doblado en terceras, muy suave (pp/p), sin apenas ' +
      'moverse (ritmo armónico lento). ACUMULACIÓN: empieza escaso (solistas + voces agudas; ' +
      'graves en silencio) e incorpora las voces graves GRADUALMENTE hacia un clímax tenue, ' +
      'aclarando al final (cierre "Amen" pianísimo, sostenido). Entradas escalonadas con ' +
      'silencios. Pon la sílaba en la primera nota de cada melisma y deja VACÍO el lyric en ' +
      'las siguientes.',
  },
  solistas_coro: {
    label: 'Solistas sobre coro sostenido',
    sustained: true,
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
