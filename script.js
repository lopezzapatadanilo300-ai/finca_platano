// ═══════════════════════════════════════════
//   BASE DE DATOS (localStorage)
// ═══════════════════════════════════════════
const DB_KEY = 'finca_platano_db';

function cargarDatos() {
  try { const r = localStorage.getItem(DB_KEY); return r ? JSON.parse(r) : []; }
  catch(e) { return []; }
}
function guardarDatos(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }

// Datos iniciales del Excel original
function cargarDatosIniciales() {
  if (cargarDatos().length > 0) return;
  const ini = [
    { fecha:'2026-01-04', desc:'Compre rollo de pita para amarre', cat:'Costo',   cantidad:1,    precio:65000,  monto:65000  },
    { fecha:'2026-01-08', desc:'Corte de platano',                  cat:'Ingreso', cantidad:1035, precio:820,    monto:848700 },
    { fecha:'2026-01-13', desc:'Amarre de platano',                 cat:'Costo',   cantidad:0,    precio:0,      monto:80000  },
    { fecha:'2026-01-15', desc:'Compre litro de veneno',            cat:'Costo',   cantidad:0,    precio:0,      monto:23000  },
    { fecha:'2026-01-22', desc:'Corte de platano',                  cat:'Ingreso', cantidad:1025, precio:850,    monto:871250 },
    { fecha:'2026-01-29', desc:'Corte de platano',                  cat:'Ingreso', cantidad:360,  precio:760,    monto:273600 },
    { fecha:'2026-02-05', desc:'Corte de platano',                  cat:'Ingreso', cantidad:945,  precio:1000,   monto:945000 },
    { fecha:'2026-02-10', desc:'Compuse platano que tumbo el viento',cat:'Costo',  cantidad:0,    precio:0,      monto:210000 },
    { fecha:'2026-02-18', desc:'Corte de platano',                  cat:'Ingreso', cantidad:685,  precio:800,    monto:548000 },
    { fecha:'2026-02-13', desc:'Corte de platano',                  cat:'Ingreso', cantidad:287,  precio:700,    monto:200900 },
  ];
  guardarDatos(ini.map((t, i) => ({ ...t, id: Date.now() + i })));
}

// ═══════════════════════════════════════════
//   UTILIDADES
// ═══════════════════════════════════════════
function fmt(n)       { return '$' + Math.abs(n).toLocaleString('es-CO'); }
function fmtSigned(n) { return (n < 0 ? '-' : '') + fmt(n); }
function hoy()        { return new Date().toISOString().slice(0,10).replace(/-/g,''); }
function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function calcularSaldos(datos) {
  let s = 0;
  return datos.map(t => {
    const ing = t.cat === 'Ingreso' ? t.monto : 0;
    const cos = t.cat === 'Costo'   ? t.monto : 0;
    s += ing - cos;
    return { ...t, ingreso: ing, costo: cos, saldo: s };
  });
}

function getFiltered() {
  const datos = calcularSaldos(cargarDatos());
  const fd = document.getElementById('filtroDesc').value.toLowerCase();
  const fc = document.getElementById('filtroCat').value;
  const fm = document.getElementById('filtroMes').value;
  return datos.filter(t =>
    (!fd || t.desc.toLowerCase().includes(fd)) &&
    (!fc || t.cat === fc) &&
    (!fm || t.fecha.startsWith(fm))
  );
}

// ═══════════════════════════════════════════
//   TABS
// ═══════════════════════════════════════════
function showTab(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
  if (name === 'resumen')  renderResumen();
  if (name === 'graficas') renderGraficas();
}

// ═══════════════════════════════════════════
//   RENDER TABLA
// ═══════════════════════════════════════════
function renderTabla() {
  const datos = cargarDatos();

  // Poblar select de meses
  const meses = [...new Set(datos.map(t => t.fecha.slice(0,7)))].sort();
  const selMes = document.getElementById('filtroMes');
  const val = selMes.value;
  selMes.innerHTML = '<option value="">Todos los meses</option>';
  meses.forEach(m => {
    const [y, mo] = m.split('-');
    const n = new Date(y, mo-1).toLocaleDateString('es-CO', { month:'long', year:'numeric' });
    selMes.innerHTML += `<option value="${m}" ${m===val?'selected':''}>${n}</option>`;
  });

  const todo = calcularSaldos(datos);
  const fil  = getFiltered();
  const tbody = document.getElementById('tablaBody');
  const empty = document.getElementById('emptyState');

  if (fil.length === 0) { tbody.innerHTML = ''; empty.style.display = ''; return; }
  empty.style.display = 'none';

  tbody.innerHTML = fil.map((t, i) => `
    <tr>
      <td style="color:var(--texto2);font-size:.72rem">${i+1}</td>
      <td style="color:var(--texto2)">${formatFecha(t.fecha)}</td>
      <td>${t.desc}</td>
      <td><span class="badge badge-${t.cat.toLowerCase()}">${t.cat}</span></td>
      <td class="num">${t.cantidad > 0 ? t.cantidad.toLocaleString('es-CO') : '—'}</td>
      <td class="num">${t.precio   > 0 ? fmt(t.precio) : '—'}</td>
      <td class="num pos">${t.ingreso > 0 ? fmt(t.ingreso) : '—'}</td>
      <td class="num neg">${t.costo   > 0 ? fmt(t.costo)   : '—'}</td>
      <td class="num sal">${fmtSigned(t.saldo)}</td>
      <td><button class="btn btn-danger" onclick="eliminar(${t.id})">✕</button></td>
    </tr>
  `).join('');

  actualizarCards(todo);
}

function actualizarCards(datos) {
  const ti = datos.reduce((s,t) => s + t.ingreso, 0);
  const tc = datos.reduce((s,t) => s + t.costo,   0);
  const u  = ti - tc;
  const s  = datos.length > 0 ? datos[datos.length-1].saldo : 0;
  document.getElementById('cardIngresos').textContent = fmt(ti);
  document.getElementById('cardCostos').textContent   = fmt(tc);
  document.getElementById('cardUtilidad').textContent = fmtSigned(u);
  document.getElementById('cardTx').textContent       = datos.length;
  document.getElementById('saldoHeader').textContent  = fmtSigned(s);
}

// ═══════════════════════════════════════════
//   AGREGAR / ELIMINAR
// ═══════════════════════════════════════════
function agregarTransaccion() {
  const fecha = document.getElementById('fFecha').value;
  const desc  = document.getElementById('fDesc').value.trim();
  const cat   = document.getElementById('fCat').value;
  const cant  = parseFloat(document.getElementById('fCantidad').value) || 0;
  const prec  = parseFloat(document.getElementById('fPrecio').value)   || 0;
  let   mont  = parseFloat(document.getElementById('fMonto').value)    || 0;

  if (!fecha || !desc) { alert('⚠️ Completa la fecha y descripción'); return; }
  if (mont === 0 && cant > 0 && prec > 0) mont = cant * prec;
  if (mont === 0) { alert('⚠️ Ingresa un monto o cantidad × precio'); return; }

  const datos = cargarDatos();
  datos.push({ id: Date.now(), fecha, desc, cat, cantidad: cant, precio: prec, monto: mont });
  guardarDatos(datos);

  document.getElementById('fFecha').value    = new Date().toISOString().slice(0,10);
  document.getElementById('fDesc').value     = '';
  document.getElementById('fCantidad').value = '';
  document.getElementById('fPrecio').value   = '';
  document.getElementById('fMonto').value    = '';
  renderTabla();
}

function eliminar(id) {
  if (!confirm('¿Eliminar esta transacción?')) return;
  guardarDatos(cargarDatos().filter(t => t.id !== id));
  renderTabla();
}

function limpiarFiltros() {
  document.getElementById('filtroDesc').value = '';
  document.getElementById('filtroCat').value  = '';
  document.getElementById('filtroMes').value  = '';
  renderTabla();
}

// ═══════════════════════════════════════════
//   RESUMEN POR MES
// ═══════════════════════════════════════════
function renderResumen() {
  const datos = calcularSaldos(cargarDatos());
  const meses = {};
  datos.forEach(t => {
    const m = t.fecha.slice(0,7);
    if (!meses[m]) meses[m] = { ing:0, cos:0, tx:0 };
    meses[m].ing += t.ingreso;
    meses[m].cos += t.costo;
    meses[m].tx++;
  });
  const keys = Object.keys(meses).sort();
  const el = document.getElementById('resumenContenido');
  if (keys.length === 0) {
    el.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📊</div><div>No hay datos</div></div>';
    return;
  }
  el.innerHTML = keys.map(m => {
    const [y, mo] = m.split('-');
    const n = new Date(y, mo-1).toLocaleDateString('es-CO', { month:'long', year:'numeric' });
    const u = meses[m].ing - meses[m].cos;
    return `<div class="resumen-bloque">
      <div class="resumen-titulo">${n}</div>
      <div class="resumen-item"><span>Ingresos</span><span style="color:var(--verde-neon)">${fmt(meses[m].ing)}</span></div>
      <div class="resumen-item"><span>Costos</span><span style="color:var(--rojo)">${fmt(meses[m].cos)}</span></div>
      <div class="resumen-item"><span>Utilidad</span><span style="color:${u>=0?'var(--amarillo)':'var(--rojo)'};font-weight:700">${fmtSigned(u)}</span></div>
      <div class="resumen-item"><span>Transacciones</span><span style="color:var(--azul)">${meses[m].tx}</span></div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════
//   GRÁFICAS
// ═══════════════════════════════════════════
function renderGraficas() {
  const datos = calcularSaldos(cargarDatos());
  const meses = {};
  datos.forEach(t => {
    const m = t.fecha.slice(0,7);
    if (!meses[m]) meses[m] = { ing:0, cos:0 };
    meses[m].ing += t.ingreso;
    meses[m].cos += t.costo;
  });
  const keys = Object.keys(meses).sort();
  const maxV = Math.max(...Object.values(meses).flatMap(m => [m.ing, m.cos]), 1);
  const el = document.getElementById('chartArea');
  if (keys.length === 0) { el.innerHTML = '<div class="empty"><div class="empty-icon">📈</div><div>No hay datos</div></div>'; return; }
  el.innerHTML = `
    <div style="display:flex;gap:20px;margin-bottom:16px;font-size:.75rem">
      <span style="color:var(--verde-neon)">■ Ingresos</span>
      <span style="color:var(--rojo)">■ Costos</span>
    </div>
    <div class="chart-bar-wrap">
      ${keys.map(m => {
        const [y, mo] = m.split('-');
        const n = new Date(y, mo-1).toLocaleDateString('es-CO', { month:'short' }) + ' ' + y;
        const pi = (meses[m].ing / maxV * 100).toFixed(1);
        const pc = (meses[m].cos / maxV * 100).toFixed(1);
        return `<div style="margin-bottom:18px">
          <div style="font-size:.72rem;color:var(--texto2);margin-bottom:6px;font-family:'Syne';text-transform:uppercase;letter-spacing:.08em">${n}</div>
          <div class="chart-row">
            <div class="chart-label">Ingresos</div>
            <div class="chart-bar-bg"><div class="chart-bar ing" style="width:${pi}%">${fmt(meses[m].ing)}</div></div>
          </div>
          <div class="chart-row">
            <div class="chart-label">Costos</div>
            <div class="chart-bar-bg"><div class="chart-bar cos" style="width:${pc}%">${fmt(meses[m].cos)}</div></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ═══════════════════════════════════════════
//   PDF
// ═══════════════════════════════════════════
function abrirModalPDF()  { document.getElementById('modalPDF').classList.add('open'); }
function cerrarModalPDF() { document.getElementById('modalPDF').classList.remove('open'); }

function generarPDF() {
  const tipo = document.querySelector('input[name="tipoPDF"]:checked').value;
  cerrarModalPDF();
  if (tipo === 'completo') generarPDFCompleto();
  else if (tipo === 'resumen') generarPDFResumen();
  else generarPDFFiltrado();
}

function pdfHeader(doc, titulo) {
  doc.setFillColor(13, 26, 13);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(45, 106, 45);
  doc.rect(0, 36, 210, 2, 'F');
  doc.setTextColor(126, 219, 106);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Finca Platano', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(138, 176, 138);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Contable Digital', 14, 23);
  doc.text(titulo, 14, 30);
  const f = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });
  doc.setFontSize(8);
  doc.text('Generado: ' + f, 196, 16, { align:'right' });
  return 46;
}

function pdfResumenCards(doc, y, datos) {
  const ti   = datos.reduce((s,t) => s + t.ingreso, 0);
  const tc   = datos.reduce((s,t) => s + t.costo,   0);
  const util = ti - tc;
  const saldo = datos.length > 0 ? datos[datos.length-1].saldo : 0;
  const cards = [
    { label:'Total Ingresos', val: fmt(ti),         color:[45,160,45]  },
    { label:'Total Costos',   val: fmt(tc),         color:[200,60,60]  },
    { label:'Utilidad Neta',  val: fmtSigned(util), color: util>=0?[200,160,0]:[200,60,60] },
    { label:'Saldo Actual',   val: fmtSigned(saldo),color:[82,160,224] },
  ];
  cards.forEach((c, i) => {
    const x = 14 + i * 47;
    doc.setFillColor(23, 37, 23);
    doc.roundedRect(x, y, 43, 22, 3, 3, 'F');
    doc.setDrawColor(...c.color);
    doc.setLineWidth(0.8);
    doc.line(x, y, x+43, y);
    doc.setFontSize(7);
    doc.setTextColor(138,176,138);
    doc.setFont('helvetica','normal');
    doc.text(c.label.toUpperCase(), x+21.5, y+8, { align:'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...c.color);
    doc.text(c.val, x+21.5, y+17, { align:'center' });
  });
  return y + 30;
}

function pdfFooter(doc) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(13, 26, 13);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(138, 176, 138);
    doc.text('Finca Platano — Sistema Contable Digital', 14, 292);
    doc.text(`Pagina ${i} de ${total}`, 196, 292, { align:'right' });
  }
}

function generarPDFCompleto() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const datos = calcularSaldos(cargarDatos());
  let y = pdfHeader(doc, 'Reporte Completo de Movimientos');
  y = pdfResumenCards(doc, y, datos);
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(126,219,106);
  doc.text('DETALLE DE TRANSACCIONES', 14, y); y += 4;
  doc.autoTable({
    startY: y,
    head: [['#','Fecha','Descripcion','Cat.','Cant.','Precio','Ingreso','Costo','Saldo']],
    body: datos.map((t,i) => [
      i+1, formatFecha(t.fecha), t.desc, t.cat,
      t.cantidad > 0 ? t.cantidad.toLocaleString('es-CO') : '—',
      t.precio   > 0 ? fmt(t.precio)   : '—',
      t.ingreso  > 0 ? fmt(t.ingreso)  : '—',
      t.costo    > 0 ? fmt(t.costo)    : '—',
      fmtSigned(t.saldo)
    ]),
    styles: { fontSize:7.5, cellPadding:3, textColor:[232,245,232], fillColor:[17,31,17], lineColor:[42,61,42], lineWidth:0.3 },
    headStyles: { fillColor:[23,37,23], textColor:[138,176,138], fontStyle:'bold', fontSize:7 },
    alternateRowStyles: { fillColor:[13,26,13] },
    columnStyles: {
      0:{cellWidth:8,  halign:'center'},
      1:{cellWidth:20},
      2:{cellWidth:52},
      3:{cellWidth:14, halign:'center'},
      4:{cellWidth:14, halign:'right'},
      5:{cellWidth:20, halign:'right'},
      6:{cellWidth:22, halign:'right', textColor:[126,219,106]},
      7:{cellWidth:22, halign:'right', textColor:[224,82,82]},
      8:{cellWidth:22, halign:'right', textColor:[245,200,66]},
    }
  });
  pdfFooter(doc);
  doc.save('finca_platano_completo_' + hoy() + '.pdf');
}

function generarPDFResumen() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const datos = calcularSaldos(cargarDatos());
  let y = pdfHeader(doc, 'Resumen Mensual');
  y = pdfResumenCards(doc, y, datos);
  const meses = {};
  datos.forEach(t => {
    const m = t.fecha.slice(0,7);
    if (!meses[m]) meses[m] = { ing:0, cos:0, tx:0 };
    meses[m].ing += t.ingreso; meses[m].cos += t.costo; meses[m].tx++;
  });
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(126,219,106);
  doc.text('RESUMEN POR MES', 14, y); y += 4;
  const keys = Object.keys(meses).sort();
  doc.autoTable({
    startY: y,
    head: [['Mes','Ingresos','Costos','Utilidad','Transacciones']],
    body: keys.map(m => {
      const [yr, mo] = m.split('-');
      const n = new Date(yr, mo-1).toLocaleDateString('es-CO', { month:'long', year:'numeric' });
      const u = meses[m].ing - meses[m].cos;
      return [n, fmt(meses[m].ing), fmt(meses[m].cos), fmtSigned(u), meses[m].tx];
    }),
    styles: { fontSize:9, cellPadding:4, textColor:[232,245,232], fillColor:[17,31,17], lineColor:[42,61,42], lineWidth:0.3 },
    headStyles: { fillColor:[23,37,23], textColor:[138,176,138], fontStyle:'bold' },
    alternateRowStyles: { fillColor:[13,26,13] },
    columnStyles: {
      1:{halign:'right', textColor:[126,219,106]},
      2:{halign:'right', textColor:[224,82,82]},
      3:{halign:'right', textColor:[245,200,66]},
      4:{halign:'center',textColor:[82,160,224]},
    }
  });
  pdfFooter(doc);
  doc.save('finca_platano_resumen_' + hoy() + '.pdf');
}

function generarPDFFiltrado() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const datos = getFiltered();
  let y = pdfHeader(doc, 'Reporte Filtrado');
  y = pdfResumenCards(doc, y, datos);
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(126,219,106);
  doc.text('TRANSACCIONES (Vista actual)', 14, y); y += 4;
  doc.autoTable({
    startY: y,
    head: [['#','Fecha','Descripcion','Cat.','Ingreso','Costo','Saldo']],
    body: datos.map((t,i) => [
      i+1, formatFecha(t.fecha), t.desc, t.cat,
      t.ingreso > 0 ? fmt(t.ingreso) : '—',
      t.costo   > 0 ? fmt(t.costo)   : '—',
      fmtSigned(t.saldo)
    ]),
    styles: { fontSize:8, cellPadding:3, textColor:[232,245,232], fillColor:[17,31,17], lineColor:[42,61,42], lineWidth:0.3 },
    headStyles: { fillColor:[23,37,23], textColor:[138,176,138], fontStyle:'bold' },
    alternateRowStyles: { fillColor:[13,26,13] },
    columnStyles: {
      0:{cellWidth:8, halign:'center'},
      4:{halign:'right', textColor:[126,219,106]},
      5:{halign:'right', textColor:[224,82,82]},
      6:{halign:'right', textColor:[245,200,66]},
    }
  });
  pdfFooter(doc);
  doc.save('finca_platano_filtrado_' + hoy() + '.pdf');
}

// ═══════════════════════════════════════════
//   EXPORTAR / IMPORTAR
// ═══════════════════════════════════════════
function exportarCSV() {
  const datos = calcularSaldos(cargarDatos());
  const filas = [
    ['Fecha','Descripcion','Categoria','Cantidad','Precio','Ingreso','Costo','Saldo'],
    ...datos.map(t => [t.fecha, t.desc, t.cat, t.cantidad, t.precio, t.ingreso, t.costo, t.saldo])
  ];
  descargar('finca_platano_' + hoy() + '.csv', filas.map(r => r.join(',')).join('\n'), 'text/csv');
}

function exportarJSON() {
  descargar('finca_platano_' + hoy() + '.json', JSON.stringify(cargarDatos(), null, 2), 'application/json');
}

function importarJSON() { document.getElementById('archivoImport').click(); }

function leerArchivoJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (!Array.isArray(d)) throw new Error();
      if (confirm(`¿Importar ${d.length} registros? Reemplazará los actuales.`)) {
        guardarDatos(d); renderTabla(); alert('✅ Datos importados correctamente');
      }
    } catch { alert('❌ Archivo inválido'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

function limpiarTodo() {
  if (confirm('⚠️ ¿Borrar TODOS los registros?')) { guardarDatos([]); renderTabla(); }
}

function descargar(n, c, t) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([c], { type: t }));
  a.download = n;
  a.click();
}

// ═══════════════════════════════════════════
//   MODAL — cerrar al click fuera
// ═══════════════════════════════════════════
document.getElementById('modalPDF').addEventListener('click', function(e) {
  if (e.target === this) cerrarModalPDF();
});

// ═══════════════════════════════════════════
//   INIT
// ═══════════════════════════════════════════
document.getElementById('fFecha').value = new Date().toISOString().slice(0,10);
cargarDatosIniciales();
renderTabla();