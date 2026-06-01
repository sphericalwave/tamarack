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

const blank = {
  projectId: '', date: '',
  amount: '', tax: '', tip: '',
  vendorNotes: '', province: '', paymentType: '',
};

export default function ExpenseEntry() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState(null);
  const projects = (getItem('tm_projects') || []).filter(p => p.status === 'active');

  const amount = parseFloat(form.amount) || 0;
  const tax = parseFloat(form.tax) || 0;
  const tip = parseFloat(form.tip) || 0;
  const total = (amount + tax + tip).toFixed(2);

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

      <div className="card" style={{ maxWidth: '560px' }}>
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

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
