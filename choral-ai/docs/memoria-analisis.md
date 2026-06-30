# Memoria de análisis — referencias para ejecución posterior

Documento de "memoria": análisis de obras reales y las funciones derivadas que
conviene implementar en la app. No es código; es la lista de trabajo pendiente
basada en partituras analizadas.

---

## Obra 1 — Coral letón impresionista (texto de I. Ziedonis)

- **Indicación**: "Ar impresionistisku vieglumu" (con ligereza impresionista), ♪=88-92.
- **Tonalidad**: 1 sostenido (Sol mayor / Mi menor). A cappella, divisi hasta 8 voces (SSAATTBB).
- **Estética**: escuela coral báltica/letona contemporánea (Ešenvalds, Prauliņš…).

### Técnicas observadas
1. **Métrica aditiva / compuesta y mixta**: compases tipo (2+3+3)/8, (3+3)/8… que
   **cambian por compás**. Agrupaciones irregulares de corcheas → vaivén lilting.
2. **Capa de tarareo "Mm"**: varias voces sostienen un zumbido cerrado (sin texto)
   como colchón armónico mientras otras llevan el texto.
3. **Dinámicas extremas**: ppp, pp, con marcas expresivas ("maigi" = con ternura).
4. **Entradas escalonadas** y divisi; la melodía pasa entre secciones (voice exchange).
5. **Rubato**: rall. / a tempo.
6. **Armonía impresionista**: estática, modal, por color (paralelismos, añadidos),
   sin funcionalidad tonal.

### Funciones derivadas — ESTADO
- [x] **Compases aditivos/compuestos** (3+3+2/8, 5/8, 7/8…): `beatsPerMeasure` suma
      el numerador con '+'; LilyPond `\compoundMeter`.
- [x] **Métrica MIXTA que cambia por compás**: campo opcional `meters` (un compás por
      bar). `metersOf`/`totalBeats` en schema.js; render con `global` (directiva +
      skip por compás) en PARALELO a cada voz en lilypond.js. Verificado: 3/4 →
      2+3+3/8 → 2+3/8 rebarra y alinea correctamente (PDF+MIDI, sin warnings).
- [x] **Rol "tarareo/Mm"**: textura `tarareo` (voces en zumbido cerrado "Mm" como
      colchón mientras otras llevan el texto).
- [x] **Dinámicas ppp y fff** en `DYN`; campo `text` por nota para marcas expresivas
      ("maigi", "dolce", "rall.", "a tempo") → markup en cursiva sobre la nota.
- [x] **Sistema "Impresionista / modal"** (Debussy–báltico): modal, paralelismo
      (planing), añadidos, ligereza; en el selector "Sistema armónico".
- [x] **Rubato / cambios de tempo** vía el campo `text` (rall., accel., a tempo).
- [x] **Divisi SSAATTBB** (voicing `ssaattbb` ya existente) + entradas escalonadas
      por prompt (texturas tarareo / solistas / contemporáneo).

### Notas de implementación
- La métrica aditiva es el cambio más estructural (toca schema, validación,
  reparación rítmica y render). Abordarla primero si se prioriza este estilo.
- El "Mm" encaja bien con la textura "Solistas sobre coro sostenido" ya existente,
  invirtiendo roles (el coro tararea, una voz lleva el texto).

---

## Obra 2 — Ešenvalds, "Rasa" (MB2236), análisis completo

- **Plantilla**: SSAATTBB a cappella con divisi; "Ar impresionistisku vieglumu".
- **Métrica**: el compás CAMBIA casi cada bar (3/4, 2+3+3/8, 2+3/8, 2+2/8,
  2+2+2/8…) siguiendo el acento natural del letón → confirma la necesidad de
  métrica mixta por compás.
- **Color vocal**: colchones de tarareo no solo en "Mm" cerrado, sino en vocales
  abiertas "Oh"/"Oo"/"Ah" que se abren al crecer la dinámica (cresc. poco a poco).
- **Dinámica/expresión**: ppp de base; "maigi", "Skanīgāk" (más sonoro), "allarg.",
  "a tempo", "cresc. poco a poco".

### Funciones derivadas — ESTADO
- [x] **Métrica mixta por compás** (`meters`) — ver Obra 1.
- [x] **Tarareo con vocal variable** (Mm/Oh/Oo/Ah): textura `tarareo` generalizada
      para abrir el color de la vocal al crecer hacia el clímax.
- [x] **Sugerencia de `meters` en el prompt** para sistemas impresionista/contemporáneo
      (la prosodia del texto guía los cambios de compás).
