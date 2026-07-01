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

// Última composición generada (para «Componer continuación»).
let lastComposition = null;

// Lee los valores actuales del formulario como objeto para la petición. Es async
// porque, si hay un MusicXML seleccionado, lee su texto para enviarlo.
async function readForm() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.tempo = Number(data.tempo);
  data.measures = Number(data.measures);
  data.modulate = document.getElementById('modulate').checked;
  // Sistemas: una o varias casillas marcadas (o "mixto" = combinar todo).
  data.systems = [...document.querySelectorAll('#system input:checked')].map((c) => c.value);
  delete data.system;
  // Modo "armonizar mi melodía": adjunta el contenido del MusicXML si lo hay.
  delete data.melodyFile;
  const file = document.getElementById('melodyFile').files[0];
  if (file) data.melodyXml = await file.text();
  return data;
}

// Envía la petición de composición y pinta el resultado. `data.continueFrom`,
// si está, hace que la IA compona una continuación coherente de esa pieza.
async function compose(data) {
  const continueBtn = document.getElementById('continue-btn');
  submitBtn.disabled = true;
  if (continueBtn) continueBtn.disabled = true;
  result.hidden = true;
  setStatus(
    data.continueFrom
      ? 'Componiendo la continuación (parte 2)…'
      : data.melodyXml
        ? 'Armonizando tu melodía con IA… (suele tardar entre 30 s y 2 min).'
        : 'Componiendo con IA… (suele tardar entre 30 s y 2 min).',
    'info',
  );

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
    if (continueBtn) continueBtn.disabled = false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  compose(await readForm());
});

// Muestra el nombre del MusicXML elegido para armonizar.
document.getElementById('melodyFile').addEventListener('change', (e) => {
  const info = document.getElementById('melody-info');
  const file = e.target.files[0];
  if (file) {
    info.textContent = `Melodía cargada: ${file.name}. Al pulsar «Componer» se armonizará.`;
    info.hidden = false;
  } else {
    info.hidden = true;
  }
});

// «Componer continuación»: reenvía el formulario actual adjuntando la pieza
// anterior como contexto, para que la IA encadene una 2ª parte coherente.
document.getElementById('continue-btn').addEventListener('click', async () => {
  if (!lastComposition) return;
  const data = await readForm();
  data.continueFrom = lastComposition;
  compose(data);
});

function renderResult(payload) {
  const { composition, pdfUrl, midiUrl, lyUrl, voices, texture, harmony, system } = payload;
  // Recuerda esta pieza para poder pedir una continuación coherente.
  lastComposition = composition;
  const title = composition.title || 'Pieza coral';
  const bits = [];
  if (system) bits.push(system);
  if (texture) bits.push(texture);
  if (voices && voices.length) bits.push(voices.join(', '));
  const subtitle = bits.length ? ` · ${bits.join(' · ')}` : '';
  document.getElementById('result-title').textContent = title + subtitle;

  const harmonyEl = document.getElementById('harmony');
  const parts2 = [];
  if (payload.harmonized && payload.melodyInfo) {
    const mi = payload.melodyInfo;
    parts2.push(
      `🎵 TU melodía armonizada (${mi.measures} compases, ${mi.tonality}, ${mi.notes} notas)`,
    );
  }
  if (harmony && harmony.progression && harmony.progression.length) {
    const prog = harmony.progression.join(' · ');
    const cad = harmony.cadence ? ` — cadencia: ${harmony.cadence}` : '';
    parts2.push(`Plan armónico: ${prog}${cad}`);
  }
  harmonyEl.textContent = parts2.join('  ·  ');

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

// Pobla las casillas de "Sistema armónico", agrupadas por encabezado (Tonal / Siglo XX).
// Permite marcar varias; la casilla especial "combinar todo" (combo) es EXCLUSIVA.
function fillSystems(items, def) {
  const box = document.getElementById('system');
  box.innerHTML = '';
  const groups = [];
  const byGroup = new Map();
  for (const it of items) {
    const g = it.group || '';
    if (!byGroup.has(g)) {
      byGroup.set(g, []);
      groups.push(g);
    }
    byGroup.get(g).push(it);
  }
  for (const g of groups) {
    if (g) {
      const h = document.createElement('div');
      h.className = 'checkbox-group-title';
      h.textContent = g;
      box.appendChild(h);
    }
    for (const it of byGroup.get(g)) {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = it.id;
      cb.dataset.combo = it.combo ? '1' : '';
      if (it.id === def) cb.checked = true;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + it.label));
      box.appendChild(label);
    }
  }
  // Exclusividad de "combinar todo": al marcarlo se desmarcan los demás, y viceversa.
  box.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type !== 'checkbox') return;
    const boxes = [...box.querySelectorAll('input[type=checkbox]')];
    if (t.dataset.combo && t.checked) {
      boxes.forEach((c) => c.dataset.combo || (c.checked = false));
    } else if (t.checked) {
      boxes.forEach((c) => c.dataset.combo && (c.checked = false));
    }
    // Si no queda ninguna marcada, vuelve a la de por defecto.
    if (!boxes.some((c) => c.checked)) {
      const d = boxes.find((c) => c.value === def) || boxes[0];
      if (d) d.checked = true;
    }
  });
}

fetch('/api/systems')
  .then((r) => r.json())
  .then(({ systems, default: def }) => fillSystems(systems, def))
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
