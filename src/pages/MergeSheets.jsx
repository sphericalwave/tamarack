import { useState, useRef } from 'react';
import XLSX from 'xlsx-js-style';
import { parseHours, parseExpenses } from '../lib/parseSheets.js';

const SHEET_NAMES = ['Hours', 'Expenses', 'Projects', 'Employees'];
const CURRENCY_COLS = new Set(['Expense Amount', 'Tax', 'Tip', 'Total']);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DATE_RE = /^\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/;

function fmtDate(s) { return typeof s === 'string' ? s : ''; }

function isDateStr(v) { return typeof v === 'string' && DATE_RE.test(v); }

function dateStrToSerial(s) {
  const [d, m, y] = s.split('-');
  return Date.UTC(2000 + parseInt(y), MONTHS.indexOf(m), parseInt(d)) / 86400000 + 25569;
}

function parseProjects(wb) {
  const ws = wb.Sheets['Sheet1'];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function parseEmployees(ws) {
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return raw.filter(r => r['Employee'] && String(r['Employee']).trim());
}

async function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        resolve({
          name: file.name,
          rows: {
            Hours:     parseHours(wb.Sheets['Hours']),
            Expenses:  parseExpenses(wb.Sheets['Expenses']),
            Projects:  parseProjects(wb),
            Employees: parseEmployees(wb.Sheets['Employees']),
          },
        });
      } catch (err) {
        reject(new Error(`Could not parse ${file.name}: ${err.message}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function withSeq(rows, start = 1) {
  return rows.map((r, i) => ({ Seq: i + start, ...r }));
}

function dedup(rows, keyFn) {
  const seen = new Set();
  return rows.filter(r => {
    const k = keyFn(r);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function colWidths(rows) {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0]);
  return cols.map(col => {
    const maxLen = Math.max(
      col.length,
      ...rows.map(r => {
        const v = r[col];
        if (isDateStr(v)) return 9; // dd-mmm-yy
        return String(v ?? '').length;
      })
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
}

function applyDateFormat(ws) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const dateCols = new Set();
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell?.v != null && /^date$/i.test(String(cell.v))) dateCols.add(C);
  }
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (const C of dateCols) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[ref];
      if (cell) cell.z = 'DD-MMM-YY';
    }
  }
}


function applyCurrencyFormat(ws, headers) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const currCols = headers.reduce((acc, h, i) => { if (CURRENCY_COLS.has(h)) acc.push(i); return acc; }, []);
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (const C of currCols) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[ref];
      if (cell && cell.t === 'n') cell.z = '$#,##0.00';
    }
  }
}

const HEADER_FILL  = { patternType: 'solid', fgColor: { rgb: '556B2F' } };
const HEADER_FONT  = { color: { rgb: 'FFFFFF' }, bold: true };
const CELL_BORDER  = {
  top:    { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left:   { style: 'thin', color: { rgb: '000000' } },
  right:  { style: 'thin', color: { rgb: '000000' } },
};

const EMPTY_FILL = { patternType: 'solid', fgColor: { rgb: 'FF4D4D' } }; // red @ 0.7 opacity over white

// Borders on all cells, green header, red Seq, red-highlight empty cols, autofilter
function applyStyles(ws, hasSeq, emptyHighlight = []) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Map header names → column indices
  const headerToCol = {};
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell?.v != null) headerToCol[String(cell.v)] = C;
  }
  const emptyCols = new Set(emptyHighlight.map(h => headerToCol[h]).filter(i => i !== undefined));

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      if (R === range.s.r) {
        const cell = ws[ref];
        if (cell) cell.s = { fill: HEADER_FILL, font: HEADER_FONT, border: CELL_BORDER };
      } else if (emptyCols.has(C)) {
        const cell = ws[ref];
        const isEmpty = !cell || cell.v == null || String(cell.v).trim() === '';
        if (isEmpty) {
          ws[ref] = { ...(cell ?? { t: 's', v: '' }), s: { fill: EMPTY_FILL, border: CELL_BORDER } };
        } else {
          cell.s = { border: CELL_BORDER };
        }
      } else {
        const cell = ws[ref];
        if (!cell) continue;
        cell.s = hasSeq && C === 0
          ? { font: { color: { rgb: 'FF0000' } }, border: CELL_BORDER }
          : { border: CELL_BORDER };
      }
    }
  }
  ws['!autofilter'] = { ref: ws['!ref'] };
}

function cellDisplay(col, val) {
  if (isDateStr(val)) return fmtDate(val);
  if (CURRENCY_COLS.has(col) && typeof val === 'number')
    return val.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  return String(val ?? '');
}

function PreviewTable({ rows }) {
  if (!rows.length) return <p className="empty-state">No rows</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? '#fff' : 'var(--color-surface)' }}>
              {cols.map((c, ci) => (
                <td key={c} style={{
                  padding: '7px 12px',
                  whiteSpace: 'nowrap',
                  maxWidth: '280px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: ci === 0 && c === 'Seq' ? '#cc0000' : undefined,
                  fontWeight: ci === 0 && c === 'Seq' ? 600 : undefined,
                }}>
                  {cellDisplay(c, row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MergeSheets() {
  const [files, setFiles]         = useState([]);
  const [activeTab, setActiveTab] = useState('Hours');
  const [dragging, setDragging]   = useState(false);
  const [errors, setErrors]       = useState([]);
  const [timeSeqStart, setTimeSeqStart] = useState(1);
  const [expSeqStart,  setExpSeqStart]  = useState(1);
  const inputRef = useRef();

  const raw = files.reduce(
    (acc, f) => {
      for (const name of SHEET_NAMES) acc[name] = [...acc[name], ...f.rows[name]];
      return acc;
    },
    { Hours: [], Expenses: [], Projects: [], Employees: [] }
  );

  const byEmployee = rows => [...rows].sort((a, b) => a.Employee.localeCompare(b.Employee));

  const merged = {
    Hours:     withSeq(byEmployee(raw.Hours),    timeSeqStart),
    Expenses:  withSeq(byEmployee(raw.Expenses), expSeqStart),
    Projects:  dedup(raw.Projects,  r => r['PROJECT']),
    Employees: dedup(raw.Employees, r => r['Employee']),
  };

  async function handleFiles(fileList) {
    const newFiles = [...fileList].filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (!newFiles.length) return;
    const existingNames = new Set(files.map(f => f.name));
    const toProcess = newFiles.filter(f => !existingNames.has(f.name));
    if (!toProcess.length) return;
    const results = await Promise.allSettled(toProcess.map(parseWorkbook));
    const ok = [], errs = [];
    for (const r of results) {
      if (r.status === 'fulfilled') ok.push(r.value);
      else errs.push(r.reason.message);
    }
    if (ok.length) setFiles(prev => [...prev, ...ok]);
    if (errs.length) setErrors(prev => [...prev, ...errs]);
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function download() {
    const wb = XLSX.utils.book_new();
    for (const name of SHEET_NAMES) {
      const serialized = merged[name].map(r => {
        const out = {};
        for (const [k, v] of Object.entries(r))
          out[k] = isDateStr(v) ? dateStrToSerial(v) : v;
        return out;
      });
      const rows = merged[name];
      const ws = serialized.length
        ? XLSX.utils.json_to_sheet(serialized)
        : XLSX.utils.aoa_to_sheet([[]]);
      if (serialized.length) {
        const headers = Object.keys(rows[0]);
        ws['!cols'] = colWidths(rows);
        applyDateFormat(ws);

        if (name === 'Expenses') applyCurrencyFormat(ws, headers);
        const emptyHighlight = name === 'Hours' ? ['Project', 'Phase']
          : name === 'Expenses' ? ['Project', 'Expense Amount', 'Total', 'Tax Rate'] : [];
        applyStyles(ws, name === 'Hours' || name === 'Expenses', emptyHighlight);
      }
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
    XLSX.writeFile(wb, 'master-timesheet.xlsx');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const seqInput = (label, val, set) => (
    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <input
        type="number"
        min="1"
        value={val}
        onChange={e => set(Math.max(1, parseInt(e.target.value) || 1))}
        style={{ width: '64px', padding: '4px 6px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '13px' }}
      />
    </label>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Merge Timesheets</h1>
        <p>Upload employee Excel workbooks to merge Hours, Expenses, Projects, and Employees sheets into one master file.</p>
      </div>

      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius)',
          background: dragging ? '#f0f5e8' : 'var(--color-surface)',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          marginBottom: '24px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Drop .xlsx files here or click to browse</div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Workbooks must contain sheets named Hours, Expenses, Projects, Employees</div>
      </div>

      {errors.map((err, i) => (
        <div key={i} className="toast toast-error" style={{ position: 'static', marginBottom: '8px' }}>{err}</div>
      ))}

      {files.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} loaded
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '13px' }}>
              — {merged.Hours.length} hours entries · {merged.Expenses.length} expenses · {merged.Projects.length} projects · {merged.Employees.length} employees
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>File</th>
                {['Hours', 'Expenses'].map(n => (
                  <th key={n} style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>{n}</th>
                ))}
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{f.name}</td>
                  {['Hours', 'Expenses'].map(n => (
                    <td key={n} style={{ padding: '7px 8px', textAlign: 'right', color: f.rows[n].length ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {f.rows[n].length}
                    </td>
                  ))}
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                    <button onClick={() => removeFile(f.name)} className="btn btn-danger btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {files.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {SHEET_NAMES.map(name => (
                <button
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className={activeTab === name ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                >
                  {name} <span style={{ opacity: 0.7, marginLeft: '4px' }}>({merged[name].length})</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {seqInput('Time Seq #', timeSeqStart, setTimeSeqStart)}
              {seqInput('Expense Seq #', expSeqStart, setExpSeqStart)}
              <button className="btn btn-primary" onClick={download}>↓ Download Master Sheet</button>
            </div>
          </div>
          <PreviewTable rows={merged[activeTab]} />
        </div>
      )}
    </div>
  );
}
