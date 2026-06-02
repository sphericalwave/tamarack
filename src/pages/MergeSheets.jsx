import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const SHEET_NAMES = ['Hours', 'Expenses', 'Projects', 'Employees'];

// Excel date serial → YYYY-MM-DD
function excelDate(serial) {
  if (typeof serial !== 'number' || serial < 40000) return '';
  const d = new Date((serial - 25569) * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function str(v) { return String(v ?? '').trim(); }

// Hours: multiline column names, tons of __EMPTY_* formula columns, blanks at bottom
function parseHours(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (!raw.length) return [];
  const keys = Object.keys(raw[0]);
  const empKey   = keys.find(k => /^Employee/i.test(k));
  const projKey  = keys.find(k => /^Project/i.test(k));
  const phaseKey = keys.find(k => /^Phase/i.test(k));
  const dateKey  = keys.find(k => /^Date/i.test(k));
  const hoursKey = keys.find(k => k === 'Hours');
  const notesKey = keys.find(k => /^Billing Notes/i.test(k));
  if (!empKey || !hoursKey || !dateKey) return [];

  return raw
    .filter(r => {
      const emp = r[empKey];
      const hrs = r[hoursKey];
      const dt  = r[dateKey];
      // Valid row: short employee code (initials, no newlines), numeric date serial, positive hours
      return typeof emp === 'string' && emp.trim() && !emp.includes('\n') && emp.length <= 12 &&
             typeof dt  === 'number' && dt  > 40000 &&
             typeof hrs === 'number' && hrs  > 0;
    })
    .map(r => ({
      Employee:       str(r[empKey]),
      Project:        str(r[projKey]),
      Phase:          str(r[phaseKey]),
      Date:           excelDate(r[dateKey]),
      Hours:          r[hoursKey],
      'Billing Notes': str(r[notesKey]),
    }));
}

// Expenses: rows 0-1 are instruction/header rows; real data at row 2+; all columns __EMPTY_*
// Col layout: 0=Staff, 1=Project, 2=Date, 3=Amount, 4=Tax, 5=Tip, 6=Total, 7=Notes, 8=Province, 9=Payment
function parseExpenses(ws) {
  const arrays = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return arrays.slice(2)
    .filter(r => {
      const emp = r[0];
      return typeof emp === 'string' && emp.trim() && emp.length <= 12 &&
             !emp.includes('Staff') && !emp.includes('INSTRUCTIONS');
    })
    .map(r => ({
      Employee:         str(r[0]),
      Project:          str(r[1]),
      Date:             excelDate(typeof r[2] === 'number' ? r[2] : null),
      'Expense Amount': typeof r[3] === 'number' ? r[3] : '',
      Tax:              typeof r[4] === 'number' ? r[4] : '',
      Tip:              typeof r[5] === 'number' ? r[5] : '',
      Total:            typeof r[6] === 'number' ? r[6] : '',
      'Vendor and Notes': str(r[7]),
      'Tax Rate':       str(r[8]),
      'Payment Type':   str(r[9]),
    }))
    .filter(r => r.Employee !== '' && r.Total !== '' && r.Total > 0);
}

// Projects: Sheet1 has clean column headers (PROJECT, Phase, Phase_1, ...)
// Deduplicate by project name across files
function parseProjects(wb) {
  const ws = wb.Sheets['Sheet1'];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// Employees: just the Employee column, deduplicate
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

// Add Seq column as first key
function withSeq(rows) {
  return rows.map((r, i) => ({ Seq: i + 1, ...r }));
}

// Deduplicate rows for Projects and Employees (same data in every file)
function dedup(rows, keyFn) {
  const seen = new Set();
  return rows.filter(r => {
    const k = keyFn(r);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
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
              {cols.map(c => (
                <td key={c} style={{ padding: '7px 12px', whiteSpace: 'nowrap', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {String(row[c] ?? '')}
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
  const [files, setFiles]       = useState([]);
  const [activeTab, setActiveTab] = useState('Hours');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors]     = useState([]);
  const inputRef = useRef();

  const raw = files.reduce(
    (acc, f) => {
      for (const name of SHEET_NAMES) acc[name] = [...acc[name], ...f.rows[name]];
      return acc;
    },
    { Hours: [], Expenses: [], Projects: [], Employees: [] }
  );

  const merged = {
    Hours:     withSeq(raw.Hours),
    Expenses:  withSeq(raw.Expenses),
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
      const rows = merged[name];
      const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([[]]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
    XLSX.writeFile(wb, 'master-timesheet.xlsx');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

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
                {SHEET_NAMES.map(n => (
                  <th key={n} style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>{n}</th>
                ))}
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{f.name}</td>
                  {SHEET_NAMES.map(n => (
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
            <div style={{ display: 'flex', gap: '4px' }}>
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
            <button className="btn btn-primary" onClick={download}>↓ Download Master Sheet</button>
          </div>
          <PreviewTable rows={merged[activeTab]} />
        </div>
      )}
    </div>
  );
}
