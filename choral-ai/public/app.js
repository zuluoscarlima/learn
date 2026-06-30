const form = document.getElementById('compose-form');
const statusEl = document.getElementById('status');
const result = document.getElementById('result');
const submitBtn = document.getElementById('submit-btn');

function setStatus(msg, kind = 'info') {
  if (!msg) {
    statusEl.hidden = true;
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = msg;
  statusEl.className = `status ${kind}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.tempo = Number(data.tempo);
  data.measures = Number(data.measures);
  data.modulate = document.getElementById('modulate').checked;

  submitBtn.disabled = true;
  result.hidden = true;
  setStatus('Componiendo con IA… (suele tardar entre 30 s y 2 min).', 'info');

  try {
    const res = await fetch('/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || 'Error desconocido');

    renderResult(payload);
    setStatus(payload.warning || '', payload.warning ? 'warn' : 'info');
  } catch (err) {
    setStatus('Error: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

function renderResult(payload) {
  const { composition, pdfUrl, midiUrl, lyUrl, voices, texture, harmony, system } = payload;
  const title = composition.title || 'Pieza coral';
  const bits = [];
  if (system) bits.push(system);
  if (texture) bits.push(texture);
  if (voices && voices.length) bits.push(voices.join(', '));
  const subtitle = bits.length ? ` · ${bits.join(' · ')}` : '';
  document.getElementById('result-title').textContent = title + subtitle;

  const harmonyEl = document.getElementById('harmony');
  if (harmony && harmony.progression && harmony.progression.length) {
    const prog = harmony.progression.join(' · ');
    const cad = harmony.cadence ? ` — cadencia: ${harmony.cadence}` : '';
    harmonyEl.textContent = `Plan armónico: ${prog}${cad}`;
  } else {
    harmonyEl.textContent = '';
  }

  const downloads = document.getElementById('downloads');
  downloads.innerHTML = '';
  const links = [
    ['PDF', pdfUrl],
    ['MIDI', midiUrl],
    ['LilyPond (.ly)', lyUrl],
  ];
  for (const [label, url] of links) {
    if (!url) continue;
    const a = document.createElement('a');
    a.href = url;
    a.textContent = `⬇ ${label}`;
    a.download = '';
    downloads.appendChild(a);
  }

  const player = document.getElementById('player');
  const pdf = document.getElementById('pdf');
  if (midiUrl) {
    player.src = midiUrl;
    player.hidden = false;
  } else {
    player.hidden = true;
  }
  if (pdfUrl) {
    pdf.src = pdfUrl;
    pdf.hidden = false;
  } else {
    pdf.hidden = true;
  }

  result.hidden = false;
}

// Rellena un <select> con una lista de {id, label}, marcando el por defecto.
function fillSelect(elId, items, def) {
  const sel = document.getElementById(elId);
  sel.innerHTML = '';
  for (const it of items) {
    const opt = document.createElement('option');
    opt.value = it.id;
    opt.textContent = it.label;
    if (it.id === def) opt.selected = true;
    sel.appendChild(opt);
  }
}

// Pobla los desplegables (sistema, voces, textura) desde el catálogo del servidor.
fetch('/api/systems')
  .then((r) => r.json())
  .then(({ systems, default: def }) => fillSelect('system', systems, def))
  .catch(() => {});

fetch('/api/voicings')
  .then((r) => r.json())
  .then(({ voicings, default: def }) => fillSelect('voicing', voicings, def))
  .catch(() => {});

fetch('/api/textures')
  .then((r) => r.json())
  .then(({ textures, default: def }) => fillSelect('texture', textures, def))
  .catch(() => {});

// Aviso temprano si falta configuración del servidor.
fetch('/api/health')
  .then((r) => r.json())
  .then((h) => {
    if (!h.apiKey) {
      setStatus('Aviso: falta ANTHROPIC_API_KEY en el servidor.', 'warn');
    } else if (!h.lilypond) {
      setStatus(
        'Aviso: LilyPond no está instalado; se generará solo el .ly (sin PDF/MIDI).',
        'warn',
      );
    }
  })
  .catch(() => {});
