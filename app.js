// ============================================================
// GASTOS — app.js (v3: 4 pestañas + subcategorías con tono + tema)
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
function iconoPadre(nombre) { return PALETTE_ICONS[(nombre || '').toLowerCase()] || '❓'; }
function colorPadre(nombre) { return PALETTE_COLORS[(nombre || '').toLowerCase()] || '#8a8175'; }
function euros(n) { return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function fechaLocal(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function ultimoDiaMes(y, m) { return new Date(y, m + 1, 0).getDate(); }
function hoyISO() { const d = new Date(); return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate()); }

function ajustarColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xFF, g = (num >> 8) & 0xFF, b = num & 0xFF;
  const adj = (c) => Math.min(255, Math.max(0, Math.round(c + 255 * percent / 100)));
  return '#' + [adj(r), adj(g), adj(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

let categoriasCache = [];
let ticketActual = null;
let modalManualEditId = null;
let nominaEsteMesId = null;
let chartCategorias = null;
let filtroTicketsActivo = null;

// ---------------- CATEGORÍAS Y COLORES ----------------
function padres() { return categoriasCache.filter((c) => !c.padre_id); }
function hijasDe(padreId) { return categoriasCache.filter((c) => c.padre_id === padreId).sort((a, b) => a.orden - b.orden); }
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
function colorDeCategoria(catId) {
  const cat = categoriasCache.find((c) => c.id === catId);
  if (!cat) return '#8a8175';
  if (!cat.padre_id) return colorPadre(cat.nombre);
  const padre = categoriasCache.find((c) => c.id === cat.padre_id);
  const base = colorPadre(padre?.nombre);
  const hermanas = hijasDe(cat.padre_id);
  const i = hermanas.findIndex((h) => h.id === cat.id);
  if (i <= 0) return base;
  const nivel = Math.ceil(i / 2) * 14;
  return ajustarColor(base, i % 2 === 1 ? nivel : -nivel);
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

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('version-tag').textContent = 'v' + CONFIG.APP_VERSION;
  document.getElementById('manual-fecha').value = hoyISO();

  if (localStorage.getItem('gastos-tema') === 'claro') {
    document.body.classList.add('tema-claro');
    document.getElementById('tema-toggle').classList.remove('off');
  }

  await cargarCategorias();
  await cargarDashboard();
}

// ---------------- TEMA ----------------
document.getElementById('tema-toggle').addEventListener('click', () => {
  const claro = document.body.classList.toggle('tema-claro');
  document.getElementById('tema-toggle').classList.toggle('off', !claro);
  localStorage.setItem('gastos-tema', claro ? 'claro' : 'oscuro');
  dibujarDashboardSiVisible();
});
function dibujarDashboardSiVisible() {
  if (document.getElementById('view-resumen').classList.contains('active')) cargarDashboard();
}

// ---------------- NAVEGACIÓN (4 pestañas) ----------------
document.querySelectorAll('.navitem').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.navitem').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');

    if (btn.dataset.view === 'resumen') cargarDashboard();
    if (btn.dataset.view === 'tickets') cargarTickets();
    if (btn.dataset.view === 'fijos') { cargarNominaConfig(); cargarFijosConfig(); }
    if (btn.dataset.view === 'opciones') renderConfigCategorias();
  });
});

// ---------------- CATEGORÍAS ----------------
async function cargarCategorias() {
  const { data, error } = await sb.from('categorias').select('*').order('orden');
  if (error) { alert('No se pudieron cargar las categorías: ' + error.message); return; }
  categoriasCache = data;
}

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
  alert('Nómina guardada.');
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
      <div class="fijo-card">
        <div class="fijo-top" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-dia="${f.dia_cobro}" data-variable="${!f.importe_es_fijo}">
          <div>
            <div class="fijo-name">${f.nombre} <span style="font-size:10px; color:var(--tinta-suave);">✎</span></div>
            <div class="fijo-cat"><span class="fijo-cat-dot" style="background:${colorDeCategoria(f.categoria_id)}"></span>${nombreCompleto(f.categoria_id)} · día ${f.dia_cobro}</div>
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
  const categoriaId = document.getElementById('new-fijo-subcategoria').value;
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

  await sb.from('gastos_fijos').update({ nombre, categoria_id: categoriaId, importe_estimado: importe, dia_cobro: dia, importe_es_fijo: !variable }).eq('id', fijoId);
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  await sb.from('gastos').update({ categoria_id: categoriaId, descripcion: nombre }).eq('gasto_fijo_id', fijoId).gte('fecha', inicioMes);

  document.getElementById('modal-fijo').classList.remove('open');
  cargarFijosConfig();
});

// ---------------- CATEGORÍAS (en Opciones) ----------------
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
            <div class="cat-hija-left"><span class="cat-hija-dot" style="background:${colorDeCategoria(h.id)}"></span>${h.nombre}</div>
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

// ---------------- CAPTURA (cámara / galería, siempre visible) ----------------
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

// ---------------- GASTO MANUAL (－) ----------------
document.getElementById('btn-manual').addEventListener('click', () => abrirModalManual());
document.getElementById('manual-cancelar').addEventListener('click', () => document.getElementById('modal-manual').classList.remove('open'));

function abrirModalManual(existing) {
  modalManualEditId = existing?.id || null;
  document.getElementById('manual-descripcion').value = existing?.descripcion || '';
  document.getElementById('manual-importe').value = existing?.importe || '';
  document.getElementById('manual-fecha').value = existing?.fecha || hoyISO();
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
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
});

function editarGasto(row) {
  const { gastoId, categoriaId, importe, descripcion, fecha } = row.dataset;
  abrirModalManual({ id: gastoId, categoriaId, importe, descripcion, fecha });
}

async function borrarTicketCompleto(ticketId) {
  if (!confirm('¿Borrar este ticket entero? Se eliminarán todos sus artículos y no contarán como gasto. No se puede deshacer.')) return;

  const { error: errorGastos } = await sb.from('gastos').delete().eq('ticket_id', ticketId);
  if (errorGastos) { alert('No se pudo borrar: ' + errorGastos.message); return; }

  const { error: errorTicket } = await sb.from('tickets').delete().eq('id', ticketId);
  if (errorTicket) { alert('Se borraron los gastos pero no el ticket: ' + errorTicket.message); return; }

  cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
}

// ---------------- RESUMEN (dashboard con círculo) ----------------
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

  // Por subcategoría (id real), para que el donut tenga un tono por cada una
  const porSubcategoria = {};
  data.forEach((g) => { porSubcategoria[g.categoria_id] = (porSubcategoria[g.categoria_id] || 0) + Number(g.importe); });

  // Ordenar: agrupadas por categoría padre (mismo orden que en Opciones), y dentro por orden de subcategoría
  const ordenPadres = padres().map((p) => p.id);
  const entradas = Object.entries(porSubcategoria).sort((a, b) => {
    const catA = categoriasCache.find((c) => c.id === a[0]);
    const catB = categoriasCache.find((c) => c.id === b[0]);
    const padreA = catA?.padre_id || catA?.id;
    const padreB = catB?.padre_id || catB?.id;
    const diff = ordenPadres.indexOf(padreA) - ordenPadres.indexOf(padreB);
    if (diff !== 0) return diff;
    return (catA?.orden || 0) - (catB?.orden || 0);
  });

  const sliceIds = entradas.map((e) => e[0]);
  const sliceValores = entradas.map((e) => e[1]);

  window._gastosDelMes = data; // para el popup de categoría
  dibujarDashboard(sliceIds, sliceValores, total, totalIngresos);
  renderMovimientos(data, comercioPorTicket);
}

function dibujarDashboard(sliceIds, sliceValores, totalGastos, totalIngresos) {
  document.getElementById('center-ingresos').textContent = euros(totalIngresos);
  document.getElementById('center-gastos').textContent = euros(totalGastos);

  try {
    const canvas = document.getElementById('chart-categorias');
    if (chartCategorias) { chartCategorias.destroy(); chartCategorias = null; }
    const bordeChart = document.body.classList.contains('tema-claro') ? '#F3EEE3' : '#2B2622';
    if (sliceIds.length) {
      chartCategorias = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: sliceIds.map((id) => nombreCompleto(id)),
          datasets: [{ data: sliceValores, backgroundColor: sliceIds.map((id) => colorDeCategoria(id)), borderColor: bordeChart, borderWidth: 2 }],
        },
        options: {
          cutout: '68%', rotation: -90,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${euros(ctx.raw)}` } },
          },
        },
      });
    }
    requestAnimationFrame(() => posicionarIconos(sliceIds, sliceValores));
  } catch (err) {
    alert('La gráfica falló, pero los totales de arriba son correctos. Detalle técnico: ' + err.message);
  }
}

function posicionarIconos(sliceIds, sliceValores) {
  try {
    const wrap = document.getElementById('chart-wrap-hero');
    wrap.querySelectorAll('.cat-label').forEach((el) => el.remove());
    const svg = document.getElementById('cat-lines');
    svg.innerHTML = '';

    const size = wrap.clientWidth;
    if (!size || !sliceIds.length) return;
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    const cx = size / 2, cy = size / 2;
    const donutR = size * 0.31, lineR = size * 0.44, iconR = size * 0.47;
    const total = sliceValores.reduce((a, b) => a + b, 0) || 1;

    // Agrupar las porciones contiguas que pertenecen a la misma categoría padre,
    // para poner UN solo icono por padre (aunque tenga varias subcategorías)
    const grupos = [];
    let acumulado = 0, i = 0;
    while (i < sliceIds.length) {
      const nombrePadre = padreDeCategoria(sliceIds[i]);
      const inicio = acumulado;
      let suma = 0;
      while (i < sliceIds.length && padreDeCategoria(sliceIds[i]) === nombrePadre) {
        suma += sliceValores[i];
        acumulado += sliceValores[i] / total;
        i++;
      }
      grupos.push({ nombre: nombrePadre, valor: suma, mid: (inicio + acumulado) / 2 });
    }

    grupos.forEach((grupo) => {
      const angleRad = (-90 + grupo.mid * 360) * Math.PI / 180;
      const color = colorPadre(grupo.nombre);

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
      label.innerHTML = `<div class="cat-label-icon" style="background:${color}">${iconoPadre(grupo.nombre)}</div><div class="cat-label-pct">${Math.round((grupo.valor / total) * 100)}%</div>`;
      label.addEventListener('click', () => abrirDetalleCategoria(grupo.nombre));
      wrap.appendChild(label);
    });
  } catch (err) {
    console.error('Error posicionando iconos:', err);
  }
}

// ---------------- POPUP: detalle de una categoría del círculo ----------------
function abrirDetalleCategoria(nombrePadre) {
  const gastos = (window._gastosDelMes || []).filter((g) => padreDeCategoria(g.categoria_id) === nombrePadre);
  const total = gastos.reduce((a, g) => a + Number(g.importe), 0);

  const porSub = {};
  gastos.forEach((g) => {
    const nombreSub = nombreCompleto(g.categoria_id).split(' · ')[1] || nombreCompleto(g.categoria_id);
    if (!porSub[nombreSub]) porSub[nombreSub] = [];
    porSub[nombreSub].push(g);
  });

  document.getElementById('modal-cat-titulo').textContent = `${iconoPadre(nombrePadre)} ${nombrePadre} — ${euros(total)}`;
  document.getElementById('modal-cat-contenido').innerHTML = Object.entries(porSub).map(([sub, items]) => `
    <div style="margin-bottom:14px;">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--tinta-suave); margin-bottom:6px;">${sub} · ${euros(items.reduce((a, g) => a + Number(g.importe), 0))}</div>
      ${items.map((g) => `
        <div class="ticket-item-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
          <span>${g.descripcion}</span>
          <span>${euros(g.importe)}</span>
        </div>
      `).join('')}
    </div>
  `).join('') || '<div class="empty-state">Sin gastos en esta categoría.</div>';

  document.getElementById('modal-cat-contenido').querySelectorAll('.ticket-item-row').forEach((row) => {
    row.addEventListener('click', () => { document.getElementById('modal-categoria-detalle').classList.remove('open'); editarGasto(row); });
  });
  document.getElementById('modal-categoria-detalle').classList.add('open');
}
document.getElementById('cerrar-modal-cat').addEventListener('click', () => document.getElementById('modal-categoria-detalle').classList.remove('open'));
document.getElementById('modal-categoria-detalle').addEventListener('click', (e) => { if (e.target.id === 'modal-categoria-detalle') e.currentTarget.classList.remove('open'); });

// ---------------- MOVIMIENTOS (lista bajo el círculo) ----------------
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
            <button class="ticket-delete-btn" data-ticket-id="${m.ticketId}" title="Borrar ticket completo">🗑</button>
          </div>
          <div class="ticket-group-detail">
            ${m.items.map((it) => `
              <div class="ticket-item-row" data-gasto-id="${it.id}" data-categoria-id="${it.categoria_id}" data-importe="${it.importe}" data-descripcion="${it.descripcion}" data-fecha="${it.fecha}">
                <span><span class="cat-dot-inline" style="background:${colorDeCategoria(it.categoria_id)}"></span>${it.descripcion.split(' — ').slice(1).join(' — ') || it.descripcion}</span>
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
          <div class="gasto-dot" style="background:${colorDeCategoria(g.categoria_id)}"></div>
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
  cont.querySelectorAll('.ticket-delete-btn').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); borrarTicketCompleto(btn.dataset.ticketId); }));
  cont.querySelectorAll('.ticket-item-row').forEach((row) => row.addEventListener('click', (e) => { e.stopPropagation(); editarGasto(row); }));
  cont.querySelectorAll('.gasto-row').forEach((row) => row.addEventListener('click', () => editarGasto(row)));
}

// ---------------- TICKETS (compras: súper + online) ----------------
const ETIQUETAS_TICKETS = ['Alimentación', 'Higiene personal', 'Limpieza', 'Otros'];

async function cargarTickets() {
  const hoy = new Date();
  const inicioMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = fechaLocal(hoy.getFullYear(), hoy.getMonth(), ultimoDiaMes(hoy.getFullYear(), hoy.getMonth()));

  const { data, error } = await sb.from('gastos').select('*').eq('origen', 'ticket').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  if (error) { alert('No se pudieron cargar los tickets: ' + error.message); return; }

  window._gastosTicketsMes = data;

  function etiquetaDe(g) {
    const nombreSub = nombreCompleto(g.categoria_id).split(' · ')[1] || '';
    if (nombreSub === 'Alimentos') return 'Alimentación';
    if (nombreSub === 'Higiene personal') return 'Higiene personal';
    if (nombreSub === 'Limpieza') return 'Limpieza';
    return 'Otros';
  }

  const porEtiqueta = {};
  ETIQUETAS_TICKETS.forEach((e) => { porEtiqueta[e] = { items: [], total: 0 }; });
  data.forEach((g) => {
    const e = etiquetaDe(g);
    porEtiqueta[e].items.push(g);
    porEtiqueta[e].total += Number(g.importe);
  });
  window._porEtiquetaTickets = porEtiqueta;

  const chips = document.getElementById('tickets-chips');
  chips.innerHTML = ETIQUETAS_TICKETS.map((e) => `
    <div class="filtro-chip ${filtroTicketsActivo === e ? 'active' : ''}" style="${filtroTicketsActivo === e ? `background:${colorPadre(e === 'Otros' ? 'otros' : 'hogar')}` : ''}" data-etiqueta="${e}">
      ${e} <span class="chip-amt">${euros(porEtiqueta[e].total)}</span>
    </div>
  `).join('');

  chips.querySelectorAll('.filtro-chip').forEach((chip) => {
    chip.addEventListener('click', () => { filtroTicketsActivo = chip.dataset.etiqueta; cargarTickets(); });
  });

  const detalle = document.getElementById('tickets-detalle');
  if (!filtroTicketsActivo) {
    detalle.innerHTML = '<div class="empty-state">Elige una etiqueta arriba para ver los productos de este mes.</div>';
    return;
  }
  const grupo = porEtiqueta[filtroTicketsActivo];
  detalle.innerHTML = `
    <div class="recent-label" style="margin-top:16px;">${filtroTicketsActivo} · ${euros(grupo.total)}</div>
    ${grupo.items.map((g) => `
      <div class="gasto-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
        <div class="gasto-left">
          <div class="gasto-dot" style="background:${colorDeCategoria(g.categoria_id)}"></div>
          <div>
            <div class="gasto-name">${g.descripcion}</div>
            <div class="gasto-date">${new Date(g.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
          </div>
        </div>
        <div class="gasto-amt">${euros(g.importe)}</div>
      </div>
    `).join('') || '<div class="empty-state">Nada en esta etiqueta todavía.</div>'}
  `;
  detalle.querySelectorAll('.gasto-row').forEach((row) => row.addEventListener('click', () => editarGasto(row)));
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
