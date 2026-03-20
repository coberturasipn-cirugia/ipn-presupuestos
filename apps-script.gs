// ═══════════════════════════════════════════════════════════════
// IPN – Apps Script para Google Sheets
// VERSIÓN 2 — acepta GET para guardar (evita CORS)
// Reemplazá todo el código anterior con este
// ═══════════════════════════════════════════════════════════════

const SHEET_ID   = '1LN3E3wTTJVNajpNSuPmhpI513PQSOeU0zRy-yOXdJxw';
const SHEET_NAME = 'Presupuestos';

const HEADERS = [
  'N°', 'Fecha', 'Nombre Paciente', 'Seguro', 'Plan',
  'Cirugía', 'Cirujano', 'Celular', 'Email', 'Padre/Madre',
  'Total General (Gs)', 'Cant. Ítems', 'Ítems Detalle',
  'Observaciones', 'Fecha Creación', 'Fecha Modificación', 'Estado'
];

// ── Maneja GET (leer Y guardar) ──────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || '';

    // Guardar via GET (datos en parámetro ?data=)
    if (e.parameter.data) {
      const parsed = JSON.parse(decodeURIComponent(e.parameter.data));
      if (parsed.action === 'save') {
        return respond(savePresupuesto(parsed.payload));
      }
    }

    if (action === 'getAll')  return respond(getAllPresupuestos());
    if (action === 'search')  return respond(searchPresupuestos(e.parameter.q || ''));
    if (action === 'delete')  return respond(deletePresupuesto(e.parameter.nro));
    if (action === 'ping')    return respond({ ok: true, msg: 'IPN Sheets OK' });

    // Default: devolver todos
    return respond(getAllPresupuestos());

  } catch(err) {
    return respond({ ok: false, error: err.toString() });
  }
}

// ── Maneja POST (alternativa) ────────────────────────────────
function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'save')   return respond(savePresupuesto(data.payload));
    if (action === 'getAll') return respond(getAllPresupuestos());
    if (action === 'search') return respond(searchPresupuestos(data.query || ''));
    if (action === 'delete') return respond(deletePresupuesto(data.nro));
    return respond({ ok: false, error: 'Acción desconocida' });
  } catch(err) {
    return respond({ ok: false, error: err.toString() });
  }
}

// ── Guardar / actualizar ─────────────────────────────────────
function savePresupuesto(p) {
  const sheet   = getOrCreateSheet();
  const total   = (p.rows || []).reduce((s, r) => s + (r.qty || 0) * (r.price || 0), 0);
  const itemsCon = (p.rows || []).filter(r => (r.qty || 0) * (r.price || 0) > 0);
  const itemsText = itemsCon.map(r =>
    `${r.concepto}: Gs ${Math.round((r.qty||0)*(r.price||0)).toLocaleString('es-PY')}`
  ).join(' | ');

  const now   = new Date();
  const stamp = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm');
  const nro   = String(p.nro || '').padStart(4, '0');

  const newRow = [
    nro, p.fecha||'', p.nombre||'', p.seguro||'', p.plan||'',
    p.cirugia||'', p.cirujano||'', p.celular||'', p.email||'', p.padre||'',
    total, itemsCon.length, itemsText, p.obs||'',
    p.createdAt||stamp, stamp,
    p.isModified ? 'Modificado' : 'Original'
  ];

  // Buscar fila existente por N°
  const data   = sheet.getDataRange().getValues();
  let   rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === nro) { rowIdx = i + 1; break; }
  }

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
    applyRowStyle(sheet, rowIdx, p.isModified);
    return { ok: true, action: 'updated', nro };
  } else {
    sheet.appendRow(newRow);
    applyRowStyle(sheet, sheet.getLastRow(), p.isModified);
    return { ok: true, action: 'created', nro };
  }
}

// ── Traer todos ──────────────────────────────────────────────
function getAllPresupuestos() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, rows: [] };
  const rows = data.slice(1).map(r => rowToObj(r)).reverse();
  return { ok: true, rows };
}

// ── Buscar ───────────────────────────────────────────────────
function searchPresupuestos(q) {
  const all  = getAllPresupuestos();
  if (!q || !q.trim()) return all;
  const term = q.toLowerCase().trim();
  return {
    ok: true,
    rows: all.rows.filter(r =>
      String(r.nro).includes(term) ||
      (r.nombre  ||'').toLowerCase().includes(term) ||
      (r.cirugia ||'').toLowerCase().includes(term) ||
      (r.seguro  ||'').toLowerCase().includes(term) ||
      (r.cirujano||'').toLowerCase().includes(term)
    )
  };
}

// ── Eliminar ─────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────
function rowToObj(r) {
  return {
    nro: r[0], fecha: r[1], nombre: r[2], seguro: r[3], plan: r[4],
    cirugia: r[5], cirujano: r[6], celular: r[7], email: r[8], padre: r[9],
    total: r[10], cantItems: r[11], items: r[12], obs: r[13],
    createdAt: r[14], modifiedAt: r[15], estado: r[16]
  };
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setValues([HEADERS]);
    hdr.setBackground('#0D47A1').setFontColor('#FFFFFF')
       .setFontWeight('bold').setFontSize(10);
    [50,90,200,120,80,160,140,110,150,130,130,60,350,200,130,130,90]
      .forEach((w,i) => sheet.setColumnWidth(i+1, w));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function applyRowStyle(sheet, rowIdx, isModified) {
  const range = sheet.getRange(rowIdx, 1, 1, HEADERS.length);
  range.setBackground(isModified ? '#FFF3E0' : '#F0FFF4');
  sheet.getRange(rowIdx, 11).setFontWeight('bold').setFontColor('#0D47A1');
  const est = sheet.getRange(rowIdx, 17);
  est.setFontColor(isModified ? '#E65100' : '#2E7D32').setFontWeight('bold');
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
