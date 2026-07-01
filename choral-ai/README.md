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
- **LilyPond** para generar PDF/MIDI. La forma más fácil (sin root, sin tocar el
  PATH) es el instalador incluido, que descarga el binario portable a
  `vendor/lilypond/` y la app lo detecta sola:

  ```bash
  npm run setup:lilypond     # Linux x86_64, macOS y Windows 10/11
  ```

  Alternativas: `sudo apt-get install -y lilypond` (Debian/Ubuntu),
  `brew install lilypond` (macOS), o el instalador de
  https://lilypond.org/download.html (Windows).

  Si LilyPond no está disponible, la app sigue funcionando pero devuelve solo el
  archivo `.ly` (con un aviso), que puedes renderizar en otro sitio.

## Uso

```bash
cd choral-ai
npm install
npm run setup:lilypond          # instala LilyPond portable (Linux/macOS)
cp .env.example .env            # pega tu clave en .env (ANTHROPIC_API_KEY=...)
npm start
# abre http://localhost:3000
```

### ¿Dónde va la clave de API?

La app lee `ANTHROPIC_API_KEY` del entorno. Lo más cómodo es el archivo
**`choral-ai/.env`** (lo carga `npm start` con `--env-file`, sin dependencias):

```bash
cp .env.example .env
# edita .env y pon: ANTHROPIC_API_KEY=sk-ant-...
```

El `.env` está en `.gitignore`, así que tu clave no se sube al repositorio.
Alternativa puntual: `export ANTHROPIC_API_KEY=sk-ant-...` antes de `npm start`.

### Armonizar TU propia melodía (MusicXML)

En el formulario hay un campo **«Armonizar MI melodía (MusicXML)»**. Sube tu
melodía exportada como **MusicXML sin comprimir** (`.musicxml` o `.xml`) desde
MuseScore, Sibelius o Finale. La app fija TU melodía **exacta** en la voz
superior y la IA compone las demás voces por debajo para armonizarla.

- La tonalidad, el compás, el tempo, el nº de compases y la letra se toman del
  archivo (los campos del formulario para eso se ignoran en este modo).
- Sí se respetan el **Sistema armónico**, las **Voces** y la **Textura** elegidos.
- En MuseScore: *Archivo → Exportar → MusicXML sin comprimir* (no `.mxl`).
- Limitaciones v1: evita compás de anacrusa y tresillos exóticos; en tonalidades
  con bemoles/sostenidos la armadura puede no dibujarse, pero las alteraciones van
  explícitas en cada nota, así que el sonido y las alturas son correctos.

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
