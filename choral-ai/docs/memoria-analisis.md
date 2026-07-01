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

---

## Tratado 2 — Persichetti, "Armonía del siglo XX" (en curso)

Estudio incremental para construir el sistema **"Siglo XX · control de tensión"**
(id `sigloxx` en systems.js).

### Cap. I — Intervalos y tensión (pág. 12–13) — APLICADO
- Jerarquía de tensión interválica: consonancias ABIERTAS (5ª/8ª J) < BLANDAS
  (3as/6as) < disonancias SUAVES (2ª M / 7ª m) < FUERTES (2ª m / 7ª M).
- 4ª JUSTA ambivalente (consonante en entorno disonante y viceversa); TRITONO
  ambiguo (neutro en cromatismo, inestable en diatonismo).
- Principio: los intervalos se ORDENAN para formar una CURVA DE TENSIÓN deliberada.
- [x] Sistema `sigloxx`: `PERSICHETTI_HARMONY_SYSTEM` (fase 1, diseña la curva de
      tensión con las calidades disponibles) y `PERSICHETTI_COMPOSE_SYSTEM` (fase 2,
      controla la tensión interválica vertical/horizontal como un arco). No funcional;
      cierre por distensión. Compás cambiante habilitado.

### Cap. I — Uso de la tensión, inversión y disposición (pág. 14–15) — APLICADO
- La curva de tensión puede INVERTIRSE (tensa→reposo); los tritonos finales quedan
  neutros al descargarse la tensión.
- Consonancia/disonancia RELATIVA: la norma la fija el nivel de tensión predominante
  (en un contexto disonante, una disonancia fuerte puede ser el reposo).
- Interacción con TIMBRE/DINÁMICA/TEMPO: la misma 2ª es "bronca" en f y velada en pp.
- INVERSIÓN de intervalos cambia su cualidad: 5ª J ⇄ 4ª J (estable⇄inestable);
  2ª m incisiva ⇄ 7ª M ancha (menos áspera).
- DISPOSICIÓN/registro: separar las voces > 1 octava suaviza las disonancias (menos
  mordientes, más brillantes) y enriquece 3as/6as; refuerza 5as/8as y 4ª justa.
- [x] Añadido a `PERSICHETTI_COMPOSE_SYSTEM`: sección "REGISTRO Y DISPOSICIÓN",
      reposo relativo, curva reversible y refuerzo/contraste con dinámica y tempo;
      y nota de norma relativa en `PERSICHETTI_HARMONY_SYSTEM`.

### Cap. I — Clasificación de acordes y duplicación (pág. 18–19) — APLICADO
- Clasificación por contenido: con/sin disonancia fuerte, con/sin tritono.
  CON tritono → INESTABLE; SIN tritono → ESTABLE aunque muy disonante.
- Regla precisa de la 4ª justa en un acorde: su carácter lo fija el intervalo entre
  el BAJO y la nota ajena a la 4ª (disonancia suave/fuerte → 4ª = consonancia abierta;
  consonancia blanda → 4ª = levemente disonante).
- DUPLICACIÓN como color/tensión: doblar la 3ª mayor = color; doblar disonancia =
  más mordacidad; duplicar todas las voces = percusivo. Se puede duplicar/triplicar/
  omitir cualquier miembro por textura; por defecto, duplicación natural.
- CORDONES INTERVÁLICOS: bloques de voces con intervalo fijo en movimiento contrario.
- [x] Fase 2: regla exacta de la 4ª y estabilidad por tritono en la jerarquía;
      nueva sección "DUPLICACIÓN" (6); cordones interválicos en la conducción.
      Fase 1: estabilidad por tritono (qué calidades empujan / reposan).

### Cap. I — Disposición, armónicos y medio (pág. 20–23) — APLICADO (parte coral)
- Disposición espacial: intervalos anchos ABAJO → equilibrio; anchos ARRIBA → tensión.
- Resonancia (serie de armónicos): disposición abierta en grave y cerrada en agudo →
  brillo; apiñar en el grave = "relaciones turbias" (embarrado).
- La 5ª (armónico 3) es más potente que la 3ª (armónico 5); reforzar el bajo por su
  5ª/9ª por debajo da brillantez; añadir color por ARMÓNICOS DE ARMÓNICOS (emparentar
  por quinta), no por armónicos agudos débiles.
- Medio/timbre (no aplica a coro a cappella directamente), pero SÍ su consecuencia:
  clusters de 2as "relajados" repartiéndolos como 3as por octavas; policordes
  transparentes si cada tríada suena en un grupo de voces distinto (divisi).
- [x] Fase 2, sección REGISTRO Y DISPOSICIÓN: anchos abajo/arriba, resonancia por
      serie de armónicos, transparencia de clusters/policordes; sección DUPLICACIÓN:
      resonancia por armónicos (quintas, refuerzo por 5ª/9ª, armónico de armónico).
- Nota: acordes por 3as/4as/enteros construidos desde la serie (1-3-5, 1-3-5-7,
  1-3-5-7-9, tonos enteros 7–11, cuartas 6-8-9) → pendiente al ampliar el enum.

---

## Tratado 2 — Persichetti, cap. 3 "Acordes por terceras" (pág. 65–69) — APLICADO

Sistema NUEVO `terceras` ("Triádico por ciclos · 2as/3as/5as").
- Armonía TRIÁDICA organizada por un CICLO de fundamentales elegido, alrededor de un
  centro (no por la sintaxis tonal V–I habitual).
- Ciclo de 5as → primarios I/IV/V (V–I, IV–I). Ciclo de 3as → I/III/VI (III–I, VI–I;
  mediante/submediante). Ciclo de 2as → I/II/VII (II–I, VII–I; supertónica/sensible).
- Plantillas de fundamentales: 5as = I III IV VI V I; 3as = I II VI VII III I;
  2as = I V VII IV II I.
- Se pueden MEZCLAR ciclos (libertad total de fundamentales; 2ª/3ª/5ª ≡ 7ª/6ª/4ª por
  inversión → los 12 sonidos). Construible en cualquier escala (mayor, modal,
  sintética); colores de los primarios según la intervalica de la escala.
- Ojo: tríadas con 3ª aumentada/disminuida suenan a 4ª/2ª (problema de ortografía).
- [x] systems.js: TERTIAN_HARMONY_SYSTEM + TERTIAN_COMPOSE_SYSTEM.
      harmony.js/compose.js: ramas de selección, línea de sistema y cierre por
      confirmación del centro. El enum de calidades existente (major/minor/diminished/
      augmented) ya cubre las tríadas; no requiere ampliación.
- Pendiente (siguiente en cap. 3): acordes de 7ª/9ª/11ª/13ª por terceras, tríadas con
  añadidos, y espesamiento triádico → puede requerir ampliar el enum.

### Pendiente (siguientes capítulos, cuando lleguen las páginas)
- Acordes por 3as (novenas, oncenas, trecenas), por 4as y por 2as (clusters).
- Acordes de sonoridad AÑADIDA y de tono agregado; policordes/bitonalidad.
- Escalas/modos sintéticos; centros tonales por afirmación no funcional.
- (Requerirá ampliar el enum de calidades en harmony.js para clusters/policordes.)
