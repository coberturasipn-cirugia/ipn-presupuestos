// ═══════════════════════════════════════════════════
// IPN – Apps Script para Google Sheets
// Pegá todo este código en Apps Script de tu planilla
// ═══════════════════════════════════════════════════

const SHEET_ID   = '1LN3E3wTTJVNajpNSuPmhpI513PQSOeU0zRy-yOXdJxw';
const SHEET_NAME = 'Presupuestos';

// ── Cabeceras de la planilla ─────────────────────────
const HEADERS = [
  'N°', 'Fecha', 'Nombre Paciente', 'Seguro', 'Plan',
  'Cirugía', 'Cirujano', 'Celular', 'Email', 'Padre/Madre',
  'Total General (Gs)', 'Cant. Ítems',
  'Ítems Detalle', 'Observaciones',
  'Fecha Creación', 'Fecha Modificación', 'Estado'
];

// ── Entry point: maneja GET y POST ───────────────────
function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'save')   return respond(savePresupuesto(data.payload));
    if (action === 'getAll') return respond(getAllPresupuestos());
    if (action === 'search') return respond(searchPresupuestos(data.query));
    if (action === 'delete') return respond(deletePresupuesto(data.nro));

    return respond({ ok: false, error: 'Acción desconocida' });
  } catch(err) {
    return respond({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action || 'getAll';
  if (action === 'getAll') return respond(getAllPresupuestos());
  if (action === 'search') return respond(searchPresupuestos(e.parameter.q || ''));
  return respond({ ok: false, error: 'Acción GET no soportada' });
}

// ── Guardar / actualizar presupuesto ─────────────────
function savePresupuesto(p) {
  const sheet = getOrCreateSheet();

  // Calcular total y armar resumen de ítems
  const total     = (p.rows || []).reduce((s, r) => s + (r.qty || 0) * (r.price || 0), 0);
  const itemsCon  = (p.rows || []).filter(r => (r.qty || 0) * (r.price || 0) > 0);
  const itemsText = itemsCon.map(r =>
    `${r.concepto}: Gs ${Math.round((r.qty||0)*(r.price||0)).toLocaleString('es-PY')}`
  ).join(' | ');

  const now    = new Date();
  const stamp  = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm');
  const nro    = String(p.nro || '').padStart(4, '0');

  const newRow = [
    nro,                              // N°
    p.fecha         || '',            // Fecha
    p.nombre        || '',            // Nombre
    p.seguro        || '',            // Seguro
    p.plan          || '',            // Plan
    p.cirugia       || '',            // Cirugía
    p.cirujano      || '',            // Cirujano
    p.celular       || '',            // Celular
    p.email         || '',            // Email
    p.padre         || '',            // Padre/Madre
    total,                            // Total
    itemsCon.length,                  // Cant ítems
    itemsText,                        // Detalle
    p.obs           || '',            // Observaciones
    p.createdAt     || stamp,         // Creado
    stamp,                            // Modificado
    p.isModified ? 'Modificado' : 'Original'
  ];

  // Buscar si ya existe para actualizar
  const data    = sheet.getDataRange().getValues();
  let   rowIdx  = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === nro) { rowIdx = i + 1; break; }
  }

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
    applyRowStyle(sheet, rowIdx, p.isModified);
    return { ok: true, action: 'updated', nro };
  } else {
    sheet.appendRow(newRow);
    const lastRow = sheet.getLastRow();
    applyRowStyle(sheet, lastRow, p.isModified);
    return { ok: true, action: 'created', nro };
  }
}

// ── Traer todos ───────────────────────────────────────
function getAllPresupuestos() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, rows: [] };

  const rows = data.slice(1).map(r => rowToObj(r)).reverse(); // más recientes primero
  return { ok: true, rows };
}

// ── Buscar ────────────────────────────────────────────
function searchPresupuestos(q) {
  const all    = getAllPresupuestos();
  if (!q || !q.trim()) return all;
  const term   = q.toLowerCase().trim();
  const result = all.rows.filter(r =>
    String(r.nro).includes(term)         ||
    (r.nombre   ||'').toLowerCase().includes(term) ||
    (r.cirugia  ||'').toLowerCase().includes(term) ||
    (r.seguro   ||'').toLowerCase().includes(term) ||
    (r.cirujano ||'').toLowerCase().includes(term)
  );
  return { ok: true, rows: result };
}

// ── Eliminar ──────────────────────────────────────────
function deletePresupuesto(nro) {
  const sheet  = getOrCreateSheet();
  const data   = sheet.getDataRange().getValues();
  const padded = String(nro).padStart(4,'0');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === padded) {
      sheet.deleteRow(i + 1);
      return { ok: true, deleted: padded };
    }
  }
  return { ok: false, error: 'No encontrado' };
}

// ── Helpers ───────────────────────────────────────────
function rowToObj(r) {
  return {
    nro:          r[0],  fecha:       r[1],  nombre:   r[2],
    seguro:       r[3],  plan:        r[4],  cirugia:  r[5],
    cirujano:     r[6],  celular:     r[7],  email:    r[8],
    padre:        r[9],  total:       r[10], cantItems: r[11],
    items:        r[12], obs:         r[13],
    createdAt:    r[14], modifiedAt:  r[15], estado:   r[16]
  };
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Cabeceras
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // Estilo cabecera
    const hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setBackground('#0D47A1');
    hdr.setFontColor('#FFFFFF');
    hdr.setFontWeight('bold');
    hdr.setFontSize(10);
    // Anchos de columna
    sheet.setColumnWidth(1, 50);   // N°
    sheet.setColumnWidth(2, 90);   // Fecha
    sheet.setColumnWidth(3, 200);  // Nombre
    sheet.setColumnWidth(4, 120);  // Seguro
    sheet.setColumnWidth(5, 80);   // Plan
    sheet.setColumnWidth(6, 160);  // Cirugía
    sheet.setColumnWidth(7, 140);  // Cirujano
    sheet.setColumnWidth(8, 110);  // Celular
    sheet.setColumnWidth(9, 150);  // Email
    sheet.setColumnWidth(10, 130); // Padre
    sheet.setColumnWidth(11, 130); // Total
    sheet.setColumnWidth(12, 60);  // Cant
    sheet.setColumnWidth(13, 350); // Ítems
    sheet.setColumnWidth(14, 200); // Obs
    sheet.setColumnWidth(15, 130); // Creado
    sheet.setColumnWidth(16, 130); // Modificado
    sheet.setColumnWidth(17, 90);  // Estado
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function applyRowStyle(sheet, rowIdx, isModified) {
  const range = sheet.getRange(rowIdx, 1, 1, HEADERS.length);
  range.setBackground(isModified ? '#FFF3E0' : '#F8FFF8');
  // Columna total en negrita y azul
  sheet.getRange(rowIdx, 11).setFontWeight('bold').setFontColor('#0D47A1');
  // Estado
  const estadoCell = sheet.getRange(rowIdx, 17);
  estadoCell.setFontColor(isModified ? '#E65100' : '#2E7D32');
  estadoCell.setFontWeight('bold');
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
