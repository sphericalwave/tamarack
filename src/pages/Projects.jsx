import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getItem, setItem, uid } from '../hooks/useStorage';
import { computeProjectHours, slicesForChart } from '../lib/projectHours';

const PIE_COLORS = [
  '#2d6a4f','#40916c','#74c69d','#3a86ff',
  '#8338ec','#ff006e','#fb5607','#e9c46a',
  '#06d6a0','#118ab2',
];

function pieSlicePath(cx, cy, r, start, end) {
  if (end - start >= 2 * Math.PI - 0.001) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${(cx - 0.001).toFixed(3)} ${(cy - r).toFixed(3)} Z`;
  }
  const x1 = (cx + r * Math.cos(start)).toFixed(3);
  const y1 = (cy + r * Math.sin(start)).toFixed(3);
  const x2 = (cx + r * Math.cos(end)).toFixed(3);
  const y2 = (cy + r * Math.sin(end)).toFixed(3);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function ProjectHoursChart({ timeEntries, projects }) {
  const byProject = computeProjectHours(timeEntries, projects);
  const slices = slicesForChart(byProject, 8);
  if (!slices.length) return null;

  const total = byProject.reduce((s, p) => s + p.hours, 0);
  const cx = 100, cy = 100, r = 88;
  let cumAngle = -Math.PI / 2;
  const arcs = slices.map((slice, i) => {
    const start = cumAngle;
    cumAngle += slice.pct * 2 * Math.PI;
    return { ...slice, d: pieSlicePath(cx, cy, r, start, cumAngle), color: PIE_COLORS[i % PIE_COLORS.length] };
  });

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', padding: '20px 24px', marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        Hours by Project &ensp;·&ensp; {total % 1 === 0 ? total : total.toFixed(1)}h total
      </div>
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={200} height={200} style={{ flexShrink: 0 }}>
          {arcs.map(arc => (
            <path key={arc.id} d={arc.d} fill={arc.color} stroke="#fff" strokeWidth={1.5} />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, minWidth: 200 }}>
          {arcs.map(arc => (
            <div key={arc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: arc.color, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {arc.name}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-nav)', whiteSpace: 'nowrap' }}>
                {arc.hours % 1 === 0 ? arc.hours : arc.hours.toFixed(1)}h
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', minWidth: '40px', textAlign: 'right' }}>
                {(arc.pct * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function usePhaseBudgets() {
  const [budgets, setBudgets] = useState(() => getItem('tm_phase_budgets') || {});
  function save(updated) { setItem('tm_phase_budgets', updated); setBudgets(updated); }
  return [budgets, save];
}

function useInvoices() {
  const [invoices, setInvoices] = useState(() => getItem('tm_invoices') || []);
  function save(updated) { setItem('tm_invoices', updated); setInvoices(updated); }
  return [invoices, save];
}

function fmt(n) {
  return '$' + (n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

function getClientName(project) {
  if (project.client) return project.client;
  const i = (project.name || '').search(/\s[-–]\s/);
  return i >= 0 ? project.name.slice(0, i).trim() : project.name;
}

function Variance({ budget, spent }) {
  const diff = (budget || 0) - (spent || 0);
  const color = diff < 0 ? '#c0392b' : diff === 0 ? 'var(--color-text-muted)' : '#27ae60';
  return (
    <span style={{ fontWeight: 600, color }}>
      {diff < 0 ? '–' : '+'}{fmt(Math.abs(diff))}
    </span>
  );
}

function BudgetCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (editing) {
    return (
      <input
        type="number" min="0" value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(parseFloat(draft) || 0); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(parseFloat(draft) || 0); setEditing(false); }
          if (e.key === 'Escape') setEditing(false);
        }}
        autoFocus
        style={{ width: '96px', padding: '2px 6px', fontSize: '13px', border: '1.5px solid var(--color-primary)', borderRadius: '4px' }}
      />
    );
  }
  return (
    <span
      onClick={() => { setDraft(String(value || 0)); setEditing(true); }}
      title="Click to edit"
      style={{ cursor: 'pointer', color: value ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: '1px dashed var(--color-border)', fontStyle: value ? 'normal' : 'italic', fontSize: '13px' }}
    >
      {value ? fmt(value) : 'Set budget'}
    </span>
  );
}

function InvoicesSection({ project, allInvoices, saveInvoices }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dateSent: '', paid: false, amount: '', description: '' });

  const projectInvoices = allInvoices
    .filter(i => i.projectId === project.id)
    .sort((a, b) => b.dateSent.localeCompare(a.dateSent));

  function addInvoice() {
    if (!form.dateSent || !form.amount || !form.description.trim()) return;
    saveInvoices([...allInvoices, { id: uid(), projectId: project.id, dateSent: form.dateSent, paid: form.paid, amount: parseFloat(form.amount) || 0, description: form.description.trim() }]);
    setForm({ dateSent: '', paid: false, amount: '', description: '' });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-nav)' }}>Invoices</div>
        <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setShowForm(f => !f); }}>
          {showForm ? 'Cancel' : '+ Add Invoice'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '160px 130px 1fr 100px auto', gap: '10px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Date Sent *</label>
            <input type="date" value={form.dateSent} onChange={e => setForm(f => ({ ...f, dateSent: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Amount *</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Description *</label>
            <input type="text" placeholder="Invoice description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
              <input type="checkbox" id={`new-paid-${project.id}`} checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} />
              <label htmlFor={`new-paid-${project.id}`} style={{ fontWeight: 400, fontSize: '13px', margin: 0 }}>Paid</label>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addInvoice} style={{ marginBottom: '2px' }}>Save</button>
        </div>
      )}

      {projectInvoices.length === 0 ? (
        <div className="empty-state">No invoices yet.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Date Sent</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {projectInvoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.dateSent)}</td>
                <td>{inv.description}</td>
                <td style={{ fontWeight: 700 }}>{fmt(inv.amount)}</td>
                <td><span className={`badge ${inv.paid ? 'badge-active' : 'badge-complete'}`}>{inv.paid ? 'Paid' : 'Outstanding'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => saveInvoices(allInvoices.map(i => i.id === inv.id ? { ...i, paid: !i.paid } : i))}>
                      {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => { if (confirm('Delete this invoice?')) saveInvoices(allInvoices.filter(i => i.id !== inv.id)); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProjectCard({ project, users, timeEntries, expenses, allBudgets, saveBudgets, allInvoices, saveInvoices }) {
  const [expanded, setExpanded] = useState(false);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const pm = userMap[project.pmId];
  const projectInvoices = allInvoices.filter(i => i.projectId === project.id);
  const lastInvoice = [...projectInvoices].sort((a, b) => b.dateSent.localeCompare(a.dateSent))[0];
  const phaseBudgets = allBudgets[project.id] || {};

  function setBudget(phase, field, value) {
    saveBudgets({ ...allBudgets, [project.id]: { ...phaseBudgets, [phase]: { ...(phaseBudgets[phase] || {}), [field]: value } } });
  }

  function spentFees(phase) {
    return timeEntries.filter(t => t.projectId === project.id && t.phase === phase).reduce((sum, t) => sum + t.hours * (userMap[t.employeeId]?.rate || 0), 0);
  }

  const totalBudgetFees = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.fees || 0), 0);
  const totalBudgetExp  = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.expenses || 0), 0);
  const totalSpentFees  = project.phases.reduce((s, ph) => s + spentFees(ph), 0);
  const totalSpentExp   = expenses.filter(e => e.projectId === project.id).reduce((s, e) => s + e.total, 0);

  const hasActivity = totalSpentFees > 0 || totalSpentExp > 0 || projectInvoices.length > 0;

  return (
    <div className="card" style={{ marginBottom: '8px', padding: 0, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(x => !x)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-nav)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {project.phases.length} phase{project.phases.length !== 1 ? 's' : ''}
            {lastInvoice && <>&ensp;·&ensp;Last invoice: {fmtDate(lastInvoice.dateSent)}</>}
            {totalSpentFees > 0 && <>&ensp;·&ensp;Fees: <span style={{ color: 'var(--color-nav)', fontWeight: 600 }}>{fmt(totalSpentFees)}</span></>}
            {totalSpentExp  > 0 && <>&ensp;·&ensp;Exp: <span style={{ color: 'var(--color-nav)', fontWeight: 600 }}>{fmt(totalSpentExp)}</span></>}
          </div>
        </div>
        <span className={`badge badge-${project.status}`}>{project.status}</span>
        <Link
          to={`/projects/${project.id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Details →
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px' }}>
          {/* Phase list */}
          {project.phases.length > 0 ? (
            <>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-nav)', marginBottom: '8px' }}>Phase Budgets</div>
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>Budgeted Fees</th>
                      <th>Spent Fees</th>
                      <th>Fee Variance</th>
                      <th>Budgeted Exp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.phases.map(ph => (
                      <tr key={ph}>
                        <td style={{ fontWeight: 500 }}>{ph}</td>
                        <td><BudgetCell value={phaseBudgets[ph]?.fees || 0} onChange={v => setBudget(ph, 'fees', v)} /></td>
                        <td style={{ fontWeight: 600 }}>{fmt(spentFees(ph))}</td>
                        <td><Variance budget={phaseBudgets[ph]?.fees || 0} spent={spentFees(ph)} /></td>
                        <td><BudgetCell value={phaseBudgets[ph]?.expenses || 0} onChange={v => setBudget(ph, 'expenses', v)} /></td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                      <td>Total</td>
                      <td>{fmt(totalBudgetFees)}</td>
                      <td>{fmt(totalSpentFees)}</td>
                      <td><Variance budget={totalBudgetFees} spent={totalSpentFees} /></td>
                      <td>{fmt(totalBudgetExp)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '20px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Actual Expenses: </span><strong>{fmt(totalSpentExp)}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Expense Variance: </span><Variance budget={totalBudgetExp} spent={totalSpentExp} /></div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ marginBottom: '16px' }}>No phases defined. Edit in Details.</div>
          )}
          <InvoicesSection project={project} allInvoices={allInvoices} saveInvoices={saveInvoices} />
        </div>
      )}
    </div>
  );
}

function ClientGroup({ client, projects, users, timeEntries, expenses, allBudgets, saveBudgets, allInvoices, saveInvoices, forceOpen }) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const clientFees = projects.reduce((sum, p) =>
    sum + timeEntries.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours * (userMap[t.employeeId]?.rate || 0), 0), 0);
  const clientExp = projects.reduce((sum, p) =>
    sum + expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.total, 0), 0);

  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px',
          background: isOpen ? 'var(--color-nav)' : 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer', userSelect: 'none',
          transition: 'background 0.15s',
        }}
      >
        <span style={{
          fontWeight: 700, fontSize: '14px',
          color: isOpen ? '#fff' : 'var(--color-nav)',
          flex: 1,
        }}>
          {client}
        </span>
        {clientFees > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: isOpen ? 'rgba(255,255,255,0.85)' : 'var(--color-nav)' }}>
            Fees: {fmt(clientFees)}
          </span>
        )}
        {clientExp > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: isOpen ? 'rgba(255,255,255,0.85)' : 'var(--color-nav)' }}>
            Exp: {fmt(clientExp)}
          </span>
        )}
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: isOpen ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)',
          background: isOpen ? 'rgba(255,255,255,0.15)' : 'var(--color-border)',
          borderRadius: '10px', padding: '1px 8px',
        }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
        <span style={{ color: isOpen ? '#fff' : 'var(--color-text-muted)', fontSize: '12px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              users={users}
              timeEntries={timeEntries}
              expenses={expenses}
              allBudgets={allBudgets}
              saveBudgets={saveBudgets}
              allInvoices={allInvoices}
              saveInvoices={saveInvoices}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const projects = getItem('tm_projects') || [];
  const users = getItem('tm_users') || [];
  const timeEntries = getItem('tm_time_entries') || [];
  const expenses = getItem('tm_expenses') || [];
  const [allBudgets, saveBudgets] = usePhaseBudgets();
  const [allInvoices, saveInvoices] = useInvoices();
  const [search, setSearch] = useState('');

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const totals = projects.reduce((acc, p) => {
    const pb = allBudgets[p.id] || {};
    acc.contracted += Object.values(pb).reduce((s, b) => s + (b.fees || 0) + (b.expenses || 0), 0);
    acc.spent += timeEntries.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours * (userMap[t.employeeId]?.rate || 0), 0);
    acc.spent += expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.total, 0);
    return acc;
  }, { contracted: 0, spent: 0 });
  const totalVariance = totals.contracted - totals.spent;
  const totalOver = totalVariance < 0;

  // Filter + group
  const q = search.trim().toLowerCase();
  const filtered = q ? projects.filter(p => p.name.toLowerCase().includes(q)) : projects;

  const clientMap = {};
  filtered.forEach(p => {
    const c = getClientName(p);
    if (!clientMap[c]) clientMap[c] = [];
    clientMap[c].push(p);
  });
  const clients = Object.keys(clientMap).sort();

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <p>{projects.length} projects across {Object.keys(Object.fromEntries(projects.map(p => [getClientName(p), 1]))).length} clients.</p>
      </div>

      <ProjectHoursChart timeEntries={timeEntries} projects={projects} />

      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {[
            { label: 'Total Contracted', value: fmt(totals.contracted), color: 'var(--color-nav)', light: '#e8f0dc' },
            { label: 'Total Spent', value: fmt(totals.spent), color: totalOver ? '#c0392b' : '#27ae60', light: totalOver ? '#fdf0ee' : '#edf7ed' },
            { label: 'Total Variance', value: `${totalOver ? '–' : '+'}${fmt(Math.abs(totalVariance))}`, color: totalOver ? '#c0392b' : '#27ae60', light: totalOver ? '#fdf0ee' : '#edf7ed' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: '14px 20px', background: item.light, borderRight: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
          style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No projects match "{search}".</div>
      ) : (
        clients.map(c => (
          <ClientGroup
            key={c}
            client={c}
            projects={clientMap[c]}
            users={users}
            timeEntries={timeEntries}
            expenses={expenses}
            allBudgets={allBudgets}
            saveBudgets={saveBudgets}
            allInvoices={allInvoices}
            saveInvoices={saveInvoices}
            forceOpen={!!q}
          />
        ))
      )}
    </div>
  );
}
