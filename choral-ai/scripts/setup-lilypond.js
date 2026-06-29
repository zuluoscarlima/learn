// Descarga el binario portable de LilyPond a choral-ai/vendor/lilypond/.
// No requiere root ni modificar el PATH: src/lilypond.js detecta este binario.
//
// Uso: npm run setup:lilypond
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, rm, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const VERSION = '2.24.4';

// Mapea plataforma/arquitectura al asset de release correspondiente.
function assetFor() {
  const { platform } = process;
  if (platform === 'linux') {
    return `lilypond-${VERSION}-linux-x86_64.tar.gz`;
  }
  if (platform === 'darwin') {
    return `lilypond-${VERSION}-darwin-x86_64.tar.gz`; // funciona en Apple Silicon vía Rosetta
  }
  if (platform === 'win32') {
    return `lilypond-${VERSION}-mingw-x86_64.zip`;
  }
  return null;
}

// Nombre del ejecutable según la plataforma.
function binName() {
  return process.platform === 'win32' ? 'lilypond.exe' : 'lilypond';
}

function has(cmd) {
  try {
    execFileSync(cmd, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Descarga respetando proxys (curl/wget honran HTTPS_PROXY); fetch como respaldo.
async function download(url, dest) {
  if (has('curl')) {
    await execFileAsync('curl', ['-fsSL', '--retry', '3', '-o', dest, url]);
    return;
  }
  if (has('wget')) {
    await execFileAsync('wget', ['-q', '-O', dest, url]);
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Descarga fallida: HTTP ${res.status}`);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const asset = assetFor();
  if (!asset) {
    console.error(
      `\nPlataforma "${process.platform}" no soportada por este instalador automático.\n` +
        'Descarga LilyPond desde https://lilypond.org/download.html\n',
    );
    process.exit(1);
  }

  const destDir = path.join(ROOT, 'vendor', 'lilypond');
  const binPath = path.join(destDir, 'bin', binName());

  if (existsSync(binPath)) {
    console.log(`LilyPond ya está instalado en ${binPath}`);
    const { stdout } = await execFileAsync(binPath, ['--version']);
    console.log(stdout.split('\n')[0]);
    return;
  }

  const url = `https://gitlab.com/lilypond/lilypond/-/releases/v${VERSION}/downloads/${asset}`;
  const tmp = path.join(ROOT, 'vendor', asset);

  await mkdir(path.join(ROOT, 'vendor'), { recursive: true });
  console.log(`Descargando LilyPond ${VERSION}…\n  ${url}`);
  await download(url, tmp);

  console.log('Extrayendo…');
  await mkdir(destDir, { recursive: true });
  // `tar -xf` autodetecta gzip; en Windows 10+ el tar incluido (bsdtar) también
  // extrae ZIP. --strip-components=1 deja el contenido directo en vendor/lilypond/.
  await execFileAsync('tar', ['-xf', tmp, '-C', destDir, '--strip-components=1']);
  await rm(tmp, { force: true });

  await access(binPath);
  const { stdout } = await execFileAsync(binPath, ['--version']);
  console.log('\n✓ Instalado:', stdout.split('\n')[0]);
  console.log(`  Binario: ${binPath}`);
  console.log('  La app lo detecta automáticamente (no necesitas tocar el PATH).');
}

main().catch((err) => {
  console.error('\nError instalando LilyPond:', err.message);
  console.error(
    'Alternativa: instala LilyPond manualmente y asegúrate de que `lilypond` esté en el PATH.',
  );
  process.exit(1);
});
