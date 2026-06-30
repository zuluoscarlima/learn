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

### Funciones derivadas a implementar (pendiente)
- [ ] **Compases aditivos/compuestos y mixtos** (p. ej. 2+3+3/8, cambios por compás).
      Requiere: campo de compás por compás (o lista de compases), ajuste de
      `beatsPerMeasure`, validación/reparación por compás, y agrupación de corcheas
      en LilyPond (`\set Staff.beatStructure` / `\time 8/8` con `\tuplet`/`beamExceptions`).
- [ ] **Rol "tarareo/Mm"** por voz: voces de zumbido cerrado (lyric "Mm", notas largas)
      como colchón. Podría ser un flag de voz o una textura nueva.
- [ ] **Dinámicas ppp y fff** en el mapa de dinámicas (`DYN`) y matices expresivos
      (texto bajo la nota, p. ej. "maigi", "dolce").
- [ ] **Sistema/estética "Impresionista"**: modal, acordes paralelos (planing de
      tríadas/7as), notas añadidas, armonía estática "ligera" (distinto del
      contemporáneo pandiatónico ya existente: aquí más paralelismo y modalidad
      tipo Debussy/báltico).
- [ ] **Rubato / cambios de tempo** (rall., accel., a tempo) como marcas.
- [ ] **Divisi explícito** (SI/SII, TI/TII, BI/BII) ya cubierto por voicings;
      añadir un voicing SSAATTBB con nombres divididos y entradas escalonadas.

### Notas de implementación
- La métrica aditiva es el cambio más estructural (toca schema, validación,
  reparación rítmica y render). Abordarla primero si se prioriza este estilo.
- El "Mm" encaja bien con la textura "Solistas sobre coro sostenido" ya existente,
  invirtiendo roles (el coro tararea, una voz lleva el texto).
