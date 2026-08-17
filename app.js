// ============================================================
// GASTOS — app.js (v4: Material You, categorías planas)
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const CAT_COLORS = {
  'alimentación': '#9FCB8E', 'higiene personal': '#8FCBBE', 'limpieza': '#8EB8CB',
  'vivienda': '#CBB68E', 'transporte': '#CBAF8E', 'salud': '#CB8E9F',
  'ocio': '#B08ECB', 'compras': '#CBC28E', 'otros': '#A9A99A',
  'préstamos': '#8E9ECB',
};
// Paleta de respaldo para categorías personalizadas que el usuario añada,
// con más colores de los que hacen falta para evitar que se repitan
const PALETA_RESPALDO = [
  '#D9A6CB', '#A6CBB0', '#CB9E8E', '#8ECBC0', '#CBB98E',
  '#9E8ECB', '#CB8EA9', '#8EAECB', '#B9CB8E', '#CB8E71',
];

// Iconos propios en SVG, mismo estilo de trazo fino en todos (24x24, stroke 1.7)
const ICONOS_SVG = {
  'alimentación': '<path d="M7 2v7.5c0 1.7-1.1 2.5-2.5 2.5v0"/><path d="M7 2v7.5c0 1.7 1.1 2.5 2.5 2.5v0"/><path d="M5.8 2v6M8.2 2v6M7 12v10"/><path d="M17 2c-1.9 0-3.2 2.3-3.2 5.5S15.1 13 17 13v9"/>',
  'higiene personal': '<path d="M12 3s5.5 6.2 5.5 10.5A5.5 5.5 0 0 1 6.5 13.5C6.5 9.2 12 3 12 3z"/>',
  'limpieza': '<path d="M9.5 21V10.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V21z"/><path d="M11 8.5V5.5h2v3"/><path d="M13 5.5l2.8-2"/><path d="M13 8.5h3.8"/>',
  'vivienda': '<path d="M4 11.5l8-7.3 8 7.3"/><path d="M6 10.3V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9.7"/>',
  'transporte': '<path d="M4.5 16v-3.2l1.8-4.6a1.5 1.5 0 0 1 1.4-1h8.6a1.5 1.5 0 0 1 1.4 1l1.8 4.6V16"/><path d="M4.5 16h15"/><circle cx="8" cy="17.6" r="1.5"/><circle cx="16" cy="17.6" r="1.5"/>',
  'salud': '<path d="M12 20.3s-7.3-4.5-9-9.2C1.6 7.8 3 4.9 5.9 4.2 8 3.7 10 4.7 12 7c2-2.3 4-3.3 6.1-2.8 2.9.7 4.3 3.6 3.1 6.9-1.7 4.7-9.2 9.2-9.2 9.2z"/>',
  'ocio': '<path d="M12 3.2l2.5 5.6 6.1.6-4.6 4.1 1.4 6-5.4-3.2-5.4 3.2 1.4-6-4.6-4.1 6.1-.6z"/>',
  'compras': '<path d="M6.2 9h11.6l1 11.2a1 1 0 0 1-1 1.1H6.2a1 1 0 0 1-1-1.1z"/><path d="M9 9V6.8a3 3 0 0 1 6 0V9"/>',
  'otros': '<path d="M20 12.3l-7.7 7.7-9-9V4.5h6.5z"/><circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/>',
  'préstamos': '<circle cx="12" cy="12" r="8.5"/><path d="M15 8.3c-.7-.5-1.6-.8-2.5-.8-2.3 0-4.1 2-4.1 4.5s1.8 4.5 4.1 4.5c.9 0 1.8-.3 2.5-.8"/><path d="M7 10.3h5.5M7 13.2h4.7"/>',
};
function iconoSVG(nombre, size) {
  const s = size || 16;
  const path = ICONOS_SVG[(nombre || '').toLowerCase()] || '<circle cx="12" cy="12" r="8"/>';
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
const ICONO_RECIBO = '<path d="M6 3h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11h6M9 14h3.5"/>';
const ICONO_PAPELERA = '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>';
function svgInline(pathInner, size, strokeWidth) {
  return `<svg width="${size || 16}" height="${size || 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth || 1.7}" stroke-linecap="round" stroke-linejoin="round">${pathInner}</svg>`;
}

let coloresAsignados = {};

function colorCategoria(nombre) {
  const k = (nombre || '').toLowerCase();
  return coloresAsignados[k] || '#A9A99A';
}
function asignarColores() {
  coloresAsignados = {};
  const usados = new Set();
  const pendientes = [];

  // 1º pasada: categorías con color fijo conocido
  categoriasCache.forEach((c) => {
    const k = c.nombre.toLowerCase();
    if (CAT_COLORS[k]) { coloresAsignados[k] = CAT_COLORS[k]; usados.add(CAT_COLORS[k]); }
    else pendientes.push(k);
  });
  // 2º pasada: categorías personalizadas, un color libre de la paleta de respaldo cada una
  pendientes.forEach((k) => {
    const libre = PALETA_RESPALDO.find((c) => !usados.has(c)) || '#A9A99A';
    coloresAsignados[k] = libre;
    usados.add(libre);
  });
}
function iconoCategoria(nombre) {
  // Mantiene compatibilidad: ahora devuelve el SVG en vez de un emoji
  return iconoSVG(nombre, 16);
}
function euros(n) { return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function fechaLocal(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function ultimoDiaMes(y, m) { return new Date(y, m + 1, 0).getDate(); }
function hoyISO() { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); }
function nombreCategoria(id) { return categoriasCache.find((c) => c.id === id)?.nombre || 'Otros'; }

let categoriasCache = [];
let ticketActual = null;
let modalManualEditId = null;
let nominaEsteMesId = null;
let chartCategorias = null;

function poblarSelectCategorias(sel, categoriaIdActual) {
  const activas = categoriasCache.filter((c) => c.activa);
  sel.innerHTML = activas.map((c) => `<option value="${c.id}" ${c.id === categoriaIdActual ? 'selected' : ''}>${c.nombre}</option>`).join('');
  if (!categoriaIdActual && activas.length) sel.value = activas[0].id;
}

// ---------------- AUTH ----------------
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user?.email === CONFIG.ADMIN_EMAIL) mostrarApp();
  else document.getElementById('login-screen').style.display = 'flex';
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || data.user?.email !== CONFIG.ADMIN_EMAIL) {
    errorEl.textContent = error ? error.message : 'Cuenta no autorizada';
    errorEl.style.display = 'block';
    return;
  }
  mostrarApp();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('version-tag').textContent = 'v' + CONFIG.APP_VERSION;
  document.getElementById('manual-fecha').value = hoyISO();
  document.getElementById('topbar-month').textContent = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  if (localStorage.getItem('gastos-tema') === 'claro') {
    document.body.classList.add('tema-claro');
    document.getElementById('tema-toggle').classList.remove('off');
  }

  await cargarCategorias();
  await cargarDashboard();
}

document.getElementById('tema-toggle').addEventListener('click', () => {
  const claro = document.body.classList.toggle('tema-claro');
  document.getElementById('tema-toggle').classList.toggle('off', !claro);
  localStorage.setItem('gastos-tema', claro ? 'claro' : 'oscuro');
  if (document.getElementById('view-resumen').classList.contains('active')) cargarDashboard();
});

// ---------------- NAVEGACIÓN ----------------
document.querySelectorAll('.navitem').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.navitem').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'resumen') cargarDashboard();
    if (btn.dataset.view === 'tickets') cargarTickets();
    if (btn.dataset.view === 'ajustes') { cargarNominaConfig(); cargarFijosConfig(); renderCategorias(); }
  });
});

// ---------------- CATEGORÍAS ----------------
async function cargarCategorias() {
  const { data, error } = await sb.from('categorias').select('*').order('orden');
  if (error) { alert('No se pudieron cargar las categorías: ' + error.message); return; }
  categoriasCache = data;
  asignarColores();
}

function renderCategorias() {
  const cont = document.getElementById('cat-list');
  cont.innerHTML = categoriasCache.map((c) => `
    <div class="cat-row">
      <div class="cat-row-left">
        <div class="cat-icon-circ" style="background:${colorCategoria(c.nombre)}33; color:${colorCategoria(c.nombre)};">${iconoCategoria(c.nombre)}</div>
        <div class="cat-name">${c.nombre}</div>
      </div>
      <button class="m3-switch ${c.activa ? '' : 'off'}" data-id="${c.id}" data-activa="${c.activa}"></button>
    </div>
  `).join('');
  cont.querySelectorAll('.m3-switch').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await sb.from('categorias').update({ activa: btn.dataset.activa !== 'true' }).eq('id', btn.dataset.id);
      await cargarCategorias();
      renderCategorias();
    });
  });
}

document.getElementById('add-cat-btn').addEventListener('click', async () => {
  const input = document.getElementById('nueva-cat-nombre');
  const nombre = input.value.trim();
  if (!nombre) return;
  await sb.from('categorias').insert({ nombre, orden: categoriasCache.length + 1 });
  input.value = '';
  await cargarCategorias();
  renderCategorias();
});

// ---------------- NÓMINA ----------------
async function cargarNominaConfig() {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesAnterior = fechaLocal(hoy.getFullYear(), hoy.getMonth() - 1, 1);

  const { data: esteMes } = await sb.from('ingresos').select('*').gte('fecha', inicioMes).order('fecha', { ascending: false }).limit(1);
  const { data: mesAnterior } = await sb.from('ingresos').select('*').gte('fecha', inicioMesAnterior).lt('fecha', inicioMes).order('fecha', { ascending: false }).limit(1);

  const hint = document.getElementById('nomina-hint');
  if (esteMes && esteMes.length) {
    nominaEsteMesId = esteMes[0].id;
    document.getElementById('nomina-importe').value = esteMes[0].importe;
    hint.textContent = 'Ya la registraste este mes. Puedes corregirla.';
  } else {
    nominaEsteMesId = null;
    document.getElementById('nomina-importe').value = mesAnterior?.[0]?.importe || '';
    hint.textContent = mesAnterior?.length ? `Precargada con la del mes pasado (${euros(mesAnterior[0].importe)}). Ajústala y guarda.` : 'Todavía no has metido ninguna nómina.';
  }
}

document.getElementById('nomina-guardar').addEventListener('click', async () => {
  const importe = parseFloat(document.getElementById('nomina-importe').value);
  if (!importe) { alert('Pon un importe.'); return; }
  if (nominaEsteMesId) {
    await sb.from('ingresos').update({ importe }).eq('id', nominaEsteMesId);
  } else {
    const { data, error } = await sb.from('ingresos').insert({ fecha: hoyISO(), importe, descripcion: 'Nómina' }).select().single();
    if (!error) nominaEsteMesId = data.id;
  }
  cargarDashboard();
});

// ---------------- FIJOS ----------------
async function cargarFijosConfig() {
  const { data: fijos, error } = await sb.from('gastos_fijos').select('*').eq('activo', true);
  if (error) { console.error(error); return; }

  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const { data: gastosDelMes } = await sb.from('gastos').select('gasto_fijo_id').eq('origen', 'fijo').eq('estado', 'confirmado').gte('fecha', inicioMes);
  const pagadosIds = new Set((gastosDelMes || []).map((g) => g.gasto_fijo_id));

  const cont = document.getElementById('fijos-list');
  cont.innerHTML = fijos.map((f) => {
    const pagado = pagadosIds.has(f.id);
    const diaHoy = hoy.getDate();
    let badgeClass = 'badge-proximo', badgeText = `Próximo: día ${f.dia_cobro}`;
    if (pagado) { badgeClass = 'badge-pagado'; badgeText = 'Pagado'; }
    else if (diaHoy > f.dia_cobro) { badgeClass = 'badge-confirmar'; badgeText = 'Confirmar importe'; }

    return `
      <div class="m3-card">
        <div class="fijo-top" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-dia="${f.dia_cobro}" data-variable="${!f.importe_es_fijo}">
          <div>
            <div class="fijo-name">${f.nombre} <span style="font-size:10px; opacity:0.6;">✎</span></div>
            <div class="fijo-cat">${iconoCategoria(nombreCategoria(f.categoria_id))} ${nombreCategoria(f.categoria_id)} · día ${f.dia_cobro}</div>
          </div>
          <div class="fijo-amt">${f.importe_es_fijo ? euros(f.importe_estimado) : '~' + euros(f.importe_estimado)}${f.importe_es_fijo ? '' : '<span class="approx">estimado</span>'}</div>
        </div>
        <div class="fijo-bottom">
          <button class="fijo-badge ${badgeClass}" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" ${pagado ? 'disabled' : ''}>${badgeText}</button>
          <button class="cal-chip" data-nombre="${f.nombre}" data-dia="${f.dia_cobro}">📅 Calendario</button>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state">Todavía no tienes gastos fijos.</div>';

  cont.querySelectorAll('.fijo-top').forEach((el) => el.addEventListener('click', () => abrirModalFijo(el)));
  cont.querySelectorAll('.fijo-badge:not([disabled])').forEach((btn) => btn.addEventListener('click', () => marcarFijoPagado(btn)));
  cont.querySelectorAll('.cal-chip').forEach((btn) => btn.addEventListener('click', () => abrirCalendario(btn.dataset.nombre, parseInt(btn.dataset.dia))));

  poblarSelectCategorias(document.getElementById('new-fijo-categoria'));
}

async function marcarFijoPagado(btn) {
  const { data: ultimo } = await sb.from('gastos').select('importe').eq('gasto_fijo_id', btn.dataset.fijoId).order('fecha', { ascending: false }).limit(1);
  const sugerido = ultimo?.[0]?.importe ?? btn.dataset.importe;
  const importe = prompt(`Importe real de "${btn.dataset.nombre}":`, sugerido);
  if (importe === null) return;

  const { error } = await sb.from('gastos').insert({
    fecha: hoyISO(), importe: parseFloat(importe), categoria_id: btn.dataset.categoriaId,
    descripcion: btn.dataset.nombre, origen: 'fijo', estado: 'confirmado', gasto_fijo_id: btn.dataset.fijoId,
  });
  if (error) { alert('No se pudo registrar: ' + error.message); return; }
  cargarFijosConfig();
  cargarDashboard();
}

function abrirCalendario(nombre, dia) {
  const hoy = new Date();
  let mes = hoy.getMonth(), anio = hoy.getFullYear();
  if (hoy.getDate() > dia) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } }
  const fechaStr = fechaLocal(anio, mes, dia).replace(/-/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Pagar: ' + nombre)}&dates=${fechaStr}/${fechaStr}&recur=RRULE:FREQ=MONTHLY&details=${encodeURIComponent('Recordatorio de gasto fijo — Gastos app')}`;
  window.open(url, '_blank');
}

document.getElementById('add-fijo-btn').addEventListener('click', async () => {
  const nombre = document.getElementById('new-fijo-nombre').value.trim();
  const categoriaId = document.getElementById('new-fijo-categoria').value;
  const importe = parseFloat(document.getElementById('new-fijo-importe').value);
  const dia = parseInt(document.getElementById('new-fijo-dia').value);
  const esVariable = document.getElementById('new-fijo-variable').checked;
  if (!nombre || !importe || !dia || !categoriaId) { alert('Rellena todos los campos.'); return; }

  const { error } = await sb.from('gastos_fijos').insert({ nombre, importe_estimado: importe, dia_cobro: dia, categoria_id: categoriaId, importe_es_fijo: !esVariable });
  if (error) { alert('Error: ' + error.message); return; }

  document.getElementById('new-fijo-nombre').value = '';
  document.getElementById('new-fijo-importe').value = '';
  document.getElementById('new-fijo-dia').value = '';
  document.getElementById('new-fijo-variable').checked = false;
  cargarFijosConfig();
});

function abrirModalFijo(el) {
  const { fijoId, nombre, categoriaId, importe, dia, variable } = el.dataset;
  document.getElementById('fijo-nombre').value = nombre;
  document.getElementById('fijo-importe').value = importe;
  document.getElementById('fijo-dia').value = dia;
  document.getElementById('fijo-variable').checked = variable === 'true';
  poblarSelectCategorias(document.getElementById('fijo-categoria'), categoriaId);
  document.getElementById('modal-fijo').dataset.fijoId = fijoId;
  document.getElementById('modal-fijo').classList.add('open');
}
document.getElementById('fijo-cancelar').addEventListener('click', () => document.getElementById('modal-fijo').classList.remove('open'));
document.getElementById('modal-fijo').addEventListener('click', (e) => { if (e.target.id === 'modal-fijo') e.currentTarget.classList.remove('open'); });

document.getElementById('fijo-guardar').addEventListener('click', async () => {
  const fijoId = document.getElementById('modal-fijo').dataset.fijoId;
  const nombre = document.getElementById('fijo-nombre').value.trim();
  const categoriaId = document.getElementById('fijo-categoria').value;
  const importe = parseFloat(document.getElementById('fijo-importe').value);
  const dia = parseInt(document.getElementById('fijo-dia').value);
  const variable = document.getElementById('fijo-variable').checked;
  if (!nombre || !importe || !dia || !categoriaId) { alert('Rellena todos los campos.'); return; }

  await sb.from('gastos_fijos').update({ nombre, categoria_id: categoriaId, importe_estimado: importe, dia_cobro: dia, importe_es_fijo: !variable }).eq('id', fijoId);
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  await sb.from('gastos').update({ categoria_id: categoriaId, descripcion: nombre }).eq('gasto_fijo_id', fijoId).gte('fecha', inicioMes);

  document.getElementById('modal-fijo').classList.remove('open');
  cargarFijosConfig();
});

// ---------------- BOTTOM SHEET (＋) ----------------
document.getElementById('fab-add').addEventListener('click', () => document.getElementById('sheet-add').classList.add('open'));
document.getElementById('sheet-add').addEventListener('click', (e) => { if (e.target.id === 'sheet-add') e.currentTarget.classList.remove('open'); });
document.getElementById('sheet-camara').addEventListener('click', () => { document.getElementById('sheet-add').classList.remove('open'); document.getElementById('file-input').click(); });
document.getElementById('sheet-galeria').addEventListener('click', () => { document.getElementById('sheet-add').classList.remove('open'); document.getElementById('file-input-gallery').click(); });
document.getElementById('sheet-manual').addEventListener('click', () => { document.getElementById('sheet-add').classList.remove('open'); abrirModalManual(); });

document.getElementById('file-input').addEventListener('change', (e) => procesarFotoTicket(e));
document.getElementById('file-input-gallery').addEventListener('change', (e) => procesarFotoTicket(e));

async function procesarFotoTicket(e) {
  const file = e.target.files[0];
  if (!file) return;
  const spinner = document.getElementById('capture-spinner');
  spinner.classList.add('active');

  try {
    const { data: { session } } = await sb.auth.getSession();
    const nombreOriginal = file.name || `imagen.${(file.type || 'image/jpeg').split('/')[1] || 'jpg'}`;
    const nombreSeguro = nombreOriginal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${nombreSeguro}`;

    const { error: uploadError } = await sb.storage.from('tickets').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (uploadError) throw new Error(`Subiendo la imagen: ${uploadError.message}`);

    const res = await fetch(`${CONFIG.FUNCTIONS_URL}/leer-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ storagePath: path }),
    });
    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || 'Error leyendo el ticket');

    ticketActual = resultado;
    renderRevisarModal();
  } catch (err) {
    alert('No se pudo leer el ticket: ' + err.message);
  } finally {
    spinner.classList.remove('active');
    e.target.value = '';
  }
}

function renderRevisarModal() {
  if (!ticketActual) return;
  const { ticket, items } = ticketActual;
  const box = document.getElementById('modal-revisar-box');
  box.innerHTML = `
    <div class="modal-title">Revisar ticket</div>
    <div class="ticket-preview">
      <input class="comercio-edit" id="edit-comercio" value="${ticket.comercio}">
      <div class="meta-edit">${ticket.fecha}</div>
      <hr class="divider">
      <div id="items-list">
        ${items.map((item) => `
          <div class="item-edit" data-item-id="${item.id}">
            <div class="item-name-edit" contenteditable="true" data-field="nombre_articulo">${item.nombre_articulo}</div>
            <div class="item-row2">
              <select class="item-categoria" data-field="categoria_id"></select>
              <div class="item-price-edit" contenteditable="true" data-field="precio_total">${Number(item.precio_total).toFixed(2)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="total-row">
        <div class="total-label">Total</div>
        <div class="total-amount" id="modal-total-amount">${euros(ticket.importe_total)}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-tonal" id="btn-descartar">Descartar</button>
      <button class="btn-filled" id="btn-conformar">Conformar</button>
    </div>
  `;

  box.querySelectorAll('.item-edit').forEach((itemEl) => {
    const original = items.find((it) => it.id === itemEl.dataset.itemId);
    poblarSelectCategorias(itemEl.querySelector('.item-categoria'), original?.categoria_id);
  });

  box.querySelectorAll('[data-field="precio_total"]').forEach((el) => {
    el.addEventListener('input', () => {
      const precios = [...box.querySelectorAll('[data-field="precio_total"]')].map((e) => parseFloat(e.textContent.replace(',', '.')) || 0);
      document.getElementById('modal-total-amount').textContent = euros(precios.reduce((a, b) => a + b, 0));
    });
  });

  document.getElementById('btn-descartar').addEventListener('click', descartarTicket);
  document.getElementById('btn-conformar').addEventListener('click', conformarTicket);
  document.getElementById('modal-revisar').classList.add('open');
}

async function descartarTicket() {
  if (!ticketActual) return;
  if (!confirm('¿Descartar este ticket?')) return;
  const { error } = await sb.from('tickets').delete().eq('id', ticketActual.ticket.id);
  if (error) { alert('No se pudo descartar: ' + error.message); return; }
  ticketActual = null;
  document.getElementById('modal-revisar').classList.remove('open');
}

async function conformarTicket() {
  if (!ticketActual) return;
  const { ticket } = ticketActual;
  const box = document.getElementById('modal-revisar-box');

  const itemsEditados = [...box.querySelectorAll('#items-list .item-edit')].map((row) => ({
    id: row.dataset.itemId,
    nombre: row.querySelector('[data-field="nombre_articulo"]').textContent.trim(),
    precio: parseFloat(row.querySelector('[data-field="precio_total"]').textContent.replace(',', '.')) || 0,
    categoriaId: row.querySelector('[data-field="categoria_id"]').value,
  }));
  const comercio = document.getElementById('edit-comercio').value.trim();
  const totalFinal = itemsEditados.reduce((a, i) => a + i.precio, 0);

  if (itemsEditados.length === 0) {
    alert('Este ticket no tiene artículos que confirmar. Descártalo y vuelve a escanearlo.');
    return;
  }

  try {
    for (const item of itemsEditados) {
      const { error } = await sb.from('ticket_items').update({ nombre_articulo: item.nombre, precio_total: item.precio, categoria_id: item.categoriaId }).eq('id', item.id);
      if (error) throw new Error(`Actualizando "${item.nombre}": ${error.message}`);
    }
    const filasGasto = itemsEditados.map((item) => ({
      fecha: ticket.fecha, importe: item.precio, categoria_id: item.categoriaId,
      descripcion: `${comercio} — ${item.nombre}`, origen: 'ticket', estado: 'confirmado', ticket_id: ticket.id,
    }));
    const { error: gastosError } = await sb.from('gastos').insert(filasGasto);
    if (gastosError) throw new Error(`Creando los gastos: ${gastosError.message}`);

    const { error: ticketError } = await sb.from('tickets').update({ comercio, importe_total: totalFinal, estado: 'confirmado' }).eq('id', ticket.id);
    if (ticketError) throw new Error(`Marcando el ticket como confirmado: ${ticketError.message}`);

    ticketActual = null;
    document.getElementById('modal-revisar').classList.remove('open');
    cargarDashboard();
  } catch (err) {
    alert('No se pudo conformar el ticket:\n\n' + err.message + '\n\nSigue en pendiente. Vuelve a intentarlo.');
  }
}

async function borrarTicketCompleto(ticketId) {
  if (!confirm('¿Borrar este ticket entero? No se puede deshacer.')) return;
  const { error: errorGastos } = await sb.from('gastos').delete().eq('ticket_id', ticketId);
  if (errorGastos) { alert('No se pudo borrar: ' + errorGastos.message); return; }
  const { error: errorTicket } = await sb.from('tickets').delete().eq('id', ticketId);
  if (errorTicket) { alert('Se borraron los gastos pero no el ticket: ' + errorTicket.message); return; }
  cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
}

// ---------------- GASTO MANUAL / OCASIONAL ----------------
document.getElementById('manual-cancelar').addEventListener('click', () => document.getElementById('modal-manual').classList.remove('open'));

function abrirModalManual(existing) {
  modalManualEditId = existing?.id || null;
  document.getElementById('manual-modal-tipo').textContent = modalManualEditId ? '' : 'imprevisto';
  document.getElementById('manual-descripcion').value = existing?.descripcion || '';
  document.getElementById('manual-importe').value = existing?.importe || '';
  document.getElementById('manual-fecha').value = existing?.fecha || hoyISO();
  document.getElementById('manual-borrar').style.display = modalManualEditId ? 'block' : 'none';
  poblarSelectCategorias(document.getElementById('manual-categoria'), existing?.categoriaId);
  document.getElementById('modal-manual').classList.add('open');
}

document.getElementById('manual-guardar').addEventListener('click', async () => {
  const descripcion = document.getElementById('manual-descripcion').value.trim();
  const importe = parseFloat(document.getElementById('manual-importe').value);
  const fecha = document.getElementById('manual-fecha').value;
  const categoriaId = document.getElementById('manual-categoria').value;
  if (!descripcion || !importe || !fecha || !categoriaId) { alert('Rellena todos los campos.'); return; }

  let error;
  if (modalManualEditId) {
    ({ error } = await sb.from('gastos').update({ descripcion, importe, fecha, categoria_id: categoriaId }).eq('id', modalManualEditId));
  } else {
    ({ error } = await sb.from('gastos').insert({ fecha, importe, categoria_id: categoriaId, descripcion, origen: 'manual', estado: 'confirmado' }));
  }
  if (error) { alert('Error: ' + error.message); return; }

  document.getElementById('modal-manual').classList.remove('open');
  cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
});

document.getElementById('manual-borrar').addEventListener('click', async () => {
  if (!modalManualEditId) return;
  if (!confirm('¿Borrar este gasto?')) return;
  const { error } = await sb.from('gastos').delete().eq('id', modalManualEditId);
  if (error) { alert('No se pudo borrar: ' + error.message); return; }
  document.getElementById('modal-manual').classList.remove('open');
  cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
});

function editarGasto(row) {
  const { gastoId, categoriaId, importe, descripcion, fecha } = row.dataset;
  abrirModalManual({ id: gastoId, categoriaId, importe, descripcion, fecha });
}

// ---------------- RESUMEN (dashboard) ----------------
async function cargarDashboard() {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), ultimoDiaMes(hoy.getFullYear(), hoy.getMonth()));

  const { data, error } = await sb.from('gastos').select('*').gte('fecha', inicioMes).lte('fecha', finMes).eq('estado', 'confirmado').order('fecha', { ascending: false });
  if (error) { alert('No se pudo cargar el resumen: ' + error.message); return; }

  const { data: ingresos, error: errorIngresos } = await sb.from('ingresos').select('*').gte('fecha', inicioMes).lte('fecha', finMes);
  if (errorIngresos) { alert('No se pudieron cargar los ingresos: ' + errorIngresos.message); return; }
  const totalIngresos = (ingresos || []).reduce((a, i) => a + Number(i.importe), 0);

  const { data: ticketsMes } = await sb.from('tickets').select('id, comercio, fecha').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  const comercioPorTicket = {};
  (ticketsMes || []).forEach((t) => { comercioPorTicket[t.id] = t.comercio; });

  const total = data.reduce((a, g) => a + Number(g.importe), 0);
  const ahorro = totalIngresos - total;

  document.getElementById('r-ingresos').textContent = 'Ingresos: ' + euros(totalIngresos);
  document.getElementById('r-gastos').textContent = euros(total);
  document.getElementById('r-ahorro').textContent = euros(ahorro);
  document.getElementById('r-ahorro').style.color = ahorro >= 0 ? '#E8A05C' : 'var(--md-error)';

  const porCategoria = {};
  data.forEach((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    porCategoria[nombre] = (porCategoria[nombre] || 0) + Number(g.importe);
  });

  dibujarDonut(porCategoria);
  renderMovimientos(data, comercioPorTicket, 'movimientos-list', false);
  cargarFijosResumen(data);
}

async function cargarFijosResumen(gastosDelMes) {
  const { data: fijos, error } = await sb.from('gastos_fijos').select('*').eq('activo', true);
  if (error) { console.error(error); return; }

  const totalFijos = (gastosDelMes || []).filter((g) => g.origen === 'fijo').reduce((a, g) => a + Number(g.importe), 0);
  document.getElementById('fijos-resumen-total').textContent = euros(totalFijos);
  document.getElementById('fijos-resumen-icon').innerHTML = svgInline('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18"/><path d="M6.5 14.5h4"/>', 18);

  const pagadosIds = new Set((gastosDelMes || []).filter((g) => g.origen === 'fijo').map((g) => g.gasto_fijo_id));
  const hoy = new Date().getDate();

  const detalle = document.getElementById('fijos-resumen-detalle');
  detalle.innerHTML = (fijos || []).map((f) => {
    const pagado = pagadosIds.has(f.id);
    let badgeClass = 'badge-proximo', badgeText = `Día ${f.dia_cobro}`;
    if (pagado) { badgeClass = 'badge-pagado'; badgeText = 'Pagado'; }
    else if (hoy > f.dia_cobro) { badgeClass = 'badge-confirmar'; badgeText = 'Pendiente'; }
    return `
      <div class="ticket-item-row" style="align-items:center;">
        <span style="display:flex; align-items:center; gap:8px;">${iconoSVG(nombreCategoria(f.categoria_id), 15)} ${f.nombre}</span>
        <span style="display:flex; align-items:center; gap:8px;">
          <span class="fijo-badge ${badgeClass}" style="font-size:9.5px; padding:3px 8px;">${badgeText}</span>
          ${euros(f.importe_estimado)}
        </span>
      </div>
    `;
  }).join('') || '<div class="empty-state">Todavía no tienes gastos fijos. Añádelos en Ajustes.</div>';
}

document.getElementById('fijos-resumen-header').addEventListener('click', () => {
  const detalle = document.getElementById('fijos-resumen-detalle');
  const chevron = document.getElementById('fijos-resumen-chevron');
  const abierto = detalle.style.display !== 'none';
  detalle.style.display = abierto ? 'none' : 'block';
  chevron.style.transform = abierto ? '' : 'rotate(180deg)';
});

function dibujarDonut(porCategoria) {
  const labels = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);

  try {
    const canvas = document.getElementById('chart-categorias');
    if (chartCategorias) { chartCategorias.destroy(); chartCategorias = null; }
    if (labels.length) {
      chartCategorias = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: valores, backgroundColor: labels.map(colorCategoria), borderWidth: 0 }] },
        options: {
          cutout: '68%',
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${euros(ctx.raw)}` } } },
        },
      });
    }
  } catch (err) {
    console.error('Error dibujando la gráfica:', err);
  }

  requestAnimationFrame(() => posicionarIconosDonut(labels, valores));
}

function posicionarIconosDonut(labels, valores) {
  const wrap = document.getElementById('donut-hero');
  wrap.querySelectorAll('.cat-icon-label').forEach((el) => el.remove());
  const svg = document.getElementById('cat-lines');
  svg.innerHTML = '';

  const size = wrap.clientWidth;
  if (!size || !labels.length) { svg.setAttribute('viewBox', '0 0 1 1'); return; }
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  const cx = size / 2, cy = size / 2;
  const donutR = size * 0.335, lineR = size * 0.43, iconR = size * 0.465;
  const total = valores.reduce((a, b) => a + b, 0) || 1;
  let acumulado = 0;

  labels.forEach((nombre, i) => {
    const frac = valores[i] / total;
    const midFrac = acumulado + frac / 2;
    acumulado += frac;
    const angleRad = (-90 + midFrac * 360) * Math.PI / 180;
    const color = colorCategoria(nombre);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx + donutR * Math.cos(angleRad));
    line.setAttribute('y1', cy + donutR * Math.sin(angleRad));
    line.setAttribute('x2', cx + lineR * Math.cos(angleRad));
    line.setAttribute('y2', cy + lineR * Math.sin(angleRad));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.6');
    svg.appendChild(line);

    const label = document.createElement('div');
    label.className = 'cat-icon-label';
    label.style.left = (cx + iconR * Math.cos(angleRad)) + 'px';
    label.style.top = (cy + iconR * Math.sin(angleRad)) + 'px';
    label.innerHTML = `<div class="cat-icon-circ2" style="background:${color}40; color:${color};">${iconoSVG(nombre, 17)}</div>`;
    label.addEventListener('click', () => abrirDetalleCategoria(nombre));
    wrap.appendChild(label);
  });
}

// ---------------- POPUP: detalle de una categoría ----------------
async function abrirDetalleCategoria(nombreCat) {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), ultimoDiaMes(hoy.getFullYear(), hoy.getMonth()));
  const catId = categoriasCache.find((c) => c.nombre === nombreCat)?.id;

  const { data } = await sb.from('gastos').select('*').eq('categoria_id', catId).eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes).order('fecha', { ascending: false });
  const total = (data || []).reduce((a, g) => a + Number(g.importe), 0);

  document.getElementById('modal-cat-titulo').innerHTML = `${iconoSVG(nombreCat, 16)} ${nombreCat} — ${euros(total)}`;
  document.getElementById('modal-cat-contenido').innerHTML = (data || []).map((g) => `
    <div class="ticket-item-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
      <span>${g.descripcion}</span>
      <span>${euros(g.importe)}</span>
    </div>
  `).join('') || '<div class="empty-state">Sin gastos en esta categoría.</div>';

  document.getElementById('modal-cat-contenido').querySelectorAll('.ticket-item-row').forEach((row) => {
    row.addEventListener('click', () => { document.getElementById('modal-categoria-detalle').classList.remove('open'); editarGasto(row); });
  });
  document.getElementById('modal-categoria-detalle').classList.add('open');
}
document.getElementById('cerrar-modal-cat').addEventListener('click', () => document.getElementById('modal-categoria-detalle').classList.remove('open'));
document.getElementById('modal-categoria-detalle').addEventListener('click', (e) => { if (e.target.id === 'modal-categoria-detalle') e.currentTarget.classList.remove('open'); });

// ---------------- LISTA DE MOVIMIENTOS (compartida Resumen/Tickets) ----------------
function renderMovimientos(data, comercioPorTicket, containerId, incluirFijos) {
  const entradas = [];
  const gruposTicket = {};
  data.forEach((g) => {
    if (g.origen === 'ticket' && g.ticket_id) {
      if (!gruposTicket[g.ticket_id]) {
        gruposTicket[g.ticket_id] = { tipo: 'ticket', ticketId: g.ticket_id, fecha: g.fecha, comercio: comercioPorTicket[g.ticket_id] || 'Ticket', total: 0, items: [] };
        entradas.push(gruposTicket[g.ticket_id]);
      }
      gruposTicket[g.ticket_id].total += Number(g.importe);
      gruposTicket[g.ticket_id].items.push(g);
    } else if (g.origen === 'manual') {
      entradas.push({ tipo: 'manual', fecha: g.fecha, gasto: g });
    } else if (incluirFijos && g.origen === 'fijo') {
      entradas.push({ tipo: 'fijo', fecha: g.fecha, gasto: g });
    }
  });
  entradas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const cont = document.getElementById(containerId);
  cont.innerHTML = entradas.map((e) => {
    if (e.tipo === 'ticket') {
      return `
        <div class="ticket-card" data-ticket-id="${e.ticketId}">
          <div class="ticket-card-header">
            <div class="ticket-card-icon" style="background:${colorCategoria(e.items[0] ? nombreCategoria(e.items[0].categoria_id) : 'otros')}33; color:${colorCategoria(e.items[0] ? nombreCategoria(e.items[0].categoria_id) : 'otros')};">${svgInline(ICONO_RECIBO, 18)}</div>
            <div class="ticket-card-info">
              <div class="ticket-card-name">${e.comercio}</div>
              <div class="ticket-card-date">${new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
            </div>
            <div class="ticket-card-amt">${euros(e.total)}</div>
            <span class="ticket-chevron">▾</span>
            <button class="ticket-delete-btn" data-ticket-id="${e.ticketId}">${svgInline(ICONO_PAPELERA, 15)}</button>
          </div>
          <div class="ticket-card-detail">
            ${e.items.map((it) => `
              <div class="ticket-item-row" data-gasto-id="${it.id}" data-categoria-id="${it.categoria_id}" data-importe="${it.importe}" data-descripcion="${it.descripcion}" data-fecha="${it.fecha}">
                <span>${iconoCategoria(nombreCategoria(it.categoria_id))} ${it.descripcion.split(' — ').slice(1).join(' — ') || it.descripcion}</span>
                <span>${euros(it.importe)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    const g = e.gasto;
    return `
      <div class="ticket-card">
        <div class="ticket-card-header" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}" style="cursor:pointer;">
          <div class="ticket-card-icon" style="background:${colorCategoria(nombreCategoria(g.categoria_id))}33; color:${colorCategoria(nombreCategoria(g.categoria_id))};">${iconoCategoria(nombreCategoria(g.categoria_id))}</div>
          <div class="ticket-card-info">
            <div class="ticket-card-name">${g.descripcion} ${e.tipo === 'manual' ? '<span class="manual-tag">· manual</span>' : ''}</div>
            <div class="ticket-card-date">${new Date(g.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
          </div>
          <div class="ticket-card-amt">${euros(g.importe)}</div>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state">Sin movimientos este mes todavía.</div>';

  cont.querySelectorAll('.ticket-card-header').forEach((h) => {
    h.addEventListener('click', (evt) => {
      if (evt.target.classList.contains('ticket-delete-btn')) return;
      if (h.closest('.ticket-card').dataset.ticketId) { h.closest('.ticket-card').classList.toggle('open'); return; }
      editarGasto(h);
    });
  });
  cont.querySelectorAll('.ticket-delete-btn').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); borrarTicketCompleto(btn.dataset.ticketId); }));
  cont.querySelectorAll('.ticket-item-row').forEach((row) => row.addEventListener('click', (e) => { e.stopPropagation(); editarGasto(row); }));
}

// ---------------- TICKETS (pestaña) ----------------
const ETIQUETAS_TICKETS = ['Alimentación', 'Higiene personal', 'Limpieza', 'Otros'];

async function cargarTickets() {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), ultimoDiaMes(hoy.getFullYear(), hoy.getMonth()));

  const { data, error } = await sb.from('gastos').select('*').in('origen', ['ticket', 'manual']).eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  if (error) { alert('No se pudieron cargar los tickets: ' + error.message); return; }

  const { data: ticketsMes, error: errorTickets } = await sb.from('tickets').select('id, comercio, fecha').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  if (errorTickets) { alert('No se pudieron cargar los tickets: ' + errorTickets.message); return; }
  const comercioPorTicket = {};
  (ticketsMes || []).forEach((t) => { comercioPorTicket[t.id] = t.comercio; });

  const porEtiqueta = {};
  ETIQUETAS_TICKETS.forEach((e) => { porEtiqueta[e] = 0; });
  data.forEach((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    const etiqueta = ETIQUETAS_TICKETS.includes(nombre) ? nombre : 'Otros';
    porEtiqueta[etiqueta] += Number(g.importe);
  });

  const chips = document.getElementById('tickets-chips');
  chips.innerHTML = ETIQUETAS_TICKETS.map((e) => `
    <div class="m3-chip" data-etiqueta="${e}">${iconoCategoria(e)} ${e} <span class="chip-amt">${euros(porEtiqueta[e])}</span></div>
  `).join('');
  chips.querySelectorAll('.m3-chip').forEach((chip) => {
    chip.addEventListener('click', () => abrirDetalleEtiquetaGeneral(chip.dataset.etiqueta, data));
  });

  renderMovimientos(data, comercioPorTicket, 'tickets-detalle', false);
}

function abrirDetalleEtiquetaGeneral(etiqueta, data) {
  const items = data.filter((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    return etiqueta === 'Otros' ? !ETIQUETAS_TICKETS.slice(0, 3).includes(nombre) : nombre === etiqueta;
  });
  const total = items.reduce((a, g) => a + Number(g.importe), 0);
  document.getElementById('modal-cat-titulo').innerHTML = `${iconoSVG(etiqueta, 16)} ${etiqueta} — ${euros(total)}`;
  document.getElementById('modal-cat-contenido').innerHTML = items.map((g) => `
    <div class="ticket-item-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
      <span>${g.descripcion}</span><span>${euros(g.importe)}</span>
    </div>
  `).join('') || '<div class="empty-state">Nada en esta etiqueta todavía.</div>';
  document.getElementById('modal-cat-contenido').querySelectorAll('.ticket-item-row').forEach((row) => {
    row.addEventListener('click', () => { document.getElementById('modal-categoria-detalle').classList.remove('open'); editarGasto(row); });
  });
  document.getElementById('modal-categoria-detalle').classList.add('open');
}

// ---------------- ARRANQUE ----------------
init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });
}
