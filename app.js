// ============================================================
// GASTOS — app.js (v2: dashboard tipo Monefy + subcategorías)
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const PALETTE_COLORS = {
  'hogar': '#a75d35', 'alimentación': '#d9b34a', 'transporte y moto': '#8f7a3d',
  'préstamos': '#6f4c3e', 'salud': '#5c3a2e', 'ocio': '#c9a769',
  'compras': '#b98b56', 'otros': '#e5c9a9',
};
const PALETTE_ICONS = {
  'hogar': '🏠', 'alimentación': '🛒', 'transporte y moto': '🚗',
  'préstamos': '💳', 'salud': '❤️', 'ocio': '🎉',
  'compras': '🛍️', 'otros': '❓',
};
function colorPadre(nombre) { return PALETTE_COLORS[(nombre || '').toLowerCase()] || '#8a8175'; }
function iconoPadre(nombre) { return PALETTE_ICONS[(nombre || '').toLowerCase()] || '❓'; }
function euros(n) { return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function fechaLocal(y, m, d) {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

let categoriasCache = [];
let ticketActual = null;
let modalManualEditId = null;
let nominaEsteMesId = null;
let chartCategorias = null;

// ---------------- HELPERS DE CATEGORÍAS ----------------
function padres() { return categoriasCache.filter((c) => !c.padre_id); }
function hijasDe(padreId) { return categoriasCache.filter((c) => c.padre_id === padreId); }
function padreDeCategoria(catId) {
  const cat = categoriasCache.find((c) => c.id === catId);
  if (!cat) return 'Otros';
  if (!cat.padre_id) return cat.nombre;
  return categoriasCache.find((c) => c.id === cat.padre_id)?.nombre || 'Otros';
}
function nombreCompleto(catId) {
  const cat = categoriasCache.find((c) => c.id === catId);
  if (!cat) return '';
  if (!cat.padre_id) return cat.nombre;
  const p = categoriasCache.find((c) => c.id === cat.padre_id);
  return p ? `${p.nombre} · ${cat.nombre}` : cat.nombre;
}

function poblarCascada(selPadre, selHija, categoriaIdActual) {
  const listaPadres = padres().filter((p) => p.activa);
  selPadre.innerHTML = listaPadres.map((p) => `<option value="${p.id}">${iconoPadre(p.nombre)} ${p.nombre}</option>`).join('');

  let padreIdInicial = listaPadres[0]?.id;
  if (categoriaIdActual) {
    const catActual = categoriasCache.find((c) => c.id === categoriaIdActual);
    if (catActual) padreIdInicial = catActual.padre_id || catActual.id;
  }
  selPadre.value = padreIdInicial;

  function refrescarHijas() {
    const hijas = hijasDe(selPadre.value).filter((h) => h.activa);
    selHija.innerHTML = hijas.map((h) => `<option value="${h.id}">${h.nombre}</option>`).join('');
    if (categoriaIdActual && hijas.some((h) => h.id === categoriaIdActual)) selHija.value = categoriaIdActual;
  }
  selPadre.onchange = refrescarHijas;
  refrescarHijas();
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

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('version-tag').textContent = 'v' + CONFIG.APP_VERSION;
  document.getElementById('manual-fecha').value = (() => { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); })();
  await cargarCategorias();
  await cargarDashboard();
}

// ---------------- CATEGORÍAS ----------------
async function cargarCategorias() {
  const { data, error } = await sb.from('categorias').select('*').order('orden');
  if (error) { console.error(error); return; }
  categoriasCache = data;
}

// ---------------- MENÚ / CONFIGURACIÓN ----------------
document.getElementById('menu-btn').addEventListener('click', async () => {
  document.getElementById('config-overlay').classList.add('open');
  await cargarNominaConfig();
  await cargarFijosConfig();
  renderConfigCategorias();
});
document.getElementById('config-cerrar').addEventListener('click', () => {
  document.getElementById('config-overlay').classList.remove('open');
  cargarDashboard();
});

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
    const { data, error } = await sb.from('ingresos').insert({
      fecha: (() => { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); })(), importe, descripcion: 'Nómina',
    }).select().single();
    if (!error) nominaEsteMesId = data.id;
  }
  alert('Nómina guardada.');
  cargarDashboard();
});

// ---------------- FIJOS (en Configuración) ----------------
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
      <div class="fijo-card">
        <div class="fijo-top" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-dia="${f.dia_cobro}" data-variable="${!f.importe_es_fijo}">
          <div>
            <div class="fijo-name">${f.nombre} <span style="font-size:10px; color:var(--tinta-suave);">✎</span></div>
            <div class="fijo-cat"><span class="fijo-cat-dot" style="background:${colorPadre(padreDeCategoria(f.categoria_id))}"></span>${nombreCompleto(f.categoria_id)} · día ${f.dia_cobro}</div>
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

  poblarCascada(document.getElementById('new-fijo-categoria'), document.getElementById('new-fijo-subcategoria'));
}

async function marcarFijoPagado(btn) {
  const { data: ultimo } = await sb.from('gastos').select('importe').eq('gasto_fijo_id', btn.dataset.fijoId).order('fecha', { ascending: false }).limit(1);
  const sugerido = ultimo?.[0]?.importe ?? btn.dataset.importe;

  const importe = prompt(`Importe real de "${btn.dataset.nombre}":`, sugerido);
  if (importe === null) return;

  const { error } = await sb.from('gastos').insert({
    fecha: (() => { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); })(),
    importe: parseFloat(importe),
    categoria_id: btn.dataset.categoriaId,
    descripcion: btn.dataset.nombre,
    origen: 'fijo', estado: 'confirmado',
    gasto_fijo_id: btn.dataset.fijoId,
  });
  if (error) { alert('No se pudo registrar: ' + error.message); return; }
  cargarFijosConfig();
  cargarDashboard();
}

function abrirCalendario(nombre, dia) {
  const hoy = new Date();
  let mes = hoy.getMonth(), anio = hoy.getFullYear();
  if (hoy.getDate() > dia) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } }
  const fechaStr = new Date(anio, mes, dia).toISOString().split('T')[0].replace(/-/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Pagar: ' + nombre)}&dates=${fechaStr}/${fechaStr}&recur=RRULE:FREQ=MONTHLY&details=${encodeURIComponent('Recordatorio de gasto fijo — Gastos app')}`;
  window.open(url, '_blank');
}

document.getElementById('add-fijo-btn').addEventListener('click', async () => {
  const nombre = document.getElementById('new-fijo-nombre').value.trim();
  const categoriaId = document.getElementById('new-fijo-subcategoria').value;
  const importe = parseFloat(document.getElementById('new-fijo-importe').value);
  const dia = parseInt(document.getElementById('new-fijo-dia').value);
  const esVariable = document.getElementById('new-fijo-variable').checked;
  if (!nombre || !importe || !dia || !categoriaId) { alert('Rellena todos los campos.'); return; }

  const { error } = await sb.from('gastos_fijos').insert({
    nombre, importe_estimado: importe, dia_cobro: dia, categoria_id: categoriaId, importe_es_fijo: !esVariable,
  });
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
  poblarCascada(document.getElementById('fijo-categoria'), document.getElementById('fijo-subcategoria'), categoriaId);
  document.getElementById('modal-fijo').dataset.fijoId = fijoId;
  document.getElementById('modal-fijo').classList.add('open');
}
document.getElementById('fijo-cancelar').addEventListener('click', () => document.getElementById('modal-fijo').classList.remove('open'));
document.getElementById('modal-fijo').addEventListener('click', (e) => { if (e.target.id === 'modal-fijo') e.currentTarget.classList.remove('open'); });

document.getElementById('fijo-guardar').addEventListener('click', async () => {
  const fijoId = document.getElementById('modal-fijo').dataset.fijoId;
  const nombre = document.getElementById('fijo-nombre').value.trim();
  const categoriaId = document.getElementById('fijo-subcategoria').value;
  const importe = parseFloat(document.getElementById('fijo-importe').value);
  const dia = parseInt(document.getElementById('fijo-dia').value);
  const variable = document.getElementById('fijo-variable').checked;
  if (!nombre || !importe || !dia || !categoriaId) { alert('Rellena todos los campos.'); return; }

  await sb.from('gastos_fijos').update({
    nombre, categoria_id: categoriaId, importe_estimado: importe, dia_cobro: dia, importe_es_fijo: !variable,
  }).eq('id', fijoId);

  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  await sb.from('gastos').update({ categoria_id: categoriaId, descripcion: nombre }).eq('gasto_fijo_id', fijoId).gte('fecha', inicioMes);

  document.getElementById('modal-fijo').classList.remove('open');
  cargarFijosConfig();
});

// ---------------- CATEGORÍAS (en Configuración) ----------------
function renderConfigCategorias() {
  const cont = document.getElementById('config-cat-list');
  cont.innerHTML = padres().map((p) => {
    const hijas = hijasDe(p.id);
    return `
      <div class="cat-padre-row" data-id="${p.id}">
        <div class="cat-padre-left">
          <div class="cat-padre-icon" style="background:${colorPadre(p.nombre)}">${iconoPadre(p.nombre)}</div>
          <div class="cat-padre-name">${p.nombre}</div>
        </div>
        <span class="chevron">▾</span>
      </div>
      <div class="cat-hijas">
        ${hijas.map((h) => `
          <div class="cat-hija-row">
            <span>${h.nombre}</span>
            <button class="cat-toggle ${h.activa ? '' : 'off'}" data-id="${h.id}" data-activa="${h.activa}"></button>
          </div>
        `).join('')}
        <div class="add-subcat">
          <input type="text" placeholder="Nueva subcategoría…" class="new-subcat-input" data-padre-id="${p.id}">
          <button class="new-subcat-btn" data-padre-id="${p.id}">+</button>
        </div>
      </div>
    `;
  }).join('');

  cont.querySelectorAll('.cat-padre-row').forEach((row) => row.addEventListener('click', () => row.classList.toggle('open')));
  cont.querySelectorAll('.cat-toggle').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await sb.from('categorias').update({ activa: btn.dataset.activa !== 'true' }).eq('id', btn.dataset.id);
      await cargarCategorias();
      renderConfigCategorias();
    });
  });
  cont.querySelectorAll('.new-subcat-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const input = cont.querySelector(`.new-subcat-input[data-padre-id="${btn.dataset.padreId}"]`);
      const nombre = input.value.trim();
      if (!nombre) return;
      await sb.from('categorias').insert({ nombre, padre_id: btn.dataset.padreId, orden: 99 });
      input.value = '';
      await cargarCategorias();
      renderConfigCategorias();
    });
  });
}

// ---------------- CAPTURA (cámara / galería) ----------------
document.getElementById('btn-camara').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('btn-galeria').addEventListener('click', () => document.getElementById('file-input-gallery').click());
document.getElementById('file-input').addEventListener('change', (e) => procesarFotoTicket(e));
document.getElementById('file-input-gallery').addEventListener('change', (e) => procesarFotoTicket(e));

async function procesarFotoTicket(e) {
  const file = e.target.files[0];
  if (!file) return;
  const spinner = document.getElementById('capture-spinner');
  spinner.classList.add('active');

  try {
    const { data: { session } } = await sb.auth.getSession();
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await sb.storage.from('tickets').upload(path, file);
    if (uploadError) throw uploadError;

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
    <div class="ticket">
      <div class="comercio" contenteditable="true" id="edit-comercio">${ticket.comercio}</div>
      <div class="meta">${ticket.fecha}</div>
      <hr class="divider">
      <div id="items-list">
        ${items.map((item) => `
          <div class="item" data-item-id="${item.id}">
            <div class="item-name" contenteditable="true" data-field="nombre_articulo">${item.nombre_articulo}</div>
            <div class="item-row2">
              <select class="item-padre"></select>
              <select class="item-hija" data-field="categoria_id"></select>
              <div class="item-price" contenteditable="true" data-field="precio_total">${Number(item.precio_total).toFixed(2)}</div>
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
      <button class="btn-secundario" id="btn-descartar">Descartar</button>
      <button class="btn-primario" id="btn-conformar">Conformar</button>
    </div>
  `;

  box.querySelectorAll('.item').forEach((itemEl) => {
    const original = items.find((it) => it.id === itemEl.dataset.itemId);
    poblarCascada(itemEl.querySelector('.item-padre'), itemEl.querySelector('.item-hija'), original?.categoria_id);
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

  const itemsEditados = [...box.querySelectorAll('#items-list .item')].map((row) => ({
    id: row.dataset.itemId,
    nombre: row.querySelector('[data-field="nombre_articulo"]').textContent.trim(),
    precio: parseFloat(row.querySelector('[data-field="precio_total"]').textContent.replace(',', '.')) || 0,
    categoriaId: row.querySelector('[data-field="categoria_id"]').value,
  }));
  const comercio = document.getElementById('edit-comercio').textContent.trim();
  const totalFinal = itemsEditados.reduce((a, i) => a + i.precio, 0);

  try {
    for (const item of itemsEditados) {
      const { error } = await sb.from('ticket_items').update({
        nombre_articulo: item.nombre, precio_total: item.precio, categoria_id: item.categoriaId,
      }).eq('id', item.id);
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

// ---------------- GASTO MANUAL (＋/－) ----------------
document.getElementById('btn-manual').addEventListener('click', () => abrirModalManual());
document.getElementById('manual-cancelar').addEventListener('click', () => document.getElementById('modal-manual').classList.remove('open'));

function abrirModalManual(existing) {
  modalManualEditId = existing?.id || null;
  document.getElementById('manual-descripcion').value = existing?.descripcion || '';
  document.getElementById('manual-importe').value = existing?.importe || '';
  document.getElementById('manual-fecha').value = existing?.fecha || (() => { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); })();
  poblarCascada(document.getElementById('manual-categoria'), document.getElementById('manual-subcategoria'), existing?.categoriaId);
  document.getElementById('modal-manual').classList.add('open');
}

document.getElementById('manual-guardar').addEventListener('click', async () => {
  const descripcion = document.getElementById('manual-descripcion').value.trim();
  const importe = parseFloat(document.getElementById('manual-importe').value);
  const fecha = document.getElementById('manual-fecha').value;
  const categoriaId = document.getElementById('manual-subcategoria').value;
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
});

function editarGasto(row) {
  const { gastoId, categoriaId, importe, descripcion, fecha } = row.dataset;
  abrirModalManual({ id: gastoId, categoriaId, importe, descripcion, fecha });
}

// ---------------- DASHBOARD ----------------
async function cargarDashboard() {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = fechaLocal(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  const { data, error } = await sb.from('gastos').select('*')
    .gte('fecha', inicioMes).lte('fecha', finMes).eq('estado', 'confirmado').order('fecha', { ascending: false });
  if (error) { alert('No se pudo cargar el resumen: ' + error.message); return; }

  const { data: ingresos, error: errorIngresos } = await sb.from('ingresos').select('*').gte('fecha', inicioMes).lte('fecha', finMes);
  if (errorIngresos) { alert('No se pudieron cargar los ingresos: ' + errorIngresos.message); return; }
  const totalIngresos = (ingresos || []).reduce((a, i) => a + Number(i.importe), 0);

  const { data: ticketsMes } = await sb.from('tickets').select('id, comercio, fecha').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  const comercioPorTicket = {};
  (ticketsMes || []).forEach((t) => { comercioPorTicket[t.id] = t.comercio; });

  const total = data.reduce((a, g) => a + Number(g.importe), 0);

  const porPadre = {};
  data.forEach((g) => {
    const nombre = padreDeCategoria(g.categoria_id);
    porPadre[nombre] = (porPadre[nombre] || 0) + Number(g.importe);
  });

  dibujarDashboard(porPadre, total, totalIngresos);
  renderMovimientos(data, comercioPorTicket);
}

function dibujarDashboard(porPadre, totalGastos, totalIngresos) {
  const canvas = document.getElementById('chart-categorias');
  if (chartCategorias) chartCategorias.destroy();
  const labels = Object.keys(porPadre);
  const valores = Object.values(porPadre);

  if (labels.length) {
    chartCategorias = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: valores, backgroundColor: labels.map(colorPadre), borderColor: '#2B2622', borderWidth: 3 }] },
      options: { cutout: '68%', rotation: -90, plugins: { legend: { display: false } } },
    });
  }

  document.getElementById('center-ingresos').textContent = euros(totalIngresos);
  document.getElementById('center-gastos').textContent = euros(totalGastos);

  requestAnimationFrame(() => posicionarIconos(labels, valores));
}

function posicionarIconos(labels, valores) {
  const wrap = document.getElementById('chart-wrap-hero');
  wrap.querySelectorAll('.cat-label').forEach((el) => el.remove());
  const svg = document.getElementById('cat-lines');
  svg.innerHTML = '';

  const size = wrap.clientWidth;
  if (!size || !labels.length) return;
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  const cx = size / 2, cy = size / 2;
  const donutR = size * 0.31, lineR = size * 0.44, iconR = size * 0.47;
  const total = valores.reduce((a, b) => a + b, 0) || 1;
  let acumulado = 0;

  labels.forEach((nombre, i) => {
    const frac = valores[i] / total;
    const midFrac = acumulado + frac / 2;
    acumulado += frac;
    const angleRad = (-90 + midFrac * 360) * Math.PI / 180;
    const color = colorPadre(nombre);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx + donutR * Math.cos(angleRad));
    line.setAttribute('y1', cy + donutR * Math.sin(angleRad));
    line.setAttribute('x2', cx + lineR * Math.cos(angleRad));
    line.setAttribute('y2', cy + lineR * Math.sin(angleRad));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);

    const label = document.createElement('div');
    label.className = 'cat-label';
    label.style.left = (cx + iconR * Math.cos(angleRad)) + 'px';
    label.style.top = (cy + iconR * Math.sin(angleRad)) + 'px';
    label.innerHTML = `<div class="cat-label-icon" style="background:${color}">${iconoPadre(nombre)}</div><div class="cat-label-pct">${Math.round(frac * 100)}%</div>`;
    wrap.appendChild(label);
  });
}

function renderMovimientos(data, comercioPorTicket) {
  const movimientos = [];
  const gruposTicket = {};
  data.forEach((g) => {
    if (g.origen === 'ticket' && g.ticket_id) {
      if (!gruposTicket[g.ticket_id]) {
        gruposTicket[g.ticket_id] = { tipo: 'ticket', ticketId: g.ticket_id, fecha: g.fecha, comercio: comercioPorTicket[g.ticket_id] || 'Ticket', total: 0, items: [] };
        movimientos.push(gruposTicket[g.ticket_id]);
      }
      gruposTicket[g.ticket_id].total += Number(g.importe);
      gruposTicket[g.ticket_id].items.push(g);
    } else {
      movimientos.push({ tipo: 'simple', gasto: g });
    }
  });
  movimientos.sort((a, b) => (a.tipo === 'ticket' ? a.fecha : a.gasto.fecha) < (b.tipo === 'ticket' ? b.fecha : b.gasto.fecha) ? 1 : -1);

  const cont = document.getElementById('movimientos-list');
  cont.innerHTML = movimientos.map((m) => {
    if (m.tipo === 'ticket') {
      return `
        <div class="ticket-group" data-ticket-id="${m.ticketId}">
          <div class="ticket-group-header">
            <div class="ticket-group-info">
              <span class="chevron">▾</span>
              <div>
                <div class="ticket-group-name">${m.comercio}</div>
                <div class="ticket-group-date">${new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
              </div>
            </div>
            <div class="ticket-group-amt">${euros(m.total)}</div>
          </div>
          <div class="ticket-group-detail">
            ${m.items.map((it) => `
              <div class="ticket-item-row" data-gasto-id="${it.id}" data-categoria-id="${it.categoria_id}" data-importe="${it.importe}" data-descripcion="${it.descripcion}" data-fecha="${it.fecha}">
                <span><span class="cat-dot-inline" style="background:${colorPadre(padreDeCategoria(it.categoria_id))}"></span>${it.descripcion.split(' — ').slice(1).join(' — ') || it.descripcion}</span>
                <span>${euros(it.importe)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    const g = m.gasto;
    return `
      <div class="gasto-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
        <div class="gasto-left">
          <div class="gasto-dot" style="background:${colorPadre(padreDeCategoria(g.categoria_id))}"></div>
          <div>
            <div class="gasto-name">${g.descripcion}</div>
            <div class="gasto-date">${new Date(g.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
          </div>
        </div>
        <div class="gasto-amt">${euros(g.importe)}</div>
      </div>
    `;
  }).join('') || '<div class="empty-state">Sin movimientos este mes todavía.</div>';

  cont.querySelectorAll('.ticket-group-header').forEach((h) => h.addEventListener('click', () => h.closest('.ticket-group').classList.toggle('open')));
  cont.querySelectorAll('.ticket-item-row').forEach((row) => row.addEventListener('click', (e) => { e.stopPropagation(); editarGasto(row); }));
  cont.querySelectorAll('.gasto-row').forEach((row) => row.addEventListener('click', () => editarGasto(row)));
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
