# Choral AI

App web de **composición coral SATB con IA**. Describes el tema, la tonalidad y el
compás; Claude compone una pieza a cuatro voces (soprano, contralto, tenor, bajo)
y el servidor la renderiza a **partitura PDF** y **MIDI**, reproducibles y
descargables desde el navegador.

## Cómo funciona

1. El frontend envía los parámetros a `POST /api/compose`.
2. **Claude (`claude-opus-4-8`)** genera la pieza como **JSON estructurado**
   (altura, duración y sílaba por nota) usando *structured outputs* — nunca
   escribe LilyPond directamente, por lo que la salida es robusta.
3. `src/lilypond.js` traduce ese JSON de forma determinista a un archivo `.ly`
   con bloques `\layout` y `\midi`.
4. Una sola invocación de **LilyPond** produce el **PDF** y el **MIDI**.

```
public/        frontend (formulario, visor PDF, reproductor MIDI)
server.js      Express: estáticos + POST /api/compose
src/compose.js llamada a Claude (structured outputs)
src/schema.js  esquema JSON de la composición + validación rítmica
src/lilypond.js JSON -> .ly -> PDF + MIDI
```

## Requisitos

- **Node.js ≥ 20**
- **`ANTHROPIC_API_KEY`** en el entorno (clave de la API de Claude).
- **LilyPond** instalado para generar PDF/MIDI:

  ```bash
  sudo apt-get update && sudo apt-get install -y lilypond
  ```

  Si LilyPond no está instalado, la app sigue funcionando pero devuelve solo el
  archivo `.ly` (con un aviso), que puedes renderizar en otro sitio.

## Uso

```bash
cd choral-ai
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm start
# abre http://localhost:3000
```

### Probar la cadena de render sin gastar API

```bash
npm run test:lily
```

Genera una pieza de ejemplo y la renderiza a `output/test/` (valida
JSON → LilyPond → PDF + MIDI de forma independiente al modelo).

## Alcance (v1) y posibles ampliaciones

- Voces fijas SATB (ampliable a número de voces configurable).
- Reproducción MIDI en el cliente con `html-midi-player` (soundfont); se podría
  añadir render a WAV/MP3 con `fluidsynth`/`timidity`.
- Sin autenticación ni persistencia; pensado para uso local/desarrollo.
