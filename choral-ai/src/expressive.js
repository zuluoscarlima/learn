// Paleta expresiva: vocabulario curado de indicaciones de CARÁCTER, TEMPO y
// ARTICULACIÓN, con la regla de CUÁNDO usar cada una. Se inyecta en el prompt de
// la fase 2 para que la IA escriba matices variados y apropiados sobre la
// partitura (campo `text` de cada nota) coordinados con las dinámicas.
//
// Recordatorio del modelo de datos: `text` es una marca en cursiva sobre la nota
// (p. ej. "dolce", "rall."); `dynamic` es el matiz/regulador (ppp…fff, <, >, !).

export const EXPRESSIVE_PALETTE = `PALETA EXPRESIVA (marcas de carácter y tempo — campo
"text" — con las dinámicas del campo "dynamic"). Colócalas con CRITERIO (una por frase o
sección, no en cada nota) pero VÁRIALAS (no repitas siempre la misma). Ponlas sobre la
PRIMERA nota de la frase/sección a la que afectan.

Vocabulario por función (elige el término que mejor case con el texto y el carácter):
- ÍNTIMO / TIERNO (inicios suaves, pp/ppp): dolce, dolcissimo, espressivo, teneramente,
  semplice, tranquillo, calmo, sereno, sotto voce, mesto, dolente. (Báltico: "maigi" = con
  ternura.)
- CÁLIDO / EXPANSIVO (al crecer): cantabile, con anima, con calore, appassionato, sonoro,
  largamente, con slancio (con ímpetu). (Báltico: "skanīgāk" = más sonoro.)
- CLÍMAX (punto culminante): con forza, marcato, appassionato, con slancio.
- RELAJACIÓN / CIERRE: morendo, calando, smorzando, perdendosi, dolcissimo, niente (hacia
  la nada).
- ARTICULACIÓN / FRASEO: legato, sempre legato, tenuto, portato (staccato solo si lo pide
  el carácter; raro en coro).

Marcas de TEMPO / RUBATO (campo "text"), en cambios de sección o al acercarse a un reposo:
rit., rall., allargando, a tempo, accel., meno mosso, più mosso, sostenuto, rubato,
"poco a poco".

REGLAS de aplicación:
- COORDINA carácter + dinámica: inicio pp + "dolce"; crecimiento con regulador "<" +
  "cantabile"/"con anima" hacia mf/f; CLÍMAX en f + "appassionato"/"marcato"; cierre con
  ">" + "morendo"/"dolcissimo" hacia ppp.
- TEMPO: pon "rit." o "allargando" ANTES de un reposo importante o del final; "a tempo" al
  retomar; "accel." hacia el clímax si procede.
- Ajusta el idioma al estilo: obra sacra/estándar → términos ITALIANOS; estilo báltico →
  puedes usar "maigi"/"skanīgāk". Sé COHERENTE con el tema/carácter pedido y con el texto.`;
