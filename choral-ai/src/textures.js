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
      'sonoro al crecer hacia el clímax; CAMBIA la vocal cuando cambia la armonía. Forma un ' +
      'colchón armónico muy suave con notas LARGAS LIGADAS entre compases ("tie":true; pon la ' +
      'sílaba en la primera nota y deja VACÍO el lyric en las siguientes para sostenerla). ' +
      'Las DEMÁS voces llevan el TEXTO (o una línea lírica libre) de forma más activa por encima. ' +
      'RESPIRACIÓN con MORPHING de VOCAL (estilo "In Paradisum"): el colchón respira con ' +
      'reguladores continuos (pon en el campo "dynamic" un "<" al empezar a crecer y ">" al ' +
      'menguar) y la vocal MORFA con la dinámica — cerrada "Mm" en lo suave, ABRIENDO a "Ah" en ' +
      'la CIMA del regulador y cerrando otra vez a "Mm" al recogerse (coloca "Ah" en la nota de ' +
      'la cima y "Mm" al volver a lo tenue). Entradas escalonadas; muy tenue (ppp/pp); las ' +
      'capas se superponen y se intercambian.',
  },
  halo_copas: {
    label: 'Coro con halo de copas de agua (Ešenvalds "Stars")',
    sustained: true,
    prompt:
      'Textura estilo Ešenvalds "Stars", emulando el brillo de las COPAS AFINADAS CON AGUA con ' +
      'un HALO vocal sostenido. ALGUNAS voces (o divisi de agudas/internas) mantienen un PEDAL ' +
      'muy suave y CONTINUO de sonidos ABIERTOS y RESONANTES — QUINTAS justas y color ' +
      'PENTATÓNICO (p. ej. Re–La con Mi y La añadidos) — tarareando "Mm"/"Oo" en notas LARGAS ' +
      'LIGADAS entre compases ("tie":true) que NO se cortan en las barras (un brillo que flota ' +
      'por encima de la métrica). El RESTO del coro canta el TEXTO de forma HOMOFÓNICA, cálida y ' +
      'expresiva (rubato), muy suave (p–mp), abriendo a acordes sostenidos de "Ah" en el clímax. ' +
      'Dinámicas con largos reguladores; entradas escalonadas; centro modal/mayor luminoso.',
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
  o_salutaris: {
    label: 'O Salutaris Hostia — modelo Ešenvalds (dúo de solistas + colchón)',
    sustained: true,
    prompt:
      'Reproduce fielmente el MODELO de "O Salutaris Hostia" de Ēriks Ešenvalds (SS soli sobre ' +
      'SSAATTBB), "Con sentimento", muy sereno y lento (negra ≈ 52–58), diatónico y luminoso, ' +
      'todo en dinámicas SUAVES (pp–mf). CREDO de Ešenvalds que DEBES respetar: "la ARMONÍA es ' +
      'lo más importante — cómo fluye y se transforma en una nueva armonía; la línea melódica es ' +
      'secundaria"; por tanto prioriza el FLUJO ARMÓNICO cálido (acordes diatónicos con algún ' +
      'color de 2ª/6ª/9ª añadida, enlaces suaves por nota común y planing), ritmo armónico MUY ' +
      'LENTO, y deja que la melodía sirva a la armonía.\n' +
      'DOS SOLISTAS SOPRANO (Solo I y Solo II) por encima del coro:\n' +
      '- APERTURA: entra SOLO I solo (mp) con un giro florido; SOLO II responde IMITÁNDOLO (eco) ' +
      'uno o dos tiempos después. Las dos líneas son MELISMÁTICAS y muy ondulantes, LLENAS de ' +
      'TRESILLOS ("tuplet":3) y algún seisillo, con puntillos y anacrusas (rubato).\n' +
      '- Tras el juego imitativo, las dos solistas se FUNDEN cantando en PARALELO por TERCERAS ' +
      '(a veces sextas).\n' +
      '- DIVISI DE GRUPO (firma notacional de la obra): la línea solista puede convertirse en un ' +
      'PEQUEÑO GRUPO — "3-4 soprani" o "6-8 soprani" — para hinchar la dinámica de forma ' +
      'controlada, y volver a "unis."/solo después. Realiza esos momentos con DIVISI (campo ' +
      '"chord") en la voz aguda e indícalo en el campo "text" ("3-4 soprani", "6-8 soprani", ' +
      '"unis.", "Solo").\n' +
      'COLCHÓN DEL CORO por debajo: acordes SOSTENIDOS homofónicos en notas largas (blancas/' +
      'redondas ligadas entre compases, "tie":true), doblados en 3ras/6tas, muy suaves, sin ' +
      'apenas moverse. ACUMULACIÓN (arco de densidad): empieza con S+A del coro (p) mientras ' +
      'TENOR y BAJO CALLAN; incorpora el TENOR y luego el BAJO GRADUALMENTE para crecer a mf, y ' +
      'aclara de nuevo hacia el final.\n' +
      'CIERRE: el CORO sostiene un "Amen" LARGUÍSIMO, pianísimo, conclusivo por PERMANENCIA ' +
      '(acorde diatónico pleno), mientras las solistas se apagan; calderón final.\n' +
      'Pon la sílaba SOLO en la primera nota de cada melisma y deja VACÍO el "lyric" en las ' +
      'siguientes. Entradas escalonadas con silencios.',
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
      'largas LIGADAS entre compases (blancas/redondas con ligadura de valor, campo ' +
      '"tie":true), muy suave, sobre "Mm"/"Oh". Contrasta claramente las dos velocidades. ' +
      'La SOLISTA usa TRESILLOS ("tuplet":3) y rubato, y puede rematar palabras con una ' +
      'VOCALISE SIN TEXTO ("Oh"/"Ah") — como en el final de "Only in Sleep": la solista se ' +
      'eleva libre mientras el coro sostiene el colchón, apagándose a ppp con calderón. ' +
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
