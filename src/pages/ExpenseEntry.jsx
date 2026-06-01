import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItem, setItem, uid } from '../hooks/useStorage';

const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];
const PAYMENT_TYPES = ['Corporate Card','Personal Card','Cash','E-Transfer'];

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

const blank = {
  projectId: '', date: '',
  amount: '', tax: '', tip: '',
  vendorNotes: '', province: '', paymentType: '',
};

export default function ExpenseEntry() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].val);

  const allProjects = getItem('tm_projects') || [];
  const projects = allProjects.filter(p => p.status === 'active');
  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  const amount = parseFloat(form.amount) || 0;
  const tax = parseFloat(form.tax) || 0;
  const tip = parseFloat(form.tip) || 0;
  const total = (amount + tax + tip).toFixed(2);

  const allExpenses = (getItem('tm_expenses') || []).filter(e => e.employeeId === currentUser.id);
  const monthExpenses = [...allExpenses]
    .filter(e => e.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.total, 0);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.projectId || !form.date || !form.province || !form.paymentType) {
      setToast({ msg: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    const expenses = getItem('tm_expenses') || [];
    expenses.push({
      id: uid(),
      employeeId: currentUser.id,
      projectId: form.projectId,
      date: form.date,
      amount,
      tax,
      tip,
      total: parseFloat(total),
      vendorNotes: form.vendorNotes,
      province: form.province,
      paymentType: form.paymentType,
      createdAt: new Date().toISOString(),
    });
    setItem('tm_expenses', expenses);
    setForm(blank);
    setToast({ msg: 'Expense saved.', type: 'success' });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Expense Entry</h1>
        <p>Log receipts and reimbursable expenses.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '20px', alignItems: 'start' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Staff</label>
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
              <label>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Amount (before tax)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Tax</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={e => set('tax', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Tip</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tip}
                  onChange={e => set('tip', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Total</label>
              <input
                type="text"
                value={`$${total}`}
                readOnly
                style={{ fontWeight: 700, fontSize: '15px' }}
              />
            </div>

            <div className="form-group">
              <label>Vendor and Notes</label>
              <textarea
                value={form.vendorNotes}
                onChange={e => set('vendorNotes', e.target.value)}
                placeholder={'TIM HORTONS - Meeting with KM & AB\nMARRIOTT HOTEL - Accommodations for AB June 4, 5, and 6\nMileage - Guelph to Hudson\'s Bay 345 km'}
                rows={4}
              />
              <span className="form-hint">Include vendor name first.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Province *</label>
                <select value={form.province} onChange={e => set('province', e.target.value)} required>
                  <option value="">— Province —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Payment Type *</label>
                <select value={form.paymentType} onChange={e => set('paymentType', e.target.value)} required>
                  <option value="">— How paid? —</option>
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Save Expense</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-nav)', fontSize: '15px' }}>
              ${monthTotal.toFixed(2)} total
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

          {monthExpenses.length === 0 ? (
            <div className="empty-state">No expenses for this month.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Vendor / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                      <td>{projectMap[e.projectId] || e.projectId}</td>
                      <td style={{ fontWeight: 700 }}>${e.total.toFixed(2)}</td>
                      <td style={{ fontSize: '13px' }}>{e.paymentType}</td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>{e.vendorNotes}</td>
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
