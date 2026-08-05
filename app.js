// ============================================================
// GASTOS — app.js
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const CAT_COLORS = {
  'alimentación': '#FF6B4A', 'transporte': '#3E8EDE', 'ocio': '#A855F7',
  'salud': '#FF4D6D', 'hogar': '#F5A623', 'ropa': '#EC4899',
  'suministros': '#14B8A6', 'otros': '#94A3B8',
};
const CAT_ICONS = {
  'alimentación': '🍔', 'transporte': '🚗', 'ocio': '🎬',
  'salud': '💊', 'hogar': '🏠', 'ropa': '👕',
  'suministros': '💡', 'otros': '📦',
};
function iconoCategoria(nombre) {
  return CAT_ICONS[(nombre || '').toLowerCase()] || '📦';
}
function colorCategoria(nombre) {
  return CAT_COLORS[(nombre || '').toLowerCase()] || '#94A3B8';
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
  document.getElementById('version-tag').textContent = 'v' + CONFIG.APP_VERSION;
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
document.getElementById('gallery-btn').addEventListener('click', () => {
  document.getElementById('file-input-gallery').click();
});

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
    document.getElementById('revisar-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
    cargarRecientes();
  } catch (err) {
    alert('No se pudo leer el ticket: ' + err.message);
  } finally {
    spinner.classList.remove('active');
    e.target.value = '';
  }
}

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

// ---------------- REVISAR (dentro de la pantalla Capturar) ----------------
function renderRevisar() {
  const cont = document.getElementById('revisar-content');
  if (!ticketActual) {
    cont.innerHTML = '';
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
  const { error } = await sb.from('tickets').delete().eq('id', ticketActual.ticket.id);
  if (error) { alert('No se pudo descartar: ' + error.message); return; }
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
      const { error: itemError } = await sb.from('ticket_items').update({
        nombre_articulo: item.nombre,
        precio_total: item.precio,
        categoria_id: item.categoriaId,
      }).eq('id', item.id);
      if (itemError) throw new Error(`Actualizando "${item.nombre}": ${itemError.message}`);
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
    const { error: gastosError } = await sb.from('gastos').insert(filasGasto);
    if (gastosError) throw new Error(`Creando los gastos: ${gastosError.message}`);

    // Marcar el ticket como confirmado
    const { error: ticketError } = await sb.from('tickets').update({
      comercio, importe_total: totalFinal, estado: 'confirmado',
    }).eq('id', ticket.id);
    if (ticketError) throw new Error(`Marcando el ticket como confirmado: ${ticketError.message}`);

    ticketActual = null;
    renderRevisar();
    cargarRecientes();
  } catch (err) {
    alert('No se pudo conformar el ticket:\n\n' + err.message + '\n\nNo se ha dado por confirmado, sigue en pendiente. Vuelve a intentarlo.');
  }
}

// ---------------- GASTOS (resumen mensual) ----------------
let chartCategorias = null;

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

  const { data: ingresos } = await sb.from('ingresos')
    .select('*').gte('fecha', inicioMes).lte('fecha', finMes).order('fecha', { ascending: false });
  const totalIngresos = (ingresos || []).reduce((a, i) => a + Number(i.importe), 0);

  // Tickets confirmados del mes, para mostrar el nombre del comercio en el desplegable
  const { data: ticketsMes } = await sb.from('tickets')
    .select('id, comercio, fecha').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  const comercioPorTicket = {};
  (ticketsMes || []).forEach((t) => { comercioPorTicket[t.id] = t.comercio; });

  const total = data.reduce((a, g) => a + Number(g.importe), 0);
  const fijo = data.filter((g) => g.origen === 'fijo').reduce((a, g) => a + Number(g.importe), 0);
  const variable = total - fijo;
  const ahorro = totalIngresos - total;

  const porCategoria = {};
  const itemsPorCategoria = {};
  data.forEach((g) => {
    const nombre = g.categorias?.nombre || 'Otros';
    porCategoria[nombre] = (porCategoria[nombre] || 0) + Number(g.importe);
    if (!itemsPorCategoria[nombre]) itemsPorCategoria[nombre] = [];
    itemsPorCategoria[nombre].push(g);
  });
  const maxCat = Math.max(1, ...Object.values(porCategoria));

  const nombreMes = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Agrupar gastos de origen 'ticket' por ticket_id; el resto (fijo/manual) va suelto
  const movimientos = [];
  const gruposTicket = {};
  data.forEach((g) => {
    if (g.origen === 'ticket' && g.ticket_id) {
      if (!gruposTicket[g.ticket_id]) {
        gruposTicket[g.ticket_id] = {
          tipo: 'ticket', ticketId: g.ticket_id, fecha: g.fecha,
          comercio: comercioPorTicket[g.ticket_id] || 'Ticket', total: 0, items: [],
        };
        movimientos.push(gruposTicket[g.ticket_id]);
      }
      gruposTicket[g.ticket_id].total += Number(g.importe);
      gruposTicket[g.ticket_id].items.push(g);
    } else {
      movimientos.push({ tipo: 'simple', gasto: g });
    }
  });
  movimientos.sort((a, b) => {
    const fa = a.tipo === 'ticket' ? a.fecha : a.gasto.fecha;
    const fb = b.tipo === 'ticket' ? b.fecha : b.gasto.fecha;
    return fb.localeCompare(fa);
  });

  const cont = document.getElementById('gastos-content');
  cont.innerHTML = `
    <div class="month-title">${nombreMes}</div>

    <div class="ahorro-card">
      <div>
        <div class="ahorro-label">Ahorro del mes</div>
        <div class="ahorro-amt ${ahorro >= 0 ? 'positivo' : 'negativo'}">${euros(ahorro)}</div>
      </div>
      <div style="text-align:right; font-size:11px; color:var(--tinta-suave);">
        Ingresos: ${euros(totalIngresos)}<br>Gastos: ${euros(total)}
      </div>
    </div>

    <div class="add-ingreso">
      <input type="number" id="ingreso-importe" placeholder="Importe de nómina €" step="0.01">
      <button id="add-ingreso-btn">Añadir</button>
    </div>

    <div class="add-fijo" id="add-manual-form">
      <div class="capture-sub" style="margin-bottom:0;">Gasto imprevisto</div>
      <input type="text" id="manual-descripcion" placeholder="¿Qué has pagado?">
      <div class="add-fijo-row">
        <input type="number" id="manual-importe" placeholder="Importe €" step="0.01">
        <input type="date" id="manual-fecha" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <select id="manual-categoria"></select>
      <button id="add-manual-btn">Añadir gasto</button>
    </div>

    <div class="summary-card">
      <div class="chart-wrap chart-wrap-hero">
        <canvas id="chart-categorias"></canvas>
        <div class="chart-center">
          <div class="chart-center-label">Gastado</div>
          <div class="chart-center-amt">${euros(total)}</div>
        </div>
      </div>

      <div class="split-row">
        <div class="split-box"><div class="split-label">📌 Fijo</div><div class="split-amt">${euros(fijo)}</div></div>
        <div class="split-box variable"><div class="split-label">🧾 Variable</div><div class="split-amt">${euros(variable)}</div></div>
      </div>

      ${Object.entries(porCategoria).map(([nombre, importe]) => `
        <div class="cat-group">
          <div class="cat-circle-row cat-bar-header">
            <div class="cat-circle" style="background:${colorCategoria(nombre)}">${iconoCategoria(nombre)}</div>
            <div class="cat-circle-info">
              <div class="cat-circle-name">${nombre}</div>
              <div class="cat-circle-pct">${Math.round((importe / total) * 100) || 0}% del total</div>
            </div>
            <div class="cat-circle-amt">${euros(importe)}</div>
            <span class="chevron">▾</span>
          </div>
          <div class="cat-group-detail">
            ${itemsPorCategoria[nombre].map((it) => `
              <div class="ticket-item-row" data-gasto-id="${it.id}" data-categoria-id="${it.categoria_id}" data-importe="${it.importe}" data-descripcion="${it.descripcion}">
                <span>${it.descripcion}</span>
                <span>${euros(it.importe)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="recent-label" style="margin-top:0;">Movimientos <span style="font-weight:400; text-transform:none; letter-spacing:0;">(toca uno para corregirlo)</span></div>
    ${movimientos.map((m) => {
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
                <div class="ticket-item-row" data-gasto-id="${it.id}" data-categoria-id="${it.categoria_id}" data-importe="${it.importe}" data-descripcion="${it.descripcion}">
                  <span><span class="cat-dot-inline" style="background:${colorCategoria(it.categorias?.nombre)}"></span>${it.descripcion.split(' — ').slice(1).join(' — ') || it.descripcion}</span>
                  <span>${euros(it.importe)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      const g = m.gasto;
      return `
        <div class="gasto-row" style="cursor:pointer;" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}">
          <div class="gasto-left">
            <div class="gasto-dot" style="background:${colorCategoria(g.categorias?.nombre)}"></div>
            <div class="gasto-info">
              <div class="gasto-name">${g.descripcion}</div>
              <div class="gasto-date">${new Date(g.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
            </div>
          </div>
          <div class="gasto-amt">${euros(g.importe)}</div>
        </div>
      `;
    }).join('') || '<div class="empty-state">Sin movimientos este mes todavía.</div>'}
  `;

  // Desplegar/plegar tickets
  cont.querySelectorAll('.ticket-group-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.closest('.ticket-group').classList.toggle('open');
    });
  });

  // Desplegar/plegar categorías del resumen
  cont.querySelectorAll('.cat-bar-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.closest('.cat-group').classList.toggle('open');
    });
  });

  // Editar línea individual dentro de un ticket o categoría desplegada
  cont.querySelectorAll('.ticket-item-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      editarGasto(row);
    });
  });

  // Editar gasto suelto (fijo/manual)
  cont.querySelectorAll('.gasto-row').forEach((row) => {
    row.addEventListener('click', () => editarGasto(row));
  });

  // Gráfica de categorías
  const canvas = document.getElementById('chart-categorias');
  if (chartCategorias) chartCategorias.destroy();
  if (canvas && Object.keys(porCategoria).length) {
    chartCategorias = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(porCategoria),
        datasets: [{
          data: Object.values(porCategoria),
          backgroundColor: Object.keys(porCategoria).map(colorCategoria),
          borderColor: '#F5F2E9',
          borderWidth: 3,
        }],
      },
      options: {
        cutout: '72%',
        plugins: { legend: { display: false } },
      },
    });
  }

  // Formulario ingreso
  document.getElementById('add-ingreso-btn').addEventListener('click', async () => {
    const input = document.getElementById('ingreso-importe');
    const importe = parseFloat(input.value);
    if (!importe) return;
    await sb.from('ingresos').insert({
      fecha: new Date().toISOString().split('T')[0],
      importe, descripcion: 'Nómina',
    });
    cargarGastos();
  });

  // Formulario gasto imprevisto
  const selManual = document.getElementById('manual-categoria');
  selManual.innerHTML = categoriasCache.filter((c) => c.activa)
    .map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');

  document.getElementById('add-manual-btn').addEventListener('click', async () => {
    const descripcion = document.getElementById('manual-descripcion').value.trim();
    const importe = parseFloat(document.getElementById('manual-importe').value);
    const fecha = document.getElementById('manual-fecha').value;
    const categoriaId = selManual.value;

    if (!descripcion || !importe || !fecha || !categoriaId) {
      alert('Rellena qué has pagado, el importe y la fecha.');
      return;
    }

    await sb.from('gastos').insert({
      fecha, importe, categoria_id: categoriaId, descripcion,
      origen: 'manual', estado: 'confirmado',
    });

    cargarGastos();
  });
}

async function editarGasto(row) {
  const { gastoId, categoriaId, importe, descripcion } = row.dataset;
  const activas = categoriasCache.filter((c) => c.activa);
  const actual = activas.findIndex((c) => c.id === categoriaId);

  const listado = activas.map((c, i) => `${i + 1}. ${c.nombre}${i === actual ? ' (actual)' : ''}`).join('\n');
  const eleccion = prompt(`Corregir categoría de "${descripcion}":\n\n${listado}\n\nEscribe el número:`, actual >= 0 ? String(actual + 1) : '1');
  if (eleccion === null) return;
  const nuevaCategoria = activas[parseInt(eleccion) - 1];
  if (!nuevaCategoria) { alert('Número no válido'); return; }

  const nuevoImporte = prompt('Importe:', importe);
  if (nuevoImporte === null) return;

  await sb.from('gastos').update({
    categoria_id: nuevaCategoria.id,
    importe: parseFloat(nuevoImporte) || parseFloat(importe),
  }).eq('id', gastoId);

  cargarGastos();
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
        <div class="fijo-top" style="cursor:pointer;" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-dia="${f.dia_cobro}" data-variable="${!f.importe_es_fijo}">
          <div>
            <div class="fijo-name">${f.nombre} <span style="font-size:10px; color:var(--tinta-suave);">✎</span></div>
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

  cont.querySelectorAll('.fijo-top').forEach((el) => {
    el.addEventListener('click', () => abrirModalFijo(el));
  });
  cont.querySelectorAll('.fijo-badge:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => marcarFijoPagado(btn));
  });
  cont.querySelectorAll('.cal-chip').forEach((btn) => {
    btn.addEventListener('click', () => abrirCalendario(btn.dataset.nombre, parseInt(btn.dataset.dia)));
  });
}

function abrirModalFijo(el) {
  const { fijoId, nombre, categoriaId, importe, dia, variable } = el.dataset;

  document.getElementById('modal-nombre').value = nombre;
  document.getElementById('modal-importe').value = importe;
  document.getElementById('modal-dia').value = dia;
  document.getElementById('modal-variable').checked = variable === 'true';

  const sel = document.getElementById('modal-categoria');
  sel.innerHTML = categoriasCache.filter((c) => c.activa)
    .map((c) => `<option value="${c.id}" ${c.id === categoriaId ? 'selected' : ''}>${c.nombre}</option>`).join('');

  const overlay = document.getElementById('modal-overlay');
  overlay.dataset.fijoId = fijoId;
  overlay.classList.add('open');
}

function cerrarModalFijo() {
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('modal-cancelar').addEventListener('click', cerrarModalFijo);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') cerrarModalFijo();
});

document.getElementById('modal-guardar').addEventListener('click', async () => {
  const fijoId = document.getElementById('modal-overlay').dataset.fijoId;
  const nombre = document.getElementById('modal-nombre').value.trim();
  const categoriaId = document.getElementById('modal-categoria').value;
  const importe = parseFloat(document.getElementById('modal-importe').value);
  const dia = parseInt(document.getElementById('modal-dia').value);
  const variable = document.getElementById('modal-variable').checked;

  if (!nombre || !importe || !dia || !categoriaId) {
    alert('Rellena todos los campos.');
    return;
  }

  await sb.from('gastos_fijos').update({
    nombre, categoria_id: categoriaId, importe_estimado: importe,
    dia_cobro: dia, importe_es_fijo: !variable,
  }).eq('id', fijoId);

  // Si este mes ya se registró el pago de este fijo, corregir también ese gasto
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  await sb.from('gastos')
    .update({ categoria_id: categoriaId, descripcion: nombre })
    .eq('gasto_fijo_id', fijoId)
    .gte('fecha', inicioMes);

  cerrarModalFijo();
  cargarFijos();
});

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

  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });
}
