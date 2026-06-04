import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItem, setItem, uid } from '../hooks/useStorage';

function fmt(n) {
  return '$' + (n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
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
        style={{ width: '100px', padding: '2px 6px', fontSize: '13px', border: '1.5px solid var(--color-primary)', borderRadius: '4px' }}
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
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)' }}>Invoices</div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(f => !f)}>
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
              <input type="checkbox" id="new-inv-paid" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} />
              <label htmlFor="new-inv-paid" style={{ fontWeight: 400, fontSize: '13px', margin: 0 }}>Paid</label>
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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Load everything from storage into state
  const [projects, setProjects] = useState(() => getItem('tm_projects') || []);
  const [allBudgets, setAllBudgets] = useState(() => getItem('tm_phase_budgets') || {});
  const [allInvoices, setAllInvoices] = useState(() => getItem('tm_invoices') || []);
  const users = getItem('tm_users') || [];
  const timeEntries = getItem('tm_time_entries') || [];
  const expenses = getItem('tm_expenses') || [];

  const project = projects.find(p => p.id === id);

  // Form state for project-level fields
  const [form, setForm] = useState(() => {
    const p = (getItem('tm_projects') || []).find(x => x.id === id);
    return p ? { name: p.name, pmId: p.pmId || '', status: p.status } : null;
  });
  const [formSaved, setFormSaved] = useState(false);
  const [newPhase, setNewPhase] = useState('');

  if (!project || !form) {
    return (
      <div>
        <Link to="/projects" style={{ color: 'var(--color-primary)', fontSize: '14px' }}>← Back to Projects</Link>
        <div className="empty-state" style={{ marginTop: '32px' }}>Project not found.</div>
      </div>
    );
  }

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const pms = users.filter(u => u.role === 'pm');
  const phaseBudgets = allBudgets[id] || {};

  function saveProjects(updated) {
    setItem('tm_projects', updated);
    setProjects(updated);
  }

  function saveBudgets(updated) {
    setItem('tm_phase_budgets', updated);
    setAllBudgets(updated);
  }

  function saveInvoices(updated) {
    setItem('tm_invoices', updated);
    setAllInvoices(updated);
  }

  function saveProjectDetails() {
    if (!form.name.trim()) return;
    saveProjects(projects.map(p =>
      p.id === id ? { ...p, name: form.name.trim(), pmId: form.pmId || null, status: form.status } : p
    ));
    setFormSaved(true);
    setTimeout(() => setFormSaved(false), 2000);
  }

  function setBudget(phase, field, value) {
    saveBudgets({
      ...allBudgets,
      [id]: { ...phaseBudgets, [phase]: { ...(phaseBudgets[phase] || {}), [field]: value } },
    });
  }

  function addPhase() {
    const name = newPhase.trim();
    if (!name) return;
    saveProjects(projects.map(p =>
      p.id === id ? { ...p, phases: [...p.phases, name] } : p
    ));
    setNewPhase('');
  }

  function removePhase(idx) {
    saveProjects(projects.map(p =>
      p.id === id ? { ...p, phases: p.phases.filter((_, i) => i !== idx) } : p
    ));
  }

  function movePhase(idx, dir) {
    const phases = [...project.phases];
    const target = idx + dir;
    if (target < 0 || target >= phases.length) return;
    [phases[idx], phases[target]] = [phases[target], phases[idx]];
    saveProjects(projects.map(p => p.id === id ? { ...p, phases } : p));
  }

  function spentFees(phase) {
    return timeEntries
      .filter(t => t.projectId === id && t.phase === phase)
      .reduce((sum, t) => sum + t.hours * (userMap[t.employeeId]?.rate || 0), 0);
  }

  const totalBudgetFees = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.fees || 0), 0);
  const totalBudgetExp  = project.phases.reduce((s, ph) => s + (phaseBudgets[ph]?.expenses || 0), 0);
  const totalSpentFees  = project.phases.reduce((s, ph) => s + spentFees(ph), 0);
  const totalSpentExp   = expenses.filter(e => e.projectId === id).reduce((s, e) => s + e.total, 0);

  return (
    <div>
      {/* Back nav */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/projects"
          style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
        >
          ← Back to Projects
        </Link>
      </div>

      {/* Page header */}
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {project.name}
          <span className={`badge badge-${project.status}`} style={{ fontSize: '12px', verticalAlign: 'middle' }}>
            {project.status}
          </span>
        </h1>
        <p>PM: {userMap[project.pmId]?.name || '—'}</p>
      </div>

      {/* Contracted vs Spent summary */}
      {(() => {
        const contracted = totalBudgetFees + totalBudgetExp;
        const spent = totalSpentFees + totalSpentExp;
        const variance = contracted - spent;
        const over = variance < 0;
        return (
          <div style={{
            display: 'flex',
            gap: '0',
            marginBottom: '20px',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}>
            {[
              { label: 'Contracted', value: fmt(contracted), color: 'var(--color-nav)', light: '#e8f0dc' },
              { label: 'Spent', value: fmt(spent), color: over ? '#c0392b' : '#27ae60', light: over ? '#fdf0ee' : '#edf7ed' },
              { label: 'Variance', value: `${over ? '–' : '+'}${fmt(Math.abs(variance))}`, color: over ? '#c0392b' : '#27ae60', light: over ? '#fdf0ee' : '#edf7ed' },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1,
                padding: '14px 20px',
                background: item.light,
                borderRight: i < 2 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Project details form */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)', marginBottom: '16px' }}>
          Project Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && saveProjectDetails()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Project Manager</label>
            <select value={form.pmId} onChange={e => setForm(f => ({ ...f, pmId: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {pms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={saveProjectDetails}>Save Changes</button>
          {formSaved && <span style={{ color: '#27ae60', fontSize: '13px', fontWeight: 600 }}>Saved ✓</span>}
        </div>
      </div>

      {/* Phases + Budgets */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)', marginBottom: '16px' }}>
          Phases &amp; Budgets
        </div>

        {project.phases.length === 0 ? (
          <div className="empty-state" style={{ marginBottom: '16px' }}>No phases yet. Add one below.</div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>#</th>
                  <th>Phase</th>
                  <th>Budg. Fees</th>
                  <th>Budg. Exp.</th>
                  <th>Spent Fees</th>
                  <th>Fee Variance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {project.phases.map((ph, i) => (
                  <tr key={ph + i}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{ph}</td>
                    <td>
                      <BudgetCell
                        value={phaseBudgets[ph]?.fees || 0}
                        onChange={v => setBudget(ph, 'fees', v)}
                      />
                    </td>
                    <td>
                      <BudgetCell
                        value={phaseBudgets[ph]?.expenses || 0}
                        onChange={v => setBudget(ph, 'expenses', v)}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmt(spentFees(ph))}</td>
                    <td><Variance budget={phaseBudgets[ph]?.fees || 0} spent={spentFees(ph)} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => movePhase(i, -1)} disabled={i === 0}>↑</button>
                        <button className="btn btn-sm btn-outline" onClick={() => movePhase(i, 1)} disabled={i === project.phases.length - 1}>↓</button>
                        <button className="btn btn-sm btn-danger" onClick={() => removePhase(i)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, background: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                  <td></td>
                  <td>Total</td>
                  <td>{fmt(totalBudgetFees)}</td>
                  <td>{fmt(totalBudgetExp)}</td>
                  <td>{fmt(totalSpentFees)}</td>
                  <td><Variance budget={totalBudgetFees} spent={totalSpentFees} /></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Add phase */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newPhase}
            onChange={e => setNewPhase(e.target.value)}
            placeholder="New phase name"
            onKeyDown={e => e.key === 'Enter' && addPhase()}
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '14px' }}
          />
          <button className="btn btn-primary" onClick={addPhase}>Add Phase</button>
        </div>

        {/* Expense summary */}
        {project.phases.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
            marginTop: '20px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            fontSize: '13px',
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
              Expenses tracked at project level, not per phase.
            </div>
          </div>
        )}
      </div>

      {/* Time Entries */}
      {(() => {
        const entries = timeEntries
          .filter(t => t.projectId === id)
          .sort((a, b) => b.date.localeCompare(a.date));
        const totalHours = Math.round(entries.reduce((s, t) => s + t.hours, 0) * 100) / 100;
        return (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)', marginBottom: '16px' }}>
              Time Entries
              {entries.length > 0 && (
                <span style={{ fontWeight: 400, fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  — {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h total across {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
                </span>
              )}
            </div>
            {entries.length === 0 ? (
              <div className="empty-state">No time entries for this project.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Employee</th><th>Phase</th><th>Hours</th><th>Billing Notes</th></tr>
                  </thead>
                  <tbody>
                    {entries.map(t => (
                      <tr key={t.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{userMap[t.employeeId]?.name || t.employeeId}</td>
                        <td>{t.phase || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{t.hours % 1 === 0 ? t.hours : t.hours.toFixed(1)}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{t.billingNotes || '—'}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                      <td colSpan={3}>Total</td>
                      <td>{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Expenses */}
      {(() => {
        const rows = expenses
          .filter(e => e.projectId === id)
          .sort((a, b) => b.date.localeCompare(a.date));
        const totalExp = rows.reduce((s, e) => s + e.total, 0);
        return (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-nav)', marginBottom: '16px' }}>
              Expenses
              {rows.length > 0 && (
                <span style={{ fontWeight: 400, fontSize: '13px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  — {fmt(totalExp)} total across {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
                </span>
              )}
            </div>
            {rows.length === 0 ? (
              <div className="empty-state">No expenses for this project.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Employee</th><th>Vendor / Notes</th><th>Amount</th><th>Tax</th><th>Tip</th><th>Total</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(e => (
                      <tr key={e.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{userMap[e.employeeId]?.name || e.employeeId}</td>
                        <td style={{ fontSize: '13px' }}>{e.vendorNotes || '—'}</td>
                        <td>{fmt(e.amount)}</td>
                        <td>{e.tax ? fmt(e.tax) : '—'}</td>
                        <td>{e.tip ? fmt(e.tip) : '—'}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(e.total)}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{e.paymentType || '—'}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                      <td colSpan={6}>Total</td>
                      <td>{fmt(totalExp)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Invoices */}
      <InvoicesSection
        project={project}
        allInvoices={allInvoices}
        saveInvoices={saveInvoices}
      />
    </div>
  );
}
