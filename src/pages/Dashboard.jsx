import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getItem } from '../hooks/useStorage';

const COLORS = ['#556b2f','#2f4f4f','#8b6914','#6b2f55','#2f556b','#6b8a3a','#4f2f2f','#2f4f35'];

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('time');

  const projects = getItem('tm_projects') || [];
  const timeEntries = (getItem('tm_time_entries') || []).filter(e => e.employeeId === currentUser.id);
  const expenses = (getItem('tm_expenses') || []).filter(e => e.employeeId === currentUser.id);

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const hoursByProject = projects
    .map(p => {
      const hrs = timeEntries.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.hours, 0);
      return { name: p.name, hours: hrs };
    })
    .filter(p => p.hours > 0);

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);

  const recentTime = [...timeEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const recentExpenses = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  const tabStyle = (active) => ({
    padding: '8px 20px',
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
        <h1>Dashboard — {currentUser.name}</h1>
        <p>Your hours and expenses summary.</p>
      </div>

      <div className="grid-2col">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary)' }}>{totalHours.toFixed(1)}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Total Hours Logged</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-nav)' }}>${totalExpenses.toFixed(2)}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Total Expenses</div>
        </div>
      </div>

      {hoursByProject.length > 0 && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--color-nav)' }}>Hours by Project</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={hoursByProject}
                dataKey="hours"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {hoursByProject.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} hrs`, 'Hours']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {hoursByProject.length === 0 && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="empty-state">No time entries yet. Log some hours to see the chart.</div>
        </div>
      )}

      <div className="card">
        <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '16px', display: 'flex' }}>
          <button style={tabStyle(activeTab === 'time')} onClick={() => setActiveTab('time')}>
            Recent Time Entries
          </button>
          <button style={tabStyle(activeTab === 'expenses')} onClick={() => setActiveTab('expenses')}>
            Recent Expenses
          </button>
        </div>

        {activeTab === 'time' && (
          recentTime.length === 0
            ? <div className="empty-state">No time entries yet.</div>
            : (
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
                    {recentTime.map(e => (
                      <tr key={e.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                        <td>{projectMap[e.projectId] || e.projectId}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{e.phase}</td>
                        <td style={{ fontWeight: 700 }}>{e.hours}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>{e.billingNotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {activeTab === 'expenses' && (
          recentExpenses.length === 0
            ? <div className="empty-state">No expenses yet.</div>
            : (
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
                    {recentExpenses.map(e => (
                      <tr key={e.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                        <td>{projectMap[e.projectId] || e.projectId}</td>
                        <td style={{ fontWeight: 700 }}>${e.total.toFixed(2)}</td>
                        <td style={{ fontSize: '13px' }}>{e.paymentType}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>{e.vendorNotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
    </div>
  );
}
