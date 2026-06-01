import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItem, setItem, uid } from '../hooks/useStorage';

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

function formatDateDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
    opts.push({ val, label });
  }
  return opts;
}

const MONTH_OPTIONS = getMonthOptions();

const blank = { projectId: '', phase: '', date: '', hours: '', billingNotes: '' };

export default function TimeEntry() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].val);

  const allProjects = getItem('tm_projects') || [];
  const projects = allProjects.filter(p => p.status === 'active');
  const selectedProject = projects.find(p => p.id === form.projectId);
  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  const allEntries = (getItem('tm_time_entries') || []).filter(e => e.employeeId === currentUser.id);
  const monthEntries = [...allEntries]
    .filter(e => e.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));
  const monthHours = monthEntries.reduce((sum, e) => sum + e.hours, 0);

  function set(field, value) {
    setForm(f => ({
      ...f,
      [field]: value,
      ...(field === 'projectId' ? { phase: '' } : {}),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.projectId || !form.phase || !form.date || !form.hours) {
      setToast({ msg: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    const entries = getItem('tm_time_entries') || [];
    entries.push({
      id: uid(),
      employeeId: currentUser.id,
      projectId: form.projectId,
      phase: form.phase,
      date: form.date,
      hours: parseFloat(form.hours),
      billingNotes: form.billingNotes,
      createdAt: new Date().toISOString(),
    });
    setItem('tm_time_entries', entries);
    setForm(blank);
    setToast({ msg: 'Time entry saved.', type: 'success' });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Time Entry</h1>
        <p>Log hours against a project and phase.</p>
      </div>

      <div className="grid-form-list">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Employee</label>
              <input type="text" value={currentUser.name} readOnly />
            </div>

            <div className="form-group">
              <label>Project *</label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} required>
                <option value="">— Choose project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Phase *</label>
              <select
                value={form.phase}
                onChange={e => set('phase', e.target.value)}
                required
                disabled={!selectedProject}
              >
                <option value="">— Select project first —</option>
                {(selectedProject?.phases || []).map(ph => (
                  <option key={ph} value={ph}>{ph}</option>
                ))}
              </select>
              <span className="form-hint">Select the applicable phase for this work.</span>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
              {form.date && (
                <span className="form-hint">{formatDateDisplay(form.date)}</span>
              )}
            </div>

            <div className="form-group">
              <label>Hours *</label>
              <input
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={form.hours}
                onChange={e => set('hours', e.target.value)}
                placeholder="e.g. 4.5"
                required
              />
            </div>

            <div className="form-group">
              <label>Billing Notes</label>
              <textarea
                value={form.billingNotes}
                onChange={e => set('billingNotes', e.target.value)}
                placeholder="Include description of activities completed"
                rows={4}
              />
            </div>

            <button type="submit" className="btn btn-primary">Save Entry</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-nav)', fontSize: '15px' }}>
              {monthHours.toFixed(1)} hrs logged
            </div>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: '6px 10px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '13px', background: '#fff', color: 'var(--color-text)' }}
            >
              {MONTH_OPTIONS.map(o => (
                <option key={o.val} value={o.val}>{o.label}</option>
              ))}
            </select>
          </div>

          {monthEntries.length === 0 ? (
            <div className="empty-state">No time entries for this month.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Phase</th>
                    <th>Hours</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {monthEntries.map(e => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                      <td>{projectMap[e.projectId] || e.projectId}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{e.phase}</td>
                      <td style={{ fontWeight: 700 }}>{e.hours}</td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>{e.billingNotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
