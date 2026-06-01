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

function formatDateDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

const blank = { projectId: '', phase: '', date: '', hours: '', billingNotes: '' };

export default function TimeEntry() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState(null);
  const projects = (getItem('tm_projects') || []).filter(p => p.status === 'active');
  const selectedProject = projects.find(p => p.id === form.projectId);

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

      <div className="card" style={{ maxWidth: '560px' }}>
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

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
