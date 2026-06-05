import { useState } from 'react';
import { getItem, setItem, uid } from '../hooks/useStorage';

function useProjects() {
  const [projects, setProjectsState] = useState(() => getItem('tm_projects') || []);
  function save(updated) {
    setItem('tm_projects', updated);
    setProjectsState(updated);
  }
  return [projects, save];
}

function useUsers() {
  const [users, setUsersState] = useState(() => getItem('tm_users') || []);
  function save(updated) {
    setItem('tm_users', updated);
    setUsersState(updated);
  }
  return [users, save];
}

function fmt(n) {
  return '$' + (n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProjectsTab() {
  const [projects, saveProjects] = useProjects();
  const [users] = useUsers();
  const [newName, setNewName] = useState('');
  const [newPmId, setNewPmId] = useState('');
  const pms = users.filter(u => u.role === 'pm');
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const userObjMap = Object.fromEntries(users.map(u => [u.id, u]));

  const budgets = getItem('tm_phase_budgets') || {};
  const timeEntries = getItem('tm_time_entries') || [];
  const expenses = getItem('tm_expenses') || [];

  function financials(p) {
    const pb = budgets[p.id] || {};
    const contracted = Object.values(pb).reduce((s, b) => s + (b.fees || 0) + (b.expenses || 0), 0);
    const spentFees = timeEntries
      .filter(t => t.projectId === p.id)
      .reduce((s, t) => s + t.hours * (userObjMap[t.employeeId]?.rate || 125), 0);
    const spentExp = expenses
      .filter(e => e.projectId === p.id)
      .reduce((s, e) => s + e.total, 0);
    return { contracted, spent: spentFees + spentExp };
  }

  function addProject() {
    const name = newName.trim();
    if (!name) return;
    saveProjects([...projects, { id: uid(), name, status: 'active', pmId: newPmId || null, phases: [] }]);
    setNewName('');
    setNewPmId('');
  }

  function toggleStatus(id) {
    saveProjects(projects.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'complete' : 'active' } : p
    ));
  }

  function deleteProject(id) {
    if (!confirm('Delete this project? This does not delete existing time entries.')) return;
    saveProjects(projects.filter(p => p.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New project name"
          style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '14px' }}
          onKeyDown={e => e.key === 'Enter' && addProject()}
        />
        <select
          value={newPmId}
          onChange={e => setNewPmId(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '14px', background: '#fff' }}
        >
          <option value="">— Assign PM —</option>
          {pms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={addProject}>Add Project</button>
      </div>

      {projects.length === 0 && <div className="empty-state">No projects yet.</div>}

      <table>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>PM</th>
            <th>Status</th>
            <th>Phases</th>
            <th>Contracted</th>
            <th>Spent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const { contracted, spent } = financials(p);
            const over = spent > contracted && contracted > 0;
            return (
            <tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{userMap[p.pmId] || '—'}</td>
              <td>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{p.phases.length} phase{p.phases.length !== 1 ? 's' : ''}</td>
              <td style={{ fontWeight: 600 }}>{contracted > 0 ? fmt(contracted) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
              <td style={{ fontWeight: 600, color: over ? '#c0392b' : 'inherit' }}>{spent > 0 ? fmt(spent) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn btn-sm ${p.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => toggleStatus(p.id)}
                  >
                    {p.status === 'active' ? 'Mark Complete' : 'Reactivate'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteProject(p.id)}>Delete</button>
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PhasesTab() {
  const [projects, saveProjects] = useProjects();
  const [selectedId, setSelectedId] = useState('');
  const [newPhase, setNewPhase] = useState('');

  const project = projects.find(p => p.id === selectedId);

  function addPhase() {
    const name = newPhase.trim();
    if (!name || !project) return;
    saveProjects(projects.map(p =>
      p.id === selectedId ? { ...p, phases: [...p.phases, name] } : p
    ));
    setNewPhase('');
  }

  function removePhase(idx) {
    saveProjects(projects.map(p =>
      p.id === selectedId ? { ...p, phases: p.phases.filter((_, i) => i !== idx) } : p
    ));
  }

  function movePhase(idx, dir) {
    const phases = [...project.phases];
    const target = idx + dir;
    if (target < 0 || target >= phases.length) return;
    [phases[idx], phases[target]] = [phases[target], phases[idx]];
    saveProjects(projects.map(p => p.id === selectedId ? { ...p, phases } : p));
  }

  return (
    <div>
      <div className="form-group" style={{ marginBottom: '20px', maxWidth: '360px' }}>
        <label>Select Project</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">— Choose project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {project && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newPhase}
              onChange={e => setNewPhase(e.target.value)}
              placeholder="New phase name"
              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '14px' }}
              onKeyDown={e => e.key === 'Enter' && addPhase()}
            />
            <button className="btn btn-primary" onClick={addPhase}>Add Phase</button>
          </div>

          {project.phases.length === 0
            ? <div className="empty-state">No phases yet. Add one above.</div>
            : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Phase Name</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {project.phases.map((ph, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--color-text-muted)', width: '40px' }}>{i + 1}</td>
                      <td>{ph}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => movePhase(i, -1)} disabled={i === 0}>↑</button>
                          <button className="btn btn-sm btn-outline" onClick={() => movePhase(i, 1)} disabled={i === project.phases.length - 1}>↓</button>
                          <button className="btn btn-sm btn-danger" onClick={() => removePhase(i)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </>
      )}

      {!project && selectedId && <div className="empty-state">Project not found.</div>}
    </div>
  );
}

function EmployeesTab() {
  const [users, saveUsers] = useUsers();
  const [form, setForm] = useState({ name: '', email: '', password: 'password', role: 'employee' });
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function addUser() {
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email required.');
      return;
    }
    if (users.find(u => u.email === form.email.trim().toLowerCase())) {
      setError('Email already exists.');
      return;
    }
    saveUsers([...users, {
      id: uid(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password || 'password',
      role: form.role,
    }]);
    setForm({ name: '', email: '', password: 'password', role: 'employee' });
  }

  return (
    <div>
      <div className="card" style={{ maxWidth: '480px', marginBottom: '24px' }}>
        <div style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--color-nav)' }}>Add Employee</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@tamarack.ca" />
          </div>
          <div className="form-group">
            <label>Temp Password</label>
            <input type="text" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="employee">Employee</option>
              <option value="pm">Project Manager</option>
            </select>
          </div>
        </div>
        {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}
        <button className="btn btn-primary" onClick={addUser}>Add Employee</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 600 }}>{u.name}</td>
              <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
              <td>
                <span className={`badge ${u.role === 'pm' ? 'badge-active' : 'badge-complete'}`}>
                  {u.role === 'pm' ? 'PM' : 'Employee'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'phases', label: 'Phases' },
  { id: 'employees', label: 'Employees' },
];

export default function Admin() {
  const [tab, setTab] = useState('projects');

  const tabStyle = (active) => ({
    padding: '10px 24px',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontWeight: active ? 700 : 500,
    fontSize: '14px',
    cursor: 'pointer',
  });

  return (
    <div>
      <div className="page-header">
        <h1>Admin</h1>
        <p>Manage projects, phases, and team members.</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '24px', display: 'flex' }}>
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'projects' && <ProjectsTab />}
      {tab === 'phases' && <PhasesTab />}
      {tab === 'employees' && <EmployeesTab />}
    </div>
  );
}
