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

---

## Modo "Armonizar MI melodía" (MusicXML) — APLICADO
Petición del usuario: poder introducir SU propia melodía y que la IA solo la armonice
(primera versión; "luego iremos haciendo todas las cosas"). Entrada elegida: **MusicXML**
(exportado de MuseScore/Sibelius/Finale), que conserva notas, ritmo y letra.

Flujo:
- El usuario sube un `.musicxml`/`.xml` (sin comprimir). En el navegador se lee como texto
  y se envía en el body como `melodyXml` (límite JSON del servidor subido a 12mb).
- **src/musicxml.js** (`parseMelody`): parser determinista con `fast-xml-parser`. Toma la
  PRIMERA parte y su PRIMERA voz; ignora acordes (solo la línea melódica), notas de adorno
  y descarta compresión .mxl con mensaje claro. Extrae: tonalidad (fifths→tónica+modo),
  compás (y `meters` si cambia por compás), tempo (`<sound tempo>`/`<metronome>`), nº de
  compases, y las notas (step/alter/octave/duración/puntillo/lyric) → nuestro modelo abstracto.
  Octava científica coincide con la nuestra. `melodyByMeasures` lista la melodía compás a
  compás para inyectarla en los prompts.
- **server.js**: si llega `melodyXml`, `parseMelody` MANDA sobre el formulario en
  tonalidad/compás/tempo/nº de compases; `modulate=false`. Errores de parseo → 400.
- **harmony.js** (fase 1): si hay melodía, el plan debe SOPORTARLA (notas en tiempo fuerte
  = notas del acorde o extrañas justificables); se le pasa la melodía compás a compás y la
  tonalidad real (p. ej. "Eb mayor").
- **compose.js** (fase 2): se le da la melodía como VOZ 1 fija ("cópiala exacta, compón solo
  las demás voces por debajo"); se omiten los bloques de invención melódica (artesanía,
  motivo, fraseo, melisma) porque la melodía no se inventa; se conserva la paleta expresiva.
  Tras la respuesta, `applyGivenMelody` **sobrescribe la voz 1 con la melodía EXACTA** y fija
  la metadata (key/mode/timeSignature/meters/tempo/measures/title) desde el archivo → la
  melodía del usuario queda intacta pase lo que pase.
- Limitación v1 (documentada): la armadura LilyPond solo admite letra natural (A–G), así que
  en tonalidades con bemoles/sostenidos (p. ej. Mib) la ARMADURA visual puede no mostrarse,
  pero las alteraciones van explícitas en cada nota → el sonido y las alturas son correctos.
  Evitar por ahora compases de anacrusa (pickup) y tresillos exóticos.
- [x] Frontend: campo de subida de archivo + aviso del nombre cargado; readForm ahora es
      async (lee el texto del archivo). Verificado extremo a extremo el parseo + render .ly
      con la melodía fija en soprano (Mib se rinde como `ees''`, letra con melisma correcta).
- Próximo (cuando lo pida): soporte de armadura con bemoles/sostenidos, anacrusa, ligaduras
  de valor, y opción de elegir en qué voz va la melodía (no solo la superior).

---

## Obra 3 — Ešenvalds, "O Salutaris Hostia" (SS soli + SSAATTBB) — ANÁLISIS MELÓDICO
Musica Baltica 2009. "Con sentimento" ♩=56, Re mayor (2 #), 4/4. ~39 compases. La obra que
el usuario quiere como referencia de MELODÍA (sus solos son el modelo a imitar).

### Textura (dos capas, estilo Ešenvalds puro)
- CAPA SOLISTA: DOS sopranos solistas (Solo I / Solo II) que flotan por encima. Empiezan por
  IMITACIÓN/ECO (Solo I "O salutaris" → Solo II "Hostia" un poco después) y luego cantan en
  PARALELO por TERCERAS. Divisi que crece por indicación: "solo → 3-4 soprani → 6-8 soprani".
- CAPA CORO: SSAATTBB en HOMOFONÍA lenta (blancas/redondas), doblado en 3as/6as, como
  COLCHÓN. Arco de densidad: T y B entran más tarde (cc. 11-15); clímax hacia el centro (mf) y
  regreso a pp; cierre "Amen" muy suave y sostenido.
- Dinámicas: mp/p con largos reguladores; nunca estridente; crece por acumulación de voces.
- Armonía: Re mayor diatónico con color impresionista/añadidos y suspensiones; ritmo armónico
  MUY lento (varias notas de melodía por acorde).

### La MELODÍA de los solos (lo que hay que saber imitar)
1. MUY MELISMÁTICA y ornamentada: varias notas por sílaba con largos slurs ("os-ti-um",
   "pan-dis", "sem-pi-ter-na", "sine ter-mi-no", "gloria").
2. RÍTMICA IRREGULAR: TRESILLOS y SEISILLOS por todas partes + ritmos con puntillo y
   anacrusas → sensación de rubato/improvisación libre sobre el coro estático.
3. CONTORNO en ONDA en registro central-agudo: sube a una pequeña cima y baja; grados
   conjuntos con algún salto expresivo relleno después.
4. IMITACIÓN entre los dos solos (antecedente/consecuente), luego paralelismo por 3as.

### Qué puede y qué NO puede el programa hoy (gap identificado)
- YA cubierto: la TEXTURA (textura `solistas_coro`), el color (sistemas impresionista/
  contemporáneo/añadidos), el arco de densidad y dinámicas, el melisma controlable, y la
  imitación (contrapunto imitativo). Todo esto se acerca al SONIDO de la obra.
- BLOQUEO real: el modelo de datos NO admite TRESILLOS/SEISILLOS (enum de duración solo
  binario [1,2,4,8,16] + puntillo). Esa es la causa principal de que los solos salgan
  "primitivos" frente a Ešenvalds: sin subdivisiones irregulares no hay floritura báltica.
- PRÓXIMO PASO propuesto: añadir soporte de TUPLETS (tresillo/seisillo, quintillo) en
  schema.js (campo `tuplet` por nota o agrupación), en el cuadre rítmico (noteBeats/
  totalBeats/repairRhythm), en lilypond.js (\tuplet 3/2 { ... }) y en la lectura MusicXML
  (<time-modification>/<tuplet>, que hoy se aproximan a binario). Con eso + una textura
  dedicada "dos solistas en imitación sobre colchón" los solos podrían acercarse de verdad.

---

## Soporte de GRUPOS IRREGULARES (tresillos/seisillos) + textura dúo Ešenvalds — APLICADO
Resuelve el gap identificado con "O Salutaris Hostia": las melodías binarias sonaban
"primitivas" por no admitir subdivisiones irregulares. Implementado en todo el flujo:
- **schema.js**: campo `tuplet` por nota (enum [1,2,3,4,5,6,7,9]; 1 = normal). `TUPLET_RATIO`
  mapea nº→{actual,normal} (3→3:2, 6→6:4, 5→5:4…). `tupletFactor` y `noteBeats` aplican el
  factor normal/actual, así que el cuadre rítmico (`totalBeats`/`repairRhythm`) sigue exacto.
  `makeRest` incluye `tuplet:1`. Añadido a `required`.
- **lilypond.js**: `voiceToLily` envuelve tramos de notas con el mismo `tuplet` en
  `\tuplet actual/normal { ... }`, cortando cada `actual` notas (un corchete por grupo). Los
  slurs de melisma cruzan la llave sin problema (LilyPond lo admite). Verificado: tresillo de
  negras → `\tuplet 3/2 { ... }`; dos tresillos seguidos → dos corchetes; seisillo → `6/4`.
- **musicxml.js**: lee `<time-modification><actual-notes>` → `tuplet` (soportados 2..9); la
  duración se toma de `<type>`+tuplet, así que los tresillos importados quedan EXACTOS (antes
  se aproximaban a binario). Verificado con un MusicXML de tresillos.
- **compose.js**: guía a la IA para usar tresillos/seisillos ("tuplet":3/6) en floreos y
  melismas ágiles (RITMO con vida + melisma florido) → fraseo ondulante báltico, no todo binario.
- **textures.js**: nueva textura `duo_solistas_imitacion` ("Dúo de solistas en imitación sobre
  colchón (Ešenvalds)"): dos solistas floridas con tresillos/seisillos, imitación (eco) y luego
  paralelo por terceras, sobre colchón coral sostenido con arco de densidad y cierre pp.
  Se combina con el voicing `soli_satb` (Solo I/II + SATB), ya existente.
- Nota v1: el corchete del tuplet se corta por nº de notas del grupo (bien para figuras
  uniformes); grupos mixtos raros podrían mostrar un corchete algo largo, pero la DURACIÓN y
  el MIDI son siempre exactos.

---

## FIX importación MusicXML: elegir la pista de la MELODÍA (no la primera) + confirmación
Síntoma reportado: al subir una melodía (voz + piano + cuerdas) para armonizar, la salida
"no tenía nada que ver" con la melodía. Causa: `parseMelody` tomaba SIEMPRE la primera pista
(`part[0]`); si la voz no era la primera, o si el piano traía notas, se armonizaba la pista
equivocada.
- **musicxml.js**: ahora elige la pista MELÓDICA: preferencia por nombre de VOZ/canto
  (voc|voz|cant|melod|sopran|lead|vox…), penalización a piano/cuerdas/teclado, y a igualdad,
  la que tiene más notas con altura; descarta pistas sin notas. Verificado con multipista
  (voz en 3ª posición; y piano denso vs voz corta → elige la voz).
- **server.js / app.js**: la respuesta incluye `harmonized` + `melodyInfo` (compases,
  tonalidad, nº de notas) y la UI muestra "🎵 TU melodía armonizada (…)". Así se ve al
  instante si el modo armonizar-melodía se aplicó (diagnóstico + UX).

---

## FIX importación MusicXML (caso real "Pop ballad" de Sibelius): fusas + ligaduras + anacrusa
Con el archivo real del usuario (Sibelius, voz "Lead Vocals" + piano + cuerdas) se vio que la
melodía importada se desalineaba ("las medidas desaparecen de la realidad"). Causas y fix:
1. **Fusas (1/32)**: el enum de duración solo llegaba a 1/16; las fusas del c.8 se convertían
   en semicorcheas → el compás se pasaba de duración → repairRhythm recortaba → desalineación.
   Fix: añadido 32 al enum de `duration` (y a `FIGURES`/cuantización a 0.125); TYPE_DENOM mapea
   32nd→32, 64th/128th→32.
2. **Ligaduras de valor (tie)**: se convertían en notas repetidas. Fix: nuevo campo `tie`
   (booleano, en required) → LilyPond añade `~`; musicxml lee `<tie type="start">`.
3. **Compás de ANACRUSA/pickup**: el c.1 del archivo era de 1 pulso (negra de silencio) con
   cifra 4/4 → descuadre. Fix: `parseMelody` calcula el compás REAL de cada barra por su
   contenido (`beatsToMeter`); a los compases incompletos les asigna su cifra real (p. ej.
   "1/4") vía el array `meters`, así el render y el cuadre no se desalinean.
Verificado con el archivo real: los 17 compases cuadran; la soprano queda INTACTA (65 pulsos,
sin cambios tras repair); el tresillo (c.7), las fusas y las ligaduras (c.8) se renderizan
correctos en LilyPond. Nota: la selección de pista por nombre/notas ya estaba; aquí la voz era
la primera igualmente.

---

## FIX regresión "C en cada compás" + anacrusa por relleno + textura en modo armonizar
Feedback del usuario sobre la armonización de su melodía:
1. **Cifra de compás (4/4 "C") repetida en TODOS los compases**: regresión del fix de anacrusa
   (meters por barra activaba el modo "timeline" que re-emitía \time en cada barra). Fix doble:
   (a) lilypond.js solo declara \time cuando CAMBIA respecto al compás anterior (verificado que
   la métrica cambiante báltica sigue mostrando el cambio solo donde toca); (b) musicxml.js
   trata la ANACRUSA rellenando por DELANTE con silencios hasta completar el 1er compás
   (`restsForBeats`), así la pieza queda UNIFORME (meters=null) con una sola cifra al principio.
   Verificado con el archivo real: bar 1 = "r2. r4", meters=null, 68 pulsos, soprano intacta.
2. **Tempo**: se toma del archivo (metronome) y se fija en la composición; el "Pop ballad" es
   ♩=60 y la salida sale a 60 (correcto). Confirmado en el flujo server→applyGivenMelody.
3. **Textura no respetada** (salía colchón de redondas en vez de contrapunto): reforzado el
   bloque de melodía fija para EXIGIR que las voces de acompañamiento sigan la textura elegida
   (contrapunto = líneas independientes con ritmo propio e imitación; homofonía = acordes;
   colchón = notas largas), sin convertir todo en redondas por defecto.

---

## Tempo lo manda el FORMULARIO + reforzar textura en modo armonizar
Feedback: "el tempo aparece 60 cuando debería 92" y "no usa los parámetros elegidos".
- **Comprobado**: el archivo `Pop ballad.musicxml` trae metronome ♩=60 (no 92); el programa lo
  leía bien. El usuario esperaba 92. Cambio: en modo armonizar-melodía el TEMPO lo decide el
  FORMULARIO (params.tempo), NO el archivo; el del archivo se muestra como info en la UI
  ("el archivo indicaba ♩=60; cámbialo en Tempo"). server.js ya no pisa params.tempo;
  applyGivenMelody recibe el tempo del form.
- **Comprobado en código**: el sistema armónico SÍ entra en el prompt de fase 1 (tras la
  melodía) y la textura en fase 2 — los parámetros se pasan. La sensación de "no se usan"
  venía de que la IA hacía siempre un colchón de "Ah" (misma pinta visual). Reforzado el
  bloque de melodía fija para EXIGIR seguir la textura (contrapunto = líneas independientes con
  ritmo propio e imitación; no redondas por defecto). Falta validar con API (lo prueba el usuario).

---

## Eliminada la función "Componer continuación (parte 2)" + piezas largas de una vez
Petición del usuario: quitar el botón de continuación (aparecía siempre, confundía en piezas
ya completas) y que las obras de 32–36 compases se compongan COMPLETAS en una sola pasada.
- Eliminado por completo: botón y explicación en index.html; `continue-btn`/`lastComposition`/
  `continueFrom` en app.js; bloque `continueFrom`/`continuationBrief` en server.js; los bloques
  `params.continuation` en compose.js y harmony.js; borrado `src/continuation.js`; y el CSS
  `.continue`. Verificado que no quedan referencias.
- Compases: el máximo del formulario sube de 32 a 40 (permite 32 y 36).
- `max_tokens` ADAPTATIVO en compose.js: `min(128000, max(64000, measures*voices*900))`, para
  que las piezas largas no se corten por longitud (36×4 → 128k; 8×4 → 64k). Nota: piezas muy
  largas tardan más; el streaming con thinking summarized mantiene viva la conexión.

---

## Vida rítmica de las voces graves (bajo/tenor/alto) — no redondas/blancas
Feedback: al armonizar/contrapuntear, el alto, el tenor y SOBRE TODO el bajo salían casi
siempre en redondas y blancas; deben moverse e IMITAR las figuras de soprano/alto.
- **textures.js**: flag `sustained:true` en las texturas de COLCHÓN (tarareo, solistas_coro,
  duo_solistas_imitacion) donde las notas largas SÍ son el objetivo. Corregido el prompt de
  `contrapunto_libre`, que contradictoriamente pedía al bajo "notas más largas": ahora el bajo
  es una voz ACTIVA (negras/corcheas, notas de paso, arpegios, contramelodía), no un pedal.
- **compose.js**: nuevo bloque FUERTE en fase 2 (salvo texturas `sustained`): NINGUNA voz en
  solo redondas/blancas; alto/tenor/BAJO con vida rítmica comparable a la soprano; el bajo
  camina/arpegia/usa notas de paso (línea, no pedal); imitación de las figuras de las voces
  agudas (en contrapunto) o mismo ritmo activo junto a ellas (en homofonía); notas largas solo
  en reposos/cadencias. Verificado que el flag fluye (contrapunto/homofonía aplican; colchones no).

---

## "Vida rítmica en las voces" pasa a ser OPCIÓN (no romper reglas del contrapunto)
El usuario avisa (con razón) de que forzar el movimiento del bajo puede transgredir las reglas
de conducción de voces. Se convierte en una ELECCIÓN suya y se garantiza que respeta las reglas.
- **index.html**: nuevo desplegable "Escritura de las voces" (`voiceRhythm`): "Según la textura
  (respeta el contrapunto)" [por defecto] / "Coherente con la soprano (todas activas)".
- **compose.js**: el bloque de movimiento rítmico SOLO se añade si `voiceRhythm==='coherente'`
  (y nunca en texturas sustained). Reescrito para dejar CLARO que NO relaja ninguna regla: el
  movimiento se logra con notas extrañas legítimas (paso, bordadura, retardo, anticipación,
  arpegio) y siguen prohibidas 5as/8as paralelas, disonancias sin resolver, falsas relaciones,
  etc.; el bajo se mueve como línea pero canta fundamental/inversión en tiempos fuertes.
- **textures.js**: `contrapunto_libre` vuelve a una descripción NEUTRA del bajo (voz
  independiente), sin prescribir ni "notas largas" ni "negras/corcheas": por defecto se mantiene
  el contrapunto previo; el empuje de "todas activas" vive solo en la opción.

---

## Persichetti Cap. VII (poliacordes) — pág. 142–146, profundización — APLICADO
Más matices sobre poliacordes, integrados en el sistema `policordes` (harmony.js/compose.js
via systems.js). No requiere cambios de esquema.
- **Separación clara**: si las dos áreas se acercan/mezclan, el poliacorde COLAPSA en un
  acorde con sonido añadido y deja de existir; hay que mantenerlas separadas por registro/color.
- **Registro / "turbio"**: no bajar el sonido más grave por debajo del Fa grave de la clave de
  fa (queda turbio, solo para efecto dramático); si la base es aumentada/disminuida, ABRIR las
  voces de la tríada grave. Transponer al agudo aclara y da brillo (menos cuerpo); al grave da
  cuerpo pero enturbia.
- **Resonancia por tipo de tríada**: MAYOR > menor > aumentada > disminuida. MENOR sobre MAYOR
  es más rico que mayor sobre menor. Intervalos 4,5,6,9,12 del ciclo de 5ªs = los más resonantes.
- **Poliacordes cromáticos**: los que llevan una tríada aum./dism.; más flexibles: ma+aum,
  ma+dism, me+aum, me+dism.
- **Generación LINEAL (clave)**: la dirección de la poliarmonía la marca el MOVIMIENTO LINEAL;
  se traza un CONTRAPUNTO a dos partes en las voces EXTERNAS (grave y aguda) y las dos áreas
  acordales se cuelgan de esas líneas. (La pág. 146 seguía con las técnicas contra-acordales;
  pendiente si llegan más páginas.)

---

## FIX: cierres/finales incoherentes (cromatismo sin criterio tras acabar la melodía)
Feedback con la pieza "Contrapunto en Fa": la soprano acababa el texto (~c.11) y la pieza
seguía con un tramo cromático "appassionato/con forza" en las voces graves que no formaba
acordes con criterio — relleno caótico para completar los compases pedidos.
- **compose.js (fase 2)**: bloque "COHERENCIA HASTA EL ÚLTIMO COMPÁS": toda nota pertenece al
  acorde del plan o es nota extraña que resuelve; PROHIBIDO el relleno cromático; si la pieza es
  más larga que el material, DESARROLLARLO (no improvisar relleno); los últimos 1–2 compases
  REPOSAN en una sonoridad clara y estable; cuando una voz calla, las demás mantienen el acorde
  del plan (ninguna "se va por libre").
- **harmony.js (fase 1)**: el plan debe llevar acorde con sentido en TODOS los compases (nada al
  azar, sobre todo al final) y conducir a un reposo final claro y estable.

---

## Persichetti Cap. VII (poliacordes) — pág. 147–150, cierre del capítulo — APLICADO
Últimos matices de poliacordes, integrados en `policordes`:
- **Esqueleto lineal de fundamentales**: el contrapunto a dos partes se traza con las
  FUNDAMENTALES de las dos unidades; esos dos sonidos van en las voces externas o se mueven
  libremente entre internas y externas. Cualquier nota de una línea puede ser fundamental/3ª/5ª
  de una tríada may/men/aum/dism → muchas texturas, tensión que fluctúa.
- **Centro tonal**: la escala no lo fija; se establece por una LÍNEA MELÓDICA predominante o por
  gravitación a un acorde característico. La TÓNICA/reposo conviene que sea un poliacorde
  RESONANTE; las combinaciones densas/disonantes se reservan para el interior y la tensión (no
  para el centro ni el cierre).
- **Refrescar la textura** (poliacordes puros prolongados = masa pesada que sofoca las voces
  internas): (a) ORNAMENTAR las líneas con actividad melódica individual; (b) INTERRUPCIONES al
  unísono o a dos voces; (c) OMITIR de vez en cuando una de las dos unidades para iluminar;
  (d) contrastar los poliacordes con otros tipos de armonía (pilares arquitectónicos).
Con esto queda cubierto el capítulo de poliacordes (Ej. 7-1 a 7-28).

---

## Obra 4 — Ešenvalds, "Only in Sleep" (SATB div. + solo sop. + perc., 2010) — ANÁLISIS
Texto de Sara Teasdale. Reb mayor (5 bemoles), a cappella con leve percusión suave (glasses/
roll pp). Refuerza y amplía el "kit Ešenvalds".

### Rasgos
- **Cuerpo HOMOFÓNICO estrófico**: el coro canta el texto casi homofónico (todas las voces con
  el mismo ritmo, himno cálido), alternando DIVISI (acordes ricos) con UNÍSONO/pocas voces para
  contrastar densidad. Forma estrófica con repetición VARIADA ("2nd time only": más voces/
  dinámica/descante la 2ª vez).
- **Descante**: "a few S" (unas pocas sopranos) flotan sobre "Ah"/"Oh" mientras el resto lleva el texto.
- **Tonalidad con bemoles** (Reb) → calidez.
- **Rubato**: allarg. / a tempo / rit. constantes; dinámicas muy suaves (pp–mf) con largos reguladores.
- **CODA firma de Ešenvalds**: SOLISTA soprano con VOCALISE SIN TEXTO ("Oh/Ah"), melismática,
  con TRESILLOS y GLISSANDO, rubato, elevándose por encima; el CORO sostiene un COLCHÓN de
  acordes en notas LARGAS LIGADAS entre compases (tarareo Mm/Oh); todo se apaga a ppp con calderón.

### Aplicado
- **systems.js CONTEMPORARY_COMPOSE_SYSTEM**: añadido el cuerpo homofónico estrófico (divisi↔
  unísono), el descante de pocas sopranos, la calidez de tonalidades con bemoles, y la CODA con
  solista (vocalise Oh/Ah, tresillos, rubato, glissando de efecto) sobre colchón ligado que se
  apaga a ppp con calderón.
- **textures.js `solistas_coro`**: el colchón usa notas largas LIGADAS ("tie":true) sobre Mm/Oh;
  la solista usa tresillos, rubato y vocalise sin texto (final tipo "Only in Sleep").
- (Percusión: no la modela nuestro esquema SATB; se omite.)

---

## Combinación TONAL + Siglo XX = base tonal funcional + color (no "batiburrillo no funcional")
Antes, marcar "Tonal funcional" junto con una técnica del s.XX se trataba como una combinación
del siglo XX "NO funcional", contradiciendo a la tonal (que sí es funcional). Ahora:
- `hasTonal = systems.includes('tonal')` → la pieza es FUNCIONAL siempre que esté la tonal
  (sola o como base). `tonalPlusColor = hasTonal && multi && !isMixto`.
- harmony.js: si `tonalPlusColor`, la línea de SISTEMA dice "BASE TONAL FUNCIONAL enriquecida
  con el COLOR del s.XX" (mantiene T–S–D–T, cadencias, resolución de sensibles/7as; el color
  adorna). `nonFunctional=!hasTonal` → se habilita la MODULACIÓN funcional y el cierre es
  "cadencia final (tonal)". `selectHarmonySystem`: cabecera de armonista tonal + SYSTEM_PROMPT
  como "=== BASE TONAL (manda) ===" y las demás como "=== COLOR n ===".
- compose.js: `selectComposeSystem` igual (base tonal + color); la MÉTRICA CAMBIANTE ya no se
  ofrece si hay tonal (`nonTonal = !systems.includes('tonal')`), para mantener compás estable.
- "Combinar todo" (mixto) y las combinaciones solo-s.XX siguen igual (no funcionales).

---

## Obra 5 — Ešenvalds, "Trees" (Joyce Kilmer; coro + saxo alto + copas de agua) — ANÁLISIS
Sol mayor, 4/4, ♩=69-76. Instrumentación singular: SAXO ALTO solista + COPAS AFINADAS CON AGUA
(water-tuned glasses, capa de brillo sostenido tipo crotales) + CORO.
### Rasgos
- **Colchón VOCALISE**: el coro va casi todo SIN TEXTO, tarareando acordes lentos muy
  SOSTENIDOS y LIGADOS entre compases, CAMBIANDO la vocal con la armonía (Mm→Oo/Oh→Ah), con
  divisi (S div., B div.) y dinámicas muy suaves (p/mp).
- **Solista instrumental**: el SAXO lleva la melodía LÍRICA y libre (silencios, puntillos,
  síncopas) por encima del colchón — en nuestra app equivale a la voz superior/solista como
  línea lírica libre.
- **Capa de brillo sostenido** (copas de agua): sonoridad campana/cristalina sostenida (no
  reproducible en SATB puro; inspira el colchón brillante).
### Aplicado
- systems.js CONTEMPORARY_COMPOSE_SYSTEM: añadido el "colchón vocalise" tipo Trees (coro sin
  texto, acordes ligados con "tie", vocal que cambia con la armonía, una línea lírica libre
  por encima).
- textures.js `tarareo`: el colchón usa notas largas LIGADAS ("tie":true) y cambia la vocal
  con la armonía; la voz activa puede ser texto o una línea lírica libre.
(Con esto van 5 obras de Ešenvalds analizadas: Rasa, O Salutaris, Only in Sleep, Trees.)

---

## Obra 6 — Ešenvalds, "Stars" (Sara Teasdale; coro SATB + copas de agua) — ANÁLISIS
Re mayor (2 #), "Espressivo e rubato" ♩=76-84. Musica Baltica 2012. La obra emblemática de las
copas afinadas con agua.
### Rasgos
- **Halo de copas**: "cada segundo cantante toca una copa"; las copas suenan CONTINUAS, sin
  parar en las barras (anotación "play glasses w/o stopping, ignore bar line"), formando un
  BRILLO sostenido de acordes resonantes (pitches abiertos re/mi/la; se pueden añadir cuencos
  tibetanos en Re-Mi-La para más grave). Menos agua = más resonancia.
- **Coro homofónico** cantando el texto, cálido, expresivo, rubato, muy suave (p-mp), con hums
  "Mm" y aperturas a "Ah" sostenido en el clímax ("heaven full of stars"). Divisi.
### Aplicado (emulación en SATB, sin instrumentos reales)
- textures.js: NUEVA textura `halo_copas` ("Coro con halo de copas de agua, Stars"): unas voces
  sostienen un PEDAL continuo de sonidos ABIERTOS/resonantes (quintas justas, pentatónico
  Re-La-Mi) en "Mm"/"Oo" con notas largas LIGADAS que no se cortan en las barras, mientras el
  resto canta el texto homofónico y abre a "Ah" en el clímax. sustained:true.
- systems.js CONTEMPORARY_COMPOSE_SYSTEM: añadido el "halo de copas" (pedal vocal abierto y
  resonante, ligado, por debajo del coro).
(Van 6 obras de Ešenvalds: Rasa, O Salutaris, Only in Sleep, Trees, Stars.)

---

## DIVISI en cualquier voz (petición del usuario) — APLICADO
Motivado por "Lux Aeterna" (Ešenvalds, coro femenino SSMsAA, muy divisi). El usuario pide que
CUALQUIER voz (S/A/T/B) pueda dividirse en su propio pentagrama.
- **schema.js**: nuevo campo OPCIONAL `chord` en la nota = array de alturas ADICIONALES
  {step,alter,octave} que suenan a la vez (mismo ritmo). Opcional (como meters/keyChanges), sin
  inflar cada nota.
- **lilypond.js**: `pitchToLily` escribe un ACORDE `<main extra...>` cuando la nota trae `chord`;
  helper `pitchName` (altura sin duración). Duración/ligadura/dinámica/slur van tras el `>`.
- **compose.js**: instrucción de DIVISI en el prompt (cualquier voz; usar con intención en
  clímax/aperturas/colchones, respetando tesitura).
- Verificado con render real: soprano divisi a2 (`<e'' c'''>`) y bajo a octavas (`<c c,>`) →
  PDF + MIDI correctos, cada divisi en su pentagrama.
- Nota: es divisi HOMORRÍTMICO (acorde). Para líneas divisi con RITMOS independientes sigue el
  voicing SSAATTBB (pentagramas separados).

## Obra 7 (parcial) — Ešenvalds, "Lux Aeterna" (coro FEMENINO SSMsAA, 2017)
Texto sacro (Lux aeterna/requiem). Mib mayor aprox., "Con anima" ♩=52. Homofonía cálida y
fluida, rubato, muy divisi, con opción de pasar el texto a "Mm" gradualmente. Motiva: (a) el
DIVISI (ya hecho) y (b) un voicing de CORO FEMENINO (SSAA / SSMsAA) — pendiente de añadir.

## Obra 7 (completa) — Ešenvalds, "Lux Aeterna" (coro FEMENINO SSMsAA, 2017) — APLICADO
Comisión del International Baltic Sea Choir Competition. Texto sacro "Lux aeterna luceat eis…".
Mib mayor, "Con anima" ♩=52 (luego "Sonante" ♩=80-84). Homofonía cálida y fluida, rubato
(rall.), dinámicas p→f(ff)→p, MUY divisi, cierre sereno sostenido en p.
- Rasgos: coro femenino a 5 (S I, S II, Mezzo, A I, A II); homofonía expresiva con el texto;
  DIVISI frecuente (acordes por voz); cambio GRADUAL del texto a "Mm" (una voz tras otra,
  m.29-36 opcional) que disuelve en colchón hummeado; final rall./p.
- Aplicado:
  - voicings.js: NUEVOS voicings `ssaa` (SSAA, coro femenino a 4) y `ssmsaa` (SSMsAA a 5, el de
    esta obra). Verificado render a 5 pentagramas de agudos + divisi → PDF+MIDI OK.
  - systems.js CONTEMPORARY_COMPOSE_SYSTEM: añadida la "disolución a Mm" (voces que pasan del
    texto al tarareo una a una, con ligaduras, apagándose).
  - (El divisi ya se implementó en el commit anterior; esta obra lo motivó.)
Con esto van 7 obras de Ešenvalds analizadas (Rasa, O Salutaris, Only in Sleep, Trees, Stars,
Lux Aeterna) — el acervo báltico/Ešenvalds está muy completo.

---

## Obra 8 — Ešenvalds, "In Paradisum" (coro divisi, 2013; en memoria de su abuela) — APLICADO
Texto sacro del responsorio "In paradisum deducant angeli". "Espressivo, rubato" ♩=63-69, 3/4,
muy suave (ppp–p). Coro con divisi (S I/II, A I/II, T, B).
### Rasgo distintivo
- **Colchón que RESPIRA con morphing de VOCAL**: sobre notas sostenidas/ligadas, reguladores
  CONTINUOS (pp<p>pp<mp…) y la VOCAL morfa con la dinámica, indicado con flechas en la
  partitura: "Mm ---> Ah ---> Mm" — cerrada en lo suave, ABRE a "Ah" en la cima del regulador,
  cierra a "Mm" al recogerse. Una respiración viva del colchón.
- El coro también canta el texto homofónico, cálido, pp, con esos mismos reguladores y rubato.
### Aplicado
- textures.js `tarareo`: añadida la RESPIRACIÓN con morphing de vocal (dynamic "<"/">" y
  "Ah" en la cima / "Mm" en lo tenue).
- systems.js CONTEMPORARY_COMPOSE_SYSTEM (sección ARCO Y CIERRE): "colchón que respira" con
  reguladores encadenados y vocal que morfa con la dinámica.
(Van 8 obras de Ešenvalds: Rasa, O Salutaris, Only in Sleep, Trees, Stars, Lux Aeterna, In Paradisum.)

---

## FIX divisi: el prompt lo DESANIMABA + control de usuario
Síntoma: la IA no producía divisi. Causa: el prompt decía literalmente "No abuses: divisi con
intención" → lo frenaba. Corregido:
- Nuevo desplegable "Divisi" (`params.divisi`): "Con criterio (clímax y colchones)" [auto,
  defecto] / "Generoso (sonoridades amplias a6-a8)" / "Sin divisi".
- compose.js: bloque de divisi según el control. En 'auto' ANIMA a usarlo (clímax/aperturas/
  colchones) con EJEMPLO JSON del campo "chord"; en 'generoso' lo pide A MENUDO (6-8 sonidos
  reales repartidos entre voces, incluido el acorde final); en 'no' lo prohíbe. Se quitó la
  frase que lo desincentivaba.
- (La mecánica del campo "chord" ya estaba y renderiza bien; el problema era de adherencia.)

---

## Persichetti Cap. VII — pág. 152–154: poliacordes MULTI-UNIDAD (3+ tríadas) — APLICADO
- Cuatro clases de poliacordes de 3+ unidades: las unidades superiores se apilan sobre la 3ª y
  5ª de la tríada de BASE (rara vez la fundamental); o sobre ARMÓNICOS (a cualquier octava) de
  esa 3ª/5ª; o sobre armónicos de armónicos; o sobre armónicos de tríadas que NO son la de base.
- Masivos y complejos: la tríada de base se pone APARTE (bien espaciada); unas unidades se
  superponen y otras dejan amplio hueco. DUPLICACIONES y ACOPLAMIENTOS (octavas) alargan el
  poliacorde SIN añadir complejidad. Al superponer 3 unidades, una puede "evaporarse" → queda
  de hecho un poliacorde de 2 unidades.
- Uso: por BREVES períodos; hábitat natural = sección CLIMÁTICA (potente) o pasaje RÁPIDO pero
  suave (leggiero).
- Aplicado a `policordes`: fase 1 (concepto multi-unidad, uso breve en clímax/rápido-suave);
  fase 2 (realizar con DIVISI —campo "chord"— repartiendo unidades entre voces, base espaciada,
  duplicaciones/acoplamientos por octava, breve). Enlaza con la función de divisi recién añadida.
