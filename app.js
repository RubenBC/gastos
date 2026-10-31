// ============================================================
// GASTOS — app.js (v4: Material You, categorías planas)
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const CAT_COLORS = {
  'alimentación': '#9FCB8E', 'higiene personal': '#8FCBBE', 'limpieza': '#8EB8CB',
  'vivienda': '#CBB68E', 'transporte': '#CBAF8E', 'salud': '#CB8E9F',
  'ocio': '#B08ECB', 'compras': '#CBC28E', 'otros': '#A9A99A',
  'préstamos': '#8E9ECB', 'prestamos': '#8E9ECB',
  'moto': '#D39B7C', 'cerveza': '#D8B35A', 'loteria': '#7FC4A3', 'lotería': '#7FC4A3', 'gasolina': '#C98F8F',
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
ICONOS_SVG['prestamos'] = ICONOS_SVG['préstamos'];
ICONOS_SVG['moto'] = '<circle cx="6" cy="16.5" r="3"/><circle cx="18" cy="16.5" r="3"/><path d="M6 16.5l3-6h5l3 6"/><path d="M14 10.5l-1-3h-2"/><path d="M9 10.5h5"/>';
ICONOS_SVG['cerveza'] = '<path d="M6 8h9v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M15 10h2.2a1.8 1.8 0 0 1 1.8 1.8v1.4a1.8 1.8 0 0 1-1.8 1.8H15"/><path d="M8 5c0-1 1-1.5 2-1.5s1.2.5 2 .5 1.5-.5 2.5 0"/>';
ICONOS_SVG['loteria'] = '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12l5 8"/>';
ICONOS_SVG['lotería'] = ICONOS_SVG['loteria'];
ICONOS_SVG['gasolina'] = '<path d="M5 20V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 5v15"/><path d="M4 20h11"/><path d="M7 7h6"/><path d="M14 9h2a1.5 1.5 0 0 1 1.5 1.5v5a1.2 1.2 0 0 0 2.4 0V9l-2-2"/>';
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
let presupuestosCache = {}; // categoria_id -> límite
let soportaTipo = false; // true cuando se ha ejecutado anadir-tipo-fijo-variable.sql
let modoRosco = (() => { try { return localStorage.getItem('gastos-modo-rosco') || 'variable'; } catch (e) { return 'variable'; } })();
// Un gasto es "fijo" por su columna tipo; si aún no existe, por venir de la lista de fijos
function esFijo(g) { return g.tipo ? g.tipo === 'fijo' : g.origen === 'fijo'; }
function pintarModoRosco() {
  document.querySelectorAll('#modo-rosco button').forEach((b) => b.classList.toggle('on', b.dataset.modo === modoRosco));
  const tipoUI = soportaTipo ? '' : 'none';
  ['manual-fijo-wrap', 'fijo-comovar-wrap', 'new-fijo-comovar-wrap'].forEach((id) => { document.getElementById(id).style.display = tipoUI; });
}
document.querySelectorAll('#modo-rosco button').forEach((b) => b.addEventListener('click', () => {
  modoRosco = b.dataset.modo;
  try { localStorage.setItem('gastos-modo-rosco', modoRosco); } catch (e) {}
  pintarModoRosco();
  cargarDashboard();
}));
let ticketActual = null;
let modalManualEditId = null;
let nominaEsteMesId = null;
let chartCategorias = null;
let periodosCache = []; // fechas de inicio de cada reinicio manual, ordenadas
let cursorFecha = hoyISO(); // fecha de referencia: qué periodo se está mirando ahora mismo

// ---------------- NORMALIZAR COMERCIO ----------------
function normalizarComercio(nombre) {
  let n = (nombre || '').trim();
  if (!n || /^(desconocido|comercio desconocido|supermercado|sin nombre)$/i.test(n)) return 'Sin nombre';
  const bajo = n.toLowerCase();
  const conocidos = [['mercadona', 'Mercadona'], ['grupo dia', 'Dia'], ['alcampo', 'Alcampo'], ['primaprix', 'Primaprix'], ['lidl', 'Lidl'], ['carrefour', 'Carrefour'], ['amazon', 'Amazon']];
  for (const [k, v] of conocidos) if (bajo.includes(k)) return v;
  n = n.replace(/[,\s]+(s\.?\s?a\.?(\s?u\.?)?|s\.?\s?l\.?(\s?u\.?)?|a\.s\.a\.?)\.?$/i, '').trim();
  if (n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return n;
}

// ---------------- TOAST CON DESHACER ----------------
let toastTimer = null;
let toastUndoFn = null;
function mostrarToast(msg, onUndo) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  const btn = document.getElementById('toast-undo');
  toastUndoFn = onUndo || null;
  btn.style.display = onUndo ? '' : 'none';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); toastUndoFn = null; }, onUndo ? 7000 : 2500);
}
document.getElementById('toast-undo').addEventListener('click', async () => {
  const fn = toastUndoFn;
  toastUndoFn = null;
  document.getElementById('toast').classList.remove('show');
  if (fn) await fn();
});
function vibrar() { try { navigator.vibrate && navigator.vibrate(15); } catch (e) {} }
function refrescarTodo() {
  cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) { cargarTickets(); ejecutarBusqueda(); }
}

function addDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fechaLocal(d.getFullYear(), d.getMonth(), d.getDate());
}

async function cargarPeriodos() {
  const { data } = await sb.from('periodos').select('fecha_inicio').order('fecha_inicio');
  periodosCache = (data || []).map((p) => p.fecha_inicio);
}

// Calcula {inicio, fin, esActual} del periodo al que pertenece fechaRefISO,
// combinando los reinicios manuales guardados con el mes de calendario como respaldo.
function calcularPeriodo(fechaRefISO) {
  const anteriores = periodosCache.filter((p) => p <= fechaRefISO);
  let inicio, fin;

  if (anteriores.length === 0) {
    const d = new Date(fechaRefISO + 'T00:00:00');
    const y = d.getFullYear(), m = d.getMonth();
    inicio = fechaLocal(y, m, 1);
    const finCalendario = fechaLocal(y, m, ultimoDiaMes(y, m));
    const dentro = periodosCache.filter((p) => p > inicio && p <= finCalendario);
    fin = dentro.length ? addDias(dentro[0], -1) : finCalendario;
  } else {
    inicio = anteriores[anteriores.length - 1];
    const siguientes = periodosCache.filter((p) => p > inicio);
    fin = siguientes.length ? addDias(siguientes[0], -1) : hoyISO();
  }

  return { inicio, fin, esActual: fin >= hoyISO() };
}

function actualizarTopbarMes() {
  const rango = calcularPeriodo(cursorFecha);
  const opts = { day: '2-digit', month: 'short' };
  const iniTxt = new Date(rango.inicio + 'T00:00:00').toLocaleDateString('es-ES', opts);
  const finTxt = rango.esActual ? 'hoy' : new Date(rango.fin + 'T00:00:00').toLocaleDateString('es-ES', opts);
  document.getElementById('topbar-month').textContent = `${iniTxt} – ${finTxt}`;
  document.getElementById('mes-siguiente').disabled = rango.esActual;
}
function refrescarVistaActual() {
  actualizarTopbarMes();
  if (document.getElementById('view-resumen').classList.contains('active')) cargarDashboard();
  if (document.getElementById('view-tickets').classList.contains('active')) cargarTickets();
}
document.getElementById('mes-anterior').addEventListener('click', () => {
  const rango = calcularPeriodo(cursorFecha);
  cursorFecha = addDias(rango.inicio, -1);
  refrescarVistaActual();
});
document.getElementById('mes-siguiente').addEventListener('click', () => {
  const rango = calcularPeriodo(cursorFecha);
  if (rango.esActual) return;
  cursorFecha = addDias(rango.fin, 1);
  refrescarVistaActual();
});

document.getElementById('reiniciar-periodo-btn').addEventListener('click', async () => {
  if (!confirm('¿Reiniciar el periodo hoy? A partir de ahora, "este mes" contará desde hoy. El periodo anterior queda guardado tal cual, podrás seguir viéndolo con la flecha ‹.')) return;
  const { error } = await sb.from('periodos').insert({ fecha_inicio: hoyISO() });
  if (error) {
    if (error.code === '23505') alert('Ya has reiniciado el periodo hoy.');
    else alert('No se pudo reiniciar: ' + error.message);
    return;
  }
  await cargarPeriodos();
  cursorFecha = hoyISO();
  refrescarVistaActual();
  cargarNominaConfig();
  cargarFijosConfig();
  alert('Periodo reiniciado. Ya puedes meter la nómina de este nuevo periodo.');
});

function poblarSelectCategorias(sel, categoriaIdActual) {
  const activas = categoriasCache.filter((c) => c.activa);
  sel.innerHTML = activas.map((c) => `<option value="${c.id}" ${c.id === categoriaIdActual ? 'selected' : ''}>${c.nombre}</option>`).join('');
  if (!categoriaIdActual && activas.length) sel.value = activas[0].id;
}

// ---------------- AUTH ----------------
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user?.email === CONFIG.ADMIN_EMAIL) {
    if (bloqueoActivo()) mostrarLock('unlock', () => mostrarApp(), { autoHuella: true });
    else mostrarApp();
  } else document.getElementById('login-screen').style.display = 'flex';
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
  document.getElementById('topbar-version').textContent = 'v' + CONFIG.APP_VERSION;
  document.getElementById('manual-fecha').value = hoyISO();
  actualizarTopbarMes();

  if (localStorage.getItem('gastos-tema') === 'claro') {
    document.body.classList.add('tema-claro');
    document.getElementById('tema-toggle').classList.remove('off');
  }

  const probe = await sb.from('gastos').select('tipo').limit(1);
  soportaTipo = !probe.error;
  pintarModoRosco();

  await cargarPeriodos();
  await cargarCategorias();
  await cargarDashboard();
  await cargarPendientes();
}

document.getElementById('tema-toggle').addEventListener('click', () => {
  const claro = document.body.classList.toggle('tema-claro');
  document.getElementById('tema-toggle').classList.toggle('off', !claro);
  localStorage.setItem('gastos-tema', claro ? 'claro' : 'oscuro');
  if (document.getElementById('view-resumen').classList.contains('active')) cargarDashboard();
});

// ---------------- BLOQUEO CON PIN / HUELLA ----------------
const LOCK_KEY = 'gastos-lock';
let suspenderBloqueo = false;
let ocultoDesde = 0;
let lockState = { modo: 'unlock', pin: '', primero: '', cb: null, fallos: 0, bloqueadoHasta: 0 };

function leerLock() { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); } catch (e) { return null; } }
function guardarLock(o) { try { if (o) localStorage.setItem(LOCK_KEY, JSON.stringify(o)); else localStorage.removeItem(LOCK_KEY); } catch (e) {} }
function bloqueoActivo() { const l = leerLock(); return !!(l && l.hash); }
async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const aB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

(function construirTeclado() {
  const pad = document.getElementById('pin-pad');
  const huellaSVG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 11v3.5a6 6 0 0 1-1.5 4"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0v2.5a9 9 0 0 1-1.2 4.2"/><path d="M5.5 12a6.5 6.5 0 0 1 13 0v1.5"/><path d="M8.5 15v.5a6 6 0 0 1-1 3"/></svg>';
  pad.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="pin-key" data-k="${n}">${n}</button>`).join('')
    + `<button class="pin-key vacio" id="pin-huella" style="display:none;">${huellaSVG}</button><button class="pin-key" data-k="0">0</button><button class="pin-key vacio" id="pin-borrar">⌫</button>`;
  pad.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => pulsarTecla(b.dataset.k)));
  document.getElementById('pin-borrar').addEventListener('click', () => { lockState.pin = lockState.pin.slice(0, -1); actualizarLockUI(); });
  document.getElementById('pin-huella').addEventListener('click', intentarHuella);
  document.getElementById('pin-dots').innerHTML = '<span class="pin-dot"></span>'.repeat(4);
})();

function mostrarLock(modo, cb, opts = {}) {
  lockState = { ...lockState, modo, pin: '', primero: '', cb, cancelable: !!opts.cancelable };
  document.getElementById('lock-screen').style.display = 'flex';
  document.getElementById('lock-error').textContent = '';
  actualizarLockUI();
  if ((modo === 'unlock' || modo === 'verify') && opts.autoHuella) intentarHuella();
}
function cerrarLock() { document.getElementById('lock-screen').style.display = 'none'; }

function actualizarLockUI() {
  const { modo, pin, primero, cancelable } = lockState;
  const textos = { unlock: 'Introduce tu PIN', verify: 'Introduce tu PIN actual', setup: primero ? 'Repite el PIN' : 'Crea un PIN de 4 dígitos' };
  document.getElementById('lock-sub').textContent = textos[modo];
  document.querySelectorAll('#pin-dots .pin-dot').forEach((d, i) => d.classList.toggle('on', i < pin.length));
  document.getElementById('lock-cancelar').style.display = cancelable ? 'block' : 'none';
  document.getElementById('lock-forgot').style.display = modo === 'unlock' ? 'block' : 'none';
  const l = leerLock();
  document.getElementById('pin-huella').style.display = (l?.cred && modo !== 'setup') ? 'flex' : 'none';
}

function errorLock(msg) {
  const el = document.getElementById('lock-error');
  el.textContent = msg;
  const dots = document.getElementById('pin-dots');
  dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
  vibrar();
  lockState.pin = '';
  actualizarLockUI();
}

function pulsarTecla(d) {
  if (Date.now() < lockState.bloqueadoHasta) { errorLock('Demasiados intentos. Espera unos segundos.'); return; }
  if (lockState.pin.length >= 4) return;
  document.getElementById('lock-error').textContent = '';
  lockState.pin += d;
  actualizarLockUI();
  if (lockState.pin.length === 4) setTimeout(procesarPin, 120);
}

async function procesarPin() {
  const { modo, pin } = lockState;
  if (modo === 'unlock' || modo === 'verify') {
    const l = leerLock();
    const h = l ? await hashPin(pin, l.salt) : null;
    if (l && h === l.hash) {
      lockState.fallos = 0;
      cerrarLock();
      if (lockState.cb) lockState.cb();
    } else {
      lockState.fallos++;
      if (lockState.fallos >= 5) { lockState.bloqueadoHasta = Date.now() + 15000; lockState.fallos = 0; errorLock('Demasiados intentos. Espera 15 segundos.'); }
      else errorLock('PIN incorrecto');
    }
    return;
  }
  // setup
  if (!lockState.primero) { lockState.primero = pin; lockState.pin = ''; actualizarLockUI(); return; }
  if (pin !== lockState.primero) { lockState.primero = ''; errorLock('Los PIN no coinciden. Empieza de nuevo.'); return; }
  const salt = aB64(crypto.getRandomValues(new Uint8Array(16)));
  const previo = leerLock() || {};
  guardarLock({ ...previo, salt, hash: await hashPin(pin, salt) });
  cerrarLock();
  if (lockState.cb) lockState.cb();
}

async function intentarHuella() {
  const l = leerLock();
  if (!l?.cred || !window.PublicKeyCredential) return;
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: deB64(l.cred), type: 'public-key', transports: ['internal'] }],
      userVerification: 'required', timeout: 60000,
    } });
    lockState.fallos = 0;
    cerrarLock();
    if (lockState.cb) lockState.cb();
  } catch (e) { /* cancelada o fallida: sigue disponible el PIN */ }
}

async function activarHuella() {
  if (!window.PublicKeyCredential) { alert('Este navegador no permite huella.'); return; }
  try {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Gastos' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'gastos', displayName: 'Gastos' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    } });
    guardarLock({ ...leerLock(), cred: aB64(cred.rawId) });
    renderBloqueoAjustes();
    mostrarToast('Huella activada');
  } catch (e) {
    alert('No se pudo activar la huella: ' + (e.message || e.name));
  }
}

function renderBloqueoAjustes() {
  const activo = bloqueoActivo();
  const l = leerLock();
  document.getElementById('lock-toggle').classList.toggle('off', !activo);
  document.getElementById('lock-opciones').style.display = activo ? 'flex' : 'none';
  const bh = document.getElementById('lock-huella');
  bh.style.display = window.PublicKeyCredential ? '' : 'none';
  bh.textContent = l?.cred ? 'Quitar huella' : 'Activar huella';
}

document.getElementById('lock-toggle').addEventListener('click', () => {
  if (!bloqueoActivo()) {
    mostrarLock('setup', () => { renderBloqueoAjustes(); mostrarToast('Bloqueo activado'); }, { cancelable: true });
  } else {
    mostrarLock('verify', () => { guardarLock(null); renderBloqueoAjustes(); mostrarToast('Bloqueo desactivado'); }, { cancelable: true });
  }
});
document.getElementById('lock-cambiar').addEventListener('click', () => {
  mostrarLock('verify', () => mostrarLock('setup', () => mostrarToast('PIN cambiado'), { cancelable: true }), { cancelable: true });
});
document.getElementById('lock-huella').addEventListener('click', () => {
  const l = leerLock();
  if (l?.cred) { const { cred, ...resto } = l; guardarLock(resto); renderBloqueoAjustes(); mostrarToast('Huella quitada'); }
  else activarHuella();
});
document.getElementById('lock-cancelar').addEventListener('click', () => { cerrarLock(); renderBloqueoAjustes(); });
document.getElementById('lock-forgot').addEventListener('click', async () => {
  if (!confirm('Se cerrará la sesión y se quitará el bloqueo. Tendrás que entrar de nuevo con tu contraseña. ¿Seguir?')) return;
  guardarLock(null);
  await sb.auth.signOut();
  location.reload();
});

// Bloquear de nuevo al volver a la app tras un rato en segundo plano
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ocultoDesde = Date.now(); return; }
  if (suspenderBloqueo) { suspenderBloqueo = false; return; }
  const appVisible = document.getElementById('app').style.display === 'flex';
  const yaBloqueada = document.getElementById('lock-screen').style.display === 'flex';
  if (appVisible && !yaBloqueada && bloqueoActivo() && ocultoDesde && Date.now() - ocultoDesde > 90000) {
    mostrarLock('unlock', null, { autoHuella: true });
  }
});

// ---------------- AJUSTES: menú y subpáginas ----------------
function mostrarMenuAjustes() {
  document.querySelectorAll('#view-ajustes .aj-panel').forEach((p) => { p.style.display = 'none'; });
  document.getElementById('aj-menu').style.display = '';
  window.scrollTo(0, 0);
}
function abrirPanelAjustes(id) {
  document.getElementById('aj-menu').style.display = 'none';
  document.querySelectorAll('#view-ajustes .aj-panel').forEach((p) => { p.style.display = p.id === id ? '' : 'none'; });
  window.scrollTo(0, 0);
  if (id === 'aj-ingresos') cargarNominaConfig();
  if (id === 'aj-fijos') cargarFijosConfig();
  if (id === 'aj-cats') { renderCategorias(); renderPresupuestos(); }
  if (id === 'aj-seguridad') renderBloqueoAjustes();
}
document.querySelectorAll('.aj-row[data-panel]').forEach((r) => r.addEventListener('click', () => abrirPanelAjustes(r.dataset.panel)));
document.querySelectorAll('.aj-back').forEach((b) => b.addEventListener('click', mostrarMenuAjustes));
document.getElementById('fijo-nuevo-toggle').addEventListener('click', () => {
  const f = document.getElementById('fijo-form-wrap');
  const abrir = f.style.display === 'none';
  f.style.display = abrir ? 'flex' : 'none';
  document.getElementById('fijo-nuevo-toggle').textContent = abrir ? '✕ Cerrar' : '＋ Nuevo gasto fijo';
  if (abrir) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    if (btn.dataset.view === 'ajustes') mostrarMenuAjustes();
  });
});

// ---------------- CATEGORÍAS ----------------
async function cargarCategorias() {
  const { data, error } = await sb.from('categorias').select('*').order('orden');
  if (error) { alert('No se pudieron cargar las categorías: ' + error.message); return; }
  categoriasCache = data;
  asignarColores();
  await cargarPresupuestos();
}

async function cargarPresupuestos() {
  const { data, error } = await sb.from('presupuestos').select('categoria_id, limite');
  presupuestosCache = {};
  if (error) return; // la tabla aún no existe: la app sigue funcionando sin presupuestos
  (data || []).forEach((p) => { presupuestosCache[p.categoria_id] = Number(p.limite); });
}

function renderPresupuestos() {
  const cont = document.getElementById('presupuestos-list');
  cont.innerHTML = categoriasCache.filter((c) => c.activa).map((c) => `
    <div class="bud-row">
      <div class="cat-icon-circ" style="background:${colorCategoria(c.nombre)}33; color:${colorCategoria(c.nombre)};">${iconoCategoria(c.nombre)}</div>
      <div class="cat-name">${c.nombre}</div>
      <input type="number" inputmode="decimal" step="1" min="0" placeholder="Sin límite" data-cat-id="${c.id}" value="${presupuestosCache[c.id] || ''}">
    </div>
  `).join('');
  cont.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('change', async () => {
      const limite = parseFloat(inp.value);
      let error;
      if (limite > 0) {
        ({ error } = await sb.from('presupuestos').upsert({ categoria_id: inp.dataset.catId, limite }));
        if (!error) presupuestosCache[inp.dataset.catId] = limite;
      } else {
        ({ error } = await sb.from('presupuestos').delete().eq('categoria_id', inp.dataset.catId));
        if (!error) delete presupuestosCache[inp.dataset.catId];
      }
      if (error) { alert('No se pudo guardar el presupuesto (¿has ejecutado anadir-presupuestos.sql?):\n' + error.message); return; }
      mostrarToast('Presupuesto guardado');
    });
  });
}

function renderCategorias() {
  const cont = document.getElementById('cat-list');
  cont.innerHTML = categoriasCache.map((c) => `
    <div class="cat-row">
      <div class="cat-row-left">
        <div class="cat-icon-circ" style="background:${colorCategoria(c.nombre)}33; color:${colorCategoria(c.nombre)};">${iconoCategoria(c.nombre)}</div>
        <div class="cat-name">${c.nombre}</div>
      </div>
      <div class="cat-row-right">
        ${c.nombre.toLowerCase() === 'otros' ? '' : `<button class="cat-del" data-del="${c.id}" aria-label="Eliminar">${svgInline(ICONO_PAPELERA, 17)}</button>`}
        <button class="m3-switch ${c.activa ? '' : 'off'}" data-id="${c.id}" data-activa="${c.activa}"></button>
      </div>
    </div>
  `).join('');
  cont.querySelectorAll('.cat-del').forEach((btn) => btn.addEventListener('click', () => eliminarCategoria(btn.dataset.del)));
  cont.querySelectorAll('.m3-switch').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await sb.from('categorias').update({ activa: btn.dataset.activa !== 'true' }).eq('id', btn.dataset.id);
      await cargarCategorias();
      renderCategorias();
    });
  });
}

async function eliminarCategoria(id) {
  const cat = categoriasCache.find((c) => c.id === id);
  const otros = categoriasCache.find((c) => c.nombre.toLowerCase() === 'otros');
  if (!cat) return;
  if (!otros) { alert('Necesitas la categoría "Otros" para poder eliminar otras: a ella pasarán sus gastos.'); return; }
  if (!confirm(`¿Eliminar "${cat.nombre}"?\n\nSus gastos, artículos y gastos fijos pasarán a "Otros". Esto no se puede deshacer.`)) return;
  try {
    for (const tabla of ['gastos', 'ticket_items', 'gastos_fijos']) {
      const { error } = await sb.from(tabla).update({ categoria_id: otros.id }).eq('categoria_id', id);
      if (error) throw new Error(`${tabla}: ${error.message}`);
    }
    await sb.from('presupuestos').delete().eq('categoria_id', id);
    const { error } = await sb.from('categorias').delete().eq('id', id);
    if (error) throw new Error(error.message);
  } catch (err) {
    alert('No se pudo eliminar la categoría:\n' + err.message);
    return;
  }
  await cargarCategorias();
  renderCategorias();
  renderPresupuestos();
  mostrarToast(`"${cat.nombre}" eliminada`);
  refrescarTodo();
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
  const rangoActual = calcularPeriodo(hoyISO());
  const rangoAnterior = calcularPeriodo(addDias(rangoActual.inicio, -1));

  const { data: esteMes } = await sb.from('ingresos').select('*').gte('fecha', rangoActual.inicio).order('fecha', { ascending: false }).limit(1);
  const { data: mesAnterior } = await sb.from('ingresos').select('*').gte('fecha', rangoAnterior.inicio).lt('fecha', rangoActual.inicio).order('fecha', { ascending: false }).limit(1);

  const hint = document.getElementById('nomina-hint');
  if (esteMes && esteMes.length) {
    nominaEsteMesId = esteMes[0].id;
    document.getElementById('nomina-importe').value = esteMes[0].importe;
    hint.textContent = 'Ya la registraste este periodo. Puedes corregirla.';
  } else {
    nominaEsteMesId = null;
    document.getElementById('nomina-importe').value = mesAnterior?.[0]?.importe || '';
    hint.textContent = mesAnterior?.length ? `Precargada con la del periodo pasado (${euros(mesAnterior[0].importe)}). Ajústala y guarda.` : 'Todavía no has metido ninguna nómina.';
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
  const rangoActual = calcularPeriodo(hoyISO());
  const { data: gastosDelMes } = await sb.from('gastos').select('gasto_fijo_id').eq('origen', 'fijo').eq('estado', 'confirmado').gte('fecha', rangoActual.inicio);
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
        <div class="fijo-top" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-dia="${f.dia_cobro}" data-variable="${!f.importe_es_fijo}" data-comovar="${!!f.cuenta_como_variable}">
          <div>
            <div class="fijo-name">${f.nombre} <span style="font-size:10px; opacity:0.6;">✎</span></div>
            <div class="fijo-cat">${iconoCategoria(nombreCategoria(f.categoria_id))} ${nombreCategoria(f.categoria_id)} · día ${f.dia_cobro}</div>
          </div>
          <div class="fijo-amt">${f.importe_es_fijo ? euros(f.importe_estimado) : '~' + euros(f.importe_estimado)}${f.importe_es_fijo ? '' : '<span class="approx">estimado</span>'}</div>
        </div>
        <div class="fijo-bottom">
          <button class="fijo-badge ${badgeClass}" data-fijo-id="${f.id}" data-nombre="${f.nombre}" data-categoria-id="${f.categoria_id}" data-importe="${f.importe_estimado}" data-comovar="${!!f.cuenta_como_variable}" ${pagado ? 'disabled' : ''}>${badgeText}</button>
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
    ...(soportaTipo ? { tipo: btn.dataset.comovar === 'true' ? 'variable' : 'fijo' } : {}),
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

  const comoVariable = soportaTipo && document.getElementById('new-fijo-comovariable').checked;
  const { error } = await sb.from('gastos_fijos').insert({ nombre, importe_estimado: importe, dia_cobro: dia, categoria_id: categoriaId, importe_es_fijo: !esVariable, ...(soportaTipo ? { cuenta_como_variable: comoVariable } : {}) });
  if (error) { alert('Error: ' + error.message); return; }

  document.getElementById('new-fijo-nombre').value = '';
  document.getElementById('new-fijo-importe').value = '';
  document.getElementById('new-fijo-dia').value = '';
  document.getElementById('new-fijo-variable').checked = false;
  document.getElementById('new-fijo-comovariable').checked = false;
  cargarFijosConfig();
});

function abrirModalFijo(el) {
  const { fijoId, nombre, categoriaId, importe, dia, variable, comovar } = el.dataset;
  document.getElementById('fijo-comovariable').checked = comovar === 'true';
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

  const comoVariable = soportaTipo && document.getElementById('fijo-comovariable').checked;
  await sb.from('gastos_fijos').update({ nombre, categoria_id: categoriaId, importe_estimado: importe, dia_cobro: dia, importe_es_fijo: !variable, ...(soportaTipo ? { cuenta_como_variable: comoVariable } : {}) }).eq('id', fijoId);
  await sb.from('gastos').update({ categoria_id: categoriaId, descripcion: nombre }).eq('gasto_fijo_id', fijoId).gte('fecha', calcularPeriodo(hoyISO()).inicio);
  // El tipo (fijo/variable) se aplica a todos sus pagos, también a los anteriores
  if (soportaTipo) await sb.from('gastos').update({ tipo: comoVariable ? 'variable' : 'fijo' }).eq('gasto_fijo_id', fijoId);

  document.getElementById('modal-fijo').classList.remove('open');
  cargarFijosConfig();
});

document.getElementById('fijo-borrar').addEventListener('click', async () => {
  const fijoId = document.getElementById('modal-fijo').dataset.fijoId;
  const { error } = await sb.from('gastos_fijos').update({ activo: false }).eq('id', fijoId);
  if (error) { alert('No se pudo borrar: ' + error.message); return; }
  document.getElementById('modal-fijo').classList.remove('open');
  cargarFijosConfig();
  mostrarToast('Gasto fijo borrado', async () => {
    await sb.from('gastos_fijos').update({ activo: true }).eq('id', fijoId);
    cargarFijosConfig();
  });
});

// ---------------- BOTTOM SHEET (＋) ----------------
document.addEventListener('click', (e) => { if (e.target.closest('[data-abrir-sheet]')) document.getElementById('sheet-add').classList.add('open'); });
document.getElementById('fab-add').addEventListener('click', () => document.getElementById('sheet-add').classList.add('open'));
document.getElementById('sheet-add').addEventListener('click', (e) => { if (e.target.id === 'sheet-add') e.currentTarget.classList.remove('open'); });
document.getElementById('sheet-camara').addEventListener('click', () => { suspenderBloqueo = true; document.getElementById('sheet-add').classList.remove('open'); document.getElementById('file-input').click(); });
document.getElementById('sheet-galeria').addEventListener('click', () => { suspenderBloqueo = true; document.getElementById('sheet-add').classList.remove('open'); document.getElementById('file-input-gallery').click(); });
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
    cargarPendientes();
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

  // Aviso de posible duplicado (se comprueba en segundo plano)
  buscarDuplicado(ticket, items).then((dup) => {
    if (!dup || ticketActual?.ticket.id !== ticket.id) return;
    const aviso = document.createElement('div');
    aviso.className = 'dup-banner';
    aviso.textContent = `Posible duplicado: ya tienes un ticket de ${dup.comercio || 'este comercio'} del ${new Date(dup.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} por ${euros(dup.importe_total)}. Si es el mismo, descártalo.`;
    box.insertBefore(aviso, box.querySelector('.ticket-preview'));
    const btn = document.getElementById('btn-conformar');
    if (btn) btn.textContent = 'Guardar igualmente';
  }).catch(() => {});
}

function normItem(s) { return (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, ''); }

async function buscarDuplicado(ticket, items) {
  const { data: cands } = await sb.from('tickets').select('id, comercio, fecha, importe_total').eq('estado', 'confirmado')
    .gte('fecha', addDias(ticket.fecha, -3)).lte('fecha', addDias(ticket.fecha, 3)).neq('id', ticket.id);
  if (!cands || !cands.length) return null;
  const nuevos = items.map((i) => normItem(i.nombre_articulo));
  const total = items.reduce((a, i) => a + Number(i.precio_total || 0), 0);
  for (const c of cands) {
    const mismoTotal = total > 0 && Math.abs(Number(c.importe_total) - total) < 0.02;
    const { data: gs } = await sb.from('gastos').select('descripcion').eq('ticket_id', c.id);
    const existentes = (gs || []).map((g) => normItem(g.descripcion.split(' — ').slice(1).join(' — ')));
    const comunes = nuevos.filter((n) => existentes.includes(n)).length;
    const solape = nuevos.length ? comunes / nuevos.length : 0;
    if (c.fecha === ticket.fecha ? (mismoTotal || solape >= 0.7) : (mismoTotal && solape >= 0.5)) return c;
  }
  return null;
}

async function cargarPendientes() {
  const { data, error } = await sb.from('tickets').select('id, comercio, fecha, importe_total').eq('estado', 'pendiente').order('fecha', { ascending: false });
  if (error) { console.error(error); return; }

  const cont = document.getElementById('pendientes-banner-cont');
  if (!data || !data.length) { cont.innerHTML = ''; return; }

  cont.innerHTML = `
    <div class="pendientes-banner" id="pendientes-banner">
      <div class="pendientes-banner-row">
        <div class="pendientes-banner-text">⚠️ ${data.length} ticket${data.length > 1 ? 's' : ''} sin revisar</div>
        <span class="ticket-chevron" id="pendientes-chevron">▾</span>
      </div>
      <div class="pendientes-lista">
        ${data.map((t) => `
          <div class="pendiente-row" data-ticket-id="${t.id}">
            <span>${t.comercio} · ${new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
            <span>${euros(t.importe_total)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelector('.pendientes-banner-row').addEventListener('click', () => {
    document.getElementById('pendientes-banner').classList.toggle('open');
  });
  cont.querySelectorAll('.pendiente-row').forEach((row) => {
    row.addEventListener('click', (e) => { e.stopPropagation(); reabrirTicketPendiente(row.dataset.ticketId); });
  });
}

async function reabrirTicketPendiente(ticketId) {
  const { data: ticket, error: errorTicket } = await sb.from('tickets').select('*').eq('id', ticketId).single();
  if (errorTicket || !ticket) { alert('No se pudo abrir el ticket: ' + errorTicket?.message); return; }
  const { data: items, error: errorItems } = await sb.from('ticket_items').select('*').eq('ticket_id', ticketId);
  if (errorItems) { alert('No se pudieron cargar los artículos: ' + errorItems.message); return; }

  ticketActual = { ticket, items: items || [] };
  renderRevisarModal();
}

async function descartarTicket() {
  if (!ticketActual) return;
  if (!confirm('¿Descartar este ticket?')) return;
  const { error } = await sb.from('tickets').delete().eq('id', ticketActual.ticket.id);
  if (error) { alert('No se pudo descartar: ' + error.message); return; }
  ticketActual = null;
  document.getElementById('modal-revisar').classList.remove('open');
  cargarPendientes();
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
  const comercio = normalizarComercio(document.getElementById('edit-comercio').value);
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
    vibrar();
    mostrarToast('Ticket guardado · ' + euros(totalFinal));
    cargarDashboard();
    cargarPendientes();
  } catch (err) {
    alert('No se pudo conformar el ticket:\n\n' + err.message + '\n\nSigue en pendiente. Vuelve a intentarlo.');
  }
}

async function borrarTicketCompleto(ticketId) {
  // Guardamos todo antes de borrar para poder deshacer
  const { data: ticketRow } = await sb.from('tickets').select('*').eq('id', ticketId).single();
  const { data: itemsRows } = await sb.from('ticket_items').select('*').eq('ticket_id', ticketId);
  const { data: gastosRows } = await sb.from('gastos').select('*').eq('ticket_id', ticketId);
  if (!ticketRow) { alert('No se encontró el ticket.'); return; }

  const { error: errorGastos } = await sb.from('gastos').delete().eq('ticket_id', ticketId);
  if (errorGastos) { alert('No se pudo borrar: ' + errorGastos.message); return; }
  const { error: errorTicket } = await sb.from('tickets').delete().eq('id', ticketId);
  if (errorTicket) { alert('Se borraron los gastos pero no el ticket: ' + errorTicket.message); return; }
  vibrar();
  refrescarTodo();

  mostrarToast('Ticket borrado', async () => {
    const r1 = await sb.from('tickets').insert(ticketRow);
    if (r1.error) { alert('No se pudo restaurar el ticket: ' + r1.error.message); return; }
    if (itemsRows && itemsRows.length) {
      const r2 = await sb.from('ticket_items').upsert(itemsRows);
      if (r2.error) { alert('Ticket restaurado, pero no sus artículos: ' + r2.error.message); }
    }
    if (gastosRows && gastosRows.length) {
      const r3 = await sb.from('gastos').insert(gastosRows);
      if (r3.error) { alert('Ticket restaurado, pero no sus gastos: ' + r3.error.message); return; }
    }
    refrescarTodo();
    mostrarToast('Ticket restaurado');
  });
}

// ---------------- GASTO MANUAL / OCASIONAL ----------------
document.getElementById('manual-cancelar').addEventListener('click', () => document.getElementById('modal-manual').classList.remove('open'));

function renderChipsManual(seleccionId) {
  const cont = document.getElementById('manual-chips');
  const activas = categoriasCache.filter((c) => c.activa);
  cont.innerHTML = activas.map((c) => `
    <button type="button" class="cat-chip ${c.id === seleccionId ? 'sel' : ''}" data-id="${c.id}">${iconoCategoria(c.nombre)} ${c.nombre}</button>
  `).join('');
  document.getElementById('manual-categoria').value = seleccionId || '';
  cont.querySelectorAll('.cat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      cont.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('sel'));
      chip.classList.add('sel');
      document.getElementById('manual-categoria').value = chip.dataset.id;
    });
  });
}

function abrirModalManual(existing) {
  modalManualEditId = existing?.id || null;
  document.getElementById('manual-modal-tipo').textContent = modalManualEditId ? '' : 'imprevisto';
  document.getElementById('manual-descripcion').value = existing?.descripcion || '';
  document.getElementById('manual-importe').value = existing?.importe || '';
  document.getElementById('manual-fecha').value = existing?.fecha || hoyISO();
  document.getElementById('manual-borrar').style.display = modalManualEditId ? 'block' : 'none';
  document.getElementById('manual-fijo').checked = false;
  if (soportaTipo && existing?.id) {
    sb.from('gastos').select('tipo').eq('id', existing.id).single().then(({ data: r }) => {
      document.getElementById('manual-fijo').checked = r?.tipo === 'fijo';
    });
  }

  let seleccion = existing?.categoriaId;
  if (!seleccion) {
    let ultima = null;
    try { ultima = localStorage.getItem('gastos-ultima-cat'); } catch (e) {}
    const activas = categoriasCache.filter((c) => c.activa);
    seleccion = activas.find((c) => c.id === ultima)?.id || activas[0]?.id;
  }
  renderChipsManual(seleccion);
  document.getElementById('modal-manual').classList.add('open');
  if (!modalManualEditId) setTimeout(() => document.getElementById('manual-importe').focus(), 250);
}

document.getElementById('manual-guardar').addEventListener('click', async () => {
  let descripcion = document.getElementById('manual-descripcion').value.trim();
  const importe = parseFloat(document.getElementById('manual-importe').value);
  const fecha = document.getElementById('manual-fecha').value;
  const categoriaId = document.getElementById('manual-categoria').value;
  if (!importe || !fecha || !categoriaId) { alert('Pon el importe y elige una categoría.'); return; }
  if (!descripcion) descripcion = nombreCategoria(categoriaId);
  const extraTipo = soportaTipo ? { tipo: document.getElementById('manual-fijo').checked ? 'fijo' : 'variable' } : {};

  let error;
  if (modalManualEditId) {
    ({ error } = await sb.from('gastos').update({ descripcion, importe, fecha, categoria_id: categoriaId, ...extraTipo }).eq('id', modalManualEditId));
  } else {
    ({ error } = await sb.from('gastos').insert({ fecha, importe, categoria_id: categoriaId, descripcion, origen: 'manual', estado: 'confirmado', ...extraTipo }));
  }
  if (error) { alert('Error: ' + error.message); return; }

  try { localStorage.setItem('gastos-ultima-cat', categoriaId); } catch (e) {}
  document.getElementById('modal-manual').classList.remove('open');
  vibrar();
  mostrarToast('Guardado · ' + euros(importe));
  refrescarTodo();
});

async function borrarGastoConDeshacer(id) {
  const { data: fila } = await sb.from('gastos').select('*').eq('id', id).single();
  const { error } = await sb.from('gastos').delete().eq('id', id);
  if (error) { alert('No se pudo borrar: ' + error.message); return false; }
  vibrar();
  refrescarTodo();
  mostrarToast('Gasto borrado', async () => {
    if (!fila) return;
    const r = await sb.from('gastos').insert(fila);
    if (r.error) { alert('No se pudo restaurar: ' + r.error.message); return; }
    refrescarTodo();
  });
  return true;
}

document.getElementById('manual-borrar').addEventListener('click', async () => {
  if (!modalManualEditId) return;
  document.getElementById('modal-manual').classList.remove('open');
  await borrarGastoConDeshacer(modalManualEditId);
});

function editarGasto(row) {
  const { gastoId, categoriaId, importe, descripcion, fecha } = row.dataset;
  abrirModalManual({ id: gastoId, categoriaId, importe, descripcion, fecha });
}

// ---------------- RESUMEN (dashboard) ----------------
async function cargarDashboard() {
  const { inicio: inicioMes, fin: finMes } = calcularPeriodo(cursorFecha);

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
  const dataRosco = modoRosco === 'variable' ? data.filter((g) => !esFijo(g)) : data;
  const totalRosco = dataRosco.reduce((a, g) => a + Number(g.importe), 0);
  const totalFijosPeriodo = data.filter(esFijo).reduce((a, g) => a + Number(g.importe), 0);

  document.getElementById('r-ingresos').textContent = 'Ingresos: ' + euros(totalIngresos);
  document.getElementById('r-gastos').textContent = euros(totalRosco);
  document.getElementById('r-label').textContent = modoRosco === 'variable' ? 'variable este periodo' : 'gastado este periodo';
  const lineaFijos = document.getElementById('fijos-linea');
  lineaFijos.style.display = modoRosco === 'variable' ? 'flex' : 'none';
  lineaFijos.innerHTML = `<span>Fijos del periodo (fuera del rosco)</span><b>${euros(totalFijosPeriodo)}</b>`;
  document.getElementById('r-ahorro').textContent = euros(ahorro);
  document.getElementById('r-ahorro').style.color = ahorro >= 0 ? '#E8A05C' : 'var(--md-error)';

  const porCategoria = {};
  dataRosco.forEach((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    porCategoria[nombre] = (porCategoria[nombre] || 0) + Number(g.importe);
  });

  // Periodo anterior, para la comparativa por categoría
  const periodoPrev = calcularPeriodo(addDias(inicioMes, -1));
  const { data: dataPrev } = await sb.from('gastos').select('*').eq('estado', 'confirmado').gte('fecha', periodoPrev.inicio).lte('fecha', periodoPrev.fin);
  const prevPorCategoria = {};
  (dataPrev || []).filter((g) => modoRosco === 'todo' || !esFijo(g)).forEach((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    prevPorCategoria[nombre] = (prevPorCategoria[nombre] || 0) + Number(g.importe);
  });

  dibujarDonut(porCategoria, prevPorCategoria);
  renderMovimientos(data, comercioPorTicket, 'movimientos-list', false);
  cargarFijosResumen(data);
  cargarAhorroResumen();
}

let ahorroEstePeriodoId = null;
let chartAhorro = null;

async function cargarAhorroResumen() {
  const { data: historial, error } = await sb.from('ahorros').select('*').order('fecha', { ascending: true });
  if (error) { console.error(error); return; }

  const rangoActual = calcularPeriodo(hoyISO());
  const esteRegistro = (historial || []).find((a) => a.fecha >= rangoActual.inicio);
  const hint = document.getElementById('ahorro-hint');

  if (esteRegistro) {
    ahorroEstePeriodoId = esteRegistro.id;
    document.getElementById('ahorro-importe').value = esteRegistro.saldo;
    hint.textContent = 'Ya lo registraste este periodo. Puedes corregirlo.';
  } else {
    ahorroEstePeriodoId = null;
    document.getElementById('ahorro-importe').value = '';
    hint.textContent = 'Apunta el saldo actual de tu cuenta de ahorro.';
  }

  const ultimo = historial && historial.length ? historial[historial.length - 1] : null;
  const anterior = historial && historial.length > 1 ? historial[historial.length - 2] : null;

  document.getElementById('ahorro-saldo-actual').textContent = ultimo ? euros(ultimo.saldo) : '—';
  const diffEl = document.getElementById('ahorro-diff');
  if (ultimo && anterior) {
    const diff = ultimo.saldo - anterior.saldo;
    diffEl.textContent = (diff >= 0 ? '+' : '') + euros(diff) + ' desde el periodo pasado';
    diffEl.style.color = diff >= 0 ? 'var(--md-success)' : 'var(--md-error)';
  } else {
    diffEl.textContent = ultimo ? 'Primer registro' : 'Sin registros todavía';
    diffEl.style.color = '';
  }

  // Histórico + gráfica
  const canvas = document.getElementById('chart-ahorro');
  if (chartAhorro) { chartAhorro.destroy(); chartAhorro = null; }
  if (historial && historial.length) {
    chartAhorro = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: historial.map((a) => new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })),
        datasets: [{ data: historial.map((a) => a.saldo), backgroundColor: '#8FCB86', borderRadius: 6 }],
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => euros(ctx.raw) } } },
        scales: { x: { grid: { display: false } }, y: { display: false } },
      },
    });
  }

  const listaHtml = document.getElementById('ahorro-historial');
  listaHtml.innerHTML = [...(historial || [])].reverse().map((a, i, arr) => {
    const prev = arr[i + 1];
    const diff = prev ? a.saldo - prev.saldo : null;
    const diffTxt = diff === null ? '' : ` <span style="font-weight:700; color:${diff >= 0 ? 'var(--md-success)' : 'var(--md-error)'};">${diff >= 0 ? '+' : ''}${euros(diff)}</span>`;
    return `
      <div class="ticket-item-row">
        <span>${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span>${euros(a.saldo)}${diffTxt}</span>
      </div>
    `;
  }).join('') || '<div class="empty-state">Todavía no has registrado ningún saldo.</div>';
}

document.getElementById('ahorro-header').addEventListener('click', () => {
  const detalle = document.getElementById('ahorro-detalle');
  const chevron = document.getElementById('ahorro-chevron');
  const abierto = detalle.style.display !== 'none';
  detalle.style.display = abierto ? 'none' : 'block';
  chevron.style.transform = abierto ? '' : 'rotate(180deg)';
});

document.getElementById('ahorro-guardar').addEventListener('click', async () => {
  const saldo = parseFloat(document.getElementById('ahorro-importe').value);
  if (isNaN(saldo)) { alert('Pon el saldo actual.'); return; }

  let error;
  if (ahorroEstePeriodoId) {
    ({ error } = await sb.from('ahorros').update({ saldo }).eq('id', ahorroEstePeriodoId));
  } else {
    ({ error } = await sb.from('ahorros').insert({ fecha: hoyISO(), saldo }));
  }
  if (error) { alert('No se pudo guardar: ' + error.message); return; }
  cargarAhorroResumen();
});

async function cargarFijosResumen(gastosDelMes) {
  const { data: fijos, error } = await sb.from('gastos_fijos').select('*').eq('activo', true);
  if (error) { console.error(error); return; }

  const totalFijos = (gastosDelMes || []).filter((g) => g.origen === 'fijo').reduce((a, g) => a + Number(g.importe), 0);
  document.getElementById('fijos-resumen-total').textContent = euros(totalFijos);
  document.getElementById('fijos-resumen-icon').innerHTML = svgInline('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18"/><path d="M6.5 14.5h4"/>', 18);

  const pagadosIds = new Set((gastosDelMes || []).filter((g) => g.origen === 'fijo').map((g) => g.gasto_fijo_id));
  const hoy = new Date().getDate();
  const mesReal = calcularPeriodo(cursorFecha).esActual;

  const detalle = document.getElementById('fijos-resumen-detalle');
  detalle.innerHTML = (fijos || []).map((f) => {
    const pagado = pagadosIds.has(f.id);
    let badgeClass = 'badge-proximo', badgeText = `Día ${f.dia_cobro}`;
    if (pagado) { badgeClass = 'badge-pagado'; badgeText = 'Pagado'; }
    else if (!mesReal) { badgeClass = 'badge-confirmar'; badgeText = 'No registrado'; }
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

function htmlDelta(actual, previo) {
  if (!previo || previo <= 0) return '';
  const pct = Math.round(((actual - previo) / previo) * 100);
  const clase = pct > 0 ? 'delta-up' : pct < 0 ? 'delta-down' : '';
  const flecha = pct > 0 ? '▲ ' : pct < 0 ? '▼ ' : '= ';
  return `<span class="legend-delta ${clase}">${flecha}${Math.abs(pct)} % <span style="opacity:0.75; font-weight:500;">(${euros(previo)})</span></span>`;
}

function htmlPresupuesto(nombre, gastado) {
  const catId = categoriasCache.find((c) => c.nombre === nombre)?.id;
  const limite = presupuestosCache[catId];
  if (!limite) return '';
  const pct = (gastado / limite) * 100;
  const clase = pct > 100 ? 'pasado' : pct >= 80 ? 'aviso' : '';
  const texto = pct > 100 ? `Te has pasado ${euros(gastado - limite)}` : `Quedan ${euros(limite - gastado)} de ${euros(limite)}`;
  return `<div class="bud-bar"><div class="bud-fill ${clase}" style="width:${Math.min(pct, 100)}%"></div></div><div class="bud-txt ${clase}">${texto}</div>`;
}

function dibujarDonut(porCategoria, prevPorCategoria = {}) {
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
          plugins: { legend: { display: false }, tooltip: {
            backgroundColor: document.body.classList.contains('tema-claro') ? '#2B3327' : '#F0F5EB',
            titleColor: document.body.classList.contains('tema-claro') ? '#FFFFFF' : '#16221B',
            bodyColor: document.body.classList.contains('tema-claro') ? '#FFFFFF' : '#16221B',
            padding: 10, cornerRadius: 10, displayColors: false,
            callbacks: { title: () => '', label: (ctx) => `${ctx.label}: ${euros(ctx.raw)}` } } },
        },
      });
    }
  } catch (err) {
    console.error('Error dibujando la gráfica:', err);
  }

  const legend = document.getElementById('legend-list');
  const ordenado = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  legend.innerHTML = ordenado.map(([nombre, importe]) => `
    <div class="legend-row" data-nombre="${nombre}">
      <div class="legend-dot" style="background:${colorCategoria(nombre)};"></div>
      <div class="legend-main">
        <span class="legend-name">${nombre}${htmlDelta(importe, prevPorCategoria[nombre])}</span>
        ${htmlPresupuesto(nombre, importe)}
      </div>
      <div class="legend-amt">${euros(importe)}</div>
    </div>
  `).join('') || '<div class="empty-state" style="padding:8px 0;">Sin gastos en este periodo.<br><button class="empty-btn" data-abrir-sheet>＋ Añadir gasto</button></div>';

  legend.querySelectorAll('.legend-row').forEach((row) => {
    row.addEventListener('click', () => abrirDetalleCategoria(row.dataset.nombre));
  });
}

// ---------------- POPUP: detalle de una categoría ----------------
async function abrirDetalleCategoria(nombreCat) {
  const { inicio: inicioMes, fin: finMes } = calcularPeriodo(cursorFecha);
  const catId = categoriasCache.find((c) => c.nombre === nombreCat)?.id;

  const { data: dataTodos } = await sb.from('gastos').select('*').eq('categoria_id', catId).eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes).order('fecha', { ascending: false });
  const data = (dataTodos || []).filter((g) => modoRosco === 'todo' || !esFijo(g));
  const total = (data || []).reduce((a, g) => a + Number(g.importe), 0);

  document.getElementById('modal-cat-titulo').innerHTML = `${iconoSVG(nombreCat, 16)} ${nombreCat} — ${euros(total)}`;
  document.getElementById('modal-cat-contenido').innerHTML = `<div style="margin-bottom:12px;">${htmlPresupuesto(nombreCat, total)}</div>` + ((data || []).map((g) => `
    <div class="ticket-item-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
      <span>${g.descripcion}</span>
      <span>${euros(g.importe)}</span>
    </div>
  `).join('') || '<div class="empty-state">Sin gastos en esta categoría.</div>');

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
  }).join('') || `<div class="empty-state">Aún no hay movimientos en este periodo.<br>Escanea un ticket o apunta un gasto.<br><button class="empty-btn" data-abrir-sheet>＋ Añadir</button></div>`;

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

// ---------------- DESLIZAR (borrar movimiento / cambiar de periodo) ----------------
function activarSwipeBorrar(cont) {
  let card = null, x0 = 0, y0 = 0, dx = 0, activo = false;
  cont.addEventListener('touchstart', (e) => {
    const c = e.target.closest('.ticket-card');
    if (!c || e.touches.length !== 1) { card = null; return; }
    card = c; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = false;
    card.style.transition = 'none';
  }, { passive: true });
  cont.addEventListener('touchmove', (e) => {
    if (!card) return;
    const t = e.touches[0];
    const ddx = t.clientX - x0, ddy = t.clientY - y0;
    if (!activo) {
      if (Math.abs(ddx) > 12 && Math.abs(ddx) > Math.abs(ddy) * 1.5) activo = true;
      else if (Math.abs(ddy) > 12) { card.style.transition = ''; card = null; return; }
    }
    if (activo) {
      dx = Math.min(0, ddx);
      card.style.transform = `translateX(${dx}px)`;
      card.style.opacity = String(1 - Math.min(0.6, Math.abs(dx) / 300));
    }
  }, { passive: true });
  cont.addEventListener('touchend', async () => {
    if (!card) return;
    const c = card; card = null;
    c.style.transition = '';
    const reset = () => { c.style.transform = ''; c.style.opacity = ''; };
    if (!activo || dx > -110) { reset(); return; }
    const ticketId = c.dataset.ticketId;
    const gastoId = c.querySelector('.ticket-card-header[data-gasto-id]')?.dataset.gastoId;
    if (ticketId) await borrarTicketCompleto(ticketId);
    else if (gastoId) await borrarGastoConDeshacer(gastoId);
    reset();
  });
}
activarSwipeBorrar(document.getElementById('movimientos-list'));
activarSwipeBorrar(document.getElementById('tickets-detalle'));

(function swipePeriodo() {
  const zona = document.querySelector('.donut-hero-wrap');
  let x0 = 0, y0 = 0;
  zona.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  zona.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const btn = document.getElementById(dx > 0 ? 'mes-anterior' : 'mes-siguiente');
    if (!btn.disabled) btn.click();
  }, { passive: true });
})();

// ---------------- TICKETS (pestaña) ----------------
const ETIQUETAS_TICKETS = ['Alimentación', 'Higiene personal', 'Limpieza', 'Otros'];

async function cargarTickets() {
  const { inicio: inicioMes, fin: finMes } = calcularPeriodo(cursorFecha);

  const { data, error } = await sb.from('gastos').select('*').in('origen', ['ticket', 'manual']).eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  if (error) { alert('No se pudieron cargar los tickets: ' + error.message); return; }

  const { data: ticketsMes, error: errorTickets } = await sb.from('tickets').select('id, comercio, fecha').eq('estado', 'confirmado').gte('fecha', inicioMes).lte('fecha', finMes);
  if (errorTickets) { alert('No se pudieron cargar los tickets: ' + errorTickets.message); return; }
  const comercioPorTicket = {};
  (ticketsMes || []).forEach((t) => { comercioPorTicket[t.id] = t.comercio; });

  // Una etiqueta por categoría: las 3 de siempre + 'Otros' fijas, y cualquier otra que tenga gasto
  const porEtiqueta = {};
  ETIQUETAS_TICKETS.forEach((e) => { porEtiqueta[e] = 0; });
  data.forEach((g) => {
    const nombre = nombreCategoria(g.categoria_id);
    porEtiqueta[nombre] = (porEtiqueta[nombre] || 0) + Number(g.importe);
  });
  const etiquetas = [
    ...ETIQUETAS_TICKETS.slice(0, 3),
    ...Object.keys(porEtiqueta).filter((e) => !ETIQUETAS_TICKETS.includes(e) && porEtiqueta[e] > 0).sort((x, y) => porEtiqueta[y] - porEtiqueta[x]),
    'Otros',
  ];

  const chips = document.getElementById('tickets-chips');
  chips.innerHTML = etiquetas.map((e) => `
    <div class="m3-chip" data-etiqueta="${e}">${iconoCategoria(e)} ${e} <span class="chip-amt">${euros(porEtiqueta[e])}</span></div>
  `).join('');
  chips.querySelectorAll('.m3-chip').forEach((chip) => {
    chip.addEventListener('click', () => abrirDetalleEtiquetaGeneral(chip.dataset.etiqueta, data));
  });

  renderMovimientos(data, comercioPorTicket, 'tickets-detalle', false);
}

function abrirDetalleEtiquetaGeneral(etiqueta, data) {
  const items = data.filter((g) => {
    return nombreCategoria(g.categoria_id) === etiqueta;
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

// ---------------- EXPORTAR CSV ----------------
function csvCelda(v) {
  const t = String(v ?? '');
  return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

async function exportarCSV(soloPeriodo) {
  const btns = [document.getElementById('export-periodo-btn'), document.getElementById('export-todo-btn')];
  btns.forEach((b) => { b.disabled = true; });
  try {
    const filas = [];
    const tamano = 1000;
    const rango = calcularPeriodo(cursorFecha);
    for (let desde = 0; ; desde += tamano) {
      let q = sb.from('gastos').select('*').eq('estado', 'confirmado').order('fecha', { ascending: false }).order('id').range(desde, desde + tamano - 1);
      if (soloPeriodo) q = q.gte('fecha', rango.inicio).lte('fecha', rango.fin);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      filas.push(...data);
      if (data.length < tamano) break;
    }
    if (!filas.length) { alert('No hay gastos que exportar.'); return; }

    const lineas = [['Fecha', 'Tipo', 'Fijo/Variable', 'Comercio', 'Descripción', 'Categoría', 'Importe (€)']];
    filas.forEach((g) => {
      let comercio = '', descripcion = g.descripcion || '';
      if (g.origen === 'ticket' && descripcion.includes(' — ')) {
        const partes = descripcion.split(' — ');
        comercio = partes.shift();
        descripcion = partes.join(' — ');
      }
      lineas.push([g.fecha, g.origen, esFijo(g) ? 'fijo' : 'variable', comercio, descripcion, nombreCategoria(g.categoria_id), Number(g.importe).toFixed(2).replace('.', ',')]);
    });
    // BOM + separador ';' para que Excel en español lo abra bien
    const csv = '\uFEFF' + lineas.map((l) => l.map(csvCelda).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = soloPeriodo ? `gastos-${rango.inicio}_${rango.fin}.csv` : `gastos-historial-${hoyISO()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    mostrarToast(`Exportados ${filas.length} gastos`);
  } catch (err) {
    alert('No se pudo exportar: ' + err.message);
  } finally {
    btns.forEach((b) => { b.disabled = false; });
  }
}
document.getElementById('export-periodo-btn').addEventListener('click', () => exportarCSV(true));
document.getElementById('export-todo-btn').addEventListener('click', () => exportarCSV(false));

// ---------------- BUSCADOR (pestaña Tickets) ----------------
let buscarTimer = null;
const buscarInput = document.getElementById('buscar-input');
const buscarLimpiar = document.getElementById('buscar-limpiar');

buscarInput.addEventListener('input', () => {
  buscarLimpiar.style.display = buscarInput.value ? 'block' : 'none';
  clearTimeout(buscarTimer);
  buscarTimer = setTimeout(ejecutarBusqueda, 300);
});
buscarLimpiar.addEventListener('click', () => {
  buscarInput.value = '';
  buscarLimpiar.style.display = 'none';
  ejecutarBusqueda();
});

async function ejecutarBusqueda() {
  const q = buscarInput.value.trim().replace(/[,()%*]/g, ' ');
  const res = document.getElementById('buscar-resultados');
  const normal = document.getElementById('tickets-normal');
  if (q.length < 2) { res.style.display = 'none'; normal.style.display = 'block'; return; }
  normal.style.display = 'none';
  res.style.display = 'block';

  const qn = q.toLowerCase();
  const idsCat = categoriasCache.filter((c) => c.nombre.toLowerCase().includes(qn)).map((c) => c.id);
  let filtro = `descripcion.ilike.%${q}%`;
  if (idsCat.length) filtro += `,categoria_id.in.(${idsCat.join(',')})`;
  const numero = parseFloat(q.replace(',', '.'));
  if (!isNaN(numero) && /^[0-9]+([.,][0-9]+)?$/.test(q)) filtro += `,importe.eq.${numero}`;

  const { data, error } = await sb.from('gastos').select('*').eq('estado', 'confirmado').or(filtro).order('fecha', { ascending: false }).limit(100);
  if (buscarInput.value.trim().replace(/[,()%*]/g, ' ') !== q) return; // llegó tarde, ya se escribió otra cosa
  if (error) { res.innerHTML = `<div class="empty-state">No se pudo buscar: ${error.message}</div>`; return; }

  const total = (data || []).reduce((a, g) => a + Number(g.importe), 0);
  res.innerHTML = (data && data.length)
    ? `<div class="hint-text" style="margin:0 4px 10px;">${data.length}${data.length === 100 ? '+' : ''} resultado(s) · ${euros(total)}</div>` + data.map((g) => {
        const nombreCat = nombreCategoria(g.categoria_id);
        return `
        <div class="search-res-row" data-gasto-id="${g.id}" data-categoria-id="${g.categoria_id}" data-importe="${g.importe}" data-descripcion="${g.descripcion}" data-fecha="${g.fecha}">
          <div class="ticket-card-icon" style="background:${colorCategoria(nombreCat)}33; color:${colorCategoria(nombreCat)};">${iconoCategoria(nombreCat)}</div>
          <div class="ticket-card-info">
            <div class="ticket-card-name">${g.descripcion}</div>
            <div class="ticket-card-date">${new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · ${nombreCat}</div>
          </div>
          <div class="ticket-card-amt">${euros(g.importe)}</div>
        </div>`;
      }).join('')
    : '<div class="empty-state">No hay gastos que coincidan.</div>';
  res.querySelectorAll('.search-res-row').forEach((row) => row.addEventListener('click', () => editarGasto(row)));
  dibujarPrecios(q, data || []);
}

let chartPrecio = null;
function dibujarPrecios(q, data) {
  if (chartPrecio) { chartPrecio.destroy(); chartPrecio = null; }
  const qn = normItem(q);
  const lineas = data.filter((g) => g.origen === 'ticket' && normItem(g.descripcion.split(' — ').slice(1).join(' — ')).includes(qn))
    .sort((x, y) => (x.fecha < y.fecha ? -1 : 1));
  if (lineas.length < 2) return;
  const imps = lineas.map((g) => Number(g.importe));
  const min = Math.min(...imps), max = Math.max(...imps);
  const media = imps.reduce((s, v) => s + v, 0) / imps.length;
  const ultima = lineas[lineas.length - 1];
  const gMin = lineas[imps.indexOf(min)];
  const comercioDe = (g) => g.descripcion.split(' — ')[0];
  const fmt = (f) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  const card = document.createElement('div');
  card.className = 'precio-card';
  card.innerHTML = `
    <div class="precio-titulo">Precio de «${q}» · ${lineas.length} compras</div>
    <div class="precio-stats">
      <div class="precio-stat"><b>${euros(ultima.importe)}</b><span>Última (${fmt(ultima.fecha)})</span></div>
      <div class="precio-stat"><b>${euros(media)}</b><span>Media</span></div>
      <div class="precio-stat"><b>${euros(min)}</b><span>Más barato (${comercioDe(gMin)}, ${fmt(gMin.fecha)})</span></div>
      <div class="precio-stat"><b>${euros(max)}</b><span>Más caro</span></div>
    </div>
    <div style="position:relative; height:120px;"><canvas id="chart-precio"></canvas></div>
    <div class="hint-text">Importe por línea del ticket: si compraste varias unidades, sale el total.</div>`;
  const res = document.getElementById('buscar-resultados');
  res.insertBefore(card, res.children[1] || null);
  try {
    chartPrecio = new Chart(document.getElementById('chart-precio'), {
      type: 'line',
      data: { labels: lineas.map((g) => fmt(g.fecha)), datasets: [{ data: imps, borderColor: '#8FCB86', backgroundColor: '#8FCB8633', fill: true, tension: 0.25, pointRadius: 3 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: (c) => euros(c.raw) } } },
        scales: { x: { ticks: { maxTicksLimit: 5, color: '#8A9683' }, grid: { display: false } }, y: { ticks: { color: '#8A9683', callback: (v) => v + ' €' }, grid: { color: '#3D4A3F55' } } } },
    });
  } catch (err) { console.error(err); }
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
