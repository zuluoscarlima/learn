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

  submitBtn.disabled = true;
  result.hidden = true;
  setStatus('Componiendo con IA… esto puede tardar hasta un minuto.', 'info');

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
  const { composition, pdfUrl, midiUrl, lyUrl, voices } = payload;
  const title = composition.title || 'Pieza coral';
  const voiceList = voices && voices.length ? ` · ${voices.join(', ')}` : '';
  document.getElementById('result-title').textContent = title + voiceList;

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

// Pobla el desplegable de voces desde el catálogo del servidor.
fetch('/api/voicings')
  .then((r) => r.json())
  .then(({ voicings, default: def }) => {
    const sel = document.getElementById('voicing');
    sel.innerHTML = '';
    for (const v of voicings) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      if (v.id === def) opt.selected = true;
      sel.appendChild(opt);
    }
  })
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
