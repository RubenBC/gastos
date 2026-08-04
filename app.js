// ============================================================
// GASTOS — app.js
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const CAT_COLORS = {
  'alimentación': '#4C6B4F', 'transporte': '#3E5C76', 'ocio': '#C07A2C',
  'salud': '#A13D3D', 'hogar': '#7A5C3E', 'ropa': '#5C4A66',
  'suministros': '#2E6E6A', 'otros': '#6B675F',
};
function colorCategoria(nombre) {
  return CAT_COLORS[(nombre || '').toLowerCase()] || '#6B675F';
}
function euros(n) {
  return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

let categoriasCache = [];
let ticketActual = null; // { ticket, items } pendiente de revisar

// ---------------- AUTH ----------------
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user?.email === CONFIG.ADMIN_EMAIL) {
    mostrarApp();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
  }
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

document.getElementById('logout-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  await sb.auth.signOut();
  location.reload();
});

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  await cargarCategorias();
  await cargarRecientes();
  poblarSelectCategoriaFijo();
}

// ---------------- NAVEGACIÓN ----------------
document.querySelectorAll('.navitem').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.navitem').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const view = btn.dataset.view;
    document.getElementById('view-' + view).classList.add('active');
    if (view === 'gastos') cargarGastos();
    if (view === 'fijos') cargarFijos();
    if (view === 'categorias') cargarCategorias();
  });
});

function irAVista(view) {
  document.querySelector(`.navitem[data-view="${view}"]`).click();
}

// ---------------- CATEGORÍAS ----------------
async function cargarCategorias() {
  const { data, error } = await sb.from('categorias').select('*').order('orden');
  if (error) return console.error(error);
  categoriasCache = data;
  renderCategorias();
  poblarSelectCategoriaFijo();
}

function renderCategorias() {
  const cont = document.getElementById('cat-list');
  cont.innerHTML = categoriasCache.map((c) => `
    <div class="cat-row">
      <div class="cat-left">
        <div class="cat-swatch" style="background:${colorCategoria(c.nombre)}"></div>
        <div class="cat-name">${c.nombre}</div>
      </div>
      <button class="cat-toggle ${c.activa ? '' : 'off'}" data-id="${c.id}" data-activa="${c.activa}"></button>
    </div>
  `).join('');

  cont.querySelectorAll('.cat-toggle').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nuevaActiva = btn.dataset.activa !== 'true';
      await sb.from('categorias').update({ activa: nuevaActiva }).eq('id', btn.dataset.id);
      cargarCategorias();
    });
  });
}

document.getElementById('add-cat-btn').addEventListener('click', async () => {
  const input = document.getElementById('nueva-cat');
  const nombre = input.value.trim();
  if (!nombre) return;
  const orden = categoriasCache.length + 1;
  await sb.from('categorias').insert({ nombre, orden });
  input.value = '';
  cargarCategorias();
});

function poblarSelectCategoriaFijo() {
  const sel = document.getElementById('fijo-categoria');
  if (!sel) return;
  sel.innerHTML = categoriasCache.filter((c) => c.activa)
    .map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

// ---------------- CAPTURAR ----------------
document.getElementById('capture-frame').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', async (e) => {
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ storagePath: path }),
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || 'Error leyendo el ticket');

    ticketActual = resultado;
    renderRevisar();
    irAVista('revisar');
    cargarRecientes();
  } catch (err) {
    alert('No se pudo leer el ticket: ' + err.message);
  } finally {
    spinner.classList.remove('active');
    e.target.value = '';
  }
});

async function cargarRecientes() {
  const { data } = await sb.from('tickets').select('*').order('creado_en', { ascending: false }).limit(5);
  const cont = document.getElementById('recent-list');
  if (!data || !data.length) {
    cont.innerHTML = '';
    return;
  }
  cont.innerHTML = data.map((t) => `
    <div class="recent-row">
      <div class="recent-name">${t.comercio}</div>
      <div class="recent-status ${t.estado === 'confirmado' ? 'status-ok' : 'status-pend'}">
        ${t.estado === 'confirmado' ? 'Conforme' : 'Pendiente'}
      </div>
    </div>
  `).join('');
}

// ---------------- REVISAR ----------------
function renderRevisar() {
  const cont = document.getElementById('revisar-content');
  if (!ticketActual) {
    cont.innerHTML = `<div class="empty-state">No hay ningún ticket pendiente de revisar.<br>Ve a Capturar para escanear uno.</div>`;
    return;
  }

  const { ticket, items } = ticketActual;

  cont.innerHTML = `
    <div class="ticket-wrap">
      <div class="pin"></div>
      <div class="ticket">
        <div class="stamp">Revisar</div>
        <div class="comercio" contenteditable="true" id="edit-comercio">${ticket.comercio}</div>
        <div class="meta">${ticket.fecha}</div>
        <hr class="divider">
        <div id="items-list">
          ${items.map((item) => `
            <div class="item" data-item-id="${item.id}">
              <div class="item-left">
                <div class="item-name" contenteditable="true" data-field="nombre_articulo">${item.nombre_articulo}</div>
                <div class="item-cat">
                  <select data-field="categoria_id" style="background:${colorCategoria(nombreCategoria(item.categoria_id))}">
                    ${categoriasCache.map((c) => `<option value="${c.id}" ${c.id === item.categoria_id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                  </select>
                </div>
                <div class="item-qty">${item.cantidad} ud</div>
              </div>
              <div class="item-price" contenteditable="true" data-field="precio_total">${Number(item.precio_total).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        <div class="total-row">
          <div class="total-label">Total</div>
          <div class="total-amount" id="total-amount">${euros(ticket.importe_total)}</div>
        </div>
        <div class="actions">
          <button class="btn-editar" id="btn-descartar">Descartar</button>
          <button class="btn-conformar" id="btn-conformar">Conformar</button>
        </div>
      </div>
    </div>
  `;

  // recalcular total al editar precios
  cont.querySelectorAll('[data-field="precio_total"]').forEach((el) => {
    el.addEventListener('input', recalcularTotal);
  });

  // recolorear el select al cambiar categoría
  cont.querySelectorAll('select[data-field="categoria_id"]').forEach((sel) => {
    sel.addEventListener('change', () => {
      sel.style.background = colorCategoria(nombreCategoria(sel.value));
    });
  });

  document.getElementById('btn-descartar').addEventListener('click', descartarTicket);
  document.getElementById('btn-conformar').addEventListener('click', conformarTicket);
}

function nombreCategoria(id) {
  const c = categoriasCache.find((c) => c.id === id);
  return c ? c.nombre : 'Otros';
}

function recalcularTotal() {
  const precios = [...document.querySelectorAll('[data-field="precio_total"]')]
    .map((el) => parseFloat(el.textContent.replace(',', '.')) || 0);
  const total = precios.reduce((a, b) => a + b, 0);
  document.getElementById('total-amount').textContent = euros(total);
}

async function descartarTicket() {
  if (!ticketActual) return;
  if (!confirm('¿Descartar este ticket? Se borrará y no se contará como gasto.')) return;
  await sb.from('tickets').delete().eq('id', ticketActual.ticket.id);
  ticketActual = null;
  renderRevisar();
  cargarRecientes();
}

async function conformarTicket() {
  if (!ticketActual) return;
  const { ticket, items } = ticketActual;

  const itemsEditados = [...document.querySelectorAll('#items-list .item')].map((row) => {
    const id = row.dataset.itemId;
    const nombre = row.querySelector('[data-field="nombre_articulo"]').textContent.trim();
    const precio = parseFloat(row.querySelector('[data-field="precio_total"]').textContent.replace(',', '.')) || 0;
    const categoriaId = row.querySelector('[data-field="categoria_id"]').value;
    return { id, nombre, precio, categoriaId };
  });

  const comercio = document.getElementById('edit-comercio').textContent.trim();
  const totalFinal = itemsEditados.reduce((a, i) => a + i.precio, 0);

  try {
    // Actualizar líneas del ticket con lo editado
    for (const item of itemsEditados) {
      await sb.from('ticket_items').update({
        nombre_articulo: item.nombre,
        precio_total: item.precio,
        categoria_id: item.categoriaId,
      }).eq('id', item.id);
    }

    // Crear un gasto por cada línea (para que las estadísticas por categoría sean precisas)
    const filasGasto = itemsEditados.map((item) => ({
      fecha: ticket.fecha,
      importe: item.precio,
      categoria_id: item.categoriaId,
      descripcion: `${comercio} — ${item.nombre}`,
      origen: 'ticket',
      estado: 'confirmado',
      ticket_id: ticket.id,
    }));
    await sb.from('gastos').insert(filasGasto);

    // Marcar el ticket como confirmado
    await sb.from('tickets').update({
      comercio, importe_total: totalFinal, estado: 'confirmado',
    }).eq('id', ticket.id);

    ticketActual = null;
    renderRevisar();
    cargarRecientes();
    irAVista('gastos');
  } catch (err) {
    alert('Error al conformar: ' + err.message);
  }
}

// ---------------- GASTOS (resumen mensual) ----------------
async function cargarGastos() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await sb.from('gastos')
    .select('*, categorias(nombre)')
    .gte('fecha', inicioMes).lte('fecha', finMes)
    .eq('estado', 'confirmado')
    .order('fecha', { ascending: false });

  if (error) { console.error(error); return; }

  const total = data.reduce((a, g) => a + Number(g.importe), 0);
  const fijo = data.filter((g) => g.origen === 'fijo').reduce((a, g) => a + Number(g.importe), 0);
  const variable = total - fijo;

  const porCategoria = {};
  data.forEach((g) => {
    const nombre = g.categorias?.nombre || 'Otros';
    porCategoria[nombre] = (porCategoria[nombre] || 0) + Number(g.importe);
  });
  const maxCat = Math.max(1, ...Object.values(porCategoria));

  const nombreMes = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const cont = document.getElementById('gastos-content');
  cont.innerHTML = `
    <div class="month-title">${nombreMes}</div>
    <div class="summary-card">
      <div class="summary-total-label">Total del mes</div>
      <div class="summary-total-amt">${euros(total)}</div>
      <div class="split-row">
        <div class="split-box"><div class="split-label">📌 Fijo</div><div class="split-amt">${euros(fijo)}</div></div>
        <div class="split-box variable"><div class="split-label">🧾 Variable</div><div class="split-amt">${euros(variable)}</div></div>
      </div>
      ${Object.entries(porCategoria).map(([nombre, importe]) => `
        <div class="bar-row">
          <div class="bar-label">${nombre}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(importe / maxCat) * 100}%; background:${colorCategoria(nombre)}"></div></div>
          <div class="bar-amt">${euros(importe)}</div>
        </div>
      `).join('')}
    </div>
    <div class="recent-label" style="margin-top:0;">Movimientos</div>
    ${data.map((g) => `
      <div class="gasto-row">
        <div class="gasto-left">
          <div class="gasto-dot" style="background:${colorCategoria(g.categorias?.nombre)}"></div>
          <div class="gasto-info">
            <div class="gasto-name">${g.descripcion}</div>
            <div class="gasto-date">${new Date(g.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
          </div>
        </div>
        <div class="gasto-amt">${euros(g.importe)}</div>
      </div>
    `).join('') || '<div class="empty-state">Sin movimientos este mes todavía.</div>'}
  `;
}

// ---------------- FIJOS ----------------
async function cargarFijos() {
  const { data: fijos, error } = await sb.from('gastos_fijos').select('*, categorias(nombre)').eq('activo', true);
  if (error) { console.error(error); return; }

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const { data: gastosDelMes } = await sb.from('gastos')
    .select('gasto_fijo_id').eq('origen', 'fijo').eq('estado', 'confirmado').gte('fecha', inicioMes);
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
        <div class="fijo-top">
          <div>
            <div class="fijo-name">${f.nombre}</div>
            <div class="fijo-cat"><span class="fijo-cat-dot" style="background:${colorCategoria(f.categorias?.nombre)}"></span>${f.categorias?.nombre || ''} · día ${f.dia_cobro}</div>
          </div>
          <div class="fijo-amt">${f.importe_es_fijo ? euros(f.importe_estimado) : '~' + euros(f.importe_estimado)}${f.importe_es_fijo ? '' : '<span class="approx">estimado</span>'}</div>
        </div>
        <div class="fijo-bottom">
          <button class="fijo-badge ${badgeClass}" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" ${pagado ? 'disabled' : ''}>${badgeText}</button>
          <button class="cal-chip" data-nombre="${f.nombre}" data-dia="${f.dia_cobro}">📅 Calendario</button>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state">Todavía no tienes gastos fijos. Añade uno abajo.</div>';

  cont.querySelectorAll('.fijo-badge:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => marcarFijoPagado(btn));
  });
  cont.querySelectorAll('.cal-chip').forEach((btn) => {
    btn.addEventListener('click', () => abrirCalendario(btn.dataset.nombre, parseInt(btn.dataset.dia)));
  });
}

async function marcarFijoPagado(btn) {
  const importeSugerido = btn.dataset.importe;
  const importe = prompt(`Importe real de "${btn.dataset.nombre}":`, importeSugerido);
  if (importe === null) return;

  await sb.from('gastos').insert({
    fecha: new Date().toISOString().split('T')[0],
    importe: parseFloat(importe),
    categoria_id: btn.dataset.categoriaId,
    descripcion: btn.dataset.nombre,
    origen: 'fijo',
    estado: 'confirmado',
    gasto_fijo_id: btn.dataset.fijoId,
  });
  cargarFijos();
}

function abrirCalendario(nombre, dia) {
  const hoy = new Date();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();
  if (hoy.getDate() > dia) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } }
  const fecha = new Date(anio, mes, dia);
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '');

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent('Pagar: ' + nombre)}` +
    `&dates=${fechaStr}/${fechaStr}` +
    `&recur=RRULE:FREQ=MONTHLY` +
    `&details=${encodeURIComponent('Recordatorio de gasto fijo — Gastos app')}`;
  window.open(url, '_blank');
}

document.getElementById('add-fijo-btn').addEventListener('click', async () => {
  const nombre = document.getElementById('fijo-nombre').value.trim();
  const importe = parseFloat(document.getElementById('fijo-importe').value);
  const dia = parseInt(document.getElementById('fijo-dia').value);
  const categoriaId = document.getElementById('fijo-categoria').value;
  const esVariable = document.getElementById('fijo-variable').checked;

  if (!nombre || !importe || !dia || !categoriaId) {
    alert('Rellena nombre, importe, día y categoría.');
    return;
  }

  await sb.from('gastos_fijos').insert({
    nombre, importe_estimado: importe, dia_cobro: dia,
    categoria_id: categoriaId, importe_es_fijo: !esVariable,
  });

  document.getElementById('fijo-nombre').value = '';
  document.getElementById('fijo-importe').value = '';
  document.getElementById('fijo-dia').value = '';
  document.getElementById('fijo-variable').checked = false;
  cargarFijos();
});

// ---------------- ARRANQUE ----------------
init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
