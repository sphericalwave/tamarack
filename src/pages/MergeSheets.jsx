import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const SHEET_NAMES = ['Hours', 'Expenses', 'Projects', 'Employees'];

function isBlankRow(row) {
  return Object.values(row).every(v => v === '' || v === null || v === undefined);
}

async function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const rows = {};
        for (const name of SHEET_NAMES) {
          const ws = wb.Sheets[name];
          rows[name] = ws
            ? XLSX.utils.sheet_to_json(ws, { defval: '' }).filter(r => !isBlankRow(r))
            : [];
        }
        resolve({ name: file.name, rows });
      } catch (err) {
        reject(new Error(`Could not parse ${file.name}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function PreviewTable({ rows }) {
  if (!rows.length) {
    return <p className="empty-state">No rows</p>;
  }
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
                <td key={c} style={{ padding: '7px 12px', whiteSpace: 'nowrap', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('Hours');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef();

  const merged = files.reduce(
    (acc, f) => {
      for (const name of SHEET_NAMES) {
        acc[name] = [...acc[name], ...f.rows[name]];
      }
      return acc;
    },
    { Hours: [], Expenses: [], Projects: [], Employees: [] }
  );

  const totalRows = SHEET_NAMES.reduce((sum, n) => sum + merged[n].length, 0);

  async function handleFiles(fileList) {
    const newFiles = [...fileList].filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (!newFiles.length) return;

    const existingNames = new Set(files.map(f => f.name));
    const toProcess = newFiles.filter(f => !existingNames.has(f.name));
    if (!toProcess.length) return;

    const results = await Promise.allSettled(toProcess.map(parseWorkbook));
    const ok = [];
    const errs = [];
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
      const ws = rows.length
        ? XLSX.utils.json_to_sheet(rows)
        : XLSX.utils.aoa_to_sheet([[]]);
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

      {/* Drop zone */}
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

      {/* Errors */}
      {errors.map((err, i) => (
        <div key={i} className="toast toast-error" style={{ position: 'static', marginBottom: '8px' }}>{err}</div>
      ))}

      {/* File list */}
      {files.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} loaded
            {totalRows > 0 && (
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '13px' }}>
                — {merged.Hours.length} hours entries · {merged.Expenses.length} expenses · {merged.Projects.length} projects · {merged.Employees.length} employees
              </span>
            )}
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
                    <button
                      onClick={() => removeFile(f.name)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview + download */}
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
            <button className="btn btn-primary" onClick={download}>
              ↓ Download Master Sheet
            </button>
          </div>
          <PreviewTable rows={merged[activeTab]} />
        </div>
      )}
    </div>
  );
}
