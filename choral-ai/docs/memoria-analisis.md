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

### Cap. 3 (pág. 70–73): tríadas cromáticas libres y recursos — APLICADO
- Movimiento CROMÁTICO LIBRE: sin escala que gobierne, cualquier tríada → cualquier
  otra; fundamentales sobre todo por 2ª/3ª (evitar 5as, tonalizan; tritono ocasional);
  tríadas mayormente mayores/menores.
- Anclaje del cromatismo con MELODÍA o BAJO DIATÓNICOS; cada voz con dirección; el
  centro puede ser claro sin modo gobernante ("Centro Fa").
- Armonización flexible: cualquier nota = fundamental/3ª/5ª de tríada mayor o menor
  (3+3 posibilidades por sonido).
- QUINTAS PARALELAS en las 2 voces graves (fund.+5ª), compensadas con movimiento
  contrario arriba; inversión periódica las realza/rompe.
- Acorde de 6/4 (2ª inv., 4ª característica, tensión moderada) para puntuar cadencias
  periódicas y articular el arco formal.
- [x] Añadido a TERTIAN_HARMONY_SYSTEM (cromático libre, forma con 6/4/cadencias) y a
      TERTIAN_COMPOSE_SYSTEM (anclaje diatónico, armonización flexible, quintas
      paralelas, 6/4 de puntuación).
- (PROCEDENCIA DEL MATERIAL: solo referencias de repertorio — Barber, Britten, Bartók,
  Copland, Prokofiev…; no se codifica.)

### Cap. 3 (pág. 74–79): acordes de 7ª y 9ª — APLICADO (+ ampliación del enum)
- 7ª/9ª como ENTIDADES ESTABLES: disonancias sin preparación/resolución obligadas
  (ductilidad de las tríadas); se mueven por los mismos ciclos y por relación de
  TRITONO entre fundamentales (renueva, sobre todo dominantes).
- Novena = DOS tríadas apiladas (implicación policordal); gradación OSCURA→BRILLANTE.
- Color/"relación" por distintas formas de 7ª/9ª sobre la MISMA fundamental.
- 4 VOCES para 9ª (5 notas) → OMISIÓN: omitir 5ª = riqueza/flexibilidad; omitir 3ª o
  7ª = menos color. DUPLICACIÓN: fund./5ª = solidez; 3ª/7ª = densidad; 9ª = más tensión
  (9ª bajo la fundamental = máxima tensión). 1ª inv. en quintas = acorde central del tono.
- [x] harmony.js: AMPLIADO el enum de calidades — séptimas minor_major7, augmented7,
      augmented_major7; novenas major9, minor9 (+ etiquetas). Deletreo verificado.
- [x] systems.js: TERTIAN_HARMONY_SYSTEM (bloque 7ª/9ª, ciclos + tritono, color
      oscura→brillante); TERTIAN_COMPOSE_SYSTEM nueva sección 2 "ACORDES DE 7ª y 9ª"
      con reglas de omisión/duplicación para 4 voces (renumeradas 2→6).
- Pendiente cap. 3: 11as/13as, tríadas con añadidos y espesamiento; policordes (cap.
  aparte) reutilizarán la idea "novena = dos tríadas".

---

## UI — Selección múltiple de sistemas + "Combinar todo" — HECHO
- El "Sistema armónico" pasa de desplegable único a CASILLAS agrupadas por encabezado
  (Tonal / Siglo XX). Se pueden marcar VARIAS técnicas a la vez → el backend concatena
  sus prompts con una cabecera de "combina con criterio".
- Opción especial `mixto` ("★ Combinar todo"): prompt umbrella (MIXTO_HARMONY_SYSTEM /
  MIXTO_COMPOSE_SYSTEM) donde la IA mezcla libremente todas las técnicas del s.XX. Es
  EXCLUSIVA (al marcarla se desmarcan las demás).
- systems.js: `resolveSystems(input)` (array/string/coma; "mixto" gana), `group`/`combo`
  en systemOptions. harmony.js/compose.js: `selectHarmonySystem`/`selectComposeSystem`
  (única, combinada o mixto) y flags `multi`/`isMixto` en el prompt de usuario. server.js
  usa `params.systems` (array) y etiqueta la respuesta con " + ". Frontend: casillas
  agrupadas con exclusividad del combo; `readForm` envía `data.systems`.
- Compatibilidad: `resolveSystems` acepta el antiguo `system` único, así que nada rompe.

---

## Persichetti cap. 3 (pág. 80–89): oncenas/trecenas, 15as/17as, 12 sonidos — APLICADO
Decisión: NO se amplía el enum con 11as/13as+ (en 4 voces suenan embarradas y el propio
Persichetti dice que rara vez se realizan enteras). Se aplica vía PROMPT (evocarlas y
realizarlas por omisión). Añadido al sistema `terceras` (fase 1 y fase 2) y mención en
`mixto`:
- 11ª = dos tríadas a 3ª; 13ª = tres tríadas (policordal). Aligerar por OMISIÓN (quitar
  un sonido de un intervalo fuerte; sin 3ª/7ª/11ª; omitir fundamental de 13ª → 11ª).
- Evitar dos tríadas sueltas salvo policordio; si predominan cuartas → suena cuartal.
- Evitar INMOVILIDAD: tocar la extensión con una voz que se mueve desde tríada/7ª
  (pedal + ornamentación); a menudo la 11ª/13ª es acorde simple + adornos.
- Sonoridades ricas ≈ una ESCALA (guiar melodía con ella); no sostener mucho.
- 15as/17as y acordes de muchos sonidos = EFECTO (paralela, acentos, pausas, tensión
  quieta); aligerar por registro agudo y porciones consonantes en grupos separados
  (divisi). Acorde de casi 12 sonidos = gesto de acento/clímax, no armonía continua.
- Pendientes (referencias del propio texto): enlazar 9as con acordes por cuartas
  (preparar la 4ª); POLICORDES y SÍNTESIS ARMÓNICA → Cap. 13 (capítulos posteriores).
- (PROCEDENCIA: Berg, Ravel, Stravinsky, Scriabin, Milhaud, Villa-Lobos… solo repertorio.)

---

## Persichetti cap. 4 "Acordes por cuartas" (pág. 95, 100–105) — APLICADO
Enriquece el sistema EXISTENTE `cuartal` (no se crea uno nuevo). El enum ya tiene
quartal3/4/5 y quartal3ja/aj; los compuestos (cuartas+3ª) se realizan como voicing.
- Origen: ornamentación de la tríada + polifonía medieval (lineal).
- REGISTRO: cuartas claras en agudo, turbias en grave; un PEDAL atenúa la resolución.
- 4 sonidos (quartal4): + resonante; el nuevo sonido = DÉCIMA consonante con la fund.;
  sus 3 inversiones dan movimiento sin cambiar fundamental. Tritono → colocar arriba.
- COMPUESTOS (cuartas + 3ª): 3ª mayor = más consonante, menor = menos; 3ª arriba+abajo =
  acorde jugoso de 5 sonidos (bueno junto a terceras/policordes).
- ENLACE con lo tonal: abordar/dejar desde/hacia tríadas o 9as (4ª inv. de la 9ª, 7ª
  prominente, enlaza categorías); resolver quartal4→terciario moviendo 2 voces por grado
  conjunto y dejando las demás quietas; resaltar el "aroma" de la 4ª al mezclar.
- CADENCIA: cuartas como "dominantes"; el acorde FINAL más poderoso INVERTIDO (al revés
  que en lo tonal); el previo admite cualquier bajo.
- CROMATISMO: introducir cromáticamente una cuartal desvía súbitamente la tonalidad.
- [x] Añadido a QUARTAL_HARMONY_SYSTEM y QUARTAL_COMPOSE_SYSTEM (nueva sección CADENCIA;
      registro/pedal, compuestos, enlace tonal, inversiones/tritono).

### Cap. 4 final (pág. 106–109): multisonidos por cuartas — APLICADO (a `cuartal`)
- Cuartas en QUINTAS: si las quintas dominan, las cuartas se vuelven inestables → resolver
  la 4ª en la 3ª de un compuesto antes de volver al puro por cuartas.
- Multisonidos: consonante hasta 5 sonidos; con 6+ aparece 4ª aum → cambio de categoría de
  tensión; contrastar grupo disonante vs consonante. Axis si nº de 3as = nº de 4as.
- Densidad ↓ potencia lineal ("asfixia") → aliviar con amago de paralelo, unísono
  interrumpido o dominante enriquecida; para no enturbiar, intervalos grandes en la base y
  omitir un miembro.

## Persichetti cap. 5 "Acordes con sonidos añadidos" (pág. 111–115) — SISTEMA NUEVO
Sistema `anadidos` ("Sonidos añadidos (Persichetti)"). Técnica general: pegar 2as
mayores/menores a cualquier acorde (terciario o por cuartas) como MIEMBROS DE COLOR (no
adornos); modifican textura más que función.
- Colocar la 2ª una 2ª por encima/debajo de un miembro (evitar que se vuelva 7ª/9ª real).
- RESONANCIA: cuanto más grave el añadido, menos resonante.
- Qué acordes: may/men lo aceptan bien (sobre 3ª mayor el color se difumina); disminuida →
  2as menores (variedad); aumentada → textura fuerte. A 7as/9as, sobre todo 2as mayores.
- El añadido NO compite con la 7ª/9ª por resolver; se pega en fund./invertido; se puede
  duplicar (octavas acopladas en voces externas, colchón con añadidos).
- Cuartas: orden de sonoridad — blandas = 2ª mayor (debajo 7ª, encima/debajo 4ª, encima
  fund.); fuertes = 2ª menor en esos lugares.
- 6ª aumentada con sonidos añadidos (5 tipos básicos) y la tónica cadencial 6/5 como
  ejemplos tradicionales → NO se codifican como calidades (funcionales/enarmónicas); el
  sistema tonal ya cubre las 6as aumentadas.
- [x] systems.js: ADDED_HARMONY_SYSTEM + ADDED_COMPOSE_SYSTEM. harmony.js/compose.js:
      mapas, branch de prompt (isAdded) y cierre por reposo. Enum sin cambios (add9/add6/
      sus2/sus4 ya existen; los añadidos libres se realizan como voicing).

### Cap. 5 final (pág. 116–122): texturas y procedimiento — APLICADO (a `anadidos`)
- Dos texturas: SUAVE (sin disonancia fuerte) vs FUERTE. Los suaves paran el flujo →
  mezclar suaves y fuertes para mantener el movimiento.
- El movimiento lo gobierna la ARMONÍA BÁSICA; protégela con cadencias/progresiones;
  los añadidos solo funcionan con relación armónica definida por los acordes básicos.
- Añadidos fuera de la escala original → más libertad y más claridad del disonante.
- Tríada en posición cerrada (voces superiores) + 2ª encima/debajo, doblada en octavas
  abajo; la MELODÍA gobierna, el bajo va a una 2ª de un miembro triádico.

## Persichetti cap. 6 "Acordes por segundas" (pág. 123–125) — SISTEMA NUEVO
Sistema `segundas` ("Por segundas / clusters"). Tercera categoría de construcción.
- 4 tipos de acordes de 3 sonidos: MM, Mm, mM, mm (consonante→disonante). AÑADIDO al
  enum: secundal_MM/Mm/mM/mm (+ etiquetas). Deletreo verificado (mm = C-D♭-E♭♭, doble
  bemol; renderiza bien en LilyPond).
- Solo MM aparece natural en mayor/menor/modos; mm de escalas cromáticas/sintéticas.
- DISPOSICIÓN: cerrada = cluster percusivo (turbio en grave); abierta en 7as/9as = líneas
  libres y activas. Cluster cerrado solo como efecto.
- DUPLICACIÓN: consolidar → doblar el bajo; suave → doblar el más consonante sobre el
  bajo; áspera → el más disonante.
- Disonante = 2ª del acorde (fund. y 2ª inv.); 3ª en 1ª inv. (salvo mM 1ª inv. = la fund.).
- [x] systems.js: SECUNDAL_HARMONY_SYSTEM + SECUNDAL_COMPOSE_SYSTEM. harmony.js/compose.js:
      enum, mapas, branch (isSecundal) y cierre por reposo.

### Cap. 6 final (pág. 126–135): clusters — APLICADO (a `segundas`)
- Sonido disonante que forma intervalo FUERTE (7ª M / 2ª m): abordar/dejar por grado
  conjunto o repetición; si no, libremente.
- Multisonidos (4–5 por 2as) se mueven con dificultad → intercalar 3 sonidos por 2as o
  acordes por cuartas (sus 7as dejan espacio). Un acorde por 2as puede alargarse a una
  escala entera; la cromática es la menos útil (se apiña/pesa).
- CLUSTERS: acorde por 2as sin invertir, mayoría de voces a 2ª. Realizar tratando las 2
  voces EXTERNAS como contrapunto y expandiendo/contrayendo el racimo (voces internas).
  Pequeños = ágiles; amplios = acentos dramáticos. Paralelo = melódico (variar una voz;
  octavas en externas). Evitar rellenar arbitrariamente.
- ARPEGIADO (roto): notas consecutivas sostenidas (arriba-abajo, abajo-arriba, centro-
  extremos); solo suena a cluster si el contexto está establecido; entrada consonante/
  disonante acentúa. POLI-CLUSTERS (divisi): fundamentales forman 2as/tríada/cuartas;
  dejar espacio. Ornamentales aumentan la circulación.
- Mezclados con 3as/4as pueden entrar en progresiones funcionales de fundamentales.
- [x] Añadido a SECUNDAL_HARMONY_SYSTEM (multisonidos, escala, clusters) y a
      SECUNDAL_COMPOSE_SYSTEM (regla del disonante fuerte + nueva sección CLUSTERS).
- FIN del capítulo 6. Próximo: cap. 7+ (policordes/síntesis, escalas sintéticas…).

---

## Cambio de ARMADURA en modulaciones largas — HECHO
- schema.js: campo opcional `keyChanges` [{measure, key, mode}]; helper `keyChangesOf`
  (filtra a compás 2..measures, tónica A–G, uno por compás, ordenado).
- lilypond.js: `useTimeline = métrica cambiante || keyChanges`; el `global` en paralelo
  coloca `\key` en el compás indicado con skips por compás (con métrica fija, el \time se
  fija una vez). Verificado: Do mayor → La mayor en el compás 3 cambia la armadura en
  todas las pautas (PDF+MIDI). Regresión OK.
- compose.js: guía de prompt — declarar keyChanges solo en modulaciones que se sostienen
  ~4+ compases; tonicizaciones breves (1–2) con alteraciones sueltas, sin cambio de
  armadura. "key"/"mode" siguen siendo la tonalidad inicial.

## Persichetti cap. 7 "Poliacordes" (pág. 137–141) — SISTEMA NUEVO
Sistema `policordes` ("Policordes / bitonalidad"). Combinación simultánea de 2+ acordes de
áreas distintas como UNIDADES con agrupación clara.
- Politonalidad SOLO si las unidades tienen centros tonales separados (raro); los no
  politonales son más flexibles. Origen en pedales dobles/triples.
- Agrupación clara obligatoria: reorganizar/mezclar los sonidos DESTRUYE el poliacorde.
- Resonancia: base más resonante = tríada mayor en 6/4 (o fundamental separada); unidad
  superior cerca de los armónicos (3ª/5ª) de la base; inventario por ciclo de 5as
  (consonancia decreciente). Intervalos pequeños arriba, anchos abajo; sonido común funde.
- Relación de la voz más grave con la más aguda gobierna la consonancia global.
- Decisión: SIN cambios de enum/esquema. La base la da el plan (calidad existente); la
  unidad superior la construye la fase 2 según el cifrado "SUPERIOR / BASE". Con pocas
  voces se reparte por grupos (Bajo+Tenor / Contralto+Soprano) o divisi.
- [x] systems.js: POLYCHORD_HARMONY_SYSTEM + POLYCHORD_COMPOSE_SYSTEM. harmony.js/
      compose.js: mapas, branch (isPolychord), cierre por reposo.
- Nota: enum de calidades NO cubre "dos tríadas"; si se quisiera plan determinista de la
  unidad superior, habría que añadir un campo `poly` al HARMONY_SCHEMA (pendiente, opcional).

## Mejora de MELODÍAS (feedback: sonaban primitivas) — HECHO
Causa: mucha guía de armonía/textura/métrica, pero casi ninguna de escritura melódica.
- compose.js buildUserPrompt: bloque "MELODÍA (ARTESANÍA)" que aplica a TODOS los sistemas
  (motivo + desarrollo; fraseo en arco con antecedente/consecuente y respiración; un solo
  clímax; contorno con saltos expresivos compensados; ritmo con vida —anacrusas, síncopas,
  puntillos, ligaduras, no "una nota por pulso"—; notas extrañas expresivas —apoyaturas,
  retardos— sin limitarse a arpegiar el acorde; text painting y acento del texto).
- systems.js CONTEMPORARY_COMPOSE_SYSTEM: rasgos melódicos Ešenvalds/báltico (arco
  ascendente a cima luminosa, suspensiones/apoyaturas de anhelo, salto expresivo en el
  clímax, motivo que pasa entre secciones/voice exchange).
- Pendiente si sigue plano: variar el RITMO ARMÓNICO y las progresiones en fase 1
  (harmony.js) para dar más apoyo melódico.

## Paleta expresiva (opción A) — HECHO
- src/expressive.js: EXPRESSIVE_PALETTE = vocabulario curado de CARÁCTER (íntimo/tierno,
  cálido/expansivo, clímax, cierre, articulación), TEMPO/rubato y REGLAS de cuándo usarlas
  (coordinar carácter+dinámica; rit./allargando antes de reposos; idioma según estilo).
  Incluye términos bálticos (maigi/skanīgāk).
- compose.js: importa e inyecta EXPRESSIVE_PALETTE en el prompt de la fase 2 tras el
  bloque de melodía.
- schema.js: descripción del campo `text` actualizada (usar en inicios de frase, cambios
  de sección/tempo y clímax; variar el término; mayoría "").
- Render verificado con marcas multi-palabra y caracteres especiales (con anima, skanīgāk).
## Tratado 3 — Schoenberg, "Fundamentals of Musical Composition" (opción B)

### Cap. III "El Motivo" (pág. 19–27) — APLICADO
- El motivo = germen (intervalos + ritmo); su uso DEBE variarse conservando lo más
  característico (a menudo el ritmo) y cambiando lo menos importante.
- Repetición EXACTA (transposición, inversión, retrogradación, disminución, aumentación)
  vs MODIFICADA (variación → formas del motivo).
- Caja de herramientas de variación por RITMO (duración, repetición, desplazamiento,
  anacrusas), INTERVALOS (orden/dirección, añadir/omitir, rellenar con notas de paso,
  reducir, deslizar), ARMONÍA (inversiones, añadir al final, insertar en el centro,
  sustituir) y MELODÍA (transponer, acordes de paso, semi-contrapunto).
- Un motivo no necesita muchos intervalos (Brahms 4ª = terceras; Beethoven 5ª = repetidos);
  a menudo importa el CONTORNO.
- [x] src/motive.js: MOTIVE_DEVELOPMENT; inyectado en compose.js (fase 2, todas las
      técnicas) tras el bloque de melodía y antes de la paleta expresiva.
### Cap. IV "Enlace de motivos" + V "Construcción de temas simples (1)" (pág. 29–37) — APLICADO
- Contorno en ONDAS: ascensos contrarrestados por descensos; UN clímax por una serie de
  cimas menores; saltos grandes compensados por grado conjunto; registro central.
- La armonía se mueve MÁS DESPACIO que la melodía (varias notas por acorde → notas de
  paso/apoyaturas, no arpegiar); acompañamiento regular de carácter constante unifica.
- Frase/período: gira en torno a una tónica, FINAL DEFINIDO, número PAR de compases (8+).
  Comienzo presenta el motivo; continuación = repetición inmediata (idéntica/transpuesta).
- ANTECEDENTE/CONSECUENTE (forma tónica → dominante, como sujeto/respuesta): mismo ritmo y
  contorno, contraste en la armonía. Esquemas tonales: I→V, I-V→V-I, I-V-I→V-I-V, I-IV→IV-I,
  I-II→V-I. En no funcional, mantener la idea pregunta/respuesta.
- Derivaciones con carácter de FRASE completa; no alejarse tanto que se pierda inteligibilidad.
- [x] src/phrase.js: PHRASE_CONSTRUCTION; inyectado en compose.js (fase 2) tras el motivo.
- Próximo (si llegan páginas): resto del cap. V y cap. VI+ (el período completo, cadencias,
  formas mayores) → completaría la construcción de temas.

### Pendiente (siguientes capítulos, cuando lleguen las páginas)
- Acordes por 3as (novenas, oncenas, trecenas), por 4as y por 2as (clusters).
- Acordes de sonoridad AÑADIDA y de tono agregado; policordes/bitonalidad.
- Escalas/modos sintéticos; centros tonales por afirmación no funcional.
- (Requerirá ampliar el enum de calidades en harmony.js para clusters/policordes.)

---

## Melisma controlable + Contrapunto libre imitativo (petición del usuario) — APLICADO
- **Melisma con control del usuario**: selector "Melisma" en el formulario con tres niveles:
  - `silabico` → una sílaba por nota (himno/coral), sin melismas salvo adorno puntual.
  - `moderado` (por defecto) → mayormente silábico con melismas expresivos (2–4 notas) en
    sílabas acentuadas, palabras clave y cimas de frase.
  - `melismatico` → líneas MUY floridas (grupos de 2–6 notas) en la voz principal/solista y
    palabras importantes; alterna con pasajes silábicos para inteligibilidad.
  - Regla común: la sílaba va SOLO en la primera nota del grupo; "lyric" VACÍO en el resto.
- [x] public/index.html: `<select name="melisma">`; app.js lo captura vía FormData.
- [x] src/compose.js: bloque MELISMA en buildUserPrompt según `params.melisma`.
- **Contrapunto libre imitativo**: la textura `contrapunto_libre` ahora pide IMITACIÓN entre
  las voces superiores (una voz presenta un motivo y otra lo imita poco después a la 8ª/5ª/3ª/
  unísono, eco/pregunta-respuesta, no estricto como canon) y un BAJO más LIBRE e independiente
  (cimiento armónico con su propia línea, sin obligación de imitar).
- [x] src/textures.js: prompt de `contrapunto_libre` reescrito con imitación + bajo libre.
