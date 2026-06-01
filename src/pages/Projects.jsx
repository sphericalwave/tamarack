import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getItem, setItem, uid } from '../hooks/useStorage';

function usePhaseBudgets() {
  const [budgets, setBudgets] = useState(() => getItem('tm_phase_budgets') || {});
  function save(updated) {
    setItem('tm_phase_budgets', updated);
    setBudgets(updated);
  }
  return [budgets, save];
}

function useInvoices() {
  const [invoices, setInvoices] = useState(() => getItem('tm_invoices') || []);
  function save(updated) {
    setItem('tm_invoices', updated);
    setInvoices(updated);
  }
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
        type="number"
        min="0"
        value={draft}
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
      style={{
        cursor: 'pointer',
        color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
        borderBottom: '1px dashed var(--color-border)',
        fontStyle: value ? 'normal' : 'italic',
        fontSize: '13px',
      }}
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
    saveInvoices([...allInvoices, {
      id: uid(),
      projectId: project.id,
      dateSent: form.dateSent,
      paid: form.paid,
      amount: parseFloat(form.amount) || 0,
      description: form.description.trim(),
    }]);
    setForm({ dateSent: '', paid: false, amount: '', description: '' });
    setShowForm(false);
  }

  function togglePaid(id) {
    saveInvoices(allInvoices.map(i => i.id === id ? { ...i, paid: !i.paid } : i));
  }

  function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    saveInvoices(allInvoices.filter(i => i.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-nav)' }}>Invoices</div>
        <button
          className="btn btn-sm btn-primary"
          onClick={e => { e.stopPropagation(); setShowForm(f => !f); }}
        >
          {showForm ? 'Cancel' : '+ Add Invoice'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          padding: '14px',
          marginBottom: '14px',
          display: 'grid',
          gridTemplateColumns: '160px 130px 1fr 100px auto',
          gap: '10px',
          alignItems: 'end',
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Date Sent *</label>
            <input
              type="date"
              value={form.dateSent}
              onChange={e => setForm(f => ({ ...f, dateSent: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Description *</label>
            <input
              type="text"
              placeholder="Invoice description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px' }}>Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
              <input
                type="checkbox"
                id={`new-paid-${project.id}`}
                checked={form.paid}
                onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))}
              />
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
            <tr>
              <th>Date Sent</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projectInvoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.dateSent)}</td>
                <td>{inv.description}</td>
                <td style={{ fontWeight: 700 }}>{fmt(inv.amount)}</td>
                <td>
                  <span className={`badge ${inv.paid ? 'badge-active' : 'badge-complete'}`}>
                    {inv.paid ? 'Paid' : 'Outstanding'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => togglePaid(inv.id)}>
                      {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteInvoice(inv.id)}>Delete</button>
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
    saveBudgets({
      ...allBudgets,
      [project.id]: {
        ...phaseBudgets,
        [phase]: { ...(phaseBudgets[phase] || {}), [field]: value },
      },
    });
  }

  function spentFees(phase) {
    return timeEntries
      .filter(t => t.projectId === project.id && t.phase === phase)
      .reduce((sum, t) => sum + t.hours * (userMap[t.employeeId]?.rate || 0), 0);
  }

  const totalBudgetFees = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.fees || 0), 0);
  const totalBudgetExp  = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.expenses || 0), 0);
  const totalSpentFees  = project.phases.reduce((s, ph) => s + spentFees(ph), 0);
  const totalSpentExp   = expenses.filter(e => e.projectId === project.id).reduce((s, e) => s + e.total, 0);

  return (
    <div className="card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(x => !x)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)' }}>{project.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            PM: {pm?.name || '—'}&ensp;·&ensp;Last invoice: {fmtDate(lastInvoice?.dateSent)}
          </div>
        </div>
        <span className={`badge badge-${project.status}`}>{project.status}</span>
        <Link
          to={`/projects/${project.id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Details →
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '20px' }}>

          {/* Phase budgets */}
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-nav)', marginBottom: '10px' }}>
            Phase Budgets
          </div>
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
                    <td>
                      <BudgetCell
                        value={phaseBudgets[ph]?.fees || 0}
                        onChange={v => setBudget(ph, 'fees', v)}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmt(spentFees(ph))}</td>
                    <td><Variance budget={phaseBudgets[ph]?.fees || 0} spent={spentFees(ph)} /></td>
                    <td>
                      <BudgetCell
                        value={phaseBudgets[ph]?.expenses || 0}
                        onChange={v => setBudget(ph, 'expenses', v)}
                      />
                    </td>
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

          {/* Expense summary (expenses are project-level, not per-phase) */}
          <div style={{
            display: 'flex',
            gap: '32px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Budgeted Expenses: </span>
              <strong>{fmt(totalBudgetExp)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Actual Expenses: </span>
              <strong>{fmt(totalSpentExp)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Expense Variance: </span>
              <Variance budget={totalBudgetExp} spent={totalSpentExp} />
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Expenses are tracked at the project level, not per phase.
            </div>
          </div>

          {/* Invoices */}
          <InvoicesSection
            project={project}
            allInvoices={allInvoices}
            saveInvoices={saveInvoices}
          />
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

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <p>Phase budget tracking and invoicing for all projects.</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">No projects. Add projects in Admin.</div>
      ) : (
        projects.map(p => (
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
        ))
      )}

      <div className="card" style={{ marginTop: '32px', borderLeft: '4px solid var(--color-primary)', background: '#f6f9f2' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-nav)', fontSize: '14px' }}>
          QuickBooks Integration — Feasibility Note
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.65', margin: 0 }}>
          Syncing invoices with QuickBooks Online is technically possible via the QuickBooks Online API (OAuth 2.0 + REST),
          but <strong>cannot be done securely from a pure browser app.</strong> OAuth client secrets and refresh tokens must
          live server-side — exposing them in client-side JavaScript would allow any user to impersonate the firm's QBO account.
          A safe path requires a thin backend (e.g. Vercel serverless functions or a Node/Express API) to store encrypted tokens,
          proxy all QBO calls, and enforce per-user authorization before touching financial records.
          Estimated effort: 2–4 days to stand up the backend + OAuth flow + QBO developer app approval (typically 1–3 business days).
          Once a backend exists, the integration itself — pushing invoice records to QBO on save — is straightforward via the
          QBO Invoices API. Until then, invoices can be exported manually to CSV if needed.
        </p>
      </div>
    </div>
  );
}
